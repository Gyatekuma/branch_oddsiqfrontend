import api from './axios'

export const authApi = {
  async login(email, password) {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data.data
  },

  async register(email, password) {
    const response = await api.post('/api/auth/register', { email, password })
    return response.data.data
  },

  async logout() {
    const response = await api.post('/api/auth/logout')
    return response.data
  },

  async refresh(refreshToken) {
    const response = await api.post('/api/auth/refresh', { refresh_token: refreshToken })
    return response.data.data
  },

  async getProfile() {
    const response = await api.get('/api/auth/profile')
    return response.data.data
  },

  async getMe() {
    const response = await api.get('/api/auth/me')
    return response.data.data
  },

  async updateProfile(data) {
    const response = await api.put('/api/auth/profile', data)
    return response.data.data
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/api/auth/password', {
      current_password: currentPassword,
      new_password: newPassword
    })
    return response.data
  }
}

export default authApi
