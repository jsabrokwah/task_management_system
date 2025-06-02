"""
Admin API endpoints for the Task Management System.
"""
import os
import json
import boto3
from datetime import datetime, timedelta
import sys

# Add parent directory to path to import common modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common import response, auth

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(os.environ.get('USERS_TABLE'))
tasks_table = dynamodb.Table(os.environ.get('TASKS_TABLE'))

def lambda_handler(event, context):
    """
    Main handler for admin API endpoints.
    
    Routes requests to the appropriate function based on the HTTP method and path.
    """
    http_method = event['httpMethod']
    path = event['path']
    
    # Route to the appropriate handler
    if http_method == 'GET' and path == '/admin/users':
        return get_users(event)
    elif http_method == 'GET' and path == '/admin/tasks/overview':
        return get_tasks_overview(event)
    elif http_method == 'GET' and path == '/admin/tasks/deadlines':
        return get_upcoming_deadlines(event)
    elif http_method == 'GET' and path == '/admin/performance':
        return get_performance_metrics(event)
    else:
        return response.not_found('Endpoint not found')

def get_users(event):
    """Get all users."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Check if user is admin
    if user['role'] != 'admin':
        return response.forbidden("Only admins can access this endpoint")
    
    try:
        # Get all users from DynamoDB
        result = users_table.scan()
        
        # Return users
        return response.success({
            'users': result.get('Items', []),
            'count': len(result.get('Items', []))
        })
        
    except Exception as e:
        print(f"Get users error: {str(e)}")
        return response.server_error(str(e))

def get_tasks_overview(event):
    """Get task statistics."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Check if user is admin
    if user['role'] != 'admin':
        return response.forbidden("Only admins can access this endpoint")
    
    try:
        # Get all tasks from DynamoDB
        result = tasks_table.scan()
        tasks = result.get('Items', [])
        
        # Calculate statistics
        total_tasks = len(tasks)
        status_counts = {
            'New': 0,
            'In Progress': 0,
            'Completed': 0,
            'Overdue': 0
        }
        priority_counts = {
            'Low': 0,
            'Medium': 0,
            'High': 0
        }
        
        for task in tasks:
            status = task.get('Status', 'New')
            priority = task.get('Priority', 'Medium')
            
            if status in status_counts:
                status_counts[status] += 1
            
            if priority in priority_counts:
                priority_counts[priority] += 1
        
        # Return statistics
        return response.success({
            'total_tasks': total_tasks,
            'status_counts': status_counts,
            'priority_counts': priority_counts
        })
        
    except Exception as e:
        print(f"Get tasks overview error: {str(e)}")
        return response.server_error(str(e))

def get_upcoming_deadlines(event):
    """Get upcoming task deadlines."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Check if user is admin
    if user['role'] != 'admin':
        return response.forbidden("Only admins can access this endpoint")
    
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        days = int(query_params.get('days', 7))
        
        # Calculate date range
        today = datetime.now().date()
        end_date = today + timedelta(days=days)
        
        today_str = today.isoformat()
        end_date_str = end_date.isoformat()
        
        # Get tasks with deadlines in the specified range
        result = tasks_table.scan(
            FilterExpression=(
                boto3.dynamodb.conditions.Attr('Status').ne('Completed') & 
                boto3.dynamodb.conditions.Attr('Deadline').between(today_str, end_date_str)
            )
        )
        
        tasks = result.get('Items', [])
        
        # Sort tasks by deadline
        tasks.sort(key=lambda x: x.get('Deadline', ''))
        
        # Return upcoming deadlines
        return response.success({
            'tasks': tasks,
            'count': len(tasks),
            'date_range': {
                'start': today_str,
                'end': end_date_str
            }
        })
        
    except Exception as e:
        print(f"Get upcoming deadlines error: {str(e)}")
        return response.server_error(str(e))

def get_performance_metrics(event):
    """Get team performance metrics."""
    # Validate token
    user = auth.validate_token(event)
    if not user:
        return response.unauthorized()
    
    # Check if user is admin
    if user['role'] != 'admin':
        return response.forbidden("Only admins can access this endpoint")
    
    try:
        # Get all tasks from DynamoDB
        tasks_result = tasks_table.scan()
        tasks = tasks_result.get('Items', [])
        
        # Get all users from DynamoDB
        users_result = users_table.scan()
        users = users_result.get('Items', [])
        
        # Calculate metrics
        user_metrics = {}
        
        for user_item in users:
            if user_item.get('Role') == 'team_member':
                user_id = user_item.get('UserID')
                user_metrics[user_id] = {
                    'user_id': user_id,
                    'name': user_item.get('Name', ''),
                    'email': user_item.get('Email', ''),
                    'total_tasks': 0,
                    'completed_tasks': 0,
                    'overdue_tasks': 0,
                    'completion_rate': 0,
                    'average_completion_time': 0
                }
        
        total_completion_time = {}
        
        for task in tasks:
            assigned_to = task.get('AssignedTo')
            status = task.get('Status')
            
            if assigned_to in user_metrics:
                user_metrics[assigned_to]['total_tasks'] += 1
                
                if status == 'Completed':
                    user_metrics[assigned_to]['completed_tasks'] += 1
                    
                    # Calculate completion time if available
                    if 'CompletedAt' in task and 'CreatedAt' in task:
                        try:
                            completed_at = datetime.fromisoformat(task['CompletedAt'])
                            created_at = datetime.fromisoformat(task['CreatedAt'])
                            completion_time = (completed_at - created_at).total_seconds() / 3600  # Hours
                            
                            if assigned_to not in total_completion_time:
                                total_completion_time[assigned_to] = []
                            
                            total_completion_time[assigned_to].append(completion_time)
                        except:
                            pass
                
                if status == 'Overdue':
                    user_metrics[assigned_to]['overdue_tasks'] += 1
        
        # Calculate completion rates and average completion times
        for user_id, metrics in user_metrics.items():
            if metrics['total_tasks'] > 0:
                metrics['completion_rate'] = round((metrics['completed_tasks'] / metrics['total_tasks']) * 100, 2)
            
            if user_id in total_completion_time and total_completion_time[user_id]:
                avg_time = sum(total_completion_time[user_id]) / len(total_completion_time[user_id])
                metrics['average_completion_time'] = round(avg_time, 2)
        
        # Convert to list
        metrics_list = list(user_metrics.values())
        
        # Return performance metrics
        return response.success({
            'team_metrics': metrics_list,
            'count': len(metrics_list)
        })
        
    except Exception as e:
        print(f"Get performance metrics error: {str(e)}")
        return response.server_error(str(e))