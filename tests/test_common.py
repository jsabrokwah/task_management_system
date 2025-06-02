"""
Tests for the common utilities.
"""
import json
import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Set environment variables before importing modules
os.environ['USER_POOL_ID'] = 'us-east-1_testpool'
os.environ['USER_POOL_CLIENT_ID'] = 'test-client-id'

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.common import response, auth

class TestResponseUtils(unittest.TestCase):
    """Test cases for response utilities."""
    
    def test_success_response(self):
        """Test success response."""
        resp = response.success({'key': 'value'})
        
        self.assertEqual(resp['statusCode'], 200)
        self.assertEqual(resp['headers']['Content-Type'], 'application/json')
        
        body = json.loads(resp['body'])
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['key'], 'value')
    
    def test_created_response(self):
        """Test created response."""
        resp = response.created({'id': '123'})
        
        self.assertEqual(resp['statusCode'], 201)
        
        body = json.loads(resp['body'])
        self.assertTrue(body['success'])
        self.assertEqual(body['data']['id'], '123')
    
    def test_bad_request_response(self):
        """Test bad request response."""
        resp = response.bad_request('Invalid input')
        
        self.assertEqual(resp['statusCode'], 400)
        
        body = json.loads(resp['body'])
        self.assertFalse(body['success'])
        self.assertEqual(body['message'], 'Invalid input')
    
    def test_unauthorized_response(self):
        """Test unauthorized response."""
        resp = response.unauthorized()
        
        self.assertEqual(resp['statusCode'], 401)
        
        body = json.loads(resp['body'])
        self.assertFalse(body['success'])
        self.assertEqual(body['message'], 'Unauthorized')
    
    def test_forbidden_response(self):
        """Test forbidden response."""
        resp = response.forbidden('Access denied')
        
        self.assertEqual(resp['statusCode'], 403)
        
        body = json.loads(resp['body'])
        self.assertFalse(body['success'])
        self.assertEqual(body['message'], 'Access denied')
    
    def test_not_found_response(self):
        """Test not found response."""
        resp = response.not_found('User not found')
        
        self.assertEqual(resp['statusCode'], 404)
        
        body = json.loads(resp['body'])
        self.assertFalse(body['success'])
        self.assertEqual(body['message'], 'User not found')
    
    def test_server_error_response(self):
        """Test server error response."""
        resp = response.server_error('Database error')
        
        self.assertEqual(resp['statusCode'], 500)
        
        body = json.loads(resp['body'])
        self.assertFalse(body['success'])
        self.assertEqual(body['message'], 'Database error')

class TestAuthUtils(unittest.TestCase):
    """Test cases for authentication utilities."""
    
    def test_validate_token_success(self):
        """Test successful token validation with test token."""
        # Create test event with test token
        event = {
            'headers': {
                'Authorization': 'Bearer test-token'
            }
        }
        
        # Call the function
        result = auth.validate_token(event)
        
        # Assertions
        self.assertIsNotNone(result)
        self.assertEqual(result['user_id'], 'test-user-id')
        self.assertEqual(result['username'], 'testuser')
        self.assertEqual(result['email'], 'test@example.com')
        self.assertEqual(result['role'], 'admin')

if __name__ == '__main__':
    unittest.main()