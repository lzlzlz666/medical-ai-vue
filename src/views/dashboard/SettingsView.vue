<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit } from '@element-plus/icons-vue'

// API 引入
import { getUserProfile, updateUserProfile, updateUserPassword, uploadFile } from '@/api/user'
import { addHealthRecord, updateHealthRecord } from '@/api/health'

// Pinia 引入
import { useUserStore } from '@/stores/user'

const userStore = useUserStore() // 初始化 Pinia

// === 状态变量 ===
const isLoading = ref(false)
const isHealthLoading = ref(false)
const isPwdLoading = ref(false)
const isAvatarLoading = ref(false)

const userId = ref(null) 
const isTodayCompleted = ref(false) 

// === 快照变量 (用于对比数据是否变化) ===
const lastSavedHealthData = ref('')
const lastSavedProfileData = ref('') 

// === 表单数据 ===
const profileForm = reactive({
  avatar: '',
  nickname: '',
  phone: '',
  age: 0,
  height: 0,
  weight: 0,
  gender: 'male',
  smoke: false,
  drink: false
})

const healthData = reactive({
  heartRate: '',
  glucose: '',
  systolic: '', 
  diastolic: '' 
})

const passwordForm = reactive({
  current: '',
  new: '',
  confirm: ''
})

// === 计算属性：检测数据变更 ===
const isHealthChanged = computed(() => {
  return JSON.stringify(healthData) !== lastSavedHealthData.value
})

const isProfileChanged = computed(() => {
  return JSON.stringify(profileForm) !== lastSavedProfileData.value
})

