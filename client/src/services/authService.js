import api from './api';

export const authService = {
  login: async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    return data;
  },
  register: async (userData) => {
    const data = await api.post('/auth/register', userData);
    return data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Continue client logout
    }
  },
  getMe: async () => {
    const data = await api.get('/auth/me');
    return data;
  },
  updateProfile: async (profileData) => {
    const data = await api.put('/auth/profile', profileData);
    return data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const data = await api.put('/auth/change-password', { currentPassword, newPassword });
    return data;
  },
  getOtpStatus: async () => {
    const data = await api.get('/auth/otp-status');
    return data;
  },
  sendOtp: async (email, purpose = 'REGISTER') => {
    const data = await api.post('/auth/send-otp', { email, purpose });
    return data;
  },
  verifyOtp: async (email, otp, purpose = 'REGISTER') => {
    const data = await api.post('/auth/verify-otp', { email, otp, purpose });
    return data;
  },
  resetPassword: async ({ email, otp, verificationToken, newPassword }) => {
    const data = await api.post('/auth/reset-password', { email, otp, verificationToken, newPassword });
    return data;
  },
};
