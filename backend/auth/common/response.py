"""
Common response utilities for API endpoints.
"""
import json

def build_response(status_code, body):
    """
    Build a standardized API response.
    
    Args:
        status_code (int): HTTP status code
        body (dict): Response body
        
    Returns:
        dict: API Gateway compatible response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }

def success(data=None):
    """Return a successful response with optional data."""
    body = {'success': True}
    if data is not None:
        body['data'] = data
    return build_response(200, body)

def created(data=None):
    """Return a 201 Created response with optional data."""
    body = {'success': True, 'message': 'Resource created successfully'}
    if data is not None:
        body['data'] = data
    return build_response(201, body)

def bad_request(message='Bad request'):
    """Return a 400 Bad Request response."""
    return build_response(400, {'success': False, 'message': message})

def unauthorized(message='Unauthorized'):
    """Return a 401 Unauthorized response."""
    return build_response(401, {'success': False, 'message': message})

def forbidden(message='Forbidden'):
    """Return a 403 Forbidden response."""
    return build_response(403, {'success': False, 'message': message})

def not_found(message='Resource not found'):
    """Return a 404 Not Found response."""
    return build_response(404, {'success': False, 'message': message})

def server_error(message='Internal server error'):
    """Return a 500 Internal Server Error response."""
    return build_response(500, {'success': False, 'message': message})