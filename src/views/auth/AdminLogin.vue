<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminLogin, getAdminInfo } from '@/api/admin' 
import { useAdminStore } from '@/stores/admin'

const router = useRouter()
const adminStore = useAdminStore()
const isLoading = ref(false)
const trustDevice = ref(false) // 新增：信任设备选项

const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!form.username || !form.password) return ElMessage.warning("请输入账号密码")

  isLoading.value = true
  try {
    // 1. 获取 Token
    const loginRes = await adminLogin(form)
    const token = loginRes.token || loginRes
    adminStore.setToken(token)

    // 2. 获取管理员详情
    const infoRes = await getAdminInfo()
    if (infoRes) {
        adminStore.setAdminInfo(infoRes)
    }
    
    ElMessage.success(`欢迎进入控制台，${infoRes.nickname || '管理员'}`)
    router.push('/admin/dashboard')

  } catch (error) {
    console.error("管理员登录失败:", error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F2F4F7] flex items-center justify-center p-4 font-sans">
    
    <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-[1050px] min-h-[640px] flex overflow-hidden">
      
      <div class="hidden lg:flex w-5/12 bg-[#0C2D2B] relative flex-col justify-between p-12 text-white overflow-hidden">
        
        <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-[#14B8A6] rounded-full opacity-10 blur-[80px] translate-x-1/3 -translate-y-1/3"></div>
        <div class="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#0F766E] rounded-full opacity-20 blur-[60px] -translate-x-1/3 translate-y-1/3"></div>

        <div class="relative z-10 flex items-center gap-3">
          <div class="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
             <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <span class="text-sm font-bold tracking-widest text-emerald-100 uppercase">Admin Control</span>
        </div>

        <div class="relative z-10 mt-10">
          <h1 class="text-4xl font-black leading-snug mb-6 tracking-tight">
            系统管理中心：<br/>
            <span class="text-emerald-400">安全、高效、精准</span>
          </h1>
          <p class="text-slate-400 text-sm leading-relaxed max-w-sm">
            全平台数据管控与动态权限治理，构建多维度的慢性病数字化管理底座。为医疗决策提供坚实的后台支撑。
          </p>
        </div>

        <div class="relative z-10 grid grid-cols-2 gap-4 mt-auto">
          <div class="bg-[#133835]/60 backdrop-blur-md border border-[#1F4D49] p-5 rounded-2xl hover:bg-[#16423E] transition-colors cursor-default">
            <div class="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
               <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div class="font-bold text-sm text-emerald-50 mb-1">动态权限管理</div>
            <div class="text-[10px] text-slate-400">基于 RBAC 的精细化访问控制策略</div>
          </div>
          <div class="bg-[#133835]/60 backdrop-blur-md border border-[#1F4D49] p-5 rounded-2xl hover:bg-[#16423E] transition-colors cursor-default">
             <div class="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center mb-3">
               <svg class="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div class="font-bold text-sm text-emerald-50 mb-1">实时运行状态</div>
            <div class="text-[10px] text-slate-400">全链路系统健康度指标实时看板</div>
          </div>
        </div>
      </div>

      <div class="w-full lg:w-7/12 bg-white p-16 flex flex-col justify-center relative">
        
        <div class="mb-10">
           <h2 class="text-3xl font-extrabold text-slate-900 mb-3">管理员登录</h2>
           <p class="text-slate-400 text-sm">请使用预分配的内部账号访问管理后台。</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
           <div>
              <label class="block text-xs font-bold text-slate-700 mb-2 ml-1">管理员账号</label>
              <div class="relative group">
                  <input 
                     v-model="form.username" 
                     type="text" 
                     class="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-slate-800 focus:ring-0 outline-none transition-all placeholder-slate-400"
                     placeholder="请输入管理工号或账号"
                  />
                  <div class="absolute left-0 top-0 h-full w-11 flex items-center justify-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
              </div>
           </div>

           <div>
              <div class="flex justify-between items-center mb-2 ml-1">
                 <label class="block text-xs font-bold text-slate-700">安全密码</label>
                 <a href="#" class="text-xs text-slate-400 hover:text-slate-600 transition-colors">忘记密码?</a>
              </div>
              <div class="relative group">
                  <input 
                     v-model="form.password" 
                     type="password" 
                     class="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:border-slate-800 focus:ring-0 outline-none transition-all placeholder-slate-400 "
                     placeholder="请输入安全验证密码"
                  />
                  <div class="absolute left-0 top-0 h-full w-11 flex items-center justify-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 transition-colors">
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
              </div>
           </div>

           <button 
             :disabled="isLoading"
             class="!mt-10 w-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98] flex justify-center items-center gap-2 group "
           >
             <span v-if="isLoading" class="flex items-center gap-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                安全验证中...
             </span>
             <span v-else class="flex items-center gap-5">
                进入管理后台 
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
             </span>
           </button>
        </form>

        <div class="mt-auto border-t border-slate-100 pt-6 flex justify-between items-center text-[10px] text-slate-400">
           <div class="flex items-center gap-1.5 text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              安全审计已开启
           </div>
           <div class="flex gap-4">
              <span class="hover:text-slate-600 cursor-pointer transition-colors">技术支持</span>
              <span class="hover:text-slate-600 cursor-pointer transition-colors">合规声明</span>
           </div>
        </div>
        
        <div class="absolute top-4 right-4 flex gap-3">
            <router-link to="/login" class="text-[10px] font-bold text-slate-300 hover:text-slate-600 px-2 py-1 rounded-md border border-transparent hover:border-slate-200 transition-all">USER</router-link>
            <router-link to="/doctor/login" class="text-[10px] font-bold text-slate-300 hover:text-teal-600 px-2 py-1 rounded-md border border-transparent hover:border-teal-100 transition-all">DOCTOR</router-link>
        </div>

      </div>
    </div>
  </div>
</template>