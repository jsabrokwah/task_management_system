# Task Management System - Backend API

This directory contains the serverless backend implementation for the Task Management System using AWS Lambda, API Gateway, DynamoDB, and other AWS services.

## Directory Structure

```
backend/
├── admin/              # Admin dashboard API endpoints
├── auth/               # Authentication API endpoints
├── common/             # Shared utilities
├── notifications/      # Notification API endpoints
├── tasks/              # Task management API endpoints
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Tasks

- `GET /tasks` - List tasks (filtered by user role)
- `POST /tasks` - Create new task
- `GET /tasks/{taskId}` - Get task details
- `PUT /tasks/{taskId}` - Update task
- `DELETE /tasks/{taskId}` - Delete task
- `PUT /tasks/{taskId}/status` - Update task status
- `PUT /tasks/{taskId}/assign` - Assign task to user

### Admin

- `GET /admin/users` - List all users
- `GET /admin/tasks/overview` - Get task statistics
- `GET /admin/tasks/deadlines` - Get upcoming deadlines
- `GET /admin/performance` - Get team performance metrics

### Notifications

- `GET /notifications` - Get user notifications
- `PUT /notifications/{notificationId}/read` - Mark notification as read
- `PUT /notifications/settings` - Update notification preferences

## Development

### Prerequisites

- Python 3.12.x
- AWS CLI configured with appropriate permissions
- AWS SAM CLI

### Local Development

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run tests:
   ```bash
   cd ..
   python -m unittest discover tests
   ```

### Deployment

The backend is deployed using AWS SAM. See the root-level README for deployment instructions.

## Environment Variables

The following environment variables are used by the Lambda functions:

- `USERS_TABLE` - DynamoDB table for users
- `TASKS_TABLE` - DynamoDB table for tasks
- `NOTIFICATIONS_TABLE` - DynamoDB table for notifications
- `USER_POOL_ID` - Cognito User Pool ID
- `USER_POOL_CLIENT_ID` - Cognito User Pool Client ID
- `NOTIFICATION_TOPIC` - SNS topic ARN for notifications

These variables are automatically set by the SAM template during deployment.

## Authentication Flow

1. User registers with username, email, and password
2. User logs in with username/email and password
3. Cognito returns JWT tokens
4. Frontend stores tokens for subsequent API calls
5. API Gateway validates tokens for protected endpoints

## Task Management Flow

1. Admin creates a new task
2. Task is stored in DynamoDB
3. Notification is sent to assigned team member
4. Team member updates task status
5. Notification is sent to admin

## Notification System

1. SNS is used for publishing notifications
2. Lambda function processes SNS messages and stores notifications in DynamoDB
3. EventBridge rule triggers deadline reminders daily
4. Users can view and mark notifications as read

## Testing

Unit tests are provided for all API endpoints and utilities. Run the tests using:

```bash
cd ..
python -m unittest discover tests
```