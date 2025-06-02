/**
 * Task Service
 * Handles task-related operations like fetching, creating, updating tasks
 */
class TaskService {
    /**
     * Get all tasks with optional filtering
     * @param {string} status - Filter tasks by status
     * @param {string} priority - Filter tasks by priority
     * @returns {Promise} - Promise resolving to array of tasks
     */
    async getTasks(status = null, priority = null) {
        try {
            let url = `${CONFIG.API_URL}/api/tasks`;
            const queryParams = [];
            
            if (status && status !== 'all') {
                queryParams.push(`status=${status}`);
            }
            
            if (priority && priority !== 'all') {
                queryParams.push(`priority=${priority}`);
            }
            
            if (queryParams.length > 0) {
                url += `?${queryParams.join('&')}`;
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
    
    /**
     * Get a specific task by ID
     * @param {string} taskId - Task ID
     * @returns {Promise} - Promise resolving to task object
     */
    async getTask(taskId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch task');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching task ${taskId}:`, error);
            throw error;
        }
    }
    
    /**
     * Create a new task
     * @param {Object} taskData - Task data
     * @returns {Promise} - Promise resolving to created task
     */
    async createTask(taskData) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create task');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }
    
    /**
     * Update an existing task
     * @param {string} taskId - Task ID
     * @param {Object} taskData - Updated task data
     * @returns {Promise} - Promise resolving to updated task
     */
    async updateTask(taskId, taskData) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update task');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error updating task ${taskId}:`, error);
            throw error;
        }
    }
    
    /**
     * Update task status
     * @param {string} taskId - Task ID
     * @param {string} status - New status
     * @param {string} notes - Optional notes about the status change
     * @returns {Promise} - Promise resolving to updated task
     */
    async updateTaskStatus(taskId, status, notes = '') {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/tasks/${taskId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify({ status, notes })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update task status');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error updating task ${taskId} status:`, error);
            throw error;
        }
    }
    
    /**
     * Assign task to a user
     * @param {string} taskId - Task ID
     * @param {string} userId - User ID to assign the task to
     * @returns {Promise} - Promise resolving to updated task
     */
    async assignTask(taskId, userId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/tasks/${taskId}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authService.getToken()}`
                },
                body: JSON.stringify({ assignedTo: userId })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to assign task');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error assigning task ${taskId}:`, error);
            throw error;
        }
    }
    
    /**
     * Delete a task
     * @param {string} taskId - Task ID
     * @returns {Promise} - Promise resolving when task is deleted
     */
    async deleteTask(taskId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete task');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error deleting task ${taskId}:`, error);
            throw error;
        }
    }
    
    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @param {boolean} includeTime - Whether to include time in the formatted date
     * @returns {string} - Formatted date string
     */
    formatDate(dateString, includeTime = true) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const options = includeTime ? CONFIG.DATE_FORMAT.DISPLAY : CONFIG.DATE_FORMAT.SHORT;
        
        return date.toLocaleDateString('en-US', options);
    }
    
    /**
     * Check if a task is overdue
     * @param {Object} task - Task object
     * @returns {boolean} - True if task is overdue
     */
    isOverdue(task) {
        if (task.Status === CONFIG.TASK_STATUS.COMPLETED) return false;
        
        const deadline = new Date(task.Deadline);
        const now = new Date();
        
        return deadline < now;
    }
    
    /**
     * Get CSS class for task status
     * @param {string} status - Task status
     * @returns {string} - CSS class name
     */
    getStatusClass(status) {
        switch (status) {
            case CONFIG.TASK_STATUS.NEW:
                return 'status-new';
            case CONFIG.TASK_STATUS.IN_PROGRESS:
                return 'status-in-progress';
            case CONFIG.TASK_STATUS.COMPLETED:
                return 'status-completed';
            case CONFIG.TASK_STATUS.OVERDUE:
                return 'status-overdue';
            default:
                return '';
        }
    }
    
    /**
     * Get CSS class for task priority
     * @param {string} priority - Task priority
     * @returns {string} - CSS class name
     */
    getPriorityClass(priority) {
        switch (priority) {
            case CONFIG.TASK_PRIORITY.HIGH:
                return 'priority-high';
            case CONFIG.TASK_PRIORITY.MEDIUM:
                return 'priority-medium';
            case CONFIG.TASK_PRIORITY.LOW:
                return 'priority-low';
            default:
                return '';
        }
    }
}

// Create and export task service instance
const taskService = new TaskService();