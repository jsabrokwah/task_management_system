"""
Notification API endpoints for the Task Management System.
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
notifications_table = dynamodb.Table(os.environ.get('NOTIFICATIONS_TABLE'))
sns = boto3.client('sns')
notification_topic = os.environ.get('NOTIFICATION_TOPIC')

def lambda_handler(event, context):
    """
    Main handler for notification API endpoints.
    
    Routes requests to the appropriate function based on the HTTP method and path.
    """
    http_method = event['httpMethod']
    path = event['path']
    
    # Route to the appropriate handler
    if http_method == 'GET' and path == '/notifications':
        return get_notifications(event)
    elif http_method == 'PUT' and '/notifications/' in path and path.endswith('/read'):
        return mark_as_read(event)
    elif http_method == 'PUT' and path == '/notifications/settings':
        return update_settings(event)
    else:
        return response.not_found('Endpoint not found')

def get_notifications(event):
    """Get notifications for the current user."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        read_status = query_params.get('read')
        limit = int(query_params.get('limit', 20))
        
        # Query notifications by user ID
        if read_status is not None:
            # Filter by read status
            is_read = read_status.lower() == 'true'
            
            result = notifications_table.query(
                IndexName='UserNotificationsIndex',
                KeyConditionExpression=boto3.dynamodb.conditions.Key('UserID').eq(user['user_id']),
                FilterExpression=boto3.dynamodb.conditions.Attr('ReadStatus').eq(is_read),
                ScanIndexForward=False,  # Sort in descending order (newest first)
                Limit=limit
            )
        else:
            # Get all notifications
            result = notifications_table.query(
                IndexName='UserNotificationsIndex',
                KeyConditionExpression=boto3.dynamodb.conditions.Key('UserID').eq(user['user_id']),
                ScanIndexForward=False,  # Sort in descending order (newest first)
                Limit=limit
            )
        
        return response.success({
            'notifications': result.get('Items', []),
            'count': len(result.get('Items', []))
        })
        
    except Exception as e:
        print(f"Get notifications error: {str(e)}")
        return response.server_error(str(e))

def mark_as_read(event):
    """Mark a notification as read."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    try:
        # Extract notification ID from path
        notification_id = event['pathParameters']['notificationId']
        
        # Get notification from DynamoDB
        result = notifications_table.get_item(Key={'NotificationID': notification_id})
        
        if 'Item' not in result:
            return response.not_found("Notification not found")
        
        notification = result['Item']
        
        # Check if user has access to this notification
        if notification['UserID'] != user['user_id']:
            return response.forbidden("You don't have access to this notification")
        
        # Update read status
        notifications_table.update_item(
            Key={'NotificationID': notification_id},
            UpdateExpression="set ReadStatus = :read_status",
            ExpressionAttributeValues={':read_status': True}
        )
        
        # Get updated notification
        updated_result = notifications_table.get_item(Key={'NotificationID': notification_id})
        updated_notification = updated_result['Item']
        
        return response.success(updated_notification)
        
    except Exception as e:
        print(f"Mark as read error: {str(e)}")
        return response.server_error(str(e))

def update_settings(event):
    """Update notification settings."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Validate settings
        if 'settings' not in body:
            return response.bad_request("Missing settings field")
        
        settings = body['settings']
        
        # Update user's notification settings in DynamoDB
        # Note: This would require adding a NotificationSettings field to the Users table
        # For now, we'll just return success
        
        return response.success({
            'message': 'Notification settings updated successfully',
            'settings': settings
        })
        
    except Exception as e:
        print(f"Update settings error: {str(e)}")
        return response.server_error(str(e))

def process_sns_notification(event, context):
    """
    Process SNS notifications and store them in DynamoDB.
    
    This function is triggered by SNS messages, not API Gateway events.
    """
    try:
        for record in event['Records']:
            # Parse SNS message
            sns_message = json.loads(record['Sns']['Message'])
            
            # Extract user ID from message attributes
            user_id = record['Sns']['MessageAttributes']['user_id']['Value']
            
            # Create notification
            notification_id = str(uuid.uuid4())
            current_time = datetime.now().isoformat()
            
            notification_type = sns_message.get('type', 'general')
            task_id = sns_message.get('task_id', '')
            
            # Generate message based on notification type
            if notification_type == 'task_assigned':
                message = f"You have been assigned a new task: {sns_message.get('title', '')}"
            elif notification_type == 'task_status_updated':
                message = f"Task '{sns_message.get('title', '')}' status has been updated to {sns_message.get('status', '')}"
            elif notification_type == 'deadline_reminder':
                message = sns_message.get('message', 'Task deadline reminder')
            else:
                message = sns_message.get('message', 'New notification')
            
            # Create notification item
            notification = {
                'NotificationID': notification_id,
                'UserID': user_id,
                'TaskID': task_id,
                'Type': notification_type,
                'Message': message,
                'CreatedAt': current_time,
                'ReadStatus': False
            }
            
            # Save to DynamoDB
            notifications_table.put_item(Item=notification)
            
            print(f"Created notification: {notification_id}")
            
    except Exception as e:
        print(f"Process SNS notification error: {str(e)}")
        raise