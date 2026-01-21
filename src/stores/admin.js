import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAdminStore = defineStore('admin', () => {
  // 🔥 管理员专用 Token Key
  const token = ref(localStorage.getItem('admin_token') || '')
  const adminInfo = ref(JSON.parse(localStorage.getItem('admin_info') || '{}'))

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('admin_token', newToken)
  }

  const setAdminInfo = (newInfo) => {
    adminInfo.value = { ...adminInfo.value, ...newInfo }
    localStorage.setItem('admin_info', JSON.stringify(adminInfo.value))
  }

  const logout = () => {
      token.value = ''
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
  }

  return { token, adminInfo, setToken, setAdminInfo, logout }
})