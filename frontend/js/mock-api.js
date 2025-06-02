/**
 * Mock API Service
 * Provides mock data for frontend development before backend integration
 */

// Enable or disable mock API
const MOCK_API_ENABLED = true;

// Mock data
const MOCK_DATA = {
    // Users
    users: [
        { UserID: 'user1', Username: 'admin', Email: 'admin@example.com', Role: 'admin' },
        { UserID: 'user2', Username: 'user', Email: 'user@example.com', Role: 'team_member' }
    ],
    
    // Tasks
    tasks: [
        {
            TaskID: 'task1',
            Title: 'Implement Login Page',
            Description: 'Create responsive login page with authentication',
            Priority: 'High',
            Status: 'Completed',
            CreatedBy: 'user1',
            CreatedByName: 'admin',
            AssignedTo: 'user2',
            AssignedToName: 'user',
            CreatedAt: '2023-06-10T10:00:00Z',
            Deadline: '2023-06-15T18:00:00Z',
            CompletedAt: '2023-06-14T16:30:00Z',
            Notes: 'Completed ahead of schedule'
        },
        {
            TaskID: 'task2',
            Title: 'Design Database Schema',
            Description: 'Create DynamoDB tables and relationships',
            Priority: 'High',
            Status: 'Completed',
            CreatedBy: 'user1',
            CreatedByName: 'admin',
            AssignedTo: 'user1',
            AssignedToName: 'admin',
            CreatedAt: '2023-06-12T09:00:00Z',
            Deadline: '2023-06-18T18:00:00Z',
            CompletedAt: '2023-06-17T14:20:00Z',
            Notes: 'Added indexes for performance'
        },
        {
            TaskID: 'task3',
            Title: 'Implement Task Management API',
            Description: 'Create REST API endpoints for task CRUD operations',
            Priority: 'Medium',
            Status: 'In Progress',
            CreatedBy: 'user1',
            CreatedByName: 'admin',
            AssignedTo: 'user2',
            AssignedToName: 'user',
            CreatedAt: '2023-06-15T11:00:00Z',
            Deadline: '2023-06-25T18:00:00Z',
            CompletedAt: null,
            Notes: 'Working on validation logic'
        },
        {
            TaskID: 'task4',
            Title: 'Setup CI/CD Pipeline',
            Description: 'Configure AWS CodePipeline for automated deployments',
            Priority: 'Low',
            Status: 'New',
            CreatedBy: 'user1',
            CreatedByName: 'admin',
            AssignedTo: 'user1',
            AssignedToName: 'admin',
            CreatedAt: '2023-06-18T14:00:00Z',
            Deadline: '2023-06-30T18:00:00Z',
            CompletedAt: null,
            Notes: ''
        },
        {
            TaskID: 'task5',
            Title: 'User Testing',
            Description: 'Conduct user testing and gather feedback',
            Priority: 'Medium',
            Status: 'New',
            CreatedBy: 'user1',
            CreatedByName: 'admin',
            AssignedTo: 'user2',
            AssignedToName: 'user',
            CreatedAt: '2023-06-20T09:30:00Z',
            Deadline: '2023-06-22T18:00:00Z',
            CompletedAt: null,
            Notes: 'Prepare test scenarios'
        }
    ],
    
    // Notifications
    notifications: [
        {
            NotificationID: 'notif1',
            UserID: 'user2',
            TaskID: 'task1',
            Type: 'task_assigned',
            Message: 'You have been assigned to task "Implement Login Page"',
            CreatedAt: '2023-06-10T10:05:00Z',
            ReadStatus: true
        },
        {
            NotificationID: 'notif2',
            UserID: 'user1',
            TaskID: 'task1',
            Type: 'status_update',
            Message: 'Task "Implement Login Page" has been marked as Completed',
            CreatedAt: '2023-06-14T16:35:00Z',
            ReadStatus: true
        },
        {
            NotificationID: 'notif3',
            UserID: 'user2',
            TaskID: 'task3',
            Type: 'task_assigned',
            Message: 'You have been assigned to task "Implement Task Management API"',
            CreatedAt: '2023-06-15T11:05:00Z',
            ReadStatus: false
        },
        {
            NotificationID: 'notif4',
            UserID: 'user2',
            TaskID: 'task5',
            Type: 'task_assigned',
            Message: 'You have been assigned to task "User Testing"',
            CreatedAt: '2023-06-20T09:35:00Z',
            ReadStatus: false
        },
        {
            NotificationID: 'notif5',
            UserID: 'user2',
            TaskID: 'task5',
            Type: 'deadline_reminder',
            Message: 'Task "User Testing" is due tomorrow',
            CreatedAt: '2023-06-21T09:00:00Z',
            ReadStatus: false
        }
    ],
    
    // Notification preferences
    notificationPreferences: {
        emailNotifications: true,
        taskAssignments: true,
        deadlineReminders: true,
        statusUpdates: true
    },
    
    // Task statistics
    taskStatistics: {
        total: 5,
        new: 2,
        inProgress: 1,
        completed: 2,
        overdue: 0
    },
    
    // Team performance
    teamPerformance: {
        labels: ['admin', 'user'],
        completed: [1, 1],
        inProgress: [0, 1],
        overdue: [0, 0]
    }
};

