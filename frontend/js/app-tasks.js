/**
 * Task Management UI
 * Handles task-specific UI functionality
 */

// DOM Elements
const taskElements = {
    // Task list
    tasksTable: document.getElementById('tasks-table'),
    tasksBody: document.getElementById('tasks-body'),
    
    // Filters
    statusFilter: document.getElementById('status-filter'),
    priorityFilter: document.getElementById('priority-filter'),
    searchInput: document.getElementById('search-tasks'),
    
    // Create task button
    createTaskBtn: document.getElementById('create-task-btn'),
    
    // Task modal
    taskModal: document.getElementById('task-modal'),
    modalTitle: document.getElementById('modal-title'),
    taskForm: document.getElementById('task-form'),
    taskId: document.getElementById('task-id'),
    taskTitle: document.getElementById('task-title'),
    taskDescription: document.getElementById('task-description'),
    taskPriority: document.getElementById('task-priority'),
    taskStatus: document.getElementById('task-status'),
    taskDeadline: document.getElementById('task-deadline'),
    taskAssignedTo: document.getElementById('task-assigned-to'),
    taskNotes: document.getElementById('task-notes'),
    cancelTaskBtn: document.getElementById('cancel-task'),
    
    // Task view modal
    taskViewModal: document.getElementById('task-view-modal'),
    viewTaskTitle: document.getElementById('view-task-title'),
    viewTaskDescription: document.getElementById('view-task-description'),
    viewTaskPriority: document.getElementById('view-task-priority'),
    viewTaskStatus: document.getElementById('view-task-status'),
    viewTaskDeadline: document.getElementById('view-task-deadline'),
    viewTaskCreatedBy: document.getElementById('view-task-created-by'),
    viewTaskAssignedTo: document.getElementById('view-task-assigned-to'),
    viewTaskCreatedAt: document.getElementById('view-task-created-at'),
    viewTaskNotes: document.getElementById('view-task-notes'),
    updateStatusBtn: document.getElementById('update-status-btn'),
    editTaskBtn: document.getElementById('edit-task-btn'),
    deleteTaskBtn: document.getElementById('delete-task-btn'),
    
    // Status update modal
    statusModal: document.getElementById('status-modal'),
    statusForm: document.getElementById('status-form'),
    statusTaskId: document.getElementById('status-task-id'),
    newStatus: document.getElementById('new-status'),
    statusNotes: document.getElementById('status-notes'),
    cancelStatusBtn: document.getElementById('cancel-status')
};

// Current tasks data
let tasksData = [];
let usersData = [];

/**
 * Initialize task management
 */
function initTasks() {
    // Set up event listeners
    setupTaskEventListeners();
    
    // Load users for assignment dropdown
    loadUsers();
}

/**
 * Set up task-related event listeners
 */
function setupTaskEventListeners() {
    // Create task button
    if (taskElements.createTaskBtn) {
        taskElements.createTaskBtn.addEventListener('click', showCreateTaskModal);
    }
    
    // Task form submission
    taskElements.taskForm.addEventListener('submit', handleTaskFormSubmit);
    
    // Cancel task button
    taskElements.cancelTaskBtn.addEventListener('click', hideTaskModal);
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            hideTaskModal();
            hideTaskViewModal();
            hideStatusModal();
        });
    });
    
    // Status update form
    taskElements.statusForm.addEventListener('submit', handleStatusFormSubmit);
    
    // Cancel status update button
    taskElements.cancelStatusBtn.addEventListener('click', hideStatusModal);
    
    // Filters
    taskElements.statusFilter.addEventListener('change', filterTasks);
    taskElements.priorityFilter.addEventListener('change', filterTasks);
    taskElements.searchInput.addEventListener('input', filterTasks);
}

/**
 * Refresh tasks data and display
 */
async function refreshTasks() {
    try {
        showLoading();
        
        // Get all tasks
        tasksData = await tasksService.getTasks();
        
        // Display tasks
        displayTasks(tasksData);
        
        hideLoading();
    } catch (error) {
        console.error('Error refreshing tasks:', error);
        hideLoading();
    }
}

/**
 * Load users for assignment dropdown
 */
