#!/bin/bash

# Replace these variables with your actual values
USER_POOL_ID="eu-west-1_L647uFs1U"  # e.g., eu-west-1_abcdefghi
USERNAME="jsabrokwahsenior@gmail.com"
EMAIL="jsabrokwahsenior@gmail.com"
PASSWORD="StrongP@ssw0rd!"  # Must meet Cognito password requirements
NAME="Admin User"

# Create the user
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
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username $USERNAME \
  --password $PASSWORD \
  --permanent