// Mock API implementation
if (MOCK_API_ENABLED) {
    // Override fetch to intercept API calls
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        // Check if this is an API call
        if (typeof url === 'string' && url.startsWith(CONFIG.API_URL)) {
            return handleMockRequest(url, options);
        }
        
        // Pass through to original fetch for non-API calls
        return originalFetch(url, options);
    };
    
    // Handle mock API request
    function handleMockRequest(url, options) {
        console.log(`Mock API: ${options.method || 'GET'} ${url}`);
        
        // Extract endpoint from URL
        const endpoint = url.replace(CONFIG.API_URL, '');
        
        // Add delay to simulate network latency
        return new Promise((resolve) => {
            setTimeout(() => {
                const response = getMockResponse(endpoint, options);
                resolve(response);
            }, 300);
        });
    }
    
    // Get mock response based on endpoint and options
    function getMockResponse(endpoint, options) {
        const method = options.method || 'GET';
        
        // Authentication endpoints
        if (endpoint === '/api/auth/login') {
            return handleLogin(options);
        } else if (endpoint === '/api/auth/register') {
            return handleRegister(options);
        } else if (endpoint === '/api/auth/profile') {
            if (method === 'GET') {
                return handleGetProfile();
            } else if (method === 'PUT') {
                return handleUpdateProfile(options);
            }
        } else if (endpoint === '/api/auth/change-password') {
            return handleChangePassword();
        }
        
        // Task endpoints
        if (endpoint === '/api/tasks') {
            if (method === 'GET') {
                return handleGetTasks();
            } else if (method === 'POST') {
                return handleCreateTask(options);
            }
        } else if (endpoint.match(/^\/api\/tasks\/[a-z0-9]+$/)) {
            const taskId = endpoint.split('/').pop();
            
            if (method === 'GET') {
                return handleGetTask(taskId);
            } else if (method === 'PUT') {
                return handleUpdateTask(taskId, options);
            } else if (method === 'DELETE') {
                return handleDeleteTask(taskId);
            }
        } else if (endpoint.match(/^\/api\/tasks\/[a-z0-9]+\/status$/)) {
            const taskId = endpoint.split('/')[3];
            return handleUpdateTaskStatus(taskId, options);
        } else if (endpoint.match(/^\/api\/tasks\/[a-z0-9]+\/assign$/)) {
            const taskId = endpoint.split('/')[3];
            return handleAssignTask(taskId, options);
        }
        
        // Notification endpoints
        if (endpoint === '/api/notifications') {
            return handleGetNotifications();
        } else if (endpoint.match(/^\/api\/notifications\/[a-z0-9]+\/read$/)) {
            const notificationId = endpoint.split('/')[3];
            return handleMarkNotificationAsRead(notificationId);
        } else if (endpoint === '/api/notifications/read-all') {
            return handleMarkAllNotificationsAsRead();
        } else if (endpoint === '/api/notifications/settings') {
            if (method === 'GET') {
                return handleGetNotificationPreferences();
            } else if (method === 'PUT') {
                return handleUpdateNotificationPreferences(options);
            }
        }
        
        // Admin endpoints
        if (endpoint === '/api/admin/users') {
            return handleGetUsers();
        } else if (endpoint === '/api/admin/tasks/overview') {
            return handleGetTaskStatistics();
        } else if (endpoint === '/api/admin/tasks/deadlines') {
            return handleGetUpcomingDeadlines();
        } else if (endpoint === '/api/admin/performance') {
            return handleGetTeamPerformance();
        }
        
        // Default 404 response
        return createMockResponse(404, { message: 'Endpoint not found' });
    }
    
    // Authentication handlers
    function handleLogin(options) {
        const body = JSON.parse(options.body);
        const { username, password } = body;
        
        // Simple mock authentication
        const user = MOCK_DATA.users.find(u => u.Username === username);
        
        if (user && password === 'password') {
            return createMockResponse(200, {
                token: 'mock-jwt-token',
                user: user
            });
        } else {
            return createMockResponse(401, { message: 'Invalid username or password' });
        }
    }
    
    function handleRegister(options) {
        const body = JSON.parse(options.body);
        const { username, email } = body;
        
        // Check if username or email already exists
        const existingUser = MOCK_DATA.users.find(u => 
            u.Username === username || u.Email === email
        );
        
        if (existingUser) {
            return createMockResponse(400, { message: 'Username or email already exists' });
        }
        
        // Create new user
        const newUser = {
            UserID: `user${MOCK_DATA.users.length + 1}`,
            Username: username,
            Email: email,
            Role: 'team_member'
        };
        
        MOCK_DATA.users.push(newUser);
        
        return createMockResponse(201, { user: newUser });
    }
    
    function handleGetProfile() {
        // Return the first user as the current user
        return createMockResponse(200, { user: MOCK_DATA.users[0] });
    }
    
    function handleUpdateProfile(options) {
        const body = JSON.parse(options.body);
        
        // Update user data
        const user = MOCK_DATA.users[0];
        user.Email = body.email || user.Email;
        
        return createMockResponse(200, { user });
    }
    
    function handleChangePassword() {
        return createMockResponse(200, { message: 'Password changed successfully' });
    }
    
    // Task handlers
    function handleGetTasks() {
        // Get user from token (mock: always return all tasks)
        return createMockResponse(200, { tasks: MOCK_DATA.tasks });
    }
    
    function handleGetTask(taskId) {
        const task = MOCK_DATA.tasks.find(t => t.TaskID === taskId);
        
        if (task) {
            return createMockResponse(200, task);
        } else {
            return createMockResponse(404, { message: 'Task not found' });
        }
    }
    
    function handleCreateTask(options) {
        const body = JSON.parse(options.body);
        
        // Create new task
        const newTask = {
            TaskID: `task${MOCK_DATA.tasks.length + 1}`,
            Title: body.Title,
            Description: body.Description,
            Priority: body.Priority,
            Status: body.Status || 'New',
            CreatedBy: 'user1', // Mock: always created by admin
            CreatedByName: 'admin',
            AssignedTo: body.AssignedTo,
            AssignedToName: MOCK_DATA.users.find(u => u.UserID === body.AssignedTo)?.Username || 'Unknown',
            CreatedAt: new Date().toISOString(),
            Deadline: body.Deadline,
            CompletedAt: null,
            Notes: body.Notes || ''
        };
        
        MOCK_DATA.tasks.push(newTask);
        
        // Create notification for assigned user
        if (body.AssignedTo) {
            const notification = {
                NotificationID: `notif${MOCK_DATA.notifications.length + 1}`,
                UserID: body.AssignedTo,
                TaskID: newTask.TaskID,
                Type: 'task_assigned',
                Message: `You have been assigned to task "${newTask.Title}"`,
                CreatedAt: new Date().toISOString(),
                ReadStatus: false
            };
            
            MOCK_DATA.notifications.push(notification);
        }
        
        return createMockResponse(201, newTask);
    }
    
    function handleUpdateTask(taskId, options) {
        const body = JSON.parse(options.body);
        
        // Find task
        const taskIndex = MOCK_DATA.tasks.findIndex(t => t.TaskID === taskId);
        
        if (taskIndex === -1) {
            return createMockResponse(404, { message: 'Task not found' });
        }
        
        // Update task
        const task = MOCK_DATA.tasks[taskIndex];
        
        task.Title = body.Title || task.Title;
        task.Description = body.Description || task.Description;
        task.Priority = body.Priority || task.Priority;
        task.Status = body.Status || task.Status;
        task.Deadline = body.Deadline || task.Deadline;
        task.Notes = body.Notes || task.Notes;
        
        // Update assigned user if changed
        if (body.AssignedTo && body.AssignedTo !== task.AssignedTo) {
            task.AssignedTo = body.AssignedTo;
            task.AssignedToName = MOCK_DATA.users.find(u => u.UserID === body.AssignedTo)?.Username || 'Unknown';
            
            // Create notification for new assigned user
            const notification = {
                NotificationID: `notif${MOCK_DATA.notifications.length + 1}`,
                UserID: body.AssignedTo,
                TaskID: task.TaskID,
                Type: 'task_assigned',
                Message: `You have been assigned to task "${task.Title}"`,
                CreatedAt: new Date().toISOString(),
                ReadStatus: false
            };
            
            MOCK_DATA.notifications.push(notification);
        }
        
        return createMockResponse(200, task);
    }
    
    function handleDeleteTask(taskId) {
        // Find task
        const taskIndex = MOCK_DATA.tasks.findIndex(t => t.TaskID === taskId);
        
        if (taskIndex === -1) {
            return createMockResponse(404, { message: 'Task not found' });
        }
        
        // Remove task
        MOCK_DATA.tasks.splice(taskIndex, 1);
        
        return createMockResponse(200, { message: 'Task deleted successfully' });
    }
    
    function handleUpdateTaskStatus(taskId, options) {
        const body = JSON.parse(options.body);
        
        // Find task
        const task = MOCK_DATA.tasks.find(t => t.TaskID === taskId);
        
        if (!task) {
            return createMockResponse(404, { message: 'Task not found' });
        }
        
        // Update status
        task.Status = body.status;
        
        // Update completed date if status is Completed
        if (body.status === 'Completed') {
            task.CompletedAt = new Date().toISOString();
        } else {
            task.CompletedAt = null;
        }
        
        // Add notes if provided
        if (body.notes) {
            task.Notes = body.notes;
        }
        
        // Create notification for task creator
        const notification = {
            NotificationID: `notif${MOCK_DATA.notifications.length + 1}`,
            UserID: task.CreatedBy,
            TaskID: task.TaskID,
            Type: 'status_update',
            Message: `Task "${task.Title}" has been marked as ${body.status}`,
            CreatedAt: new Date().toISOString(),
            ReadStatus: false
        };
        
        MOCK_DATA.notifications.push(notification);
        
        return createMockResponse(200, task);
    }
    
    function handleAssignTask(taskId, options) {
        const body = JSON.parse(options.body);
        
        // Find task
        const task = MOCK_DATA.tasks.find(t => t.TaskID === taskId);
        
        if (!task) {
            return createMockResponse(404, { message: 'Task not found' });
        }
        
        // Update assigned user
        task.AssignedTo = body.assignedTo;
        task.AssignedToName = MOCK_DATA.users.find(u => u.UserID === body.assignedTo)?.Username || 'Unknown';
        
        // Create notification for assigned user
        const notification = {
            NotificationID: `notif${MOCK_DATA.notifications.length + 1}`,
            UserID: body.assignedTo,
            TaskID: task.TaskID,
            Type: 'task_assigned',
            Message: `You have been assigned to task "${task.Title}"`,
            CreatedAt: new Date().toISOString(),
            ReadStatus: false
        };
        
        MOCK_DATA.notifications.push(notification);
        
        return createMockResponse(200, task);
    }
    
    // Notification handlers
    function handleGetNotifications() {
        // Filter notifications for current user (mock: return all)
        return createMockResponse(200, { notifications: MOCK_DATA.notifications });
    }
    
    function handleMarkNotificationAsRead(notificationId) {
        // Find notification
        const notification = MOCK_DATA.notifications.find(n => n.NotificationID === notificationId);
        
        if (!notification) {
            return createMockResponse(404, { message: 'Notification not found' });
        }
        
        // Mark as read
        notification.ReadStatus = true;
        
        return createMockResponse(200, { message: 'Notification marked as read' });
    }
    
    function handleMarkAllNotificationsAsRead() {
        // Mark all notifications as read
        MOCK_DATA.notifications.forEach(notification => {
            notification.ReadStatus = true;
        });
        
        return createMockResponse(200, { message: 'All notifications marked as read' });
    }
    
    function handleGetNotificationPreferences() {
        return createMockResponse(200, MOCK_DATA.notificationPreferences);
    }
    
    function handleUpdateNotificationPreferences(options) {
        const body = JSON.parse(options.body);
        
        // Update preferences
        Object.assign(MOCK_DATA.notificationPreferences, body);
        
        return createMockResponse(200, MOCK_DATA.notificationPreferences);
    }
    
    // Admin handlers
    function handleGetUsers() {
        return createMockResponse(200, { users: MOCK_DATA.users });
    }
    
    function handleGetTaskStatistics() {
        return createMockResponse(200, MOCK_DATA.taskStatistics);
    }
    
    function handleGetUpcomingDeadlines() {
        // Return tasks with upcoming deadlines (mock: return all tasks)
        return createMockResponse(200, { tasks: MOCK_DATA.tasks });
    }
    
    function handleGetTeamPerformance() {
        return createMockResponse(200, MOCK_DATA.teamPerformance);
    }
    
    // Helper function to create mock response
    function createMockResponse(status, data) {
        return {
            ok: status >= 200 && status < 300,
            status,
            json: async () => data,
            text: async () => JSON.stringify(data)
        };
    }
    
    console.log('Mock API enabled');
}