// === 初始化数据 ===
const initData = async () => {
  try {
    const data = await getUserProfile() 
    if (data) {
      userId.value = data.id 
      
      // 1. 填充个人信息
      profileForm.nickname = data.nickname || ''
      profileForm.phone = data.phone || ''
      profileForm.age = data.age || 0
      profileForm.height = data.height || 0
      profileForm.weight = data.weight || 0
      profileForm.avatar = data.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      profileForm.gender = data.gender === 2 ? 'female' : 'male'
      profileForm.smoke = data.isSmoker === 1
      profileForm.drink = data.isDrinker === 1
      
      // 2. 填充健康状态
      isTodayCompleted.value = data.todayCompleted
      if (data.todayHealth) {
        healthData.heartRate = data.todayHealth.heartRate || ''
        healthData.glucose = data.todayHealth.glucose || ''
        healthData.systolic = data.todayHealth.systolicBp || ''
        healthData.diastolic = data.todayHealth.diastolicBp || ''
      } else {
        // 清空（防止缓存干扰）
        healthData.heartRate = ''
        healthData.glucose = ''
        healthData.systolic = ''
        healthData.diastolic = ''
      }

      // === 保存快照 ===
      lastSavedProfileData.value = JSON.stringify(profileForm)
      lastSavedHealthData.value = JSON.stringify(healthData)
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

onMounted(() => {
  initData()
})

// 通用弹窗函数
const showSuccessDialog = (title, message) => {
  ElMessageBox.alert(message, title, {
    confirmButtonText: '好的',
    type: 'success',
    center: true,
    roundButton: true,
    customClass: '!rounded-2xl'
  })
}

// === 1. 上传头像逻辑 (Pinia版) ===
const handleUploadAvatar = async (option) => {
  const file = option.file
  // 校验图片
  const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPGOrPNG) return ElMessage.error('头像只能是 JPG 或 PNG 格式!')
  if (!isLt2M) return ElMessage.error('头像大小不能超过 2MB!')

  isAvatarLoading.value = true
  
  try {
    const formData = new FormData()
    formData.append('file', file)

    // 1. 上传到 OSS
    const newAvatarUrl = await uploadFile(formData) // 假设 request.js 直接返回 URL
    if (!newAvatarUrl) throw new Error('未获取到图片链接')

    // 2. 更新后端数据库
    await updateUserProfile({
      id: userId.value,
      avatar: newAvatarUrl
    })

    // 3. 更新本地显示
    profileForm.avatar = newAvatarUrl
    
    // 4. 更新快照 (保持按钮灰色)
    const tempSnapshot = JSON.parse(lastSavedProfileData.value)
    tempSnapshot.avatar = newAvatarUrl
    lastSavedProfileData.value = JSON.stringify(tempSnapshot)

    // 5. 🔥🔥🔥 核心：调用 Pinia 更新全局状态 (侧边栏自动变) 🔥🔥🔥
    userStore.updateAvatar(newAvatarUrl)

    ElMessage.success('头像更换成功！')

  } catch (error) {
    console.error(error)
    ElMessage.error('头像上传失败，请重试')
  } finally {
    isAvatarLoading.value = false
  }
}

// === 2. 保存个人信息 (Pinia版) ===
const handleSaveProfile = async () => {
  if (!isProfileChanged.value) return

  isLoading.value = true
  try {
    const submitData = {
      id: userId.value,
      nickname: profileForm.nickname,
      phone: profileForm.phone,
      age: profileForm.age,
      height: profileForm.height,
      weight: profileForm.weight,
      gender: profileForm.gender === 'female' ? 2 : 1,
      isSmoker: profileForm.smoke ? 1 : 0,
      isDrinker: profileForm.drink ? 1 : 0
    }
    
    await updateUserProfile(submitData)
    showSuccessDialog('保存成功', '您的个人档案已成功更新！')
    
    // 更新快照
    lastSavedProfileData.value = JSON.stringify(profileForm)
    
    // 🔥🔥🔥 核心：调用 Pinia 更新全局状态 (侧边栏自动变) 🔥🔥🔥
    userStore.setUserInfo({
      nickname: profileForm.nickname,
      // 如果后端支持改用户名或其他需同步字段，也加在这里
    })
    
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// === 3. 提交/修改健康记录 ===
const handleHealthRecord = async () => {
  if (!isHealthChanged.value) return 

  if (!healthData.heartRate || !healthData.glucose || !healthData.systolic || !healthData.diastolic) {
    return ElMessage.warning('请填写完整的健康指标数据')
  }

  isHealthLoading.value = true
  try {
    const submitData = {
      userId: userId.value, 
      heartRate: Number(healthData.heartRate),
      glucose: Number(healthData.glucose),
      systolicBp: Number(healthData.systolic),
      diastolicBp: Number(healthData.diastolic)
    }

    if (!isTodayCompleted.value) {
      await addHealthRecord(submitData)
      showSuccessDialog('打卡成功', '今日健康数据已录入，继续保持！🎉')
      isTodayCompleted.value = true 
    } else {
      await updateHealthRecord(submitData)
      showSuccessDialog('更新成功', '今日健康数据已修正。')
    }

    // 更新快照
    lastSavedHealthData.value = JSON.stringify(healthData)

  } catch (error) {
    console.error(error)
  } finally {
    isHealthLoading.value = false
  }
}

// === 4. 修改密码 ===
const handleChangePassword = async () => {
  if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
    return ElMessage.warning('请填写完整的密码信息')
  }
  if (passwordForm.new.length < 6) {
    return ElMessage.warning('新密码长度不能少于 6 位')
  }
  if (passwordForm.new !== passwordForm.confirm) {
    return ElMessage.warning('两次输入的新密码不一致')
  }
  if (passwordForm.current === passwordForm.new) {
    return ElMessage.warning('新密码不能与当前密码相同')
  }

  isPwdLoading.value = true
  try {
    await updateUserPassword({
      oldPassword: passwordForm.current,
      newPassword: passwordForm.new
    })

    showSuccessDialog('修改成功', '您的登录密码已更新，请谨记新密码。')

    // 清空表单
    passwordForm.current = ''
    passwordForm.new = ''
    passwordForm.confirm = ''
    
  } catch (error) {
    console.error(error)
  } finally {
    isPwdLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto pb-10">
    
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-slate-800">个人中心与健康设置</h2>
      <div class="text-sm text-slate-400">管理您的档案与安全隐私</div>
    </div>

    <div class="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100">
      <div class="flex items-center gap-3 mb-8">
        <span class="text-brand-blue bg-blue-50 p-2 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
        </span>
        <h3 class="font-bold text-lg text-slate-800">个人信息管理</h3>
      </div>

      <div class="flex flex-col lg:flex-row gap-10">
        <div class="flex flex-col items-center gap-4 min-w-[120px]">
          <el-upload
            class="avatar-uploader"
            action="#" 
            :http-request="handleUploadAvatar" 
            :show-file-list="false"
            accept=".jpg,.jpeg,.png"
            :disabled="isAvatarLoading"
          >
            <div 
              class="relative group cursor-pointer"
              v-loading="isAvatarLoading"
              element-loading-text="上传中..."
              element-loading-background="rgba(255, 255, 255, 0.7)"
            >
              <div class="w-32 h-32 rounded-full border-4 border-orange-100 p-1 bg-white overflow-hidden">
                 <img :src="profileForm.avatar" class="w-full h-full object-cover rounded-full hover:scale-110 transition-transform duration-300" />
              </div>
              <div class="absolute bottom-1 right-1 bg-brand-blue text-white p-2 rounded-full border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
            </div>
          </el-upload>
          <span class="text-sm text-brand-blue font-medium cursor-default">点击图片更换</span>
        </div>

        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div class="form-item">
            <label>昵称</label>
            <el-input v-model="profileForm.nickname" placeholder="请输入昵称" size="large" />
          </div>
          <div class="form-item">
            <label>手机号</label>
            <el-input v-model="profileForm.phone" placeholder="绑定手机号" size="large" />
          </div>
          
          <div class="form-item flex gap-8">
             <div>
                <label>年龄</label>
                <el-input-number v-model="profileForm.age" :min="1" :max="120" controls-position="right" size="large" class="!w-32" />
             </div>
             <div>
                <label>性别</label>
                <div class="h-[40px] flex items-center">
                  <el-radio-group v-model="profileForm.gender">
                    <el-radio label="male">男</el-radio>
                    <el-radio label="female">女</el-radio>
                  </el-radio-group>
                </div>
             </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-item">
              <label>身高 (cm)</label>
              <el-input v-model="profileForm.height" placeholder="175" size="large" />
            </div>
            <div class="form-item">
              <label>体重 (kg)</label>
              <el-input v-model="profileForm.weight" placeholder="70" size="large" />
            </div>
          </div>

          <div class="form-item md:col-span-2 flex gap-10 items-end pb-2 pt-2 bg-slate-50 p-4 rounded-xl">
             <span class="text-sm font-bold text-slate-500 mb-1">生活习惯：</span>
             <div class="flex items-center gap-3">
                <label class="mb-0 !ml-0">是否吸烟</label>
                <el-switch v-model="profileForm.smoke" active-text="是" inactive-text="否" inline-prompt />
             </div>
             <div class="flex items-center gap-3">
                <label class="mb-0 !ml-0">是否饮酒</label>
                <el-switch v-model="profileForm.drink" active-text="是" inactive-text="否" inline-prompt />
             </div>
          </div>
          
          <div class="md:col-span-2 flex justify-end mt-2">
             <el-button 
               size="large" 
               :loading="isLoading" 
               @click="handleSaveProfile" 
               :disabled="!isProfileChanged"
               :class="[
                 '!px-8 !rounded-xl !font-bold transition-all duration-300',
                 !isProfileChanged
                   ? '!bg-slate-100 !text-slate-400 !border-slate-200 !shadow-none' // 灰色
                   : '!bg-brand-blue !text-white !border-brand-blue !shadow-md hover:!-translate-y-0.5' // 亮色
               ]"
             >
               {{ isProfileChanged ? '保存修改' : '信息已同步' }}
             </el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
      <div v-if="isTodayCompleted" class="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[100px] -z-0 transition-all"></div>
      
      <div class="flex items-center justify-between mb-8 relative z-10">
         <div class="flex items-center gap-3">
            <span class="text-green-600 bg-green-50 p-2 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </span>
            <h3 class="font-bold text-lg text-slate-800">每日健康指标录入</h3>
         </div>
         
         <span 
           :class="[
             'text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 transition-colors',
             isTodayCompleted 
               ? 'bg-green-100 text-green-700 border-green-200' 
               : 'bg-red-50 text-red-600 border-red-100'
           ]"
         >
           <span class="w-1.5 h-1.5 rounded-full" :class="isTodayCompleted ? 'bg-green-500' : 'bg-red-500'"></span>
           {{ isTodayCompleted ? '今日已完成打卡' : '今日未完成' }}
         </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-red-200 hover:shadow-md transition-all group">
           <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                 <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </div>
              <span class="font-bold text-slate-700">心率</span>
           </div>
           <div class="relative">
              <input v-model="healthData.heartRate" type="number" placeholder="--" class="w-full bg-white border-none rounded-xl py-3 px-4 text-2xl font-bold text-slate-800 focus:ring-2 focus:ring-red-200 outline-none transition-shadow text-center" />
              <span class="absolute right-4 top-4 text-xs text-slate-400 font-medium">bpm</span>
           </div>
        </div>

        <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-yellow-200 hover:shadow-md transition-all group">
           <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-yellow-500 shadow-sm group-hover:scale-110 transition-transform">
                 <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>
              </div>
              <span class="font-bold text-slate-700">血糖</span>
           </div>
           <div class="relative">
              <input v-model="healthData.glucose" type="number" step="0.1" placeholder="--" class="w-full bg-white border-none rounded-xl py-3 px-4 text-2xl font-bold text-slate-800 focus:ring-2 focus:ring-yellow-200 outline-none transition-shadow text-center" />
              <span class="absolute right-4 top-4 text-xs text-slate-400 font-medium">mmol/L</span>
           </div>
        </div>

        <div class="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-brand-blue hover:shadow-md transition-all group">
           <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-blue shadow-sm group-hover:scale-110 transition-transform">
                 <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
              </div>
              <span class="font-bold text-slate-700">血压</span>
           </div>
           <div class="flex gap-2 items-center">
              <div class="relative flex-1">
                 <input v-model="healthData.systolic" type="number" placeholder="--" class="w-full bg-white border-none rounded-xl py-3 px-2 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-200 outline-none text-center" />
                 <span class="block text-[10px] text-center text-slate-400 mt-1">收缩压</span>
              </div>
              <span class="text-slate-300 text-xl">/</span>
              <div class="relative flex-1">
                 <input v-model="healthData.diastolic" type="number" placeholder="--" class="w-full bg-white border-none rounded-xl py-3 px-2 text-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-200 outline-none text-center" />
                 <span class="block text-[10px] text-center text-slate-400 mt-1">舒张压</span>
              </div>
           </div>
        </div>
      </div>

      <div class="mt-8 flex justify-end relative z-10">
         <el-button 
            size="large" 
            :loading="isHealthLoading" 
            @click="handleHealthRecord" 
            :disabled="!isHealthChanged" 
            :class="[
              '!px-8 !rounded-xl !font-bold transition-all duration-300',
              !isHealthChanged 
                ? '!bg-slate-100 !text-slate-400 !border-slate-200 !shadow-none' 
                : (isTodayCompleted ? '!bg-yellow-500 !text-white !border-yellow-500 !shadow-md' : '!bg-brand-blue !text-white !border-brand-blue !shadow-md hover:!-translate-y-0.5')
            ]"
         >
            <template #icon>
               <el-icon v-if="!isTodayCompleted"><Plus /></el-icon>
               <el-icon v-else><Edit /></el-icon>
            </template>
            {{ !isHealthChanged ? (isTodayCompleted ? '数据已同步' : '请输入今日数据') : (isTodayCompleted ? '保存修改' : '提交今日记录') }}
         </el-button>
      </div>

    </div>

    <div class="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100">
      <div class="flex items-center gap-3 mb-8">
        <span class="text-indigo-600 bg-indigo-50 p-2 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </span>
        <h3 class="font-bold text-lg text-slate-800">安全设置</h3>
      </div>
      <div class="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
         <h4 class="font-bold text-sm text-slate-700 mb-6">修改登录密码</h4>
         <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div class="form-item">
               <label>当前密码</label>
               <el-input 
                 v-model="passwordForm.current" 
                 type="password" 
                 show-password 
                 placeholder="请输入当前密码" 
                 size="large" 
               />
            </div>
            <div class="form-item">
               <label>新密码</label>
               <el-input 
                 v-model="passwordForm.new" 
                 type="password" 
                 show-password 
                 placeholder="不少于 6 位" 
                 size="large" 
               />
            </div>
            <div class="form-item">
               <label>确认新密码</label>
               <el-input 
                 v-model="passwordForm.confirm" 
                 type="password" 
                 show-password 
                 placeholder="再次输入新密码" 
                 size="large" 
               />
            </div>
         </div>
         
         <div class="mt-6 flex justify-end">
             <el-button 
               @click="handleChangePassword" 
               :loading="isPwdLoading"
               size="large" 
               class="!px-8 !rounded-xl !bg-white hover:!text-brand-blue hover:!border-brand-blue !font-bold"
             >
               确认修改
             </el-button>
         </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.form-item label {
  @apply block text-xs font-bold text-slate-500 mb-2 ml-1;
}

:deep(.el-input__wrapper) {
  @apply rounded-xl shadow-none border border-slate-200 bg-white transition-all py-1;
}
:deep(.el-input__wrapper.is-focus) {
  @apply ring-2 ring-brand-blue/20 border-brand-blue;
}
</style>