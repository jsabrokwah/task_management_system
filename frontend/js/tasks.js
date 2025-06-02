/**
 * Tasks Service
 * Handles task management operations
 */
class TasksService {
    /**
     * Get all tasks
     * @param {Object} filters - Optional filters for tasks
     * @returns {Promise} - Promise resolving to array of tasks
     */
    async getTasks(filters = {}) {
        try {
            // Build query string from filters
            const queryParams = new URLSearchParams();
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.priority) queryParams.append('priority', filters.priority);
            
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
            
            const response = await fetch(`${CONFIG.API_URL}/tasks${queryString}`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch tasks');
            }
            
            const data = await response.json();
            return data.data.tasks;
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
            const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch task');
            }
            
            const data = await response.json();
            return data.data;
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
            const response = await fetch(`${CONFIG.API_URL}/tasks`, {
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
            
            const data = await response.json();
            return data.data;
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
            const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}`, {
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
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(`Error updating task ${taskId}:`, error);
            throw error;
        }
    }
    
    /**
     * Delete a task
     * @param {string} taskId - Task ID
     * @returns {Promise} - Promise resolving to success message
     */
    async deleteTask(taskId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete task');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error deleting task ${taskId}:`, error);
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
            const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}/status`, {
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
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(`Error updating status for task ${taskId}:`, error);
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
            const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}/assign`, {
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
            
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(`Error assigning task ${taskId}:`, error);
            throw error;
        }
    }
}

// Create and export tasks service instance
const tasksService = new TasksService();