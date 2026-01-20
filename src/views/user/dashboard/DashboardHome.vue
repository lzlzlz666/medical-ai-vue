<script setup>
import { ref, onMounted } from 'vue' // 1. 引入 onMounted
import { useRouter } from 'vue-router' // 2. 引入路由用于跳转
import { ElMessage } from 'element-plus'
import HealthTrendChart from '@/components/charts/HealthTrendChart.vue'

const router = useRouter()
const username = ref('用户') // 默认名字

onMounted(() => {
  // === 1. 从 localStorage 获取用户信息 ===
  const userInfoStr = localStorage.getItem('userInfo')
  
  if (userInfoStr) {
    try {
      const userInfo = JSON.parse(userInfoStr)
      // 获取名字，如果没名字就显示默认的
      username.value = userInfo.username || userInfo.nickname || '用户'
    } catch (e) {
      console.error('用户信息解析失败', e)
    }
  } else {
    // === 2. 关键回答：这里必须手动处理 ===
    // 因为这个页面目前全是模拟数据，没有发起 API 请求，
    // 所以 request.js 的 401 拦截器不会触发。
    // 我们需要在这里手动检查：如果没有数据，直接踢回登录页。
    ElMessage.warning('未登录，请先登录！')
    router.push('/login')
  }
})

// 模拟数据 (保持不变)
const vitals = [
  { 
    label: '心率', value: '72', unit: 'bpm', 
    status: '正常范围', statusType: 'success',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    iconBg: 'bg-green-100', iconColor: 'text-green-600'
  },
  { 
    label: '血糖水平', value: '5.4', unit: 'mmol/L', 
    status: '数值平稳', statusType: 'success',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', 
    iconBg: 'bg-blue-100', iconColor: 'text-brand-blue'
  },
  { 
    label: '血压', value: '120/80', unit: 'mmHg', 
    status: '轻微偏高', statusType: 'warning',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z', 
    iconBg: 'bg-orange-100', iconColor: 'text-orange-600' 
  },
]
</script>

<template>
  <div class="space-y-8 max-w-6xl">
    <div>
      <h1 class="text-3xl font-bold text-slate-800">你好啊😘, {{ username }}</h1>
      <p class="text-slate-500 mt-2">这是您今天的健康数据摘要。</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="item in vitals" :key="item.label" class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50 hover:shadow-lg transition-all duration-300 group">
        <div class="flex justify-between items-start mb-6">
          <div>
            <div class="text-slate-500 text-sm font-medium mb-1">{{ item.label }}</div>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-bold text-slate-800 tracking-tight">{{ item.value }}</span>
              <span class="text-sm text-slate-400 font-medium">{{ item.unit }}</span>
            </div>
          </div>
          <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center transition-colors', item.iconBg, item.iconColor]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path></svg>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
           <svg v-if="item.statusType === 'success'" class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
           <svg v-else class="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4"/></svg>
           
           <span :class="['text-sm font-bold', item.statusType === 'success' ? 'text-green-500' : 'text-orange-500']">
             {{ item.status }}
           </span>
        </div>
      </div>
    </div>

    <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100/50">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h3 class="font-bold text-xl text-slate-800">实时趋势分析</h3>
          <p class="text-slate-400 text-sm mt-1">监测指标：血糖 & 血压</p>
        </div>
        
        <div class="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button class="px-4 py-1.5 bg-white text-xs font-bold rounded-lg shadow-sm text-brand-blue border border-slate-100">今天</button>
          <button class="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">本周</button>
          <button class="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">本月</button>
        </div>
      </div>
      
      <div class="h-80 w-full">
        <HealthTrendChart />
      </div>

      <div class="flex justify-center gap-8 mt-4">
        <div class="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span class="w-3 h-3 rounded-full bg-brand-blue"></span> 血糖
        </div>
        <div class="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span class="w-3 h-3 rounded-full bg-green-500"></span> 血压
        </div>
      </div>
    </div>

    <div>
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-bold text-xl text-slate-800">专家服务</h3>
        <button class="text-brand-blue text-sm font-bold hover:text-blue-700">查看全部</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-blue-200 transition-colors group cursor-pointer shadow-sm">
           <div class="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">👩‍⚕️</div>
           <div class="flex-1">
             <div class="font-bold text-slate-800">李华 主任医师</div>
             <div class="text-xs text-slate-500 mb-1">心内科 • 第一人民医院</div>
             <div class="flex items-center gap-1.5">
               <span class="w-2 h-2 rounded-full bg-green-500"></span>
               <span class="text-xs font-bold text-green-600">今日可约</span>
             </div>
           </div>
           <button class="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
           </button>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 hover:border-blue-200 transition-colors group cursor-pointer shadow-sm">
           <div class="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">👨‍⚕️</div>
           <div class="flex-1">
             <div class="font-bold text-slate-800">张伟 副主任医师</div>
             <div class="text-xs text-slate-500 mb-1">内分泌科 • 中医院</div>
             <div class="flex items-center gap-1.5">
               <span class="w-2 h-2 rounded-full bg-orange-500"></span>
               <span class="text-xs font-bold text-orange-600">最早明日</span>
             </div>
           </div>
           <button class="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
           </button>
        </div>
      </div>
    </div>
  </div>
</template>