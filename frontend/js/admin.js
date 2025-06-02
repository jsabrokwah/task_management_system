/**
 * Admin Service
 * Handles admin-specific operations
 */
class AdminService {
    /**
     * Get all users
     * @returns {Promise} - Promise resolving to array of users
     */
    async getUsers() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/admin/users`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            
            const data = await response.json();
            return data.users || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }
    
    /**
     * Get task statistics
     * @returns {Promise} - Promise resolving to task statistics
     */
    async getTaskStatistics() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/admin/tasks/overview`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch task statistics');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching task statistics:', error);
            throw error;
        }
    }
    
    /**
     * Get upcoming deadlines
     * @param {number} days - Number of days to look ahead
     * @returns {Promise} - Promise resolving to array of upcoming deadlines
     */
    async getUpcomingDeadlines(days = 7) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/admin/tasks/deadlines?days=${days}`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch upcoming deadlines');
            }
            
            const data = await response.json();
            return data.tasks || [];
        } catch (error) {
            console.error('Error fetching upcoming deadlines:', error);
            throw error;
        }
    }
    
    /**
     * Get team performance metrics
     * @returns {Promise} - Promise resolving to team performance data
     */
    async getTeamPerformance() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/api/admin/performance`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch team performance');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching team performance:', error);
            throw error;
        }
    }
    
    /**
     * Update the admin dashboard with statistics
     */
    async updateDashboard() {
        try {
            showLoading();
            
            // Get task statistics
            const stats = await this.getTaskStatistics();
            
            // Update statistics display
            document.getElementById('total-tasks').textContent = stats.total || 0;
            document.getElementById('in-progress-tasks').textContent = stats.inProgress || 0;
            document.getElementById('completed-tasks').textContent = stats.completed || 0;
            document.getElementById('overdue-tasks').textContent = stats.overdue || 0;
            
            // Get upcoming deadlines
            const deadlines = await this.getUpcomingDeadlines();
            this.displayUpcomingDeadlines(deadlines);
            
            // Get team performance data
            const performance = await this.getTeamPerformance();
            this.displayTeamPerformance(performance);
            
            hideLoading();
        } catch (error) {
            console.error('Error updating admin dashboard:', error);
            hideLoading();
            showError('Failed to load dashboard data. Please try again.');
        }
    }
    
    /**
     * Display upcoming deadlines in the UI
     * @param {Array} deadlines - Array of upcoming deadline tasks
     */
    displayUpcomingDeadlines(deadlines) {
        const tableBody = document.getElementById('deadlines-body');
        tableBody.innerHTML = '';
        
        if (deadlines.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" class="text-center">No upcoming deadlines</td>';
            tableBody.appendChild(row);
            return;
        }
        
        deadlines.forEach(task => {
            const row = document.createElement('tr');
            
            const deadlineDate = new Date(task.Deadline);
            const today = new Date();
            const isOverdue = deadlineDate < today && task.Status !== CONFIG.TASK_STATUS.COMPLETED;
            
            row.innerHTML = `
                <td><a href="#" class="task-link" data-task-id="${task.TaskID}">${task.Title}</a></td>
                <td>${task.AssignedToName || 'Unassigned'}</td>
                <td>${taskService.formatDate(task.Deadline)}</td>
                <td><span class="task-status ${taskService.getStatusClass(isOverdue ? CONFIG.TASK_STATUS.OVERDUE : task.Status)}">${isOverdue ? CONFIG.TASK_STATUS.OVERDUE : task.Status}</span></td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to task links
        document.querySelectorAll('.task-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const taskId = e.target.getAttribute('data-task-id');
                showTaskDetails(taskId);
            });
        });
    }
    
    /**
     * Display team performance chart
     * @param {Object} performance - Team performance data
     */
    displayTeamPerformance(performance) {
        const ctx = document.getElementById('team-performance-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.performanceChart) {
            this.performanceChart.destroy();
        }
        
        // Create new chart
        this.performanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: performance.labels || [],
                datasets: [
                    {
                        label: 'Completed Tasks',
                        data: performance.completed || [],
                        backgroundColor: '#2ecc71',
                        borderColor: '#27ae60',
                        borderWidth: 1
                    },
                    {
                        label: 'In Progress Tasks',
                        data: performance.inProgress || [],
                        backgroundColor: '#f39c12',
                        borderColor: '#f39c12',
                        borderWidth: 1
                    },
                    {
                        label: 'Overdue Tasks',
                        data: performance.overdue || [],
                        backgroundColor: '#e74c3c',
                        borderColor: '#c0392b',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Tasks'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Team Members'
                        }
                    }
                }
            }
        });
    }
}

// Create and export admin service instance
const adminService = new AdminService();