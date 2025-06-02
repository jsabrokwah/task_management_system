"""
SNS notification handler for the Task Management System.

This function is triggered by SNS messages to store notifications in DynamoDB.
"""
import os
import json
import boto3
import uuid
from datetime import datetime


# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
notifications_table = dynamodb.Table(os.environ.get('NOTIFICATIONS_TABLE'))

def lambda_handler(event, context):
    """
    Process SNS notifications and store them in DynamoDB.
    
    This function is triggered by SNS messages.
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
            elif notification_type == 'task_reassigned':
                message = f"Task '{sns_message.get('title', '')}' has been reassigned to you"
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
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f"Processed {len(event['Records'])} notifications"
            })
        }
            
    except Exception as e:
        print(f"Process SNS notification error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f"Error processing SNS notifications: {str(e)}"
            })
        }