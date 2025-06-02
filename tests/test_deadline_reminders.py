"""
Tests for the deadline reminder function.
"""
import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os
from datetime import datetime, timedelta

# Set environment variables before importing modules
os.environ['TASKS_TABLE'] = 'Tasks-test'
os.environ['NOTIFICATION_TOPIC'] = 'arn:aws:sns:us-east-1:123456789012:TestTopic'

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.notifications.deadline_reminders import lambda_handler

class TestDeadlineReminders(unittest.TestCase):
    """Test cases for deadline reminder function."""
    
    @patch('backend.notifications.deadline_reminders.tasks_table.scan')
    @patch('backend.notifications.deadline_reminders.sns.publish')
    def test_deadline_reminders(self, mock_publish, mock_scan):
        """Test deadline reminder processing."""
        # Get current date
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        
        # Format dates for comparison
        today_str = today.isoformat()
        tomorrow_str = tomorrow.isoformat()
        
        # Mock DynamoDB response
        mock_scan.return_value = {
            'Items': [
                {
                    'TaskID': 'task-1',
                    'Title': 'Task 1',
                    'Status': 'In Progress',
                    'AssignedTo': 'user-1',
                    'Deadline': f"{today_str}T23:59:59"
                },
                {
                    'TaskID': 'task-2',
                    'Title': 'Task 2',
                    'Status': 'New',
                    'AssignedTo': 'user-2',
                    'Deadline': f"{tomorrow_str}T12:00:00"
                }
            ]
        }
        
        # Call the handler
        response = lambda_handler({}, {})
        
        # Assertions
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertIn('Processed 2 deadline reminders', body['message'])
        
        # Verify mocks were called
        mock_scan.assert_called_once()
        self.assertEqual(mock_publish.call_count, 2)
        
        # Check first notification
        first_call = mock_publish.call_args_list[0][1]
        message = json.loads(first_call['Message'])
        self.assertEqual(message['task_id'], 'task-1')
        self.assertEqual(message['urgency'], 'high')
        self.assertIn('due today', message['message'])
        
        # Check second notification
        second_call = mock_publish.call_args_list[1][1]
        message = json.loads(second_call['Message'])
        self.assertEqual(message['task_id'], 'task-2')
        self.assertEqual(message['urgency'], 'medium')
        self.assertIn('due tomorrow', message['message'])

if __name__ == '__main__':
    unittest.main()