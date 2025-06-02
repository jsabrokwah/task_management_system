"""
Helper utilities for unit tests.
"""
import os
import unittest
from unittest.mock import patch

# Mock environment variables
os.environ['USERS_TABLE'] = 'Users-test'
os.environ['TASKS_TABLE'] = 'Tasks-test'
os.environ['NOTIFICATIONS_TABLE'] = 'Notifications-test'
os.environ['USER_POOL_ID'] = 'us-east-1_testpool'
os.environ['USER_POOL_CLIENT_ID'] = 'test-client-id'
os.environ['NOTIFICATION_TOPIC'] = 'arn:aws:sns:us-east-1:123456789012:TestTopic'
os.environ['ENVIRONMENT'] = 'test'

class TestCase(unittest.TestCase):
    """Base test case with common mocks and utilities."""
    
    def setUp(self):
        """Set up test environment."""
        # Create patches for common AWS services
        self.boto3_client_patcher = patch('boto3.client')
        self.boto3_resource_patcher = patch('boto3.resource')
        
        # Start patches
        self.mock_boto3_client = self.boto3_client_patcher.start()
        self.mock_boto3_resource = self.boto3_resource_patcher.start()
        
    def tearDown(self):
        """Clean up test environment."""
        # Stop patches
        self.boto3_client_patcher.stop()
        self.boto3_resource_patcher.stop()