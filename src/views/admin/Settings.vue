<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Lock, Timer, Refresh, Plus } from '@element-plus/icons-vue'
import { getAdminProfile, updateAdminProfile, updateAdminPassword } from '@/api/admin'
// 1. 引入 Pinia Store
import { useAdminStore } from '@/stores/admin' 

// === 1. 数据定义 ===
const adminStore = useAdminStore() 
const loading = ref(false)
const isSubmitting = ref(false)

// 个人信息表单
const userInfo = reactive({
  id: '',
  username: '',
  nickname: '',
  status: '',      // 显示的文本
  statusValue: 1,  // 🔥 新增：用于判断颜色的原始状态值 (1正常, 0禁用)
  avatar: '',
  createTime: '',
  updateTime: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const uploadHeaders = {
  token: adminStore.token 
}

// === 2. 核心逻辑 ===

// 加载个人信息
const loadProfile = async () => {
  loading.value = true
  try {
    const res = await getAdminProfile()
    const data = res 
    
    userInfo.id = data.id
    userInfo.username = data.username
    userInfo.nickname = data.nickname
    userInfo.avatar = data.avatar
    userInfo.createTime = data.createTime
    userInfo.updateTime = data.updateTime
    
    // 🔥 保存原始状态值，用于控制颜色
    userInfo.statusValue = data.status
    // 设置显示文本
    userInfo.status = data.status === 1 ? '已激活 (Active)' : '已禁用 (Disabled)'

    // 同步到 Store
    adminStore.setAdminInfo({
      id: data.id,
      username: data.username,
      nickname: data.nickname,
      avatar: data.avatar
    })
    
  } catch (error) {
    console.error('获取个人信息失败', error)
  } finally {
    loading.value = false
  }
}

// 头像上传成功回调
const handleAvatarSuccess = async (response) => {
  if (response.code === 1) {
    const newAvatarUrl = response.data
    
    // 1. 前端回显
    userInfo.avatar = newAvatarUrl
    
    try {
      // 2. 调用后端接口保存
      await updateAdminProfile({
        nickname: userInfo.nickname, 
        avatar: newAvatarUrl
      })
      
      // 3. 同步更新 Pinia Store
      adminStore.updateAvatar(newAvatarUrl)
      
      ElMessage.success('头像更新成功')
    } catch (error) {
      console.error(error)
      ElMessage.warning('头像上传成功但保存失败')
    }
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

// 保存所有修改
const handleSaveChanges = async () => {
  isSubmitting.value = true
  try {
    // 1. 保存基础信息
    await updateAdminProfile({
      nickname: userInfo.nickname,
      avatar: userInfo.avatar
    })

    // 2. 同步更新 Pinia Store
    adminStore.setAdminInfo({
      nickname: userInfo.nickname,
      avatar: userInfo.avatar
    })

    // 3. 处理密码修改
    let passwordChanged = false
    if (passwordForm.oldPassword || passwordForm.newPassword) {
      if (!passwordForm.oldPassword || !passwordForm.newPassword) {
        ElMessage.warning('若要修改密码，请填写完整')
        isSubmitting.value = false
        return
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        ElMessage.warning('两次新密码输入不一致')
        isSubmitting.value = false
        return
      }
      
      await updateAdminPassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
      passwordChanged = true
    }
    
    if (passwordChanged) {
      ElMessage.success('信息与密码已修改')
    } else {
      ElMessage.success('个人信息更新成功')
    }
    
    loadProfile() 
  } catch (error) {
    console.error(error)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-140px)]" v-loading="loading">
    
    <div class="w-full lg:w-1/3 xl:w-1/4 space-y-6">
      <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        
        <el-upload
          class="avatar-uploader"
          action="/api/admin/common/upload"
          :show-file-list="false"
          :on-success="handleAvatarSuccess"
          name="file"
          :headers="uploadHeaders"
        >
          <div class="relative mb-6 group cursor-pointer">
            <div class="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-blue-400 to-teal-400">
               <img 
                 :src="userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" 
                 class="w-full h-full rounded-full object-cover border-4 border-white" 
               />
            </div>
            <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span class="text-white text-xs font-bold">点击更换</span>
            </div>
          </div>
        </el-upload>
        
        <h2 class="text-2xl font-bold text-slate-800 mb-1">{{ userInfo.username }}</h2>
        <p class="text-slate-500 text-sm mb-6">{{ userInfo.nickname || '未设置昵称' }}</p>

        <div class="w-full space-y-4">
          <div class="flex justify-between items-center text-sm py-3 border-b border-slate-50">
            <span class="text-slate-500 font-medium">账号状态</span>
            
            <span 
              class="px-3 py-1 rounded-full text-xs font-bold"
              :class="userInfo.statusValue === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
            >
              {{ userInfo.status }}
            </span>

          </div>
          <div class="flex justify-between items-center text-sm py-2">
            <span class="text-slate-500 font-medium">角色昵称</span>
            <span class="text-blue-600 font-bold">{{ userInfo.nickname }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold text-slate-800 mb-4">时间统计</h3>
        <div class="space-y-4">
          <div class="flex gap-4 items-start">
             <div class="mt-1 text-slate-400"><el-icon><Timer /></el-icon></div>
             <div>
               <div class="text-xs text-slate-400 mb-1">创建时间</div>
               <div class="text-sm font-medium text-slate-700">{{ userInfo.createTime }}</div>
             </div>
          </div>
          <div class="flex gap-4 items-start">
             <div class="mt-1 text-slate-400"><el-icon><Refresh /></el-icon></div>
             <div>
               <div class="text-xs text-slate-400 mb-1">最后更新</div>
               <div class="text-sm font-medium text-slate-700">{{ userInfo.updateTime }}</div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 space-y-6">
      
      <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div class="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <el-icon class="text-blue-500 text-xl"><UserFilled /></el-icon>
          <h3 class="text-lg font-bold text-slate-800">基本信息</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-600">管理员 ID</label>
            <el-input v-model="userInfo.id" disabled class="bg-slate-50">
              <template #suffix><el-icon class="text-slate-400"><Lock /></el-icon></template>
            </el-input>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-600">用户名</label>
            <el-input v-model="userInfo.username" disabled class="bg-slate-50">
              <template #suffix><el-icon class="text-slate-400"><Lock /></el-icon></template>
            </el-input>
          </div>
          <div class="col-span-1 md:col-span-2 space-y-2">
            <label class="text-sm font-bold text-slate-600">昵称</label>
            <el-input v-model="userInfo.nickname" placeholder="请输入显示昵称" size="large" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
        <div class="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <el-icon class="text-blue-500 text-xl"><Lock /></el-icon>
          <h3 class="text-lg font-bold text-slate-800">修改密码</h3>
        </div>

        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-600">当前密码</label>
            <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密码以验证身份" size="large" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-600">新密码</label>
              <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" size="large" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-600">确认新密码</label>
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" size="large" />
            </div>
          </div>
        </div>

        <div class="mt-8 flex justify-end gap-4">
          <el-button text class="!text-slate-500">取消修改</el-button>
          <el-button 
            type="primary" 
            size="large" 
            class="!px-8 !font-bold !rounded-xl" 
            :loading="isSubmitting"
            @click="handleSaveChanges"
          >
            保存所有修改
          </el-button>
        </div>
      </div>

    </div>
  </div>
</template>