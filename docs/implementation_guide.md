# Task Management System - Implementation Guide

This guide provides detailed instructions for implementing the Task Management System using AWS serverless services and the AWS SAM framework.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- AWS SAM CLI installed
- Python 3.12.x installed
- Git for version control
- Code editor (VS Code recommended)

## Development Environment Setup

### 1. Install Required Tools

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install AWS SAM CLI
pip install aws-sam-cli

# Configure AWS CLI
aws configure
```

### 2. Clone Project Repository

```bash
git clone <repository-url>
cd task-management-system/backend
```

### 3. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txtcd task-management-system

```

## Project Structure

```
task-management-system/
├── .aws-sam/                  # SAM build artifacts
├── docs/                      # Project documentation
├── frontend/                  # Frontend static files
│   ├── css/                   # Stylesheets
│   ├── js/                    # JavaScript files
│   ├── images/                # Image assets
│   └── index.html             # Main HTML file
├── backend/                       # Backend source code
│   ├── auth/                  # Authentication functions
│   ├── tasks/                 # Task management functions
│   ├── notifications/         # Notification functions
│   ├── admin/                 # Admin dashboard functions
│   └── common/                # Shared utilities
├── tests/                     # Test files
├── instructions.md            # Project Instruction
├── template.yaml              # SAM template
├── samconfig.toml             # SAM configuration
└── README.md                  # Project README
```

## Implementation Steps

### Step 1: Define AWS SAM Template

Create a `template.yaml` file in the project root with the following resources:

- DynamoDB tables (Users, Tasks, Notifications)
- Lambda functions for API endpoints
- API Gateway REST API
- Cognito User Pool
- S3 bucket for frontend hosting
- CloudFront distribution
- EventBridge rules for notifications
- SNS topics for notifications
- IAM roles and policies

### Step 2: Implement Backend API

#### Authentication Module

1. Create Lambda functions for user registration, login, and profile management
2. Integrate with Cognito for authentication
3. Implement JWT token validation

#### Task Management Module

1. Create Lambda functions for CRUD operations on tasks
2. Implement task assignment and status update logic
3. Add filtering and sorting capabilities

#### Notification Module

1. Create Lambda functions for notification generation
2. Implement EventBridge rules for scheduled notifications
3. Set up SNS integration for email/SMS delivery

#### Admin Dashboard Module

1. Create Lambda functions for admin-specific operations
2. Implement task overview and statistics endpoints
3. Add team performance metrics

### Step 3: Develop Frontend

#### HTML Structure

1. Create responsive layouts for different user roles
2. Design task management interfaces
3. Implement admin dashboard views

#### CSS Styling

1. Create responsive stylesheets
2. Implement theme and visual components
3. Ensure accessibility compliance

#### JavaScript Functionality

1. Implement API client for backend communication
2. Add authentication and token management
3. Create interactive task management features
4. Implement real-time notifications

### Step 4: Integration and Testing

1. Test API endpoints with Postman or similar tools
2. Perform frontend-backend integration testing
3. Conduct security testing
4. Test notification delivery
5. Verify role-based access control

### Step 5: Deployment

#### Local Testing

```bash
# Build SAM application
sam build

# Start local API for testing
sam local start-api

# Run unit tests
pytest tests/
```

#### Deployment to AWS

```bash
# Deploy to development environment
sam deploy --guided

# Deploy to production
sam deploy --config-env production
```

## Database Schema Implementation

### Users Table

```yaml
UsersTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: Users
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - AttributeName: UserID
        AttributeType: S
      - AttributeName: Email
        AttributeType: S
    KeySchema:
      - AttributeName: UserID
        KeyType: HASH
    GlobalSecondaryIndexes:
      - IndexName: EmailIndex
        KeySchema:
          - AttributeName: Email
            KeyType: HASH
        Projection:
          ProjectionType: ALL
```

### Tasks Table

```yaml
TasksTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: Tasks
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - AttributeName: TaskID
        AttributeType: S
      - AttributeName: AssignedTo
        AttributeType: S
      - AttributeName: Status
        AttributeType: S
    KeySchema:
      - AttributeName: TaskID
        KeyType: HASH
    GlobalSecondaryIndexes:
      - IndexName: AssignedToIndex
        KeySchema:
          - AttributeName: AssignedTo
            KeyType: HASH
          - AttributeName: Status
            KeyType: RANGE
        Projection:
          ProjectionType: ALL
```

### Notifications Table

```yaml
NotificationsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: Notifications
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - AttributeName: NotificationID
        AttributeType: S
      - AttributeName: UserID
        AttributeType: S
      - AttributeName: CreatedAt
        AttributeType: S
    KeySchema:
      - AttributeName: NotificationID
        KeyType: HASH
    GlobalSecondaryIndexes:
      - IndexName: UserNotificationsIndex
        KeySchema:
          - AttributeName: UserID
            KeyType: HASH
          - AttributeName: CreatedAt
            KeyType: RANGE
        Projection:
          ProjectionType: ALL
```

