"""
Deadline reminder function for the Task Management System.

This function is triggered by EventBridge to send reminders for upcoming task deadlines.
"""
import os
import json
import boto3
import datetime
import sys

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
tasks_table = dynamodb.Table(os.environ.get('TASKS_TABLE'))
sns = boto3.client('sns')
notification_topic = os.environ.get('NOTIFICATION_TOPIC')

def lambda_handler(event, context):
    """
    Process deadline reminders for tasks.
    
    This function is triggered by EventBridge on a schedule.
    """
    try:
        # Get current date
        today = datetime.datetime.now().date()
        tomorrow = today + datetime.timedelta(days=1)
        
        # Format dates for comparison
        today_str = today.isoformat()
        tomorrow_str = tomorrow.isoformat()
        
        # Find tasks with deadlines today or tomorrow
        response = tasks_table.scan(
            FilterExpression=(
                boto3.dynamodb.conditions.Attr('Status').ne('Completed') & 
                (
                    boto3.dynamodb.conditions.Attr('Deadline').begins_with(today_str) | 
                    boto3.dynamodb.conditions.Attr('Deadline').begins_with(tomorrow_str)
                )
            )
        )
        
        tasks = response.get('Items', [])
        
        # Send notifications for each task
        for task in tasks:
            deadline_date = task['Deadline'].split('T')[0]
            is_today = deadline_date == today_str
            
            # Prepare notification message
            message = {
                'type': 'deadline_reminder',
                'task_id': task['TaskID'],
                'title': task['Title'],
                'deadline': task['Deadline'],
                'urgency': 'high' if is_today else 'medium',
                'message': f"Task '{task['Title']}' is due {'today' if is_today else 'tomorrow'}"
            }
            
            # Send notification
            try:
                sns.publish(
                    TopicArn=notification_topic,
                    Message=json.dumps(message),
                    MessageAttributes={
                        'user_id': {
                            'DataType': 'String',
                            'StringValue': task['AssignedTo']
                        }
                    }
                )
                print(f"Sent reminder for task {task['TaskID']}")
            except Exception as e:
                print(f"Failed to send notification for task {task['TaskID']}: {str(e)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f"Processed {len(tasks)} deadline reminders"
            })
        }
        
    except Exception as e:
        print(f"Deadline reminder error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f"Error processing deadline reminders: {str(e)}"
            })
        }