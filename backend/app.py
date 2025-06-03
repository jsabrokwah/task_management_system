"""
Flask application for local development of the Task Management System API.

This file is used for local development and testing only.
In production, the API is deployed as separate Lambda functions.
"""
import os
import json
from flask import Flask, request, jsonify
import boto3
from werkzeug.exceptions import HTTPException

# Import handlers
from auth.auth.auth import lambda_handler as auth_handler
from tasks.tasks.tasks import lambda_handler as tasks_handler
from notifications.notifications.notifications import lambda_handler as notifications_handler
from admin.admin.admin import lambda_handler as admin_handler

app = Flask(__name__)

# Set up mock environment variables if not set
if not os.environ.get('USERS_TABLE'):
    os.environ['USERS_TABLE'] = 'Users-dev'
if not os.environ.get('TASKS_TABLE'):
    os.environ['TASKS_TABLE'] = 'Tasks-dev'
if not os.environ.get('NOTIFICATIONS_TABLE'):
    os.environ['NOTIFICATIONS_TABLE'] = 'Notifications-dev'
if not os.environ.get('USER_POOL_ID'):
    os.environ['USER_POOL_ID'] = 'mock-user-pool-id'
if not os.environ.get('USER_POOL_CLIENT_ID'):
    os.environ['USER_POOL_CLIENT_ID'] = 'mock-user-pool-client-id'
if not os.environ.get('NOTIFICATION_TOPIC'):
    os.environ['NOTIFICATION_TOPIC'] = 'mock-notification-topic'

def create_event(request, path_params=None):
    """
    Create an API Gateway event from a Flask request.
    """
    body = request.get_data(as_text=True)
    
    event = {
        'httpMethod': request.method,
        'path': request.path,
        'queryStringParameters': request.args.to_dict() if request.args else None,
        'headers': dict(request.headers),
        'body': body,
        'pathParameters': path_params or {}
    }
    
    return event

def process_response(lambda_response):
    """
    Process a Lambda response into a Flask response.
    """
    status_code = lambda_response.get('statusCode', 200)
    headers = lambda_response.get('headers', {})
    body = lambda_response.get('body', '{}')
    
    response = app.response_class(
        response=body,
        status=status_code,
        headers=headers
    )
    
    return response

# Auth routes
@app.route('/auth/register', methods=['POST'])
def register():
    event = create_event(request)
    return process_response(auth_handler(event, None))

@app.route('/auth/login', methods=['POST'])
def login():
    event = create_event(request)
    return process_response(auth_handler(event, None))

@app.route('/auth/profile', methods=['GET', 'PUT'])
def profile():
    event = create_event(request)
    return process_response(auth_handler(event, None))

# Task routes
@app.route('/tasks', methods=['GET', 'POST'])
def tasks():
    event = create_event(request)
    return process_response(tasks_handler(event, None))

@app.route('/tasks/<task_id>', methods=['GET', 'PUT', 'DELETE'])
def task(task_id):
    event = create_event(request, {'taskId': task_id})
    return process_response(tasks_handler(event, None))

@app.route('/tasks/<task_id>/status', methods=['PUT'])
def task_status(task_id):
    event = create_event(request, {'taskId': task_id})
    return process_response(tasks_handler(event, None))

@app.route('/tasks/<task_id>/assign', methods=['PUT'])
def task_assign(task_id):
    event = create_event(request, {'taskId': task_id})
    return process_response(tasks_handler(event, None))

# Notification routes
@app.route('/notifications', methods=['GET'])
def notifications():
    event = create_event(request)
    return process_response(notifications_handler(event, None))

@app.route('/notifications/<notification_id>/read', methods=['PUT'])
def notification_read(notification_id):
    event = create_event(request, {'notificationId': notification_id})
    return process_response(notifications_handler(event, None))

@app.route('/notifications/settings', methods=['PUT'])
def notification_settings():
    event = create_event(request)
    return process_response(notifications_handler(event, None))

# Admin routes
@app.route('/admin/users', methods=['GET'])
def admin_users():
    event = create_event(request)
    return process_response(admin_handler(event, None))

@app.route('/admin/tasks/overview', methods=['GET'])
def admin_tasks_overview():
    event = create_event(request)
    return process_response(admin_handler(event, None))

@app.route('/admin/tasks/deadlines', methods=['GET'])
def admin_tasks_deadlines():
    event = create_event(request)
    return process_response(admin_handler(event, None))

@app.route('/admin/performance', methods=['GET'])
def admin_performance():
    event = create_event(request)
    return process_response(admin_handler(event, None))

# Error handling
@app.errorhandler(HTTPException)
def handle_exception(e):
    response = e.get_response()
    response.data = json.dumps({
        "code": e.code,
        "name": e.name,
        "description": e.description,
    })
    response.content_type = "application/json"
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)