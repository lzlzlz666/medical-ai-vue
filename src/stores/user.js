import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // === State ===
  // 1. Token：初始化时从 localStorage 读取，防止刷新丢失
  const token = ref(localStorage.getItem('token') || '')
  
  // 2. UserInfo：初始化读取
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  // === Actions ===
  
  // ✅ 新增：专门设置 Token 的方法
  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  // 设置用户信息 (保持你原来的逻辑，稍作优化)
  const setUserInfo = (newInfo) => {
    userInfo.value = { ...userInfo.value, ...newInfo }
    
    // 兜底逻辑
    if (!userInfo.value.nickname) {
        userInfo.value.nickname = userInfo.value.username || '访客'
    }

    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  const updateAvatar = (url) => {
    userInfo.value.avatar = url
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }
  
  // 登出：同时清理 Token 和 UserInfo
  const logout = () => {
      token.value = ''
      userInfo.value = {}
      localStorage.removeItem('token') // 清理缓存
      localStorage.removeItem('userInfo')
  }

  return { 
    token, 
    userInfo, 
    setToken, // 记得导出
    setUserInfo, 
    updateAvatar, 
    logout 
  }
})