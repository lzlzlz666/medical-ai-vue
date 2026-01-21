<script setup>
  // 1. 引入 Element Plus 的配置组件
import { ElConfigProvider } from 'element-plus'
// 2. 引入中文语言包
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

import { onMounted } from 'vue'
// 1. 引入所有角色的 Store
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'
import { useDoctorStore } from '@/stores/doctor'

// 2. 引入所有角色的获取信息 API
import { getUserInfo } from '@/api/user'
import { getAdminInfo } from '@/api/admin'
import { getDoctorInfo } from '@/api/doctor'

const userStore = useUserStore()
const adminStore = useAdminStore()
const doctorStore = useDoctorStore()

onMounted(async () => {
  // === 1. 同步【普通用户】信息 ===
  const userToken = localStorage.getItem('user_token')
  if (userToken) {
    try {
      const data = await getUserInfo()
      if (data) {
        userStore.setUserInfo(data)
        console.log('✅ 用户信息同步完成')
      }
    } catch (e) {
      console.warn('用户同步失败(可能Token过期)', e)
      // 可选：如果报错401，Store里可能需要清理一下，防止页面还显示旧名字
      userStore.logout() 
    }
  }

  // === 2. 同步【管理员】信息 ===
  const adminToken = localStorage.getItem('admin_token')
  if (adminToken) {
    try {
      const data = await getAdminInfo()
      if (data) {
        adminStore.setAdminInfo(data)
        console.log('✅ 管理员信息同步完成')
      }
    } catch (e) {
      console.warn('管理员同步失败', e)
    }
  }

  // === 3. 同步【医生】信息 ===
  const doctorToken = localStorage.getItem('doctor_token')
  if (doctorToken) {
    try {
      const data = await getDoctorInfo()
      if (data) {
        doctorStore.setDoctorInfo(data)
        console.log('✅ 医生信息同步完成')
      }
    } catch (e) {
      console.warn('医生同步失败', e)
    }
  }
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<style>
/* 全局样式 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>