async function loadUsers() {
    try {
        // Only admins can see all users
        if (authService.isAdmin()) {
            usersData = await adminService.getUsers();
        } else {
            // For team members, only show themselves
            const user = authService.getUser();
            usersData = [user];
        }
        
        // Update assignment dropdown
        updateAssignmentDropdown();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

/**
 * Update assignment dropdown with users
 */
function updateAssignmentDropdown() {
    const dropdown = taskElements.taskAssignedTo;
    dropdown.innerHTML = '';
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select User --';
    dropdown.appendChild(emptyOption);
    
    // Add users
    usersData.forEach(user => {
        const option = document.createElement('option');
        option.value = user.UserID;
        option.textContent = user.name || user.Username || user.Email;
        dropdown.appendChild(option);
    });
}

/**
 * Display tasks in the table
 * @param {Array} tasks - Tasks to display
 */
function displayTasks(tasks) {
    const tbody = taskElements.tasksBody;
    tbody.innerHTML = '';
    
    if (tasks.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No tasks found</td>';
        tbody.appendChild(row);
        return;
    }
    
    tasks.forEach(task => {
        const row = document.createElement('tr');
        
        const deadline = new Date(task.Deadline);
        const formattedDeadline = formatDate(task.Deadline);
        
        // Find assigned user name
        const assignedUser = usersData.find(user => user.UserID === task.AssignedTo);
        const assignedToName = assignedUser ? (assignedUser.name || assignedUser.Username || assignedUser.Email) : 'Unassigned';
        
        row.innerHTML = `
            <td>${task.Title}</td>
            <td class="priority-${task.Priority.toLowerCase()}">${task.Priority}</td>
            <td><span class="task-status status-${task.Status.toLowerCase().replace(' ', '-')}">${task.Status}</span></td>
            <td>${formattedDeadline}</td>
            <td>${assignedToName}</td>
            <td class="task-actions">
                <button class="btn btn-outline view-task-btn" data-task-id="${task.TaskID}">View</button>
                ${authService.isAdmin() ? `
                    <button class="btn btn-outline edit-task-btn" data-task-id="${task.TaskID}">Edit</button>
                    <button class="btn btn-danger delete-task-btn" data-task-id="${task.TaskID}">Delete</button>
                ` : ''}
            </td>
        `;
        
        // Add event listeners to buttons
        row.querySelector('.view-task-btn').addEventListener('click', () => {
            viewTask(task.TaskID);
        });
        
        if (authService.isAdmin()) {
            row.querySelector('.edit-task-btn').addEventListener('click', () => {
                editTask(task.TaskID);
            });
            
            row.querySelector('.delete-task-btn').addEventListener('click', () => {
                deleteTask(task.TaskID);
            });
        }
        
        tbody.appendChild(row);
    });
}

/**
 * Filter tasks based on selected filters
 */
function filterTasks() {
    const statusValue = taskElements.statusFilter.value;
    const priorityValue = taskElements.priorityFilter.value;
    const searchValue = taskElements.searchInput.value.toLowerCase();
    
    // Apply filters
    const filteredTasks = tasksData.filter(task => {
        // Status filter
        if (statusValue !== 'all' && task.Status !== statusValue) {
            return false;
        }
        
        // Priority filter
        if (priorityValue !== 'all' && task.Priority !== priorityValue) {
            return false;
        }
        
        // Search filter
        if (searchValue && !task.Title.toLowerCase().includes(searchValue) && 
            !task.Description.toLowerCase().includes(searchValue)) {
            return false;
        }
        
        return true;
    });
    
    // Display filtered tasks
    displayTasks(filteredTasks);
}

/**
 * Show create task modal
 */
function showCreateTaskModal() {
    // Set modal title
    taskElements.modalTitle.textContent = 'Create New Task';
    
    // Clear form
    taskElements.taskForm.reset();
    taskElements.taskId.value = '';
    
    // Set default values
    taskElements.taskStatus.value = 'New';
    
    // Set minimum deadline to today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    taskElements.taskDeadline.min = todayStr + 'T00:00';
    
    // Show modal
    taskElements.taskModal.classList.remove('hidden');
}

/**
 * Hide task modal
 */
function hideTaskModal() {
    taskElements.taskModal.classList.add('hidden');
}

/**
 * Show task view modal
 * @param {Object} task - Task to view
 */
function showTaskViewModal(task) {
    // Set task details
    taskElements.viewTaskTitle.textContent = task.Title;
    taskElements.viewTaskDescription.textContent = task.Description;
    taskElements.viewTaskPriority.textContent = task.Priority;
    taskElements.viewTaskStatus.textContent = task.Status;
    taskElements.viewTaskStatus.className = `detail-value status-${task.Status.toLowerCase().replace(' ', '-')}`;
    taskElements.viewTaskDeadline.textContent = formatDate(task.Deadline);
    
    // Find created by user
    const createdByUser = usersData.find(user => user.UserID === task.CreatedBy);
    taskElements.viewTaskCreatedBy.textContent = createdByUser ? 
        (createdByUser.name || createdByUser.Username || createdByUser.Email) : 'Unknown';
    
    // Find assigned to user
    const assignedToUser = usersData.find(user => user.UserID === task.AssignedTo);
    taskElements.viewTaskAssignedTo.textContent = assignedToUser ? 
        (assignedToUser.name || assignedToUser.Username || assignedToUser.Email) : 'Unassigned';
    
    taskElements.viewTaskCreatedAt.textContent = formatDate(task.CreatedAt);
    taskElements.viewTaskNotes.textContent = task.Notes || 'No notes';
    
    // Set up action buttons
    taskElements.updateStatusBtn.dataset.taskId = task.TaskID;
    
    if (taskElements.editTaskBtn) {
        taskElements.editTaskBtn.dataset.taskId = task.TaskID;
    }
    
    if (taskElements.deleteTaskBtn) {
        taskElements.deleteTaskBtn.dataset.taskId = task.TaskID;
    }
    
    // Add event listeners to buttons
    taskElements.updateStatusBtn.addEventListener('click', () => {
        showStatusModal(task.TaskID, task.Status);
    });
    
    if (taskElements.editTaskBtn) {
        taskElements.editTaskBtn.addEventListener('click', () => {
            hideTaskViewModal();
            editTask(task.TaskID);
        });
    }
    
    if (taskElements.deleteTaskBtn) {
        taskElements.deleteTaskBtn.addEventListener('click', () => {
            hideTaskViewModal();
            deleteTask(task.TaskID);
        });
    }
    
    // Show modal
    taskElements.taskViewModal.classList.remove('hidden');
}

/**
 * Hide task view modal
 */
function hideTaskViewModal() {
    taskElements.taskViewModal.classList.add('hidden');
}

/**
 * Show status update modal
 * @param {string} taskId - Task ID
 * @param {string} currentStatus - Current task status
 */
function showStatusModal(taskId, currentStatus) {
    // Set task ID
    taskElements.statusTaskId.value = taskId;
    
    // Set current status
    taskElements.newStatus.value = currentStatus;
    
    // Clear notes
    taskElements.statusNotes.value = '';
    
    // Hide task view modal
    hideTaskViewModal();
    
    // Show status modal
    taskElements.statusModal.classList.remove('hidden');
}

/**
 * Hide status update modal
 */
function hideStatusModal() {
    taskElements.statusModal.classList.add('hidden');
}

/**
 * View task details
 * @param {string} taskId - Task ID
 */
async function viewTask(taskId) {
    try {
        showLoading();
        
        // Get task details
        const task = await tasksService.getTask(taskId);
        
        hideLoading();
        
        // Show task view modal
        showTaskViewModal(task);
    } catch (error) {
        console.error(`Error viewing task ${taskId}:`, error);
        hideLoading();
        alert('Error loading task details. Please try again.');
    }
}

/**
 * Edit task
 * @param {string} taskId - Task ID
 */
async function editTask(taskId) {
    try {
        showLoading();
        
        // Get task details
        const task = await tasksService.getTask(taskId);
        
        hideLoading();
        
        // Set modal title
        taskElements.modalTitle.textContent = 'Edit Task';
        
        // Fill form with task data
        taskElements.taskId.value = task.TaskID;
        taskElements.taskTitle.value = task.Title;
        taskElements.taskDescription.value = task.Description;
        taskElements.taskPriority.value = task.Priority;
        taskElements.taskStatus.value = task.Status;
        
        // Format deadline for input
        const deadline = new Date(task.Deadline);
        const deadlineStr = deadline.toISOString().slice(0, 16);
        taskElements.taskDeadline.value = deadlineStr;
        
        taskElements.taskAssignedTo.value = task.AssignedTo || '';
        taskElements.taskNotes.value = task.Notes || '';
        
        // Show modal
        taskElements.taskModal.classList.remove('hidden');
    } catch (error) {
        console.error(`Error editing task ${taskId}:`, error);
        hideLoading();
        alert('Error loading task details. Please try again.');
    }
}

/**
 * Delete task
 * @param {string} taskId - Task ID
 */
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        showLoading();
        
        // Delete task
        await tasksService.deleteTask(taskId);
        
        // Refresh tasks
        await refreshTasks();
        
        hideLoading();
        
        alert('Task deleted successfully');
    } catch (error) {
        console.error(`Error deleting task ${taskId}:`, error);
        hideLoading();
        alert('Error deleting task. Please try again.');
    }
}

