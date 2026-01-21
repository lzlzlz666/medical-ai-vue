import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDoctorStore = defineStore('doctor', () => {
  // 🔥 医生专用 Token Key
  const token = ref(localStorage.getItem('doctor_token') || '')
  const doctorInfo = ref(JSON.parse(localStorage.getItem('doctor_info') || '{}'))

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('doctor_token', newToken)
  }

  const setDoctorInfo = (newInfo) => {
    doctorInfo.value = { ...doctorInfo.value, ...newInfo }
    localStorage.setItem('doctor_info', JSON.stringify(doctorInfo.value))
  }

  const updateAvatar = (url) => {
    doctorInfo.value.avatar = url
    // 这里的 ...userInfo.value 保证了昵称等其他信息不会丢失
    localStorage.setItem('doctor_info', JSON.stringify(doctorInfo.value))
  }

  const logout = () => {
      token.value = ''
      localStorage.removeItem('doctor_token')
      localStorage.removeItem('doctor_info')
  }

  return { token, doctorInfo, setToken, setDoctorInfo, updateAvatar, logout }
})