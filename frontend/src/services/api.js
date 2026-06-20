import axios from 'axios';

const api = axios.create({
  // Use VITE_API_BASE_URL as requested
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to automatically attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debugging (Development only)
    if (import.meta.env.DEV) {
      try {
        const fullUrl = new URL(config.url, config.baseURL || window.location.origin);
        if (config.params) {
          Object.keys(config.params).forEach(key => fullUrl.searchParams.append(key, config.params[key]));
        }
        console.log(`[API Request] ${config.method.toUpperCase()} ${fullUrl.toString()}`);
      } catch (e) {
        console.log(`[API Request] ${config.method.toUpperCase()} ${config.baseURL || ''}${config.url}`);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(`[API Error] Status: ${error.response?.status || 'Network Error'}`);
      if (error.response?.data) {
        console.error(`[API Error] Body:`, error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Helper to standardise error messages across the application
 */
export const extractErrorMessage = (err) => {
  if (!err.response) {
    return 'Network Error: Unable to connect to the server.';
  }
  
  const status = err.response.status;
  const backendMessage = err.response.data?.message;

  if (backendMessage) {
    return backendMessage;
  }

  if (status >= 400 && status < 500) {
    return 'Validation Error: Invalid input provided.';
  }
  
  if (status >= 500) {
    return 'Server Error: Something went wrong on our end.';
  }

  return 'An unexpected error occurred.';
};

export default api;