/**
 * Handle task form submission
 * @param {Event} e - Form submit event
 */
async function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const taskId = taskElements.taskId.value;
    const taskData = {
        title: taskElements.taskTitle.value,
        description: taskElements.taskDescription.value,
        priority: taskElements.taskPriority.value,
        status: taskElements.taskStatus.value,
        deadline: taskElements.taskDeadline.value,
        assignedTo: taskElements.taskAssignedTo.value,
        notes: taskElements.taskNotes.value
    };
    
    try {
        showLoading();
        
        if (taskId) {
            // Update existing task
            await tasksService.updateTask(taskId, taskData);
        } else {
            // Create new task
            await tasksService.createTask(taskData);
        }
        
        // Hide modal
        hideTaskModal();
        
        // Refresh tasks
        await refreshTasks();
        
        hideLoading();
    } catch (error) {
        console.error('Error saving task:', error);
        hideLoading();
        alert('Error saving task. Please try again.');
    }
}

/**
 * Handle status form submission
 * @param {Event} e - Form submit event
 */
async function handleStatusFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const taskId = taskElements.statusTaskId.value;
    const status = taskElements.newStatus.value;
    const notes = taskElements.statusNotes.value;
    
    try {
        showLoading();
        
        // Update task status
        await tasksService.updateTaskStatus(taskId, status, notes);
        
        // Hide modal
        hideStatusModal();
        
        // Refresh tasks
        await refreshTasks();
        
        hideLoading();
    } catch (error) {
        console.error('Error updating task status:', error);
        hideLoading();
        alert('Error updating task status. Please try again.');
    }
}

// Initialize tasks when app is ready
document.addEventListener('app-ready', initTasks);