"""
Tests for the admin API endpoints.
"""
import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Set environment variables before importing modules
os.environ['USERS_TABLE'] = 'Users-test'
os.environ['TASKS_TABLE'] = 'Tasks-test'

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.admin.admin import lambda_handler

class TestAdminEndpoints(unittest.TestCase):
    """Test cases for admin endpoints."""
    
    @patch('backend.admin.admin.auth.validate_token')
    @patch('backend.admin.admin.users_table.scan')
    def test_get_users(self, mock_scan, mock_validate_token):
        """Test getting all users."""
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
                    'UserID': 'user-1',
                    'Username': 'user1',
                    'Email': 'user1@example.com',
                    'Role': 'team_member',
                    'Name': 'User One'
                },
                {
                    'UserID': 'admin-user-id',
                    'Username': 'admin',
                    'Email': 'admin@example.com',
                    'Role': 'admin',
                    'Name': 'Admin User'
                }
            ]
        }
        
        # Create test event
        event = {
            'httpMethod': 'GET',
            'path': '/admin/users',
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
        self.assertEqual(len(body['data']['users']), 2)
        self.assertEqual(body['data']['count'], 2)
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        mock_scan.assert_called_once()
    
    @patch('backend.admin.admin.auth.validate_token')
    def test_get_users_not_admin(self, mock_validate_token):
        """Test getting users by non-admin user."""
        # Mock token validation
        mock_validate_token.return_value = {
            'user_id': 'user-1',
            'username': 'user1',
            'email': 'user1@example.com',
            'role': 'team_member'
        }
        
        # Create test event
        event = {
            'httpMethod': 'GET',
            'path': '/admin/users',
            'headers': {
                'Authorization': 'Bearer test-token'
            }
        }
        
        # Call the handler
        response = lambda_handler(event, {})
        
        # Parse response
        body = json.loads(response['body'])
        
        # Assertions
        self.assertEqual(response['statusCode'], 403)
        self.assertFalse(body['success'])
        self.assertIn('Only admins can access this endpoint', body['message'])
        
        # Verify mock was called
        mock_validate_token.assert_called_once()
    
    @patch('backend.admin.admin.auth.validate_token')
    @patch('backend.admin.admin.tasks_table.scan')
    def test_get_tasks_overview(self, mock_scan, mock_validate_token):
        """Test getting task statistics."""
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
                    'Priority': 'High'
                },
                {
                    'TaskID': 'task-2',
                    'Title': 'Task 2',
                    'Status': 'In Progress',
                    'Priority': 'Medium'
                },
                {
                    'TaskID': 'task-3',
                    'Title': 'Task 3',
                    'Status': 'Completed',
                    'Priority': 'Low'
                }
            ]
        }
        
        # Create test event
        event = {
            'httpMethod': 'GET',
            'path': '/admin/tasks/overview',
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
        self.assertEqual(body['data']['total_tasks'], 3)
        self.assertEqual(body['data']['status_counts']['New'], 1)
        self.assertEqual(body['data']['status_counts']['In Progress'], 1)
        self.assertEqual(body['data']['status_counts']['Completed'], 1)
        self.assertEqual(body['data']['priority_counts']['High'], 1)
        self.assertEqual(body['data']['priority_counts']['Medium'], 1)
        self.assertEqual(body['data']['priority_counts']['Low'], 1)
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        mock_scan.assert_called_once()
    
    @patch('backend.admin.admin.auth.validate_token')
    @patch('backend.admin.admin.tasks_table.scan')
    def test_get_upcoming_deadlines(self, mock_scan, mock_validate_token):
        """Test getting upcoming deadlines."""
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
                    'Deadline': '2023-12-31T23:59:59'
                },
                {
                    'TaskID': 'task-2',
                    'Title': 'Task 2',
                    'Status': 'In Progress',
                    'Deadline': '2023-12-25T23:59:59'
                }
            ]
        }
        
        # Create test event
        event = {
            'httpMethod': 'GET',
            'path': '/admin/tasks/deadlines',
            'headers': {
                'Authorization': 'Bearer test-token'
            },
            'queryStringParameters': {
                'days': '7'
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
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        mock_scan.assert_called_once()

if __name__ == '__main__':
    unittest.main()