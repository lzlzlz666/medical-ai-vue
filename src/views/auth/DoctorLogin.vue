<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { doctorLogin, getDoctorInfo } from '@/api/doctor' 
import { useDoctorStore } from '@/stores/doctor'

const router = useRouter()
const doctorStore = useDoctorStore()
const isLoading = ref(false)
const rememberMe = ref(false) // 新增：保持登录状态

const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!form.username || !form.password) return ElMessage.warning("请输入账号密码")

  isLoading.value = true
  try {
    // 1. 调用登录
    const loginRes = await doctorLogin(form)
    
    // 2. 存 Token
    const token = loginRes.token || loginRes
    doctorStore.setToken(token)

    // 3. 获取信息
    const infoRes = await getDoctorInfo()
    
    // 4. 存 Store
    if (infoRes) {
        doctorStore.setDoctorInfo(infoRes)
    }
    
    ElMessage.success(`欢迎回来，${infoRes.nickname || '医生'}`)
    router.push('/doctor/dashboard')

  } catch (error) {
    console.error("医生登录失败:", error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-4 font-sans">
    
    <div class="bg-white rounded-[20px] shadow-2xl w-full max-w-[1000px] min-h-[600px] flex overflow-hidden">
      
      <div class="hidden lg:flex w-5/12 bg-[#0F172A] relative flex-col justify-between p-10 text-white overflow-hidden">
        
        <div class="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-[#1E293B] rounded-full opacity-50 blur-3xl"></div>
        <div class="absolute bottom-[-50px] left-[-50px] w-[300px] h-[300px] bg-[#1d4ed8] rounded-full opacity-20 blur-[60px]"></div>

        <div class="relative z-10 flex items-center gap-3">
          <div class="bg-blue-600 p-1.5 rounded-lg">
             <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
          <span class="text-xl font-bold tracking-wide">智医云端</span>
        </div>

        <div class="relative z-10 mt-12">
          <h1 class="text-4xl font-bold leading-tight mb-6">
            赋能医疗专家<br/>
            <span class="text-blue-400">提升诊疗效率</span>
          </h1>
          <p class="text-slate-400 text-sm leading-relaxed max-w-xs">
            利用 AI 多模态数据，全方位管理您的患者健康。为慢性病提供精准、高效的数字化临床路径。
          </p>
        </div>

        <div class="relative z-10 grid grid-cols-2 gap-4 mt-auto">
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
            <div class="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
               <svg class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div class="font-bold text-sm mb-1">AI 辅助决策</div>
            <div class="text-[10px] text-slate-400">基于多维数据的智能诊断辅助</div>
          </div>
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
             <div class="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
               <svg class="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <div class="font-bold text-sm mb-1">全景画像监控</div>
            <div class="text-[10px] text-slate-400">实时追踪患者生命体征动态</div>
          </div>
        </div>
      </div>

      <div class="w-full lg:w-7/12 bg-white p-12 flex flex-col justify-center relative">
        
        <div class="flex gap-8 mb-10 border-b border-slate-100 pb-1">
           <button class="pb-3 border-b-2 border-blue-600 text-blue-600 font-bold text-sm">登录</button>
        </div>

        <div class="mb-8">
           <h2 class="text-2xl font-bold text-slate-800 mb-2">医生端安全登录</h2>
           <p class="text-slate-400 text-xs">欢迎回来，请输入您的身份以继续工作。</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
           <div>
              <label class="block text-xs font-bold text-slate-500 mb-2">用户名</label>
              <input 
                 v-model="form.username" 
                 type="text" 
                 class="w-full px-4 py-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-300"
                 placeholder="请输入您的手机号或医院工号"
              />
           </div>

           <div>
              <div class="flex justify-between items-center mb-2">
                 <label class="block text-xs font-bold text-slate-500">密码</label>
                 <a href="#" class="text-xs text-blue-600 hover:underline">忘记密码?</a>
              </div>
              <input 
                 v-model="form.password" 
                 type="password" 
                 class="w-full px-4 py-3 rounded-md border border-slate-200 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-slate-300"
                 placeholder="请输入登录密码"
              />
           </div>

           <button 
             :disabled="isLoading"
             class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md shadow-lg shadow-blue-600/30 transition-all active:scale-95 text-sm"
           >
             <span v-if="isLoading">验证中...</span>
             <span v-else>医生登录</span>
           </button>
        </form>

        <div class="mt-8">
           <div class="relative flex py-2 items-center">
              <div class="flex-grow border-t border-slate-100"></div>
              <span class="flex-shrink-0 mx-4 text-slate-300 text-xs">其他验证方式</span>
              <div class="flex-grow border-t border-slate-100"></div>
           </div>

           <button class="w-full mt-2 border border-slate-200 text-slate-600 py-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
              第三方医疗 CA 认证登录
           </button>
        </div>

        <div class="mt-auto text-center pt-6">
           <p class="text-[10px] text-slate-300">© 2026 智医云端 - 慢性病全生命周期管理专家</p>
        </div>
        
        <div class="absolute bottom-2 right-4 flex gap-2">
            <router-link to="/login" class="text-[10px] text-slate-300 hover:text-blue-500">用户</router-link>
            <router-link to="/admin/login" class="text-[10px] text-slate-300 hover:text-blue-500">管理</router-link>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* 针对 Webkit 浏览器的滚动条隐藏，保持页面整洁 */
::-webkit-scrollbar {
  width: 0px;
}
</style>