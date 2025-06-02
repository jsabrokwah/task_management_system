/**
 * Main Application Script
 * Handles UI interactions and application flow
 */

// DOM Elements
const elements = {
    // Containers
    authContainer: document.getElementById('auth-container'),
    dashboardContainer: document.getElementById('dashboard-container'),
    tasksContainer: document.getElementById('tasks-container'),
    notificationsContainer: document.getElementById('notifications-container'),
    profileContainer: document.getElementById('profile-container'),
    
    // Navigation
    navLinks: document.querySelectorAll('.nav-links a'),
    dashboardLink: document.getElementById('dashboard-link'),
    tasksLink: document.getElementById('tasks-link'),
    notificationsLink: document.getElementById('notifications-link'),
    profileLink: document.getElementById('profile-link'),
    
    // Auth forms
    loginTab: document.getElementById('login-tab'),
    registerTab: document.getElementById('register-tab'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginError: document.getElementById('login-error'),
    registerError: document.getElementById('register-error'),
    
    // User info
    userName: document.getElementById('user-name'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Admin sections
    adminSections: document.querySelectorAll('.admin-section'),
    
    // Loading spinner
    loadingSpinner: document.getElementById('loading-spinner')
};

// Initialize application
function initApp() {
    // Set up event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    if (authService.isAuthenticated()) {
        showApp();
    } else {
        showAuthForms();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Auth tabs
    elements.loginTab.addEventListener('click', () => switchAuthTab('login'));
    elements.registerTab.addEventListener('click', () => switchAuthTab('register'));
    
    // Auth forms
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Logout
    elements.logoutBtn.addEventListener('click', () => authService.logout());
}

// Handle navigation clicks
function handleNavigation(e) {
    e.preventDefault();
    
    // Remove active class from all links
    elements.navLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to clicked link
    e.target.classList.add('active');
    
    // Hide all containers
    elements.dashboardContainer.classList.add('hidden');
    elements.tasksContainer.classList.add('hidden');
    elements.notificationsContainer.classList.add('hidden');
    elements.profileContainer.classList.add('hidden');
    
    // Show selected container
    const linkId = e.target.id;
    
    if (linkId === 'dashboard-link') {
        elements.dashboardContainer.classList.remove('hidden');
        loadDashboard();
    } else if (linkId === 'tasks-link') {
        elements.tasksContainer.classList.remove('hidden');
        loadTasks();
    } else if (linkId === 'notifications-link') {
        elements.notificationsContainer.classList.remove('hidden');
        loadNotifications();
    } else if (linkId === 'profile-link') {
        elements.profileContainer.classList.remove('hidden');
        loadProfile();
    }
}

// Switch between login and register tabs
function switchAuthTab(tab) {
    if (tab === 'login') {
        elements.loginTab.classList.add('active');
        elements.registerTab.classList.remove('active');
        elements.loginForm.classList.remove('hidden');
        elements.registerForm.classList.add('hidden');
    } else {
        elements.loginTab.classList.remove('active');
        elements.registerTab.classList.add('active');
        elements.loginForm.classList.add('hidden');
        elements.registerForm.classList.remove('hidden');
    }
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        showLoading();
        await authService.login(username, password);
        hideLoading();
        showApp();
    } catch (error) {
        hideLoading();
        elements.loginError.textContent = error.message || 'Login failed. Please try again.';
        elements.loginError.classList.remove('hidden');
    }
}

// Handle register form submission
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        elements.registerError.textContent = 'Passwords do not match';
        elements.registerError.classList.remove('hidden');
        return;
    }
    
    try {
        showLoading();
        await authService.register({ username, email, password });
        hideLoading();
        
        // Switch to login tab and show success message
        switchAuthTab('login');
        showMessage('Registration successful! Please log in.');
    } catch (error) {
        hideLoading();
        elements.registerError.textContent = error.message || 'Registration failed. Please try again.';
        elements.registerError.classList.remove('hidden');
    }
}

// Show the main application after login
function showApp() {
    // Hide auth container
    elements.authContainer.classList.add('hidden');
    
    // Update user info
    const user = authService.getUser();
    elements.userName.textContent = user.Username || user.username || 'User';
    
    // Show/hide admin sections based on user role
    const isAdmin = authService.isAdmin();
    elements.adminSections.forEach(section => {
        section.classList.toggle('hidden', !isAdmin);
    });
    
    // Show dashboard by default
    elements.dashboardContainer.classList.remove('hidden');
    loadDashboard();
    
    // Start notification polling
    notificationService.startPolling();
}

