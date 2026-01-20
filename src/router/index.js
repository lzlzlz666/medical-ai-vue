import { createRouter, createWebHistory } from 'vue-router'

// 引入三个角色的布局组件
import UserLayout from '@/layout/UserLayout.vue'
import DoctorLayout from '@/layout/DoctorLayout.vue'
import AdminLayout from '@/layout/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // === 1. 公共区域 ===
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue')
    },

    // === 2. 用户端 (User) ===
    {
      path: '/user',  // 原来是 /app，现在改为 /user 更清晰
      component: UserLayout,
      redirect: '/user/dashboard',
      meta: { role: 'user' },
      children: [
        {
          path: 'dashboard',
          name: 'UserDashboard',
          // 注意路径：中间加了 /user/
          component: () => import('@/views/user/dashboard/DashboardHome.vue')
        },
        {
          path: 'ai-consult',
          name: 'AiConsult',
          component: () => import('@/views/user/consultation/AiDoctorsView.vue')
        },
        {
          path: 'settings',
          name: 'UserSettings',
          component: () => import('@/views/user/settings/SettingsView.vue')
        }
      ]
    },

    // === 3. 医生端 (Doctor) ===
    {
      path: '/doctor',
      component: DoctorLayout,
      redirect: '/doctor/dashboard',
      meta: { role: 'doctor' },
      children: [
        {
          path: 'dashboard',
          name: 'DoctorDashboard',
          component: () => import('@/views/doctor/Dashboard.vue')
        }
        // 以后在这里加：患者列表、病历管理...
      ]
    },

    // === 4. 管理员端 (Admin) ===
    {
      path: '/admin',
      component: AdminLayout,
      redirect: '/admin/dashboard',
      meta: { role: 'admin' },
      children: [
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/admin/Dashboard.vue')
        }
        // 以后在这里加：用户管理、系统日志...
      ]
    }
  ]
})

export default router