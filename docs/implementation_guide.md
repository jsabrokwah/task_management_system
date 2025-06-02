# Task Management System Implementation Guide

This guide provides detailed instructions for testing, deploying, and maintaining the Task Management System application.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Testing Strategy](#testing-strategy)
- [Deployment Process](#deployment-process)
- [Post-Deployment Tasks](#post-deployment-tasks)
- [Troubleshooting](#troubleshooting)
- [Maintenance and Updates](#maintenance-and-updates)

## Architecture Overview

The Task Management System is a serverless application built on AWS with the following components:

- **Frontend**: Single-page application hosted on S3 and distributed via CloudFront
- **Backend**: Serverless API built with AWS Lambda and API Gateway
- **Authentication**: User management via Amazon Cognito
- **Database**: DynamoDB tables for users, tasks, and notifications
- **Notifications**: SNS for real-time notifications and deadline reminders

## Testing Strategy

### Unit Testing

The application includes comprehensive unit tests for all backend modules:

```bash
# Run all tests
cd /path/to/project
python -m unittest discover -s tests

# Run specific test modules
python -m unittest tests.test_auth
python -m unittest tests.test_tasks
python -m unittest tests.test_notifications
python -m unittest tests.test_deadline_reminders
```

### Test Coverage

To generate test coverage reports:

```bash
# Install coverage tool
pip install coverage

# Run tests with coverage
coverage run -m unittest discover -s tests

# Generate coverage report
coverage report
coverage html  # For detailed HTML report
```

### Integration Testing

Integration tests verify the interaction between components:

```bash
# Run integration tests (requires local DynamoDB)
cd /path/to/project
./backend/run_local.sh  # Start local API server
python -m unittest tests.test_integration
```

### End-to-End Testing

End-to-end tests validate the complete user journey:

1. Set up test environment with the frontend pointing to a test backend
2. Run automated UI tests using Selenium or Cypress
3. Verify all user flows work correctly

```bash
# Example Cypress command
npx cypress run
```

## Deployment Process

### Prerequisites

1. AWS CLI installed and configured
2. AWS SAM CLI installed
3. Python 3.12 or later
4. Node.js and npm (for frontend)

### 1. Build the SAM Application

```bash
# Navigate to project root
cd /path/to/project

# Build the application
sam build
```

### 2. Deploy to Development Environment

```bash
# Deploy with guided setup (first time)
sam deploy --guided

# For subsequent deployments
sam deploy
```

Follow the prompts to configure your deployment:
- Stack Name: task-management-system-dev
- AWS Region: your-preferred-region
- Parameter values:
  - Environment: dev
- Confirm changes before deployment: Y
- Allow SAM CLI to create IAM roles: Y
- Save arguments to samconfig.toml: Y

### 3. Deploy to Production Environment

```bash
# Deploy to production with specific parameters
sam deploy --config-file samconfig.toml --config-env prod
```

### 4. Deploy Frontend

```bash
# Get the S3 bucket name from CloudFormation outputs
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name task-management-system-dev --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" --output text)

# Get the API Gateway URL
API_URL=$(aws cloudformation describe-stacks --stack-name task-management-system-dev --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" --output text)

# Get Cognito User Pool and Client IDs
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name task-management-system-dev --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name task-management-system-dev --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)

 echo "apiUrl: '${API_URL}'"
# Update the frontend config.js with the apiUrl


# Deploy frontend files
aws s3 sync ./frontend/ s3://$BUCKET_NAME/

# Get the CloudFront distribution URL
DISTRIBUTION_URL=$(aws cloudformation describe-stacks --stack-name task-management-system-dev --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" --output text)

echo "Frontend deployed at: $DISTRIBUTION_URL"
```

## Post-Deployment Tasks

### 1. Create Admin User

Update the `create_admin_user.sh` script with your User Pool ID and desired admin credentials:

```bash
# Navigate to backend directory
cd /path/to/project/backend

# Update the script with your User Pool ID
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name task-management-system-dev --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
sed -i "s/YOUR_USER_POOL_ID/$USER_POOL_ID/g" create_admin_user.sh

# Make the script executable
chmod +x create_admin_user.sh

# Run the script to create admin user
./create_admin_user.sh
```

### 2. Verify Deployment

1. Access the frontend using the CloudFront URL
2. Log in with the admin credentials
3. Create a test task
4. Verify notifications are working
5. Check that deadline reminders are being sent

### 3. Configure CloudWatch Alarms

Set up CloudWatch alarms to monitor application health:

```bash
# Create alarm for API errors
aws cloudwatch put-metric-alarm \
  --alarm-name "API-Gateway-5XX-Errors" \
  --alarm-description "Alarm when API Gateway returns 5XX errors" \
  --metric-name "5XXError" \
  --namespace "AWS/ApiGateway" \
  --statistic "Sum" \
  --period 300 \
  --threshold 5 \
  --comparison-operator "GreaterThanOrEqualToThreshold" \
  --evaluation-periods 1 \
  --dimensions "Name=ApiName,Value=task-management-system-dev" \
  --alarm-actions "arn:aws:sns:region:account-id:AlertsTopic"
```

### 4. Set Up Monitoring Dashboard

Create a CloudWatch dashboard to monitor key metrics:

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "TaskManagementSystem" \
  --dashboard-body file://monitoring/dashboard.json
```

## Troubleshooting

### Common Issues and Solutions

1. **API Gateway CORS Issues**
   - Ensure CORS is properly configured in the SAM template
   - Check browser console for specific CORS errors
   - Verify the `Cors` section in the `ApiGateway` resource in template.yaml

2. **Authentication Failures**
   - Verify Cognito User Pool configuration
   - Check JWT token validation in Lambda functions
   - Ensure frontend config.js has correct User Pool and Client IDs

3. **DynamoDB Access Issues**
   - Verify IAM roles and policies for Lambda functions
   - Check DynamoDB table names in environment variables
   - Ensure table names match the environment (dev/prod)

4. **Lambda Function Errors**
   - Check CloudWatch Logs for detailed error messages:
     ```bash
     aws logs get-log-events --log-group-name /aws/lambda/task-management-system-dev-TasksFunction --log-stream-name latest
     ```
   - Verify Python dependencies are properly included

5. **Notification Delivery Issues**
   - Verify SNS topic configuration
   - Check SNS delivery status in CloudWatch Logs
   - Ensure Lambda has correct permissions to publish to SNS

### Debugging Tools

1. **Local API Testing**
   ```bash
   # Start local API server
   ./backend/run_local.sh
   
   # Test API endpoints
   curl http://localhost:3000/tasks -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **CloudWatch Logs Insights**
   ```
   fields @timestamp, @message
   | filter @message like /ERROR/
   | sort @timestamp desc
   | limit 20
   ```

## Maintenance and Updates

### Updating the Application

1. Make changes to the code or SAM template
2. Run tests to ensure changes work as expected:
   ```bash
   python -m unittest discover -s tests
   ```
3. Build and deploy the updated application:
   ```bash
   sam build
   sam deploy
   ```

### Database Maintenance

1. **Enable Point-in-Time Recovery for DynamoDB tables**
   ```bash
   aws dynamodb update-continuous-backups \
     --table-name Tasks-dev \
     --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
   ```

2. **Create on-demand backups**
   ```bash
   aws dynamodb create-backup \
     --table-name Tasks-dev \
     --backup-name "Tasks-dev-backup-$(date +%Y-%m-%d)"
   ```

### Security Updates

1. Regularly update dependencies:
   ```bash
   pip install -U -r backend/requirements.txt
   ```

2. Review and update IAM policies to follow least privilege principle

3. Enable AWS Config to monitor for security compliance

### Performance Optimization

1. Monitor Lambda function performance:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name Duration \
     --start-time 2023-01-01T00:00:00Z \
     --end-time 2023-01-02T00:00:00Z \
     --period 3600 \
     --statistics Average \
     --unit Milliseconds \
     --dimensions Name=FunctionName,Value=task-management-system-dev-TasksFunction
   ```

2. Adjust Lambda memory allocation based on performance metrics

3. Consider implementing caching for frequently accessed data

### Backup and Recovery

1. Document recovery procedures for different failure scenarios
2. Regularly test recovery procedures
3. Maintain backup copies of configuration and code in version control
4. Set up automated backups for all data stores