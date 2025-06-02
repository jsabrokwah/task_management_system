"""
Authentication API endpoints for the Task Management System.
"""
import os
import json
import boto3
import uuid
from datetime import datetime
import sys

# Add parent directory to path to import common modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import response, auth

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(os.environ.get('USERS_TABLE'))

def lambda_handler(event, context):
    """
    Main handler for authentication API endpoints.
    
    Routes requests to the appropriate function based on the HTTP method and path.
    """
    http_method = event['httpMethod']
    path = event['path']
    
    # Route to the appropriate handler
    if http_method == 'POST' and path.endswith('/auth/register'):
        return register(event)
    elif http_method == 'POST' and path.endswith('/auth/login'):
        return login(event)
    elif http_method == 'GET' and path.endswith('/auth/profile'):
        return get_profile(event)
    elif http_method == 'PUT' and path.endswith('/auth/profile'):
        return update_profile(event)
    else:
        return response.not_found('Endpoint not found')

def register(event):
    """Handle user registration."""
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'name']
        for field in required_fields:
            if field not in body:
                return response.bad_request(f"Missing required field: {field}")
        
        # Extract fields
        username = body['username']
        email = body['email']
        password = body['password']
        name = body['name']
        role = body.get('role', 'team_member')
        
        # Only allow 'admin' or 'team_member' roles
        if role not in ['admin', 'team_member']:
            return response.bad_request("Invalid role. Must be 'admin' or 'team_member'")
        
        # Create user in Cognito
        user_result = auth.admin_create_user(username, email, password, role)
        
        if 'error' in user_result:
            return response.bad_request(user_result['error'])
        
        # Create user in DynamoDB
        user_id = user_result['user_id']
        current_time = datetime.now().isoformat()
        
        user_item = {
            'UserID': user_id,
            'Username': username,
            'Email': email,
            'Role': role,
            'Name': name,
            'Department': body.get('department', ''),
            'CreatedAt': current_time,
            'LastLogin': current_time
        }
        
        users_table.put_item(Item=user_item)
        
        # Return success response
        return response.created({
            'user_id': user_id,
            'username': username,
            'email': email,
            'role': role
        })
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return response.server_error(str(e))

def login(event):
    """Handle user login."""
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Validate required fields
        if 'username' not in body or 'password' not in body:
            return response.bad_request("Missing username or password")
        
        # Extract fields
        username = body['username']
        password = body['password']
        
        # Authenticate with Cognito
        auth_result = auth.admin_initiate_auth(username, password)
        
        if 'error' in auth_result:
            return response.unauthorized(auth_result['error'])
        
        # Get user from DynamoDB
        response_user = users_table.query(
            IndexName='EmailIndex',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('Email').eq(username)
        )
        
        user = None
        if response_user['Items']:
            user = response_user['Items'][0]
        else:
            # Try by username
            response_user = users_table.scan(
                FilterExpression=boto3.dynamodb.conditions.Attr('Username').eq(username)
            )
            if response_user['Items']:
                user = response_user['Items'][0]
        
        if not user:
            return response.not_found("User not found in database")
        
        # Update last login time
        users_table.update_item(
            Key={'UserID': user['UserID']},
            UpdateExpression="set LastLogin = :login_time",
            ExpressionAttributeValues={':login_time': datetime.now().isoformat()}
        )
        
        # Return success response with token
        return response.success({
            'token': auth_result['token'],
            'refresh_token': auth_result['refresh_token'],
            'expires_in': auth_result['expires_in'],
            'user': {
                'user_id': user['UserID'],
                'username': user['Username'],
                'email': user['Email'],
                'role': user['Role'],
                'name': user['Name']
            }
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return response.server_error(str(e))

def get_profile(event):
    """Get user profile."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    try:
        # Get user from DynamoDB
        result = users_table.get_item(Key={'UserID': user['user_id']})
        
        if 'Item' not in result:
            return response.not_found("User not found")
        
        user_data = result['Item']
        
        # Return user profile
        return response.success({
            'user_id': user_data['UserID'],
            'username': user_data['Username'],
            'email': user_data['Email'],
            'role': user_data['Role'],
            'name': user_data['Name'],
            'department': user_data.get('Department', ''),
            'created_at': user_data['CreatedAt'],
            'last_login': user_data['LastLogin']
        })
        
    except Exception as e:
        print(f"Get profile error: {str(e)}")
        return response.server_error(str(e))

def update_profile(event):
    """Update user profile."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Get user from DynamoDB
        result = users_table.get_item(Key={'UserID': user['user_id']})
        
        if 'Item' not in result:
            return response.not_found("User not found")
        
        # Update allowed fields
        update_expressions = []
        expression_values = {}
        
        if 'name' in body:
            update_expressions.append("Name = :name")
            expression_values[':name'] = body['name']
            
        if 'department' in body:
            update_expressions.append("Department = :department")
            expression_values[':department'] = body['department']
        
        # Only admins can update roles
        if 'role' in body and user['role'] == 'admin':
            if body['role'] not in ['admin', 'team_member']:
                return response.bad_request("Invalid role. Must be 'admin' or 'team_member'")
            update_expressions.append("Role = :role")
            expression_values[':role'] = body['role']
        
        if not update_expressions:
            return response.bad_request("No valid fields to update")
        
        # Build update expression
        update_expression = "set " + ", ".join(update_expressions)
        
        # Update user in DynamoDB
        users_table.update_item(
            Key={'UserID': user['user_id']},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        # Get updated user
        updated_result = users_table.get_item(Key={'UserID': user['user_id']})
        updated_user = updated_result['Item']
        
        # Return updated profile
        return response.success({
            'user_id': updated_user['UserID'],
            'username': updated_user['Username'],
            'email': updated_user['Email'],
            'role': updated_user['Role'],
            'name': updated_user['Name'],
            'department': updated_user.get('Department', ''),
            'created_at': updated_user['CreatedAt'],
            'last_login': updated_user['LastLogin']
        })
        
    except Exception as e:
        print(f"Update profile error: {str(e)}")
        return response.server_error(str(e))