import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // ⚠️ 改名：用 user_token 防止和管理员混淆
  const token = ref(localStorage.getItem('user_token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user_info') || '{}'))

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('user_token', newToken)
  }

  const setUserInfo = (newInfo) => {
    userInfo.value = { ...userInfo.value, ...newInfo }
    localStorage.setItem('user_info', JSON.stringify(userInfo.value))
  }

  // 🔥🔥🔥 新增：专门更新头像的方法 🔥🔥🔥
  // 这样 Settings.vue 里的 userStore.updateAvatar(url) 就不会报错了
  const updateAvatar = (url) => {
    userInfo.value.avatar = url
    // 这里的 ...userInfo.value 保证了昵称等其他信息不会丢失
    localStorage.setItem('user_info', JSON.stringify(userInfo.value))
  }

  const logout = () => {
      token.value = ''
      userInfo.value = {}
      localStorage.removeItem('user_token')
      localStorage.removeItem('user_info')
  }

  // ... 其他保持不变
  return { token, userInfo, setToken, setUserInfo, updateAvatar, logout }
})