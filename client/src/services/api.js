import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle connection refused errors
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
      console.error('❌ Cannot connect to backend server');
      console.error('   Backend URL:', API_URL);
      console.error('   Error:', error.message);
      console.error('   Please ensure the backend server is running on port 5000');
      console.error('   Run: cd server && npm run dev');

      // Show user-friendly error message
      if (error.config && !error.config._retry) {
        error.config._retry = true;
        const errorMessage = 'Cannot connect to server. Please ensure the backend server is running on http://localhost:5000';
        // You can show a toast notification here if you have a toast system
        console.error(errorMessage);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

