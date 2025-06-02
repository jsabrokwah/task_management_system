"""
Task management API endpoints for the Task Management System.
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
tasks_table = dynamodb.Table(os.environ.get('TASKS_TABLE'))
sns = boto3.client('sns')
notification_topic = os.environ.get('NOTIFICATION_TOPIC')

def lambda_handler(event, context):
    """
    Main handler for task management API endpoints.
    
    Routes requests to the appropriate function based on the HTTP method and path.
    """
    http_method = event['httpMethod']
    path = event['path']
    
    # Route to the appropriate handler
    if http_method == 'GET' and path == '/tasks':
        return get_tasks(event)
    elif http_method == 'POST' and path == '/tasks':
        return create_task(event)
    elif http_method == 'GET' and '/tasks/' in path and not path.endswith('/status'):
        return get_task(event)
    elif http_method == 'PUT' and '/tasks/' in path and not path.endswith('/status'):
        return update_task(event)
    elif http_method == 'DELETE' and '/tasks/' in path:
        return delete_task(event)
    elif http_method == 'PUT' and path.endswith('/status'):
        return update_task_status(event)
    elif http_method == 'PUT' and path.endswith('/assign'):
        return assign_task(event)
    else:
        return response.not_found('Endpoint not found')

def get_tasks(event):
    """Get tasks based on user role and query parameters."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        status_filter = query_params.get('status')
        priority_filter = query_params.get('priority')
        
        # Different behavior based on user role
        if user['role'] == 'admin':
            # Admins can see all tasks
            if status_filter or priority_filter:
                # Apply filters
                filter_expressions = []
                expression_values = {}
                
                if status_filter:
                    filter_expressions.append("Status = :status")
                    expression_values[':status'] = status_filter
                
                if priority_filter:
                    filter_expressions.append("Priority = :priority")
                    expression_values[':priority'] = priority_filter
                
                filter_expression = " AND ".join(filter_expressions)
                
                result = tasks_table.scan(
                    FilterExpression=filter_expression,
                    ExpressionAttributeValues=expression_values
                )
            else:
                # Get all tasks
                result = tasks_table.scan()
        else:
            # Team members can only see their assigned tasks
            filter_expressions = ["AssignedTo = :user_id"]
            expression_values = {':user_id': user['user_id']}
            
            if status_filter:
                filter_expressions.append("Status = :status")
                expression_values[':status'] = status_filter
            
            if priority_filter:
                filter_expressions.append("Priority = :priority")
                expression_values[':priority'] = priority_filter
            
            filter_expression = " AND ".join(filter_expressions)
            
            result = tasks_table.scan(
                FilterExpression=filter_expression,
                ExpressionAttributeValues=expression_values
            )
        
        return response.success({
            'tasks': result.get('Items', []),
            'count': len(result.get('Items', [])),
            'user_role': user['role']
        })
        
    except Exception as e:
        print(f"Get tasks error: {str(e)}")
        return response.server_error(str(e))

