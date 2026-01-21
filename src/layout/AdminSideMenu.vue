<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminStore } from '@/stores/admin' // 1. 引入 Admin Store

const route = useRoute()
const adminStore = useAdminStore() // 2. 初始化

// 3. 计算属性：依赖 adminStore.adminInfo
const currentUser = computed(() => adminStore.adminInfo)

const avatarLetter = computed(() => {
  const name = currentUser.value.nickname || currentUser.value.username || 'A'
  return name.charAt(0).toUpperCase()
})

const menuItems = [
  { 
    name: '控制台', 
    path: '/admin/dashboard', 
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' 
  },
  { 
    name: '用户管理', 
    path: '/admin/users', 
    // 图标：用户群组
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' 
  },
  { 
    name: '医生管理', 
    path: '/admin/doctors', 
    // 图标：急救箱/医疗包
    icon: 'M20 7h-4v-1a3 3 0 00-3-3h-2a3 3 0 00-3 3v1H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM9 6a1 1 0 011-1h4a1 1 0 011 1v1H9V6zm3 11a1 1 0 11-2 0 1 1 0 012 0z' 
  },
  { 
    name: '科室/部门', 
    path: '/admin/depts', 
    // 图标：组织架构/大楼
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' 
  },
    { 
    name: '个人资料', 
    path: '/admin/profile', 
    // 图标：用户头像/ID卡
    icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .854.546 1.597 1.307 1.934a11.95 11.95 0 01-5.614 0A2.001 2.001 0 0110 6z' 
  },
]

const isActive = (path) => route.path.startsWith(path)
</script>

<template>
  <div class="py-6 flex flex-col h-full bg-white border-r border-slate-100 w-64 flex-shrink-0">
    <div class="px-8 mb-10 flex items-center gap-3">
       <div class="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-300 transition-transform hover:scale-105">
         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
       </div>
       <span class="font-bold text-lg tracking-tight text-slate-800">系统管理后台</span>
    </div>

    <nav class="flex-1 px-4 space-y-2">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path" 
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm',
          isActive(item.path) 
            ? 'bg-slate-100 text-slate-900 font-bold shadow-sm' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        ]"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path></svg>
        {{ item.name }}
      </router-link>
    </nav>

    <div class="px-4 mt-auto mb-4">
      <div class="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 hover:border-slate-200 transition-all cursor-pointer group">
        
        <div class="relative flex-shrink-0">
             <img 
               v-if="currentUser.avatar" 
               :src="currentUser.avatar" 
               class="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" 
             />
             <div 
               v-else 
               class="w-11 h-11 rounded-full bg-gradient-to-br from-slate-200 to-gray-300 flex items-center justify-center text-slate-600 font-bold text-lg border-2 border-white shadow-sm"
             >
               {{ avatarLetter }}
             </div>
             <span class="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="font-bold text-sm text-slate-800 truncate group-hover:text-slate-900 transition-colors">
            {{ currentUser.nickname }}
          </div>
          <div class="text-[11px] text-slate-400 font-medium truncate flex items-center">
            <span class="opacity-60 mr-0.5">@</span>{{ currentUser.username }}
          </div>
        </div>

        <div class="text-slate-300 group-hover:text-slate-600 transition-colors">
           <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </div>

      </div>
    </div>
  </div>
</template>