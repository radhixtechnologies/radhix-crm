import api from './api';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        if (response.data.sessionId) {
          localStorage.setItem('sessionId', response.data.sessionId);
        }
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('sessionId');
      
      if (token) {
        try {
          await api.post('/auth/logout', { sessionId });
        } catch (error) {
          console.error('Logout error:', error);
          // Continue with local logout even if backend call fails
        }
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      // Clear local storage even on error
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Logout failed',
      };
    }
  },

  logoutAll: async () => {
    try {
      await api.post('/auth/logout-all');
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Logout all error:', error);
      // Clear local storage even on error
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Logout failed',
      };
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getPermissions: async () => {
    const response = await api.get('/auth/permissions');
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/updateprofile', userData);
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/changepassword', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgotpassword', { email });
    return response.data;
  },

  resetPassword: async (resetToken, password) => {
    const response = await api.put(`/auth/resetpassword/${resetToken}`, { password });
    return response.data;
  },

  // Admin password reset methods
  adminResetPassword: async (userId, newPassword = null) => {
    const response = await api.post(`/auth/admin/reset-password/${userId}`, {
      newPassword,
    });
    return response.data;
  },

  generateTemporaryPassword: async (userId) => {
    const response = await api.post(`/auth/admin/generate-temp-password/${userId}`);
    return response.data;
  },
};
