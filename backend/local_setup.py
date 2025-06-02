"""
Local setup script for the Task Management System backend.

This script creates local DynamoDB tables for development and testing.
"""
import boto3
import os
import json
import uuid
from datetime import datetime

# Create a DynamoDB client using the local endpoint
dynamodb = boto3.resource('dynamodb', endpoint_url='http://localhost:8000')

def create_tables():
    """Create local DynamoDB tables."""
    # Create Users table
    users_table = dynamodb.create_table(
        TableName='Users-dev',
        KeySchema=[
            {'AttributeName': 'UserID', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'UserID', 'AttributeType': 'S'},
            {'AttributeName': 'Email', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'EmailIndex',
                'KeySchema': [
                    {'AttributeName': 'Email', 'KeyType': 'HASH'}
                ],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    )
    
    # Create Tasks table
    tasks_table = dynamodb.create_table(
        TableName='Tasks-dev',
        KeySchema=[
            {'AttributeName': 'TaskID', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'TaskID', 'AttributeType': 'S'},
            {'AttributeName': 'AssignedTo', 'AttributeType': 'S'},
            {'AttributeName': 'Status', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'AssignedToIndex',
                'KeySchema': [
                    {'AttributeName': 'AssignedTo', 'KeyType': 'HASH'},
                    {'AttributeName': 'Status', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    )
    
    # Create Notifications table
    notifications_table = dynamodb.create_table(
        TableName='Notifications-dev',
        KeySchema=[
            {'AttributeName': 'NotificationID', 'KeyType': 'HASH'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'NotificationID', 'AttributeType': 'S'},
            {'AttributeName': 'UserID', 'AttributeType': 'S'},
            {'AttributeName': 'CreatedAt', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'UserNotificationsIndex',
                'KeySchema': [
                    {'AttributeName': 'UserID', 'KeyType': 'HASH'},
                    {'AttributeName': 'CreatedAt', 'KeyType': 'RANGE'}
                ],
                'Projection': {'ProjectionType': 'ALL'},
                'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
            }
        ],
        ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
    )
    
    print("Tables created successfully!")
    return users_table, tasks_table, notifications_table

def seed_data():
    """Seed the tables with sample data."""
    # Get table references
    users_table = dynamodb.Table('Users-dev')
    tasks_table = dynamodb.Table('Tasks-dev')
    notifications_table = dynamodb.Table('Notifications-dev')
    
    # Create admin user
    admin_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()
    
    admin_user = {
        'UserID': admin_id,
        'Username': 'admin',
        'Email': 'admin@example.com',
        'Role': 'admin',
        'Name': 'Admin User',
        'Department': 'Management',
        'CreatedAt': current_time,
        'LastLogin': current_time
    }
    
    users_table.put_item(Item=admin_user)
    
    # Create team member
    team_member_id = str(uuid.uuid4())
    
    team_member = {
        'UserID': team_member_id,
        'Username': 'team_member',
        'Email': 'team@example.com',
        'Role': 'team_member',
        'Name': 'Team Member',
        'Department': 'Field Operations',
        'CreatedAt': current_time,
        'LastLogin': current_time
    }
    
    users_table.put_item(Item=team_member)
    
    # Create sample tasks
    task1_id = str(uuid.uuid4())
    task1 = {
        'TaskID': task1_id,
        'Title': 'Complete site survey',
        'Description': 'Perform a complete site survey at the Main Street location',
        'Priority': 'High',
        'Status': 'New',
        'CreatedBy': admin_id,
        'AssignedTo': team_member_id,
        'CreatedAt': current_time,
        'Deadline': '2023-12-31T17:00:00',
        'Notes': 'Bring all necessary equipment'
    }
    
    tasks_table.put_item(Item=task1)
    
    task2_id = str(uuid.uuid4())
    task2 = {
        'TaskID': task2_id,
        'Title': 'Equipment maintenance',
        'Description': 'Perform routine maintenance on field equipment',
        'Priority': 'Medium',
        'Status': 'In Progress',
        'CreatedBy': admin_id,
        'AssignedTo': team_member_id,
        'CreatedAt': current_time,
        'Deadline': '2023-12-15T17:00:00',
        'Notes': 'Follow maintenance checklist'
    }
    
    tasks_table.put_item(Item=task2)
    
    # Create sample notification
    notification_id = str(uuid.uuid4())
    notification = {
        'NotificationID': notification_id,
        'UserID': team_member_id,
        'TaskID': task1_id,
        'Type': 'task_assigned',
        'Message': 'You have been assigned a new task: Complete site survey',
        'CreatedAt': current_time,
        'ReadStatus': False
    }
    
    notifications_table.put_item(Item=notification)
    
    print("Sample data seeded successfully!")

if __name__ == '__main__':
    try:
        # Check if tables already exist
        existing_tables = [table.name for table in dynamodb.tables.all()]
        
        if 'Users-dev' in existing_tables and 'Tasks-dev' in existing_tables and 'Notifications-dev' in existing_tables:
            print("Tables already exist. Skipping table creation.")
        else:
            # Create tables
            create_tables()
            
            # Wait for tables to be created
            print("Waiting for tables to be created...")
            users_table = dynamodb.Table('Users-dev')
            users_table.meta.client.get_waiter('table_exists').wait(TableName='Users-dev')
            tasks_table = dynamodb.Table('Tasks-dev')
            tasks_table.meta.client.get_waiter('table_exists').wait(TableName='Tasks-dev')
            notifications_table = dynamodb.Table('Notifications-dev')
            notifications_table.meta.client.get_waiter('table_exists').wait(TableName='Notifications-dev')
        
        # Seed data
        seed_data()
        
    except Exception as e:
        print(f"Error: {str(e)}")
        print("Make sure DynamoDB Local is running on port 8000")
        print("You can start it with: docker run -p 8000:8000 amazon/dynamodb-local")