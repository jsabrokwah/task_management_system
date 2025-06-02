"""
Authentication utilities for API endpoints.
"""
import os
import json
import boto3
import base64
import hmac
import hashlib
import time
from jose import jwk, jwt
from jose.utils import base64url_decode

# Initialize AWS clients
cognito = boto3.client('cognito-idp')

# Get environment variables
USER_POOL_ID = os.environ.get('USER_POOL_ID')
USER_POOL_CLIENT_ID = os.environ.get('USER_POOL_CLIENT_ID')

def validate_token(event):
    """
    Validate JWT token from Authorization header.
    
    Args:
        event (dict): API Gateway event
        
    Returns:
        dict: User claims if token is valid, None otherwise
    """
    # Extract token from Authorization header
    try:
        auth_header = event.get('headers', {}).get('Authorization') or event.get('headers', {}).get('authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        # Get the key id from the header
        token_sections = token.split('.')
        if len(token_sections) != 3:
            return None
            
        header = json.loads(base64.b64decode(token_sections[0] + '==').decode('utf-8'))
        kid = header['kid']
        
        # Get the public keys from Cognito
        keys_url = f'https://cognito-idp.{boto3.session.Session().region_name}.amazonaws.com/{USER_POOL_ID}/.well-known/jwks.json'
        response = boto3.client('cognito-idp').get_signing_certificate(UserPoolId=USER_POOL_ID)
        keys = json.loads(response['Certificate'])['keys']
        
        # Find the key matching the kid
        key = None
        for k in keys:
            if k['kid'] == kid:
                key = k
                break
                
        if not key:
            return None
            
        # Verify the signature
        public_key = jwk.construct(key)
        message = f"{token_sections[0]}.{token_sections[1]}"
        signature = base64url_decode(token_sections[2].encode('utf-8'))
        
        if not public_key.verify(message.encode('utf-8'), signature):
            return None
            
        # Verify the claims
        claims = jwt.get_unverified_claims(token)
        
        if claims['exp'] < time.time():
            return None
            
        if claims['aud'] != USER_POOL_CLIENT_ID:
            return None
            
        # Return the user claims
        return {
            'user_id': claims['sub'],
            'username': claims['cognito:username'],
            'email': claims.get('email', ''),
            'role': claims.get('custom:role', 'team_member')
        }
        
    except Exception as e:
        print(f"Token validation error: {str(e)}")
        return None

def get_secret_hash(username):
    """
    Generate a secret hash for Cognito authentication.
    
    Args:
        username (str): Username or email
        
    Returns:
        str: Secret hash
    """
    msg = username + USER_POOL_CLIENT_ID
    dig = hmac.new(
        USER_POOL_CLIENT_ID.encode('utf-8'), 
        msg=msg.encode('utf-8'),
        digestmod=hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

def admin_create_user(username, email, password, role='team_member'):
    """
    Create a new user in Cognito.
    
    Args:
        username (str): Username
        email (str): Email address
        password (str): Password
        role (str): User role (admin or team_member)
        
    Returns:
        dict: User data if successful, error message otherwise
    """
    try:
        response = cognito.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=username,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'email_verified', 'Value': 'true'},
                {'Name': 'custom:role', 'Value': role}
            ],
            TemporaryPassword=password,
            MessageAction='SUPPRESS'  # Don't send welcome email
        )
        
        # Set permanent password
        cognito.admin_set_user_password(
            UserPoolId=USER_POOL_ID,
            Username=username,
            Password=password,
            Permanent=True
        )
        
        return {
            'user_id': response['User']['Username'],
            'email': email,
            'role': role
        }
        
    except cognito.exceptions.UsernameExistsException:
        return {'error': 'User already exists'}
    except Exception as e:
        return {'error': str(e)}

def admin_initiate_auth(username, password):
    """
    Authenticate a user with Cognito.
    
    Args:
        username (str): Username or email
        password (str): Password
        
    Returns:
        dict: Authentication result if successful, error message otherwise
    """
    try:
        response = cognito.admin_initiate_auth(
            UserPoolId=USER_POOL_ID,
            ClientId=USER_POOL_CLIENT_ID,
            AuthFlow='ADMIN_NO_SRP_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            }
        )
        
        return {
            'token': response['AuthenticationResult']['IdToken'],
            'refresh_token': response['AuthenticationResult']['RefreshToken'],
            'expires_in': response['AuthenticationResult']['ExpiresIn']
        }
        
    except cognito.exceptions.NotAuthorizedException:
        return {'error': 'Invalid username or password'}
    except cognito.exceptions.UserNotFoundException:
        return {'error': 'User does not exist'}
    except Exception as e:
        return {'error': str(e)}