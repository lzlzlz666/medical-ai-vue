import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'   // 你原来的首页
import LoginView from '../views/LoginView.vue' // 你原来的登录页

// 新增的页面
import SystemLayout from '../views/SystemLayout.vue'
import DashboardHome from '../views/dashboard/DashboardHome.vue'
import SettingsView from '../views/dashboard/SettingsView.vue'
import AiDoctorsView from '../views/dashboard/AiDoctorsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 1. 原来的首页
    { path: '/', name: 'home', component: HomeView },
    
    // 2. 原来的登录页
    { path: '/login', name: 'login', component: LoginView },

    // 3. 新增的后台系统路由 (嵌套路由)
    {
      path: '/app',
      component: SystemLayout,
      redirect: '/app/dashboard', // 默认跳到仪表盘
      children: [
        { 
          path: 'dashboard', 
          name: 'Dashboard', 
          component: DashboardHome 
        },
        // 以后可以在这里加 'health', 'doctors' 等路由
        { 
          path: 'settings',  // 对应左侧菜单的 /app/settings
          name: 'Settings', 
          component: SettingsView, 
          meta: { title: '系统设置' } 
        },
        {
          path: 'AIdoctors',
          name: 'AIDoctors',
          component: AiDoctorsView,
          meta: { title: 'AI专家咨询' }
        }
      ]
    }
  ]
})

export default router