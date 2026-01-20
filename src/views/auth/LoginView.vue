<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '@/api/user' 
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user' // 1. 引入 Store

const router = useRouter()
const userStore = useUserStore() // 2. 初始化 Store

const isLogin = ref(true)
const isLoading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const handleAuth = async () => {
  // ----------------------
  // 场景 A: 注册并自动登录
  // ----------------------
  if (!isLogin.value) {
    if (!registerForm.username || !registerForm.password || !registerForm.confirmPassword) {
      return ElMessage.warning('请填写完整的注册信息')
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      return ElMessage.warning('两次输入的密码不一致')
    }

    isLoading.value = true
    try {
      await register({
        username: registerForm.username,
        password: registerForm.password
      })

      ElMessage.success('注册成功，已自动登录！')

      // 登录
      const data = await login({
        username: registerForm.username,
        password: registerForm.password
      })

      // ❌ 删除原来的 localStorage 操作
      // ✅ 使用 Pinia 更新状态 (Store 内部会自动存 localStorage)
      localStorage.setItem('token', data.token) // Token 单独存还是没问题的，或者放入 Store 也可以
      
      userStore.setUserInfo({
        id: data.id,
        username: data.username,
        nickname: data.nickname || data.username,
        avatar: data.avatar
      })

      router.push('/user/ai-consult')

    } catch (error) {
      console.error("注册或自动登录失败:", error)
    } finally {
      isLoading.value = false
    }
    return
  }

  // ----------------------
  // 场景 B: 普通登录
  // ----------------------
  if (!loginForm.username || !loginForm.password) {
    return ElMessage.warning("请输入账号和密码")
  }

  isLoading.value = true

  try {
    const data = await login({
      username: loginForm.username,
      password: loginForm.password
    })

    ElMessage.success('登录成功，欢迎回来！')

    // 1. 存 Token
    localStorage.setItem('token', data.token)
    
    // 2. ✅ 使用 Pinia 更新用户信息
    userStore.setUserInfo({
      id: data.id,
      username: data.username,
      nickname: data.nickname || data.username,
      avatar: data.avatar
    })

    router.push('/user/ai-consult')

  } catch (error) {
    console.error("登录流程中断:", error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="auth-card">
      
      <div class="left-panel">
        <div class="absolute top-[-20%] left-[-20%] w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float-fast"></div>

        <div class="relative z-10 flex items-center gap-3 mb-12">
          <div class="bg-white/20 backdrop-blur-md p-2.5 rounded-xl shadow-inner border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 text-white">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span class="font-bold text-2xl tracking-wide text-white drop-shadow-md">MediCare+ 智医</span>
        </div>

        <div class="relative z-10 mb-auto">
          <h1 class="text-5xl font-bold leading-tight text-white mb-6 drop-shadow-lg">
            智能慢病管理<br/>
            <span class="text-teal-100">由此开启</span>
          </h1>
          <p class="text-blue-50 text-base leading-relaxed opacity-90 max-w-md">
            融合多模态数据分析与生成式 AI 技术。从实时监测到专家诊疗，为您构建全方位的个性化健康护盾。
          </p>
        </div>

        <div class="relative z-10 flex gap-4 mt-8">
          <div class="glass-tag">
            <div class="text-2xl mb-1">⚡</div>
            <div class="font-bold text-sm">实时监测</div>
            <div class="text-[10px] opacity-70">毫秒级数据同步</div>
          </div>
          <div class="glass-tag">
            <div class="text-2xl mb-1">🛡️</div>
            <div class="font-bold text-sm">隐私安全</div>
            <div class="text-[10px] opacity-70">HIPAA 合规加密</div>
          </div>
        </div>
      </div>

      <div class="right-panel">
        
        <div class="bg-slate-100 p-1.5 rounded-full inline-flex w-full mb-8 relative">
          <div class="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out"
               :class="isLogin ? 'left-1.5' : 'left-[calc(50%+3px)]'"></div>
          <button @click="isLogin = true" :class="['relative z-10 w-1/2 py-2.5 rounded-full text-sm font-bold transition-colors', isLogin ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700']">登录</button>
          <button @click="isLogin = false" :class="['relative z-10 w-1/2 py-2.5 rounded-full text-sm font-bold transition-colors', !isLogin ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700']">注册</button>
        </div>

        <Transition name="fade-slide" mode="out-in">
          
          <div v-if="isLogin" key="login" class="w-full">
            <div class="mb-8">
              <h2 class="text-3xl font-bold text-slate-800 mb-2">欢迎回来 👋</h2>
              <p class="text-slate-400 text-sm">请输入您的账号以访问健康看板</p>
            </div>

            <form @submit.prevent="handleAuth" class="space-y-5">
              <div class="input-group group">
                <label>账号</label>
                <div class="relative">
                  <input v-model="loginForm.username" type="text" class="input-field pl-12" placeholder="请输入用户名" />
                </div>
              </div>
              
              <div class="input-group group">
                <div class="flex justify-between items-center mb-1.5">
                  <label class="mb-0">密码</label>
                  <a href="#" class="text-xs text-brand-blue font-bold hover:underline">忘记密码?</a>
                </div>
                <div class="relative">
                  <input v-model="loginForm.password" type="password" class="input-field pl-12" placeholder="••••••••" />
                </div>
              </div>

              <button :disabled="isLoading" class="btn-primary mt-4 w-full">
                <span v-if="isLoading" class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                {{ isLoading ? '登录中...' : '立即登录' }}
              </button>
            </form>
          </div>

          <div v-else key="register" class="w-full">
             <div class="mb-6">
              <h2 class="text-3xl font-bold text-slate-800 mb-2">创建账户 🚀</h2>
              <p class="text-slate-400 text-sm">设置您的专属账号和密码</p>
            </div>

            <form @submit.prevent="handleAuth" class="space-y-4">
              <div class="input-group group">
                <label>设置账号</label>
                <div class="relative">
                   <input v-model="registerForm.username" type="text" class="input-field pl-12" placeholder="设置用户名" />
                </div>
              </div>

              <div class="input-group group">
                <label>设置密码</label>
                <div class="relative">
                    <input v-model="registerForm.password" type="password" class="input-field pl-12" placeholder="6位以上字符" />
                </div>
              </div>

              <div class="input-group group">
                <label>确认密码</label>
                <div class="relative">
                    <input v-model="registerForm.confirmPassword" type="password" class="input-field pl-12" placeholder="再次输入密码" />
                </div>
              </div>

              <button class="btn-dark mt-4 w-full">立即注册</button>
            </form>
          </div>

        </Transition>

        <div class="relative my-8">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-100"></div></div>
            <div class="relative flex justify-center text-xs uppercase"><span class="px-4 bg-white text-slate-400 font-medium">其他登录方式</span></div>
        </div>

        <div class="flex justify-center gap-6">
           <button class="social-btn group">
             <svg class="w-5 h-5 text-slate-600 group-hover:text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
           </button>
           <button class="social-btn group">
             <svg class="w-6 h-6 text-green-600 group-hover:text-green-700" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5,3C4.9,3,2,5.5,2,8.5c0,1.8,1,3.4,2.7,4.4C4.6,13.7,4.3,14.6,4.3,14.6c0,0,1.7,0,3-0.8c0.4,0.1,0.8,0.2,1.2,0.2c-0.2-0.6-0.3-1.3-0.3-1.9C8.2,8.3,11.5,5.2,15.6,5.2c0.2,0,0.5,0,0.7,0C14.3,3.7,11.6,3,8.5,3z M16.5,6C12.9,6,10,8.5,10,11.5c0,1.7,0.9,3.2,2.3,4.1c-0.1,0.6-0.5,1.7-0.5,1.7c0,0,1.6-0.1,2.8-0.9c0.6,0.2,1.2,0.3,1.9,0.3c3.6,0,6.5-2.5,6.5-5.5C23,8.5,20.1,6,16.5,6z M13.8,10.2c-0.4,0-0.8-0.3-0.8-0.8c0-0.4,0.3-0.8,0.8-0.8c0.4,0,0.8,0.3,0.8,0.8C14.5,9.9,14.2,10.2,13.8,10.2z M19.2,10.2c-0.4,0-0.8-0.3-0.8-0.8c0-0.4,0.3-0.8,0.8-0.8c0.4,0,0.8,0.3,0.8,0.8C20,9.9,19.7,10.2,19.2,10.2z"/></svg>
           </button>
           <button class="social-btn group">
             <svg class="w-5 h-5 text-blue-500 group-hover:text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15.5c-2.3 0-4.34-1.29-5.35-3.18-.1-.19.06-.41.27-.37.75.14 1.96.25 2.82.25.68 0 1.25-.09 1.75-.24-.26-.78-.54-1.63-.54-2.46 0-2.32 1.84-4.5 4.5-4.5s4.5 2.18 4.5 4.5c0 .83-.28 1.68-.54 2.46.5.15 1.07.24 1.75.24.86 0 2.07-.11 2.82-.25.21-.04.37.18.27.37-1.01 1.89-3.05 3.18-5.35 3.18z"/></svg>
           </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 容器与布局 */
.page-container { @apply min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 font-sans; }
.auth-card { 
  @apply bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[1100px] flex overflow-hidden min-h-[700px];
  box-shadow: 0 25px 50px -12px rgba(0, 102, 255, 0.15); /* 定制的高级蓝阴影 */
}

/* 左侧面板：渐变背景 */
.left-panel { 
  @apply hidden lg:flex w-5/12 p-12 flex-col justify-between relative overflow-hidden text-white;
  background: linear-gradient(135deg, #00C2CB 0%, #0066FF 100%);
}
.glass-tag {
  @apply bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex-1 text-white hover:bg-white/20 transition-colors cursor-default;
}

/* 右侧面板 */
.right-panel { @apply w-full lg:w-7/12 p-12 lg:p-16 flex flex-col justify-center bg-white relative; }

/* 输入框组合 */
.input-group { @apply mb-1; }
.input-group label { 
  @apply block text-sm font-bold text-slate-700 mb-2 ml-1 transition-colors group-focus-within:text-brand-blue; 
}
.input-field { 
  @apply w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 transition-all duration-300;
  @apply placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue focus:bg-white;
}

/* 按钮样式 */
.btn-primary { 
  @apply bg-gradient-to-r from-[#00A3FF] to-[#0066FF] hover:from-[#009bf2] hover:to-[#005ce6] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center;
}
.btn-dark {
  @apply bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-300/50 transition-all transform hover:-translate-y-0.5 active:scale-[0.98];
}
.social-btn {
  @apply w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all transform hover:-translate-y-0.5;
}

/* 动画 */
@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
.animate-float-slow { animation: float 8s ease-in-out infinite; }
.animate-float-fast { animation: float 6s ease-in-out infinite reverse; }

/* 切换动画 */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }
</style>