"""
Test script for the Task Management System API.

This script tests the API endpoints using the local Flask server.
"""
import requests
import json
import time

BASE_URL = 'http://localhost:5000'

def test_auth():
    """Test authentication endpoints."""
    print("\n=== Testing Authentication ===")
    
    # Register admin user
    print("\nRegistering admin user...")
    register_data = {
        'username': 'admin_test',
        'email': 'admin_test@example.com',
        'password': 'Password123!',
        'name': 'Admin Test',
        'role': 'admin'
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Login
    print("\nLogging in...")
    login_data = {
        'username': 'admin_test@example.com',
        'password': 'Password123!'
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        token = response.json()['data']['token']
        return token
    else:
        # Use test token if login fails
        print("Using test token instead...")
        return 'test-token'

def test_tasks(token):
    """Test task management endpoints."""
    print("\n=== Testing Task Management ===")
    headers = {'Authorization': f'Bearer {token}'}
    
    # Create task
    print("\nCreating task...")
    task_data = {
        'title': 'Test Task',
        'description': 'This is a test task',
        'priority': 'Medium',
        'assignedTo': 'team-member-id',
        'deadline': '2023-12-31T17:00:00'
    }
    
    response = requests.post(f"{BASE_URL}/tasks", headers=headers, json=task_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 201:
        task_id = response.json()['data']['TaskID']
        
        # Get task
        print("\nGetting task...")
        response = requests.get(f"{BASE_URL}/tasks/{task_id}", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Update task status
        print("\nUpdating task status...")
        status_data = {'status': 'In Progress'}
        response = requests.put(f"{BASE_URL}/tasks/{task_id}/status", headers=headers, json=status_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Delete task
        print("\nDeleting task...")
        response = requests.delete(f"{BASE_URL}/tasks/{task_id}", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

def test_notifications(token):
    """Test notification endpoints."""
    print("\n=== Testing Notifications ===")
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get notifications
    print("\nGetting notifications...")
    response = requests.get(f"{BASE_URL}/notifications", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_admin(token):
    """Test admin endpoints."""
    print("\n=== Testing Admin Dashboard ===")
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get users
    print("\nGetting users...")
    response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Get task overview
    print("\nGetting task overview...")
    response = requests.get(f"{BASE_URL}/admin/tasks/overview", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == '__main__':
    try:
        # Test authentication
        token = test_auth()
        
        # Wait a bit for any async operations
        time.sleep(1)
        
        # Test other endpoints
        test_tasks(token)
        test_notifications(token)
        test_admin(token)
        
        print("\n=== All tests completed ===")
        
    except requests.exceptions.ConnectionError:
        print("\nError: Could not connect to the API server.")
        print("Make sure the Flask app is running on http://localhost:5000")
    except Exception as e:
        print(f"\nError: {str(e)}")