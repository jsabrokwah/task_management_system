"""
Tests for the notification API endpoints.
"""
import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Set environment variables before importing modules
os.environ['NOTIFICATIONS_TABLE'] = 'Notifications-test'
os.environ['NOTIFICATION_TOPIC'] = 'arn:aws:sns:us-east-1:123456789012:TestTopic'

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.notifications.notifications import lambda_handler, process_sns_notification

class TestNotificationEndpoints(unittest.TestCase):
    """Test cases for notification endpoints."""
    
    @patch('backend.notifications.notifications.auth.validate_token')
    @patch('backend.notifications.notifications.notifications_table.query')
    def test_get_notifications(self, mock_query, mock_validate_token):
        """Test getting user notifications."""
        # Mock token validation
        mock_validate_token.return_value = {
            'user_id': 'user-1',
            'username': 'user1',
            'email': 'user1@example.com',
            'role': 'team_member'
        }
        
        # Mock DynamoDB response
        mock_query.return_value = {
            'Items': [
                {
                    'NotificationID': 'notif-1',
                    'UserID': 'user-1',
                    'Type': 'task_assigned',
                    'Message': 'You have been assigned a new task',
                    'CreatedAt': '2023-01-01T00:00:00',
                    'ReadStatus': False
                },
                {
                    'NotificationID': 'notif-2',
                    'UserID': 'user-1',
                    'Type': 'deadline_reminder',
                    'Message': 'Task deadline reminder',
                    'CreatedAt': '2023-01-02T00:00:00',
                    'ReadStatus': False
                }
            ]
        }
        
        # Create test event
        event = {
            'httpMethod': 'GET',
            'path': '/notifications',
            'headers': {
                'Authorization': 'Bearer test-token'
            }
        }
        
        # Call the handler
        response = lambda_handler(event, {})
        
        # Parse response
        body = json.loads(response['body'])
        
        # Assertions
        self.assertEqual(response['statusCode'], 200)
        self.assertTrue(body['success'])
        self.assertEqual(len(body['data']['notifications']), 2)
        self.assertEqual(body['data']['count'], 2)
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        mock_query.assert_called_once()
    
    @patch('backend.notifications.notifications.auth.validate_token')
    @patch('backend.notifications.notifications.notifications_table.get_item')
    @patch('backend.notifications.notifications.notifications_table.update_item')
    def test_mark_as_read(self, mock_update_item, mock_get_item, mock_validate_token):
        """Test marking a notification as read."""
        # Mock token validation
        mock_validate_token.return_value = {
            'user_id': 'user-1',
            'username': 'user1',
            'email': 'user1@example.com',
            'role': 'team_member'
        }
        
        # Mock DynamoDB get_item response
        mock_get_item.side_effect = [
            {
                'Item': {
                    'NotificationID': 'notif-1',
                    'UserID': 'user-1',
                    'Type': 'task_assigned',
                    'Message': 'You have been assigned a new task',
                    'CreatedAt': '2023-01-01T00:00:00',
                    'ReadStatus': False
                }
            },
            {
                'Item': {
                    'NotificationID': 'notif-1',
                    'UserID': 'user-1',
                    'Type': 'task_assigned',
                    'Message': 'You have been assigned a new task',
                    'CreatedAt': '2023-01-01T00:00:00',
                    'ReadStatus': True
                }
            }
        ]
        
        # Create test event
        event = {
            'httpMethod': 'PUT',
            'path': '/notifications/notif-1/read',
            'pathParameters': {
                'notificationId': 'notif-1'
            },
            'headers': {
                'Authorization': 'Bearer test-token'
            }
        }
        
        # Call the handler
        response = lambda_handler(event, {})
        
        # Parse response
        body = json.loads(response['body'])
        
        # Assertions
        self.assertEqual(response['statusCode'], 200)
        self.assertTrue(body['success'])
        self.assertTrue(body['data']['ReadStatus'])
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        self.assertEqual(mock_get_item.call_count, 2)
        mock_update_item.assert_called_once()
    
    @patch('backend.notifications.notifications.notifications_table.put_item')
    def test_process_sns_notification(self, mock_put_item):
        """Test processing SNS notifications."""
        # Create test SNS event
        event = {
            'Records': [
                {
                    'Sns': {
                        'Message': json.dumps({
                            'type': 'task_assigned',
                            'task_id': 'task-1',
                            'title': 'Task 1'
                        }),
                        'MessageAttributes': {
                            'user_id': {
                                'Value': 'user-1'
                            }
                        }
                    }
                }
            ]
        }
        
        # Call the handler
        process_sns_notification(event, {})
        
        # Verify mock was called
        mock_put_item.assert_called_once()
        
        # Check the notification data
        notification = mock_put_item.call_args[1]['Item']
        self.assertEqual(notification['UserID'], 'user-1')
        self.assertEqual(notification['Type'], 'task_assigned')
        self.assertIn('Task 1', notification['Message'])

if __name__ == '__main__':
    unittest.main()