## API Implementation Examples

### Task Creation Endpoint

```python
import json
import boto3
import uuid
import datetime
from common import response, auth

dynamodb = boto3.resource('dynamodb')
tasks_table = dynamodb.Table('Tasks')
sns = boto3.client('sns')
notification_topic = 'arn:aws:sns:region:account-id:TaskNotifications'

def lambda_handler(event, context):
    # Validate JWT token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Check if user is admin
    if user['role'] != 'admin':
        return response.forbidden("Only admins can create tasks")
    
    # Parse request body
    try:
        body = json.loads(event['body'])
    except:
        return response.bad_request("Invalid request body")
    
    # Validate required fields
    required_fields = ['title', 'description', 'priority', 'assignedTo', 'deadline']
    for field in required_fields:
        if field not in body:
            return response.bad_request(f"Missing required field: {field}")
    
    # Create task
    task_id = str(uuid.uuid4())
    current_time = datetime.datetime.now().isoformat()
    
    task = {
        'TaskID': task_id,
        'Title': body['title'],
        'Description': body['description'],
        'Priority': body['priority'],
        'Status': 'New',
        'CreatedBy': user['user_id'],
        'AssignedTo': body['assignedTo'],
        'CreatedAt': current_time,
        'Deadline': body['deadline'],
        'Notes': body.get('notes', '')
    }
    
    # Save to DynamoDB
    try:
        tasks_table.put_item(Item=task)
    except Exception as e:
        return response.server_error(str(e))
    
    # Send notification
    try:
        sns.publish(
            TopicArn=notification_topic,
            Message=json.dumps({
                'type': 'task_assigned',
                'task_id': task_id,
                'assigned_to': body['assignedTo'],
                'title': body['title']
            }),
            MessageAttributes={
                'user_id': {
                    'DataType': 'String',
                    'StringValue': body['assignedTo']
                }
            }
        )
    except Exception as e:
        print(f"Failed to send notification: {str(e)}")
    
    return response.created(task)
```

### Task List Endpoint

```python
import boto3
from boto3.dynamodb.conditions import Key
from common import response, auth

dynamodb = boto3.resource('dynamodb')
tasks_table = dynamodb.Table('Tasks')

def lambda_handler(event, context):
    # Validate JWT token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Get query parameters
    query_params = event.get('queryStringParameters', {}) or {}
    status_filter = query_params.get('status')
    
    # Different behavior based on user role
    if user['role'] == 'admin':
        # Admins can see all tasks
        if status_filter:
            # Filter by status if provided
            result = tasks_table.scan(
                FilterExpression=Key('Status').eq(status_filter)
            )
        else:
            # Get all tasks
            result = tasks_table.scan()
    else:
        # Team members can only see their assigned tasks
        if status_filter:
            # Filter by status if provided
            result = tasks_table.query(
                IndexName='AssignedToIndex',
                KeyConditionExpression=Key('AssignedTo').eq(user['user_id']) & Key('Status').eq(status_filter)
            )
        else:
            # Get all tasks assigned to the user
            result = tasks_table.query(
                IndexName='AssignedToIndex',
                KeyConditionExpression=Key('AssignedTo').eq(user['user_id'])
            )
    
    return response.success({
        'tasks': result.get('Items', []),
        'count': len(result.get('Items', [])),
        'user_role': user['role']
    })
```

## Frontend Implementation Examples

### Authentication Module (JavaScript)

```javascript
// auth.js
const API_URL = 'https://api.example.com';

class AuthService {
    async login(username, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                throw new Error('Login failed');
            }
            
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
    
    getToken() {
        return localStorage.getItem('token');
    }
    
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    
    isAuthenticated() {
        return this.getToken() !== null;
    }
    
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }
}

const authService = new AuthService();
export default authService;
```

### Task Management Module (JavaScript)

