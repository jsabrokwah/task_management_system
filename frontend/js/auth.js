/**
 * Authentication Service
 * Handles user authentication, token management, and user session
 */
class AuthService {
    constructor() {
        this.token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
        this.user = JSON.parse(localStorage.getItem(CONFIG.AUTH.USER_KEY) || 'null');
        
        // Set up token refresh if user is logged in
        if (this.token) {
            this.setupTokenRefresh();
        }
    }
    
    /**
     * Authenticate user with username and password
     * @param {string} username - User's username
     * @param {string} password - User's password
     * @returns {Promise} - Promise resolving to user object
     */
    async login(username, password) {
        try {
            showLoading();
            
            const response = await fetch(`${CONFIG.API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
            
            const data = await response.json();
            this.setSession(data.token, data.user);
            
            hideLoading();
            return data.user;
        } catch (error) {
            hideLoading();
            throw error;
        }
    }
    
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Promise} - Promise resolving to user object
     */
    async register(userData) {
        try {
            showLoading();
            
            const response = await fetch(`${CONFIG.API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }
            
            const data = await response.json();
            
            hideLoading();
            return data.user;
        } catch (error) {
            hideLoading();
            throw error;
        }
    }
    
    /**
     * Log out the current user
     */
    logout() {
        localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
        localStorage.removeItem(CONFIG.AUTH.USER_KEY);
        this.token = null;
        this.user = null;
        
        // Clear any refresh timers
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
    
    /**
     * Get the current authentication token
     * @returns {string|null} - JWT token or null if not authenticated
     */
    getToken() {
        return this.token;
    }
    
    /**
     * Get the current user object
     * @returns {Object|null} - User object or null if not authenticated
     */
    getUser() {
        return this.user;
    }
    
    /**
     * Check if user is authenticated
     * @returns {boolean} - True if authenticated, false otherwise
     */
    isAuthenticated() {
        return !!this.token;
    }
    
    /**
     * Check if current user is an admin
     * @returns {boolean} - True if user is admin, false otherwise
     */
    isAdmin() {
        return this.user && this.user.role === CONFIG.USER_ROLES.ADMIN;
    }
    
    /**
     * Update user profile
     * @param {Object} profileData - Updated profile data
     * @returns {Promise} - Promise resolving to updated user object
     */
    async updateProfile(profileData) {
        try {
            showLoading();
            
            const response = await fetch(`${CONFIG.API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(profileData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }
            
            const data = await response.json();
            
            // Update stored user data
            this.user = data.user;
            localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(data.user));
            
            hideLoading();
            return data.user;
        } catch (error) {
            hideLoading();
            throw error;
        }
    }
    
    /**
     * Set user session data
     * @param {string} token - JWT token
     * @param {Object} user - User object
     */
    setSession(token, user) {
        this.token = token;
        this.user = user;
        
        localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, token);
        localStorage.setItem(CONFIG.AUTH.USER_KEY, JSON.stringify(user));
        
        this.setupTokenRefresh();
    }
    
    /**
     * Set up automatic token refresh
     */
    setupTokenRefresh() {
        // Clear any existing refresh timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Set up new refresh timer
        this.refreshTimer = setInterval(async () => {
            try {
                const response = await fetch(`${CONFIG.API_URL}/api/auth/refresh`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.token = data.token;
                    localStorage.setItem(CONFIG.AUTH.TOKEN_KEY, data.token);
                } else {
                    // If refresh fails, log out the user
                    this.logout();
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
            }
        }, CONFIG.AUTH.REFRESH_INTERVAL);
    }
}

// Create and export auth service instance
const authService = new AuthService();