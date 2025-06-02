"""
Tests for the authentication API endpoints.
"""
import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Set environment variables before importing modules
os.environ['USERS_TABLE'] = 'Users-test'
os.environ['USER_POOL_ID'] = 'us-east-1_testpool'
os.environ['USER_POOL_CLIENT_ID'] = 'test-client-id'

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.auth.auth import lambda_handler

class TestAuthEndpoints(unittest.TestCase):
    """Test cases for authentication endpoints."""
    
    @patch('backend.auth.auth.auth.admin_create_user')
    @patch('backend.auth.auth.users_table.put_item')
    def test_register_success(self, mock_put_item, mock_admin_create_user):
        """Test successful user registration."""
        # Mock Cognito response
        mock_admin_create_user.return_value = {
            'user_id': 'test-user-id',
            'email': 'test@example.com',
            'role': 'team_member'
        }
        
        # Create test event
        event = {
            'httpMethod': 'POST',
            'path': '/auth/register',
            'body': json.dumps({
                'username': 'testuser',
                'email': 'test@example.com',
                'password': 'Password123!',
                'name': 'Test User'
            })
        }
        
        # Call the handler
        response = lambda_handler(event, {})
        
        # Parse response
        body = json.loads(response['body'])
        
        # Assertions
        self.assertEqual(response['statusCode'], 201)
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['email'], 'test@example.com')
        self.assertEqual(body['data']['role'], 'team_member')
        
        # Verify mocks were called
        mock_admin_create_user.assert_called_once()
        mock_put_item.assert_called_once()
    
    @patch('backend.auth.auth.auth.admin_create_user')
    def test_register_missing_field(self, mock_admin_create_user):
        """Test registration with missing required field."""
        # Create test event with missing email
        event = {
            'httpMethod': 'POST',
            'path': '/auth/register',
            'body': json.dumps({
                'username': 'testuser',
                'password': 'Password123!',
                'name': 'Test User'
            })
        }
        
        # Call the handler
        response = lambda_handler(event, {})
        
        # Parse response
        body = json.loads(response['body'])
        
        # Assertions
        self.assertEqual(response['statusCode'], 400)
        self.assertFalse(body['success'])
        self.assertIn('Missing required field', body['message'])
        
        # Verify mock was not called
        mock_admin_create_user.assert_not_called()
    
    @patch('backend.auth.auth.auth.admin_initiate_auth')
    @patch('backend.auth.auth.users_table.query')
    @patch('backend.auth.auth.users_table.update_item')
    def test_login_success(self, mock_update_item, mock_query, mock_admin_initiate_auth):
        """Test successful user login."""
        # Mock Cognito response
        mock_admin_initiate_auth.return_value = {
            'token': 'test-token',
            'refresh_token': 'test-refresh-token',
            'expires_in': 3600
        }
        
        # Mock DynamoDB response
        mock_query.return_value = {
            'Items': [{
                'UserID': 'test-user-id',
                'Username': 'testuser',
                'Email': 'test@example.com',
                'Role': 'team_member',
                'Name': 'Test User'
            }]
        }
        
        # Create test event
        event = {
            'httpMethod': 'POST',
            'path': '/auth/login',
            'body': json.dumps({
                'username': 'test@example.com',
                'password': 'Password123!'
            })
        }
        
        # Call the handler
        response = lambda_handler(event, {})
        
        # Parse response
        body = json.loads(response['body'])
        
        # Assertions
        self.assertEqual(response['statusCode'], 200)
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['token'], 'test-token')
        self.assertEqual(body['data']['user']['email'], 'test@example.com')
        
        # Verify mocks were called
        mock_admin_initiate_auth.assert_called_once()
        mock_query.assert_called_once()
        mock_update_item.assert_called_once()
    
    @patch('backend.auth.auth.auth.validate_token')
    @patch('backend.auth.auth.users_table.get_item')
    def test_get_profile_success(self, mock_get_item, mock_validate_token):
        """Test successful profile retrieval."""
        # Mock token validation
        mock_validate_token.return_value = {
            'user_id': 'test-user-id',
            'username': 'testuser',
            'email': 'test@example.com',
            'role': 'team_member'
        }
        
        # Mock DynamoDB response
        mock_get_item.return_value = {
            'Item': {
                'UserID': 'test-user-id',
                'Username': 'testuser',
                'Email': 'test@example.com',
                'Role': 'team_member',
                'Name': 'Test User',
                'Department': 'Engineering',
                'CreatedAt': '2023-01-01T00:00:00',
                'LastLogin': '2023-01-02T00:00:00'
            }
        }
        
        # Create test event
        event = {
            'httpMethod': 'GET',
            'path': '/auth/profile',
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
        self.assertEqual(body['data']['email'], 'test@example.com')
        self.assertEqual(body['data']['department'], 'Engineering')
        
        # Verify mocks were called
        mock_validate_token.assert_called_once()
        mock_get_item.assert_called_once()

if __name__ == '__main__':
    unittest.main()