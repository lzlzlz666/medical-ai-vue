import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 1. 初始化时，先拿本地缓存顶着（显示旧头像，起码比空白好）
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  // 2. Actions
  const setUserInfo = (newInfo) => {
    // 关键点：使用对象展开运算符 ... 合并旧数据和新数据
    // 这样如果 newInfo 里只有 avatar，也不会把 username 弄丢
    userInfo.value = { ...userInfo.value, ...newInfo }
    
    // 确保 nickname 有兜底
    if (!userInfo.value.nickname) {
        userInfo.value.nickname = userInfo.value.username || '访客'
    }

    // 存入 localStorage
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  const updateAvatar = (url) => {
    userInfo.value.avatar = url
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }
  
  const logout = () => {
      userInfo.value = {}
      localStorage.removeItem('userInfo')
      localStorage.removeItem('token')
  }

  return { userInfo, setUserInfo, updateAvatar, logout }
})