def create_task(event):
    """Create a new task."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Check if user is admin
    if user['role'] != 'admin':
        return response.forbidden("Only admins can create tasks")
    
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Validate required fields
        required_fields = ['title', 'description', 'priority', 'assignedTo', 'deadline']
        for field in required_fields:
            if field not in body:
                return response.bad_request(f"Missing required field: {field}")
        
        # Validate priority
        if body['priority'] not in ['Low', 'Medium', 'High']:
            return response.bad_request("Invalid priority. Must be 'Low', 'Medium', or 'High'")
        
        # Create task
        task_id = str(uuid.uuid4())
        current_time = datetime.now().isoformat()
        
        task = {
            'TaskID': task_id,
            'Title': body['title'],
            'Description': body['description'],
            'Priority': body['priority'],
            'Status': 'New',
            'CreatedBy': user['user_id'],
            'AssignedTo': body['assignedTo'],
            'CreatedAt': current_time,
            'Deadline': body['deadline'],
            'Notes': body.get('notes', '')
        }
        
        # Save to DynamoDB
        tasks_table.put_item(Item=task)
        
        # Send notification
        try:
            sns.publish(
                TopicArn=notification_topic,
                Message=json.dumps({
                    'type': 'task_assigned',
                    'task_id': task_id,
                    'assigned_to': body['assignedTo'],
                    'title': body['title']
                }),
                MessageAttributes={
                    'user_id': {
                        'DataType': 'String',
                        'StringValue': body['assignedTo']
                    }
                }
            )
        except Exception as e:
            print(f"Failed to send notification: {str(e)}")
        
        return response.created(task)
        
    except Exception as e:
        print(f"Create task error: {str(e)}")
        return response.server_error(str(e))

def get_task(event):
    """Get a specific task by ID."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    try:
        # Extract task ID from path
        task_id = event['pathParameters']['taskId']
        
        # Get task from DynamoDB
        result = tasks_table.get_item(Key={'TaskID': task_id})
        
        if 'Item' not in result:
            return response.not_found("Task not found")
        
        task = result['Item']
        
        # Check if user has access to this task
        if user['role'] != 'admin' and task['AssignedTo'] != user['user_id']:
            return response.forbidden("You don't have access to this task")
        
        return response.success(task)
        
    except Exception as e:
        print(f"Get task error: {str(e)}")
        return response.server_error(str(e))

def update_task(event):
    """Update a task."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Check if user is admin
    if user['role'] != 'admin':
        return response.forbidden("Only admins can update tasks")
    
    try:
        # Extract task ID from path
        task_id = event['pathParameters']['taskId']
        
        # Parse request body
        body = json.loads(event['body'])
        
        # Get task from DynamoDB
        result = tasks_table.get_item(Key={'TaskID': task_id})
        
        if 'Item' not in result:
            return response.not_found("Task not found")
        
        # Update allowed fields
        update_expressions = []
        expression_values = {}
        
        if 'title' in body:
            update_expressions.append("Title = :title")
            expression_values[':title'] = body['title']
            
        if 'description' in body:
            update_expressions.append("Description = :description")
            expression_values[':description'] = body['description']
            
        if 'priority' in body:
            if body['priority'] not in ['Low', 'Medium', 'High']:
                return response.bad_request("Invalid priority. Must be 'Low', 'Medium', or 'High'")
            update_expressions.append("Priority = :priority")
            expression_values[':priority'] = body['priority']
            
        if 'deadline' in body:
            update_expressions.append("Deadline = :deadline")
            expression_values[':deadline'] = body['deadline']
            
        if 'notes' in body:
            update_expressions.append("Notes = :notes")
            expression_values[':notes'] = body['notes']
        
        if not update_expressions:
            return response.bad_request("No valid fields to update")
        
        # Build update expression
        update_expression = "set " + ", ".join(update_expressions)
        
        # Update task in DynamoDB
        tasks_table.update_item(
            Key={'TaskID': task_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        # Get updated task
        updated_result = tasks_table.get_item(Key={'TaskID': task_id})
        updated_task = updated_result['Item']
        
        # Send notification if assignee is different
        if 'assignedTo' in body and body['assignedTo'] != updated_task['AssignedTo']:
            try:
                sns.publish(
                    TopicArn=notification_topic,
                    Message=json.dumps({
                        'type': 'task_reassigned',
                        'task_id': task_id,
                        'assigned_to': body['assignedTo'],
                        'title': updated_task['Title']
                    }),
                    MessageAttributes={
                        'user_id': {
                            'DataType': 'String',
                            'StringValue': body['assignedTo']
                        }
                    }
                )
            except Exception as e:
                print(f"Failed to send notification: {str(e)}")
        
        return response.success(updated_task)
        
    except Exception as e:
        print(f"Update task error: {str(e)}")
        return response.server_error(str(e))

def delete_task(event):
    """Delete a task."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Check if user is admin
    if user['role'] != 'admin':
        return response.forbidden("Only admins can delete tasks")
    
    try:
        # Extract task ID from path
        task_id = event['pathParameters']['taskId']
        
        # Check if task exists
        result = tasks_table.get_item(Key={'TaskID': task_id})
        
        if 'Item' not in result:
            return response.not_found("Task not found")
        
        # Delete task
        tasks_table.delete_item(Key={'TaskID': task_id})
        
        return response.success({"message": "Task deleted successfully"})
        
    except Exception as e:
        print(f"Delete task error: {str(e)}")
        return response.server_error(str(e))

