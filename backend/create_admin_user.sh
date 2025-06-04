#!/bin/bash

# Replace these variables with your actual values
USER_POOL_ID="YOUR_USER_POOL_ID"  # e.g., eu-west-1_abcdefghi
USERNAME="jsabrokwahsenior@gmail.com"
EMAIL="jsabrokwahsenior@gmail.com"
PASSWORD="StrongP@ssw0rd!"  # Must meet Cognito password requirements
NAME="Admin User"
ENVIRONMENT="dev"  # Change to "prod" for production environment
TABLE_NAME="Users-${ENVIRONMENT}"  # DynamoDB table name based on environment

# Create the user in Cognito
echo "Creating user in Cognito..."
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username $USERNAME \
  --user-attributes \
    Name=email,Value=$EMAIL \
    Name=email_verified,Value=true \
    Name=name,Value="$NAME" \
    Name=custom:role,Value=admin \
  --message-action SUPPRESS

# Set the permanent password (skip the temporary password flow)
echo "Setting permanent password..."
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username $USERNAME \
  --password $PASSWORD \
  --permanent

# Generate a UUID for the user ID
USER_ID=$(uuidgen)

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Add the user to DynamoDB
echo "Adding user to DynamoDB table ${TABLE_NAME}..."
aws dynamodb put-item \
  --table-name $TABLE_NAME \
  --item "{\"UserID\":{\"S\":\"$USER_ID\"},\"Email\":{\"S\":\"$EMAIL\"},\"Name\":{\"S\":\"$NAME\"},\"Role\":{\"S\":\"admin\"},\"Username\":{\"S\":\"$EMAIL\"},\"CreatedAt\":{\"S\":\"$TIMESTAMP\"},\"LastLogin\":{\"S\":\"$TIMESTAMP\"}}"

echo "Admin user created successfully in both Cognito and DynamoDB!"
echo "UserID: $USER_ID"
