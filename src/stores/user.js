import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // === 1. State ===
  // 关键修改：初始化时尝试从 localStorage 读取，防止刷新丢失
  const localData = JSON.parse(localStorage.getItem('userInfo') || '{}')
  
  const userInfo = ref({
    id: localData.id || '',
    username: localData.username || '',
    nickname: localData.nickname || '访客',
    avatar: localData.avatar || ''
  })

  // === 2. Actions ===
  // 更新全部信息 (登录/注册/修改资料用)
  const setUserInfo = (newInfo) => {
    // 1. 合并新数据到状态
    userInfo.value = { ...userInfo.value, ...newInfo }
    // 2. 同步到本地缓存
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  // 单独更新头像
  const updateAvatar = (url) => {
    userInfo.value.avatar = url
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  // 退出登录清理
  const clearUserInfo = () => {
    userInfo.value = { username: '', nickname: '', avatar: '' }
    localStorage.removeItem('userInfo')
    localStorage.removeItem('token')
  }

  return { userInfo, setUserInfo, updateAvatar, clearUserInfo }
})