def update_task_status(event):
    """Update a task's status."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    try:
        # Extract task ID from path
        task_id = event['pathParameters']['taskId']
        
        # Parse request body
        body = json.loads(event['body'])
        
        if 'status' not in body:
            return response.bad_request("Missing status field")
        
        # Validate status
        if body['status'] not in ['New', 'In Progress', 'Completed', 'Overdue']:
            return response.bad_request("Invalid status. Must be 'New', 'In Progress', 'Completed', or 'Overdue'")
        
        # Get task from DynamoDB
        result = tasks_table.get_item(Key={'TaskID': task_id})
        
        if 'Item' not in result:
            return response.not_found("Task not found")
        
        task = result['Item']
        
        # Check if user has access to this task
        if user['role'] != 'admin' and task['AssignedTo'] != user['user_id']:
            return response.forbidden("You don't have access to this task")
        
        # Update status
        update_expression = "set Status = :status"
        expression_values = {':status': body['status']}
        
        # If status is Completed, set CompletedAt
        if body['status'] == 'Completed':
            update_expression += ", CompletedAt = :completed_at"
            expression_values[':completed_at'] = datetime.now().isoformat()
        
        # Update task in DynamoDB
        tasks_table.update_item(
            Key={'TaskID': task_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        # Get updated task
        updated_result = tasks_table.get_item(Key={'TaskID': task_id})
        updated_task = updated_result['Item']
        
        # Send notification to admin
        try:
            sns.publish(
                TopicArn=notification_topic,
                Message=json.dumps({
                    'type': 'task_status_updated',
                    'task_id': task_id,
                    'title': updated_task['Title'],
                    'status': body['status'],
                    'updated_by': user['user_id']
                }),
                MessageAttributes={
                    'user_id': {
                        'DataType': 'String',
                        'StringValue': updated_task['CreatedBy']
                    }
                }
            )
        except Exception as e:
            print(f"Failed to send notification: {str(e)}")
        
        return response.success(updated_task)
        
    except Exception as e:
        print(f"Update task status error: {str(e)}")
        return response.server_error(str(e))

def assign_task(event):
    """Assign a task to a user."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Check if user is admin
    if user['role'] != 'admin':
        return response.forbidden("Only admins can assign tasks")
    
    try:
        # Extract task ID from path
        task_id = event['pathParameters']['taskId']
        
        # Parse request body
        body = json.loads(event['body'])
        
        if 'assignedTo' not in body:
            return response.bad_request("Missing assignedTo field")
        
        # Get task from DynamoDB
        result = tasks_table.get_item(Key={'TaskID': task_id})
        
        if 'Item' not in result:
            return response.not_found("Task not found")
        
        # Update assignee
        tasks_table.update_item(
            Key={'TaskID': task_id},
            UpdateExpression="set AssignedTo = :assignedTo",
            ExpressionAttributeValues={':assignedTo': body['assignedTo']}
        )
        
        # Get updated task
        updated_result = tasks_table.get_item(Key={'TaskID': task_id})
        updated_task = updated_result['Item']
        
        # Send notification
        try:
            sns.publish(
                TopicArn=notification_topic,
                Message=json.dumps({
                    'type': 'task_assigned',
                    'task_id': task_id,
                    'assigned_to': body['assignedTo'],
                    'title': updated_task['Title']
                }),
                MessageAttributes={
                    'user_id': {
                        'DataType': 'String',
                        'StringValue': body['assignedTo']
                    }
                }
            )
        except Exception as e:
            print(f"Failed to send notification: {str(e)}")
        
        return response.success(updated_task)
        
    except Exception as e:
        print(f"Assign task error: {str(e)}")
        return response.server_error(str(e))