<script setup>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus' // 引入弹窗组件
import { logout } from '@/api/user' // 引入刚才写的 api
import { useUserStore } from '@/stores/user' // 1. 引入 Store

import UserSideMenu from './UserSideMenu.vue'

const router = useRouter()
const userStore = useUserStore() // 2. 初始化 Store

// === 退出登录逻辑 ===
const handleLogout = () => {
  // 1. 弹出二次确认框 (防止手滑)
  ElMessageBox.confirm(
    '确定要退出当前账号吗？',
    '提示',
    {
      confirmButtonText: '确定退出',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    // 2. 用户点击了“确定”
    try {
      // (可选) 通知后端：我要退出了，你那边记录一下日志或者清一下Redis
      await logout() 
    } catch (e) {
      // 即使后端接口报错（比如网断了），前端也要强制退出，所以这里只打印不阻断
      console.warn('后端退出接口调用失败', e)
    } finally {
      // 3. 【核心步骤】清除本地存储的 Token 和用户信息
      // localStorage.removeItem('token')
      // localStorage.removeItem('userInfo')
      userStore.logout()
      
      // 4. 提示并跳转回登录页
      ElMessage.success('已安全退出')
      router.push('/login')
    }
  }).catch(() => {
    // 用户点击了“取消”，什么都不做
  })
}
</script>

<template>
  <div class="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-800">
    <UserSideMenu />

    <main class="flex-1 flex flex-col min-w-0">
      <header class="h-20 flex items-center justify-between px-8 bg-[#F8FAFC] flex-shrink-0">
        <h2 class="font-bold text-xl text-slate-800">概览</h2>
        <div class="flex items-center gap-6">
           <button class="relative text-slate-400 hover:text-slate-600 transition-colors">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
             <span class="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
           </button>
           
           <button 
             @click="handleLogout"
             class="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-100 shadow-sm active:scale-95"
           >
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
             退出登录
           </button>
        </div>
      </header>
      
      <div class="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
        <RouterView />
      </div>
    </main>

  </div>
</template>