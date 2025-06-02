/**
 * Task Management UI Functions
 * Extension of app.js for task-related UI functionality
 */

// Load tasks data
async function loadTasks() {
    try {
        showLoading();
        
        // Get tasks
        const tasks = await taskService.getTasks();
        
        // Get filter values
        const statusFilter = document.getElementById('status-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        const searchQuery = document.getElementById('search-tasks').value.toLowerCase();
        
        // Filter tasks
        let filteredTasks = tasks;
        
        if (statusFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.Status === statusFilter);
        }
        
        if (priorityFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.Priority === priorityFilter);
        }
        
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.Title.toLowerCase().includes(searchQuery) || 
                task.Description.toLowerCase().includes(searchQuery)
            );
        }
        
        // Display tasks
        displayTasks(filteredTasks);
        
        // If admin, load users for task assignment
        if (authService.isAdmin()) {
            loadUsersForTaskAssignment();
        }
        
        hideLoading();
    } catch (error) {
        console.error('Error loading tasks:', error);
        hideLoading();
        showError('Failed to load tasks');
    }
}

// Display tasks in the table
function displayTasks(tasks) {
    const tasksBody = document.getElementById('tasks-body');
    tasksBody.innerHTML = '';
    
    if (tasks.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No tasks found</td>';
        tasksBody.appendChild(row);
        return;
    }
    
    tasks.forEach(task => {
        const isOverdue = taskService.isOverdue(task);
        const status = isOverdue ? CONFIG.TASK_STATUS.OVERDUE : task.Status;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.Title}</td>
            <td><span class="${taskService.getPriorityClass(task.Priority)}">${task.Priority}</span></td>
            <td><span class="task-status ${taskService.getStatusClass(status)}">${status}</span></td>
            <td>${taskService.formatDate(task.Deadline)}</td>
            <td>${task.AssignedToName || 'Unassigned'}</td>
            <td class="task-actions">
                <button class="btn btn-outline view-btn" data-task-id="${task.TaskID}">View</button>
                ${authService.isAdmin() ? `
                    <button class="btn btn-outline edit-btn" data-task-id="${task.TaskID}">Edit</button>
                    <button class="btn btn-danger delete-btn" data-task-id="${task.TaskID}">Delete</button>
                ` : ''}
            </td>
        `;
        
        tasksBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            showTaskDetails(taskId);
        });
    });
    
    if (authService.isAdmin()) {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                editTask(taskId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const taskId = e.target.getAttribute('data-task-id');
                confirmDeleteTask(taskId);
            });
        });
    }
}

// Load users for task assignment (admin only)
async function loadUsersForTaskAssignment() {
    try {
        const users = await adminService.getUsers();
        const assignedToSelect = document.getElementById('task-assigned-to');
        
        // Clear existing options
        assignedToSelect.innerHTML = '';
        
        // Add users as options
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.UserID;
            option.textContent = user.Username;
            assignedToSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Show task details
async function showTaskDetails(taskId) {
    try {
        showLoading();
        
        // Get task details
        const task = await taskService.getTask(taskId);
        
        // Populate task view modal
        document.getElementById('view-task-title').textContent = task.Title;
        document.getElementById('view-task-description').textContent = task.Description;
        document.getElementById('view-task-priority').textContent = task.Priority;
        document.getElementById('view-task-status').textContent = task.Status;
        document.getElementById('view-task-deadline').textContent = taskService.formatDate(task.Deadline);
        document.getElementById('view-task-created-by').textContent = task.CreatedByName || 'Unknown';
        document.getElementById('view-task-assigned-to').textContent = task.AssignedToName || 'Unassigned';
        document.getElementById('view-task-created-at').textContent = taskService.formatDate(task.CreatedAt);
        document.getElementById('view-task-notes').textContent = task.Notes || 'No notes';
        
        // Set task ID for status update
        document.getElementById('status-task-id').value = task.TaskID;
        
        // Show/hide admin actions
        const adminActions = document.getElementById('admin-actions');
        adminActions.classList.toggle('hidden', !authService.isAdmin());
        
        // Show task view modal
        document.getElementById('task-view-modal').classList.remove('hidden');
        
        hideLoading();
    } catch (error) {
        console.error(`Error loading task ${taskId}:`, error);
        hideLoading();
        showError('Failed to load task details');
    }
}

// Edit task (admin only)
async function editTask(taskId) {
    try {
        showLoading();
        
        // Get task details
        const task = await taskService.getTask(taskId);
        
        // Set modal title
        document.getElementById('modal-title').textContent = 'Edit Task';
        
        // Populate form fields
        document.getElementById('task-id').value = task.TaskID;
        document.getElementById('task-title').value = task.Title;
        document.getElementById('task-description').value = task.Description;
        document.getElementById('task-priority').value = task.Priority;
        document.getElementById('task-status').value = task.Status;
        
        // Format deadline for datetime-local input
        const deadline = new Date(task.Deadline);
        const formattedDeadline = deadline.toISOString().slice(0, 16);
        document.getElementById('task-deadline').value = formattedDeadline;
        
        document.getElementById('task-assigned-to').value = task.AssignedTo;
        document.getElementById('task-notes').value = task.Notes || '';
        
        // Show task modal
        document.getElementById('task-modal').classList.remove('hidden');
        
        hideLoading();
    } catch (error) {
        console.error(`Error loading task ${taskId} for edit:`, error);
        hideLoading();
        showError('Failed to load task for editing');
    }
}

// Confirm task deletion
function confirmDeleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        deleteTask(taskId);
    }
}

// Delete task
async function deleteTask(taskId) {
    try {
        showLoading();
        
        await taskService.deleteTask(taskId);
        
        // Reload tasks
        await loadTasks();
        
        hideLoading();
        showMessage('Task deleted successfully');
    } catch (error) {
        console.error(`Error deleting task ${taskId}:`, error);
        hideLoading();
        showError('Failed to delete task');
    }
}

// Initialize task-related event listeners
function initTaskEvents() {
    // Create task button
    const createTaskBtn = document.getElementById('create-task-btn');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', () => {
            // Reset form
            document.getElementById('task-form').reset();
            document.getElementById('task-id').value = '';
            document.getElementById('modal-title').textContent = 'Create New Task';
            
            // Show modal
            document.getElementById('task-modal').classList.remove('hidden');
        });
    }
    
    // Task form submission
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskFormSubmit);
    }
    
    // Cancel task button
    const cancelTaskBtn = document.getElementById('cancel-task');
    if (cancelTaskBtn) {
        cancelTaskBtn.addEventListener('click', () => {
            document.getElementById('task-modal').classList.add('hidden');
        });
    }
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });
    
    // Update status button
    const updateStatusBtn = document.getElementById('update-status-btn');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', () => {
            document.getElementById('task-view-modal').classList.add('hidden');
            document.getElementById('status-modal').classList.remove('hidden');
        });
    }
    
    // Status form submission
    const statusForm = document.getElementById('status-form');
    if (statusForm) {
        statusForm.addEventListener('submit', handleStatusFormSubmit);
    }
    
    // Cancel status update button
    const cancelStatusBtn = document.getElementById('cancel-status');
    if (cancelStatusBtn) {
        cancelStatusBtn.addEventListener('click', () => {
            document.getElementById('status-modal').classList.add('hidden');
        });
    }
    
    // Task filters
    const statusFilter = document.getElementById('status-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const searchInput = document.getElementById('search-tasks');
    
    if (statusFilter && priorityFilter && searchInput) {
        statusFilter.addEventListener('change', loadTasks);
        priorityFilter.addEventListener('change', loadTasks);
        searchInput.addEventListener('input', debounce(loadTasks, 300));
    }
}

// Handle task form submission
async function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('task-id').value;
    const isNewTask = !taskId;
    
    const taskData = {
        Title: document.getElementById('task-title').value,
        Description: document.getElementById('task-description').value,
        Priority: document.getElementById('task-priority').value,
        Status: document.getElementById('task-status').value,
        Deadline: document.getElementById('task-deadline').value,
        AssignedTo: document.getElementById('task-assigned-to').value,
        Notes: document.getElementById('task-notes').value
    };
    
    try {
        showLoading();
        
        if (isNewTask) {
            await taskService.createTask(taskData);
            showMessage('Task created successfully');
        } else {
            await taskService.updateTask(taskId, taskData);
            showMessage('Task updated successfully');
        }
        
        // Hide modal
        document.getElementById('task-modal').classList.add('hidden');
        
        // Reload tasks
        await loadTasks();
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to save task');
    }
}

// Handle status form submission
async function handleStatusFormSubmit(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('status-task-id').value;
    const status = document.getElementById('new-status').value;
    const notes = document.getElementById('status-notes').value;
    
    try {
        showLoading();
        
        await taskService.updateTaskStatus(taskId, status, notes);
        
        // Hide modal
        document.getElementById('status-modal').classList.add('hidden');
        
        // Reload tasks
        await loadTasks();
        
        hideLoading();
        showMessage('Task status updated successfully');
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to update task status');
    }
}

// Debounce function for search input
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}