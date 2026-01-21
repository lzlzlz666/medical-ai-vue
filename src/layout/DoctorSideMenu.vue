<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDoctorStore } from '@/stores/doctor' // 1. 引入 Doctor Store

const route = useRoute()
const doctorStore = useDoctorStore() // 2. 初始化

// 3. 计算属性：依赖 doctorStore.doctorInfo
const currentUser = computed(() => doctorStore.doctorInfo)

const avatarLetter = computed(() => {
  const name = currentUser.value.realName || currentUser.value.username || 'D'
  return name.charAt(0).toUpperCase()
})

const menuItems = [
  { 
    name: '工作概览', 
    path: '/doctor/dashboard', 
    icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' 
  },
  { 
    name: '审核修改', 
    path: '/doctor/audit', 
    // 图标：剪贴板+笔/待办事项
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' 
  },
  { 
    name: '审核历史', 
    path: '/doctor/history', 
    // 图标：时钟/历史
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' 
  },
  { 
    name: '个人资料', 
    path: '/doctor/profile', 
    // 图标：用户头像/ID卡
    icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .854.546 1.597 1.307 1.934a11.95 11.95 0 01-5.614 0A2.001 2.001 0 0110 6z' 
  },
]

const isActive = (path) => route.path.startsWith(path)
</script>

<template>
  <div class="py-6 flex flex-col h-full bg-white border-r border-slate-100 w-64 flex-shrink-0">
    <div class="px-8 mb-10 flex items-center gap-3">
       <div class="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-200 transition-transform hover:scale-105">
         <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
       </div>
       <span class="font-bold text-lg tracking-tight text-slate-800">医生工作台</span>
    </div>

    <nav class="flex-1 px-4 space-y-2">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path" 
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm',
          isActive(item.path) 
            ? 'bg-teal-50 text-teal-700 font-bold shadow-sm' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        ]"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path></svg>
        {{ item.name }}
      </router-link>
    </nav>

    <div class="px-4 mt-auto mb-4">
      <div class="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 hover:border-teal-100 transition-all cursor-pointer group">
        
        <div class="relative flex-shrink-0">
             <img 
               v-if="currentUser.avatar" 
               :src="currentUser.avatar" 
               class="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" 
             />
             <div 
               v-else 
               class="w-11 h-11 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center text-teal-700 font-bold text-lg border-2 border-white shadow-sm"
             >
               {{ avatarLetter }}
             </div>
             <span class="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
        
        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <div class="font-bold text-sm text-slate-800 truncate group-hover:text-teal-700 transition-colors">
            {{ currentUser.realName }}
          </div>
          <div class="text-[11px] text-slate-400 font-medium truncate flex items-center">
            <span class="opacity-60 mr-0.5"></span>{{ currentUser.deptName }}
          </div>
        </div>

        <div class="text-slate-300 group-hover:text-teal-600 transition-colors">
           <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </div>

      </div>
    </div>
  </div>
</template>