```javascript
// tasks.js
import authService from './auth.js';

const API_URL = 'https://api.example.com';

class TaskService {
    async getTasks(statusFilter = null) {
        try {
            let url = `${API_URL}/tasks`;
            if (statusFilter) {
                url += `?status=${statusFilter}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            
            const data = await response.json();
            return data.tasks;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    }
    
    async createTask(taskData) {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to create task');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }
    
    async updateTaskStatus(taskId, status) {
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify({ status })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update task status');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    }
}

const taskService = new TaskService();
export default taskService;
```

## Notification System Implementation

### EventBridge Rule for Deadline Reminders

```yaml
DeadlineReminderRule:
  Type: AWS::Events::Rule
  Properties:
    Description: "Trigger deadline reminders daily"
    ScheduleExpression: "cron(0 8 * * ? *)"  # Run daily at 8:00 AM UTC
    State: ENABLED
    Targets:
      - Arn: !GetAtt DeadlineReminderFunction.Arn
        Id: "DeadlineReminderTarget"

DeadlineReminderFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: src/notifications/
    Handler: deadline_reminders.lambda_handler
    Runtime: python3.12
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref TasksTable
      - SNSPublishMessagePolicy:
          TopicName: !GetAtt NotificationTopic.TopicName
    Environment:
      Variables:
        TASKS_TABLE: !Ref TasksTable
        NOTIFICATION_TOPIC: !Ref NotificationTopic
```

### Deadline Reminder Lambda Function

```python
import boto3
import datetime
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
tasks_table = dynamodb.Table('Tasks')
sns = boto3.client('sns')
notification_topic = 'arn:aws:sns:region:account-id:TaskNotifications'

def lambda_handler(event, context):
    # Get current date
    today = datetime.datetime.now().date()
    tomorrow = today + datetime.timedelta(days=1)
    
    # Format dates for comparison
    today_str = today.isoformat()
    tomorrow_str = tomorrow.isoformat()
    
    # Find tasks with deadlines today or tomorrow
    response = tasks_table.scan(
        FilterExpression=(
            Key('Status').ne('Completed') & 
            (Key('Deadline').begins_with(today_str) | Key('Deadline').begins_with(tomorrow_str))
        )
    )
    
    tasks = response.get('Items', [])
    
    # Send notifications for each task
    for task in tasks:
        deadline_date = task['Deadline'].split('T')[0]
        is_today = deadline_date == today_str
        
        # Prepare notification message
        message = {
            'type': 'deadline_reminder',
            'task_id': task['TaskID'],
            'title': task['Title'],
            'deadline': task['Deadline'],
            'urgency': 'high' if is_today else 'medium',
            'message': f"Task '{task['Title']}' is due {'today' if is_today else 'tomorrow'}"
        }
        
        # Send notification
        try:
            sns.publish(
                TopicArn=notification_topic,
                Message=json.dumps(message),
                MessageAttributes={
                    'user_id': {
                        'DataType': 'String',
                        'StringValue': task['AssignedTo']
                    }
                }
            )
            print(f"Sent reminder for task {task['TaskID']}")
        except Exception as e:
            print(f"Failed to send notification for task {task['TaskID']}: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f"Processed {len(tasks)} deadline reminders"
        })
    }
```

## Deployment Instructions

### 1. Build the SAM Application

```bash
sam build
```

### 2. Deploy to Development Environment

```bash
sam deploy --guided
```

Follow the prompts to configure your deployment:
- Stack Name: task-management-system-dev
- AWS Region: your-preferred-region
- Parameter values for your application
- Confirm changes before deployment: Y
- Allow SAM CLI to create IAM roles: Y
- Save arguments to samconfig.toml: Y

### 3. Deploy Frontend

```bash
# Get the S3 bucket name from CloudFormation outputs
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name task-management-system-dev --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" --output text)

# Deploy frontend files
aws s3 sync ./frontend/ s3://$BUCKET_NAME/

# Get the CloudFront distribution URL
DISTRIBUTION_URL=$(aws cloudformation describe-stacks --stack-name task-management-system-dev --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)

echo "Frontend deployed at: $DISTRIBUTION_URL"
```

### 4. Test the Deployment

1. Access the frontend using the CloudFront URL
2. Register an admin user
3. Create and assign tasks
4. Test the notification system
5. Verify all functionality works as expected

## Troubleshooting

### Common Issues and Solutions

1. **API Gateway CORS Issues**
   - Ensure CORS is properly configured in the SAM template
   - Check browser console for specific CORS errors

2. **Authentication Failures**
   - Verify Cognito User Pool configuration
   - Check JWT token validation in Lambda functions

3. **DynamoDB Access Issues**
   - Verify IAM roles and policies for Lambda functions
   - Check DynamoDB table names in environment variables

4. **Lambda Function Errors**
   - Check CloudWatch Logs for detailed error messages
   - Verify Python dependencies are properly included

5. **Notification Delivery Issues**
   - Verify SNS topic configuration
   - Check email addresses are verified in SES (if using SES)

## Maintenance and Updates

### Updating the Application

1. Make changes to the code or SAM template
2. Build and deploy the updated application:
   ```bash
   sam build
   sam deploy
   ```

### Monitoring

1. Set up CloudWatch Dashboards for key metrics
2. Configure CloudWatch Alarms for critical thresholds
3. Review CloudWatch Logs regularly for errors

### Backup and Recovery

1. Enable Point-in-Time Recovery for DynamoDB tables
2. Create regular backups of configuration and code
3. Document recovery procedures for different failure scenarios