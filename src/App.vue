<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user' // 引入 Pinia
import { getUserInfo } from '@/api/user'  // 引入获取信息接口

const userStore = useUserStore()

onMounted(async () => {
  // 1. 检查是否有 token (代表已登录)
  const token = localStorage.getItem('token')
  
  if (token) {
    try {
      // 2. 静默请求最新的用户信息
      // 注意：request.js 拦截器已经处理了 data.data 的剥离，这里直接拿数据
      const latestUserData = await getUserInfo()
      
      if (latestUserData) {
        // 3. 将最新的数据（包含最新的 avatar）同步到 Pinia 和 localStorage
        // 这一步执行完，侧边栏的头像会自动“跳”出来
        userStore.setUserInfo({
          id: latestUserData.id,
          username: latestUserData.username,
          nickname: latestUserData.nickname,
          avatar: latestUserData.avatar,
          // ...其他字段自动合并
        })
        console.log('✅ 用户信息已自动同步最新版')
      }
    } catch (error) {
      // 如果 Token 过期了，request.js 会自动跳登录页，这里不用管
      console.warn('自动同步用户信息失败:', error)
    }
  }
})
</script>

<template>
  <router-view />
</template>

<style>
/* 全局样式 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>