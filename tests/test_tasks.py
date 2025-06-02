"""
Tests for the task management API endpoints.
"""
import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Set environment variables before importing modules
os.environ['TASKS_TABLE'] = 'Tasks-test'
os.environ['NOTIFICATION_TOPIC'] = 'arn:aws:sns:us-east-1:123456789012:TestTopic'

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.tasks.tasks import lambda_handler

class TestTaskEndpoints(unittest.TestCase):
    """Test cases for task management endpoints."""
    
    @patch('backend.tasks.tasks.auth.validate_token')
    @patch('backend.tasks.tasks.tasks_table.scan')
    def test_get_tasks_admin(self, mock_scan, mock_validate_token):
        """Test getting tasks as admin."""
        # Mock token validation
        mock_validate_token.return_value = {
            'user_id': 'admin-user-id',
            'username': 'admin',
            'email': 'admin@example.com',
            'role': 'admin'
        }
        
        # Mock DynamoDB response
        mock_scan.return_value = {
            'Items': [
                {
                    'TaskID': 'task-1',
                    'Title': 'Task 1',
                    'Status': 'New',
                    'AssignedTo': 'user-1'
                },
                {
                    'TaskID': 'task-2',
                    'Title': 'Task 2',
                    'Status': 'In Progress',
                    'AssignedTo': 'user-2'
                }
            ]
        }
        
        # Create test event
        event = {
            'httpMethod': 'GET',
            'path': '/tasks',
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
        self.assertEqual(len(body['data']['tasks']), 2)
        self.assertEqual(body['data']['count'], 2)
        self.assertEqual(body['data']['user_role'], 'admin')
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        mock_scan.assert_called_once()
    
    @patch('backend.tasks.tasks.auth.validate_token')
    @patch('backend.tasks.tasks.tasks_table.scan')
    def test_get_tasks_team_member(self, mock_scan, mock_validate_token):
        """Test getting tasks as team member."""
        # Mock token validation
        mock_validate_token.return_value = {
            'user_id': 'user-1',
            'username': 'user1',
            'email': 'user1@example.com',
            'role': 'team_member'
        }
        
        # Mock DynamoDB response
        mock_scan.return_value = {
            'Items': [
                {
                    'TaskID': 'task-1',
                    'Title': 'Task 1',
                    'Status': 'New',
                    'AssignedTo': 'user-1'
                }
            ]
        }
        
        # Create test event
        event = {
            'httpMethod': 'GET',
            'path': '/tasks',
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
        self.assertEqual(len(body['data']['tasks']), 1)
        self.assertEqual(body['data']['count'], 1)
        self.assertEqual(body['data']['user_role'], 'team_member')
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        mock_scan.assert_called_once()
    
    @patch('backend.tasks.tasks.auth.validate_token')
    @patch('backend.tasks.tasks.tasks_table.put_item')
    @patch('backend.tasks.tasks.sns.publish')
    def test_create_task_success(self, mock_publish, mock_put_item, mock_validate_token):
        """Test successful task creation."""
        # Mock token validation
        mock_validate_token.return_value = {
            'user_id': 'admin-user-id',
            'username': 'admin',
            'email': 'admin@example.com',
            'role': 'admin'
        }
        
        # Create test event
        event = {
            'httpMethod': 'POST',
            'path': '/tasks',
            'headers': {
                'Authorization': 'Bearer test-token'
            },
            'body': json.dumps({
                'title': 'New Task',
                'description': 'Task description',
                'priority': 'High',
                'assignedTo': 'user-1',
                'deadline': '2023-12-31T23:59:59'
            })
        }
        
        # Call the handler
        response = lambda_handler(event, {})
        
        # Parse response
        body = json.loads(response['body'])
        
        # Assertions
        self.assertEqual(response['statusCode'], 201)
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['Title'], 'New Task')
        self.assertEqual(body['data']['Priority'], 'High')
        self.assertEqual(body['data']['Status'], 'New')
        self.assertEqual(body['data']['AssignedTo'], 'user-1')
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        mock_put_item.assert_called_once()
        mock_publish.assert_called_once()
    
    @patch('backend.tasks.tasks.auth.validate_token')
    def test_create_task_not_admin(self, mock_validate_token):
        """Test task creation by non-admin user."""
        # Mock token validation
        mock_validate_token.return_value = {
            'user_id': 'user-1',
            'username': 'user1',
            'email': 'user1@example.com',
            'role': 'team_member'
        }
        
        # Create test event
        event = {
            'httpMethod': 'POST',
            'path': '/tasks',
            'headers': {
                'Authorization': 'Bearer test-token'
            },
            'body': json.dumps({
                'title': 'New Task',
                'description': 'Task description',
                'priority': 'High',
                'assignedTo': 'user-1',
                'deadline': '2023-12-31T23:59:59'
            })
        }
        
        # Call the handler
        response = lambda_handler(event, {})
        
        # Parse response
        body = json.loads(response['body'])
        
        # Assertions
        self.assertEqual(response['statusCode'], 403)
        self.assertFalse(body['success'])
        self.assertIn('Only admins can create tasks', body['message'])
        
        # Verify mock was called
        mock_validate_token.assert_called_once()
    
    @patch('backend.tasks.tasks.auth.validate_token')
    @patch('backend.tasks.tasks.tasks_table.get_item')
    @patch('backend.tasks.tasks.tasks_table.update_item')
    @patch('backend.tasks.tasks.sns.publish')
    def test_update_task_status(self, mock_publish, mock_update_item, mock_get_item, mock_validate_token):
        """Test updating task status."""
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
                    'TaskID': 'task-1',
                    'Title': 'Task 1',
                    'Status': 'New',
                    'AssignedTo': 'user-1',
                    'CreatedBy': 'admin-user-id'
                }
            },
            {
                'Item': {
                    'TaskID': 'task-1',
                    'Title': 'Task 1',
                    'Status': 'In Progress',
                    'AssignedTo': 'user-1',
                    'CreatedBy': 'admin-user-id'
                }
            }
        ]
        
        # Create test event
        event = {
            'httpMethod': 'PUT',
            'path': '/tasks/task-1/status',
            'pathParameters': {
                'taskId': 'task-1'
            },
            'headers': {
                'Authorization': 'Bearer test-token'
            },
            'body': json.dumps({
                'status': 'In Progress'
            })
        }
        
        # Call the handler
        response = lambda_handler(event, {})
        
        # Parse response
        body = json.loads(response['body'])
        
        # Assertions
        self.assertEqual(response['statusCode'], 200)
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['Status'], 'In Progress')
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        self.assertEqual(mock_get_item.call_count, 2)
        mock_update_item.assert_called_once()
        mock_publish.assert_called_once()

if __name__ == '__main__':
    unittest.main()