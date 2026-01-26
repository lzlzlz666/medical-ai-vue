<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user' 

const route = useRoute()
const router = useRouter() // 引入 router 用于跳转
const userStore = useUserStore() 

// 3. 计算属性：增强版用户信息
const currentUser = computed(() => {
  const info = userStore.userInfo || {}
  // 判断是否有有效信息 (例如检查 id 或 username 是否存在)
  const isLogin = !!(info.id || info.username)

  return {
    ...info,
    // 如果已登录：优先显示昵称，没有昵称显示用户名
    // 如果未登录：显示“未登录”
    nickname: isLogin ? (info.nickname || info.username) : '未登录',
    
    // 如果已登录：显示用户名
    // 如果未登录：显示提示文案
    username: isLogin ? info.username : '点击登录',
    
    avatar: isLogin ? info.avatar : '',
    isLogin // 导出状态供模板使用
  }
})

const avatarLetter = computed(() => {
  if (!currentUser.value.isLogin) return 'G' // Guest (访客)
  const name = currentUser.value.nickname || currentUser.value.username || '?'
  return name.charAt(0).toUpperCase()
})

const menuItems = [
  { 
    name: '仪表盘', 
    path: '/user/dashboard', 
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' 
  },
  { 
    name: 'AI+专家咨询', 
    path: '/user/ai-consult', 
    icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' 
  },
  { 
    name: '医生预约', 
    path: '/user/doctors', 
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
  },
  { 
    name: '健康报告', 
    path: '/user/report', 
    icon: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' 
  },
  { 
    name: '个人中心', 
    path: '/user/settings', 
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' 
  },
]

const isActive = (path) => route.path.startsWith(path)

// 点击头像区域：如果未登录，则跳转登录页
const handleProfileClick = () => {
  if (!currentUser.value.isLogin) {
    router.push('/login')
  }
}
</script>

<template>
  <div class="py-6 flex flex-col h-full bg-white border-r border-slate-100 w-64 flex-shrink-0">
    <div class="px-8 mb-10 flex items-center gap-3">
       <div class="w-9 h-9 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 transition-transform hover:scale-105">
         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
       </div>
       <span class="font-bold text-lg tracking-tight text-slate-800">智医助理 AI</span>
    </div>

    <nav class="flex-1 px-4 space-y-2">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path" 
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm',
          isActive(item.path) 
            ? 'bg-blue-50 text-brand-blue font-bold shadow-sm' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        ]"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path></svg>
        {{ item.name }}
      </router-link>
    </nav>

    <div class="px-4 mt-auto mb-4">
      <div 
        @click="handleProfileClick"
        class="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 hover:border-blue-100 transition-all cursor-pointer group"
      >
        
        <div class="relative flex-shrink-0">
             <img 
               v-if="currentUser.avatar" 
               :src="currentUser.avatar" 
               class="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" 
             />
             <div 
               v-else 
               class="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-brand-blue font-bold text-lg border-2 border-white shadow-sm"
             >
               {{ avatarLetter }}
             </div>
             <span 
               :class="[
                 'absolute bottom-0.5 right-0.5 w-3 h-3 border-2 border-white rounded-full transition-colors',
                 currentUser.isLogin ? 'bg-green-500' : 'bg-slate-300'
               ]"
             ></span>
        </div>
        
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="font-bold text-sm text-slate-800 truncate group-hover:text-brand-blue transition-colors">
            {{ currentUser.nickname }}
          </div>
          <div class="text-[11px] text-slate-400 font-medium truncate flex items-center">
            <span v-if="currentUser.isLogin" class="opacity-60 mr-0.5">@</span>
            {{ currentUser.username }}
          </div>
        </div>

        <div class="text-slate-300 group-hover:text-brand-blue transition-colors">
           <svg v-if="!currentUser.isLogin" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
           <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </div>

      </div>
    </div>
  </div>
</template>