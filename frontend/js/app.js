/**
 * Main Application Logic
 * Handles core application functionality and navigation
 */

// Global variables
let currentView = null;
let refreshTimers = {};

// DOM Elements
const elements = {
    // Navigation
    dashboardLink: document.getElementById('dashboard-link'),
    tasksLink: document.getElementById('tasks-link'),
    notificationsLink: document.getElementById('notifications-link'),
    profileLink: document.getElementById('profile-link'),
    logoutBtn: document.getElementById('logout-btn'),
    notificationBadge: document.getElementById('notification-badge'),
    userName: document.getElementById('user-name'),
    
    // Containers
    authContainer: document.getElementById('auth-container'),
    dashboardContainer: document.getElementById('dashboard-container'),
    tasksContainer: document.getElementById('tasks-container'),
    notificationsContainer: document.getElementById('notifications-container'),
    profileContainer: document.getElementById('profile-container'),
    
    // Admin sections
    adminSections: document.querySelectorAll('.admin-section'),
    
    // Loading spinner
    loadingSpinner: document.getElementById('loading-spinner')
};

/**
 * Initialize the application
 */
function initApp() {
    // Set up event listeners
    setupEventListeners();
    
    // Check authentication
    if (authService.isAuthenticated()) {
        showApp();
    } else {
        showAuthForms();
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Navigation links
    elements.dashboardLink.addEventListener('click', () => showView('dashboard'));
    elements.tasksLink.addEventListener('click', () => showView('tasks'));
    elements.notificationsLink.addEventListener('click', () => showView('notifications'));
    elements.profileLink.addEventListener('click', () => showView('profile'));
    elements.logoutBtn.addEventListener('click', () => authService.logout());
}

/**
 * Show the main application
 */
function showApp() {
    // Hide auth forms
    elements.authContainer.classList.add('hidden');
    
    // Update user info
    const user = authService.getUser();
    elements.userName.textContent = user.name || user.username || user.email;
    
    // Show/hide admin sections
    toggleAdminSections();
    
    // Show dashboard by default
    showView('dashboard');
    
    // Start notification polling
    startNotificationPolling();
}

/**
 * Show authentication forms
 */
function showAuthForms() {
    // Hide all app containers
    elements.dashboardContainer.classList.add('hidden');
    elements.tasksContainer.classList.add('hidden');
    elements.notificationsContainer.classList.add('hidden');
    elements.profileContainer.classList.add('hidden');
    
    // Show auth container
    elements.authContainer.classList.remove('hidden');
    
    // Clear current view
    currentView = null;
    
    // Stop all refresh timers
    stopAllRefreshTimers();
}

/**
 * Show a specific view
 * @param {string} view - View name ('dashboard', 'tasks', 'notifications', 'profile')
 */
function showView(view) {
    // Update current view
    currentView = view;
    
    // Hide all containers
    elements.dashboardContainer.classList.add('hidden');
    elements.tasksContainer.classList.add('hidden');
    elements.notificationsContainer.classList.add('hidden');
    elements.profileContainer.classList.add('hidden');
    
    // Remove active class from all links
    elements.dashboardLink.classList.remove('active');
    elements.tasksLink.classList.remove('active');
    elements.notificationsLink.classList.remove('active');
    elements.profileLink.classList.remove('active');
    
    // Show selected container and activate link
    switch (view) {
        case 'dashboard':
            elements.dashboardContainer.classList.remove('hidden');
            elements.dashboardLink.classList.add('active');
            loadDashboard();
            break;
        case 'tasks':
            elements.tasksContainer.classList.remove('hidden');
            elements.tasksLink.classList.add('active');
            loadTasks();
            break;
        case 'notifications':
            elements.notificationsContainer.classList.remove('hidden');
            elements.notificationsLink.classList.add('active');
            loadNotifications();
            break;
        case 'profile':
            elements.profileContainer.classList.remove('hidden');
            elements.profileLink.classList.add('active');
            loadProfile();
            break;
    }
}

/**
 * Toggle admin sections based on user role
 */
function toggleAdminSections() {
    const isAdmin = authService.isAdmin();
    
    elements.adminSections.forEach(section => {
        if (isAdmin) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
}

/**
 * Start notification polling
 */
function startNotificationPolling() {
    // Check for unread notifications immediately
    updateNotificationBadge();
    
    // Set up polling interval
    refreshTimers.notifications = setInterval(() => {
        updateNotificationBadge();
    }, CONFIG.REFRESH.NOTIFICATIONS);
}

/**
 * Update notification badge with unread count
 */
async function updateNotificationBadge() {
    try {
        const count = await notificationsService.getUnreadCount();
        
        if (count > 0) {
            elements.notificationBadge.textContent = count;
            elements.notificationBadge.classList.remove('hidden');
        } else {
            elements.notificationBadge.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
}

/**
 * Load dashboard data
 */
function loadDashboard() {
    // Stop existing refresh timer
    if (refreshTimers.dashboard) {
        clearInterval(refreshTimers.dashboard);
    }
    
    // Load dashboard data
    refreshDashboard();
    
    // Set up refresh timer
    refreshTimers.dashboard = setInterval(() => {
        if (currentView === 'dashboard') {
            refreshDashboard();
        }
    }, CONFIG.REFRESH.DASHBOARD);
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
    try {
        showLoading();
        
        // Get tasks for statistics
        const tasks = await tasksService.getTasks();
        
        // Calculate statistics
        const stats = {
            total: tasks.length,
            new: tasks.filter(task => task.Status === 'New').length,
            inProgress: tasks.filter(task => task.Status === 'In Progress').length,
            completed: tasks.filter(task => task.Status === 'Completed').length,
            overdue: tasks.filter(task => task.Status === 'Overdue').length
        };
        
        // Update statistics display
        document.getElementById('total-tasks').textContent = stats.total;
        document.getElementById('in-progress-tasks').textContent = stats.inProgress;
        document.getElementById('completed-tasks').textContent = stats.completed;
        document.getElementById('overdue-tasks').textContent = stats.overdue;
        
        // If user is admin, load admin dashboard data
        if (authService.isAdmin()) {
            await loadAdminDashboard();
        }
        
        // Load team member dashboard data
        await loadTeamDashboard(tasks);
        
        hideLoading();
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        hideLoading();
    }
}

/**
 * Load admin dashboard data
 */
async function loadAdminDashboard() {
    try {
        // Get upcoming deadlines
        const deadlinesData = await adminService.getUpcomingDeadlines();
        const deadlines = deadlinesData.tasks;
        
        // Get team performance
        const performance = await adminService.getTeamPerformance();
        
        // Update deadlines table
        const deadlinesBody = document.getElementById('deadlines-body');
        deadlinesBody.innerHTML = '';
        
        deadlines.forEach(task => {
            const row = document.createElement('tr');
            
            const deadline = new Date(task.Deadline);
            const formattedDeadline = deadline.toLocaleDateString('en-US', CONFIG.DATE_FORMAT.DISPLAY);
            
            row.innerHTML = `
                <td>${task.Title}</td>
                <td>${task.AssignedToName || 'Unassigned'}</td>
                <td>${formattedDeadline}</td>
                <td><span class="task-status status-${task.Status.toLowerCase().replace(' ', '-')}">${task.Status}</span></td>
            `;
            
            deadlinesBody.appendChild(row);
        });
        
        // Update team performance chart
        updateTeamPerformanceChart(performance);
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

/**
 * Update team performance chart
 * @param {Object} performance - Team performance data
 */
function updateTeamPerformanceChart(performance) {
    const ctx = document.getElementById('team-performance-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.teamChart) {
        window.teamChart.destroy();
    }
    
    // Create new chart
    window.teamChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: performance.team_metrics.map(member => member.name),
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: performance.team_metrics.map(member => member.completed_tasks),
                    backgroundColor: '#2ecc71'
                },
                {
                    label: 'In Progress Tasks',
                    data: performance.team_metrics.map(member => member.total_tasks - member.completed_tasks - member.overdue_tasks),
                    backgroundColor: '#3498db'
                },
                {
                    label: 'Overdue Tasks',
                    data: performance.team_metrics.map(member => member.overdue_tasks),
                    backgroundColor: '#e74c3c'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * Load team member dashboard data
 * @param {Array} tasks - Tasks data
 */
function loadTeamDashboard(tasks) {
    // Filter tasks assigned to current user
    const user = authService.getUser();
    const myTasks = tasks.filter(task => task.AssignedTo === user.user_id);
    
    // Update my tasks list
    const myTasksList = document.getElementById('my-tasks-list');
    myTasksList.innerHTML = '';
    
    if (myTasks.length === 0) {
        myTasksList.innerHTML = '<p>No tasks assigned to you.</p>';
        return;
    }
    
    // Sort tasks by deadline (closest first)
    myTasks.sort((a, b) => new Date(a.Deadline) - new Date(b.Deadline));
    
    // Display tasks
    myTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.dataset.taskId = task.TaskID;
        taskCard.dataset.status = task.Status;
        
        const deadline = new Date(task.Deadline);
        const formattedDeadline = deadline.toLocaleDateString('en-US', CONFIG.DATE_FORMAT.DISPLAY);
        
        taskCard.innerHTML = `
            <div class="task-card-header">
                <h3 class="task-card-title">${task.Title}</h3>
                <span class="task-card-priority priority-${task.Priority.toLowerCase()}">${task.Priority}</span>
            </div>
            <div class="task-card-body">
                <p class="task-card-description">${task.Description}</p>
                <div class="task-card-meta">
                    <span>Deadline: ${formattedDeadline}</span>
                </div>
            </div>
            <div class="task-card-footer">
                <span class="task-status status-${task.Status.toLowerCase().replace(' ', '-')}">${task.Status}</span>
                <button class="btn btn-outline view-task-btn">View Details</button>
            </div>
        `;
        
        // Add event listener to view task button
        taskCard.querySelector('.view-task-btn').addEventListener('click', () => {
            viewTask(task.TaskID);
        });
        
        myTasksList.appendChild(taskCard);
    });
    
    // Add event listeners to filter buttons
    document.querySelectorAll('.task-filters .btn-filter').forEach(button => {
        button.addEventListener('click', (e) => {
            // Update active button
            document.querySelectorAll('.task-filters .btn-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Get filter value
            const filter = e.target.dataset.filter;
            
            // Filter tasks
            document.querySelectorAll('.task-card').forEach(card => {
                if (filter === 'all' || card.dataset.status === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Load tasks data
 */
function loadTasks() {
    // Stop existing refresh timer
    if (refreshTimers.tasks) {
        clearInterval(refreshTimers.tasks);
    }
    
    // Load tasks data
    refreshTasks();
    
    // Set up refresh timer
    refreshTimers.tasks = setInterval(() => {
        if (currentView === 'tasks') {
            refreshTasks();
        }
    }, CONFIG.REFRESH.TASKS);
}

/**
 * Load notifications data
 */
function loadNotifications() {
    refreshNotifications();
}

/**
 * Load profile data
 */
function loadProfile() {
    refreshProfile();
}

/**
 * Stop all refresh timers
 */
function stopAllRefreshTimers() {
    Object.keys(refreshTimers).forEach(key => {
        clearInterval(refreshTimers[key]);
    });
    refreshTimers = {};
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @param {Object} options - Date format options
 * @returns {string} - Formatted date string
 */
function formatDate(dateString, options = CONFIG.DATE_FORMAT.DISPLAY) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Show loading spinner
 */
function showLoading() {
    elements.loadingSpinner.classList.remove('hidden');
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    elements.loadingSpinner.classList.add('hidden');
}