// Show authentication forms
function showAuthForms() {
    // Show auth container
    elements.authContainer.classList.remove('hidden');
    
    // Hide all app containers
    elements.dashboardContainer.classList.add('hidden');
    elements.tasksContainer.classList.add('hidden');
    elements.notificationsContainer.classList.add('hidden');
    elements.profileContainer.classList.add('hidden');
    
    // Stop notification polling
    notificationService.stopPolling();
}

// Load dashboard data
async function loadDashboard() {
    try {
        showLoading();
        
        // Get task statistics
        const tasks = await taskService.getTasks();
        
        // Count tasks by status
        const totalTasks = tasks.length;
        const inProgressTasks = tasks.filter(task => task.Status === CONFIG.TASK_STATUS.IN_PROGRESS).length;
        const completedTasks = tasks.filter(task => task.Status === CONFIG.TASK_STATUS.COMPLETED).length;
        const overdueTasks = tasks.filter(task => taskService.isOverdue(task)).length;
        
        // Update statistics display
        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('in-progress-tasks').textContent = inProgressTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('overdue-tasks').textContent = overdueTasks;
        
        // Load team member tasks
        if (!authService.isAdmin()) {
            loadMyTasks(tasks);
        } else {
            // Load admin dashboard
            await adminService.updateDashboard();
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        hideLoading();
        showError('Failed to load dashboard data');
    }
}

// Load tasks for team member dashboard
function loadMyTasks(tasks) {
    const myTasksList = document.getElementById('my-tasks-list');
    myTasksList.innerHTML = '';
    
    if (tasks.length === 0) {
        myTasksList.innerHTML = '<p>No tasks assigned to you</p>';
        return;
    }
    
    // Sort tasks by deadline (closest first)
    tasks.sort((a, b) => new Date(a.Deadline) - new Date(b.Deadline));
    
    tasks.forEach(task => {
        const isOverdue = taskService.isOverdue(task);
        const status = isOverdue ? CONFIG.TASK_STATUS.OVERDUE : task.Status;
        
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.Status.toLowerCase().replace(' ', '-')}`;
        taskCard.setAttribute('data-status', status);
        taskCard.setAttribute('data-task-id', task.TaskID);
        
        taskCard.innerHTML = `
            <div class="task-card-header">
                <h3 class="task-card-title">${task.Title}</h3>
                <span class="task-card-priority ${taskService.getPriorityClass(task.Priority)}">${task.Priority}</span>
            </div>
            <div class="task-card-body">
                <p class="task-card-description">${task.Description}</p>
                <div class="task-card-meta">
                    <span>Deadline: ${taskService.formatDate(task.Deadline)}</span>
                </div>
            </div>
            <div class="task-card-footer">
                <span class="task-status ${taskService.getStatusClass(status)}">${status}</span>
                <button class="btn btn-outline view-task-btn">View Details</button>
            </div>
        `;
        
        myTasksList.appendChild(taskCard);
        
        // Add event listener to view task button
        taskCard.querySelector('.view-task-btn').addEventListener('click', () => {
            showTaskDetails(task.TaskID);
        });
    });
    
    // Add event listeners to filter buttons
    document.querySelectorAll('.btn-filter').forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove active class from all filter buttons
            document.querySelectorAll('.btn-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            e.target.classList.add('active');
            
            // Get filter value
            const filter = e.target.getAttribute('data-filter');
            
            // Filter tasks
            document.querySelectorAll('.task-card').forEach(card => {
                if (filter === 'all' || card.getAttribute('data-status') === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Load tasks data
async function loadTasks() {
    // Implementation will be added in the next step
}

// Load notifications data
async function loadNotifications() {
    // Implementation will be added in the next step
}

// Load profile data
async function loadProfile() {
    // Implementation will be added in the next step
}

// Show task details
function showTaskDetails(taskId) {
    // Implementation will be added in the next step
}

// Show loading spinner
function showLoading() {
    elements.loadingSpinner.classList.remove('hidden');
}

// Hide loading spinner
function hideLoading() {
    elements.loadingSpinner.classList.add('hidden');
}

// Show error message
function showError(message) {
    alert(message); // Simple implementation for now
}

// Show success message
function showMessage(message) {
    alert(message); // Simple implementation for now
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);