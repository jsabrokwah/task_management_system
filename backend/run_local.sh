#!/bin/bash

# Start DynamoDB Local if not already running
if ! docker ps | grep -q "dynamodb-local"; then
    echo "Starting DynamoDB Local..."
    docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local
else
    echo "DynamoDB Local is already running."
fi

# Set up local environment
echo "Setting up local environment..."
python3 local_setup.py

# Set environment variables
export USERS_TABLE=Users-dev
export TASKS_TABLE=Tasks-dev
export NOTIFICATIONS_TABLE=Notifications-dev
export USER_POOL_ID=mock-user-pool-id
export USER_POOL_CLIENT_ID=mock-user-pool-client-id
export NOTIFICATION_TOPIC=mock-notification-topic

# Run the Flask app
echo "Starting Flask app..."
python3 app.py