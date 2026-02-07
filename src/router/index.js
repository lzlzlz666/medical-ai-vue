import { createRouter, createWebHistory } from 'vue-router'

// 1. 引入 Pinia Stores (注意：要在 beforeEach 内部调用，或者确保 pinia 实例已挂载)
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'
import { useDoctorStore } from '@/stores/doctor' // 假设你已经创建了这个store

// 2. 引入布局组件
import UserLayout from '@/layout/UserLayout.vue'
import DoctorLayout from '@/layout/DoctorLayout.vue'
import AdminLayout from '@/layout/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ====================================================
    // 1. 公共区域 (无需权限)
    // ====================================================
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    
    // --- 各角色的登录页 ---
    {
      path: '/login',
      name: 'UserLogin',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { title: '用户登录' }
    },
    {
      path: '/admin/login',
      name: 'AdminLogin',
      component: () => import('@/views/auth/AdminLogin.vue'),
      meta: { title: '管理员登录' }
    },
    {
      path: '/doctor/login',
      name: 'DoctorLogin',
      component: () => import('@/views/auth/DoctorLogin.vue'), // 需新建此文件
      meta: { title: '医生工作台登录' }
    },

    // ====================================================
    // 2. 用户端 (User) -> 需要 user_token
    // ====================================================
    {
      path: '/user',
      component: UserLayout,
      redirect: '/user/dashboard',
      meta: { role: 'user' }, // 🔥 标记：这是用户地盘
      children: [
        {
          path: 'dashboard',
          name: 'UserDashboard',
          component: () => import('@/views/user/DashboardHome.vue')
        },
        {
          path: 'ai-consult',
          name: 'AiConsult',
          component: () => import('@/views/user/AiDoctorsView.vue')
        },
        {
          path: 'doctors',
          name: 'Doctors',
          component: () => import('@/views/user/Doctors.vue')
        },
        {
          path: 'report',
          name: 'Report',
          component: () => import('@/views/user/Report.vue')
        },
        {
          path: 'settings',
          name: 'UserSettings',
          component: () => import('@/views/user/SettingsView.vue')
        }
      ]
    },

    // ====================================================
    // 3. 医生端 (Doctor) -> 需要 doctor_token
    // ====================================================
    {
      path: '/doctor',
      component: DoctorLayout,
      redirect: '/doctor/dashboard',
      meta: { role: 'doctor' }, // 🔥 标记：这是医生地盘
      children: [
        {
          path: 'dashboard',
          name: 'DoctorDashboard',
          component: () => import('@/views/doctor/Dashboard.vue')
        },
        {
          path: 'review',
          name: 'DoctorReview',
          component: () => import('@/views/doctor/DoctorReview.vue')
        },
        {
          path: 'doctorApplyList',
          name: 'DoctorApplyList',
          component: () => import('@/views/doctor/DoctorApplyList.vue')
        },
        {
          path: 'audit',
          name: 'DoctorAudit',
          component: () => import('@/views/doctor/DoctorAudit.vue'), // 列表页
          meta: { title: '咨询申请管理' }
        },
        {
          path: 'profile',
          name: 'DoctorProfile',
          component: () => import('@/views/doctor/DoctorProfile.vue')
        },
      ]
    },

    // ====================================================
    // 4. 管理员端 (Admin) -> 需要 admin_token
    // ====================================================
    {
      path: '/admin',
      component: AdminLayout,
      redirect: '/admin/dashboard',
      meta: { role: 'admin' }, // 🔥 标记：这是管理员地盘
      children: [
        {
          path: 'dashboard',
          name: 'AdminDashboard',
          component: () => import('@/views/admin/Dashboard.vue')
        },
        {
          path: 'ragManagement',
          name: 'RagManagement',
          component: () => import('@/views/admin/RagManagement.vue')
        },
        {
          path: 'users', // ✅ 用户管理
          name: 'AdminUsers',
          component: () => import('@/views/admin/Users.vue')
        },
        {
          path: 'depts', // ✅ 科室管理
          name: 'AdminDepts',
          component: () => import('@/views/admin/Depts.vue')
        },
        {
          path: 'doctors', // ✅ 医生管理
          name: 'AdminDoctors',
          component: () => import('@/views/admin/Doctors.vue')
        },
        {
          path: 'profile', // ✅ 医生管理
          name: 'AdminProfile',
          component: () => import('@/views/admin/Settings.vue')
        }

      ]
    }
  ]
})

// ====================================================
// 🚀 全局路由守卫 (核心逻辑)
// ====================================================
router.beforeEach((to, from, next) => {
  // 在守卫内部获取 Store，防止 Pinia 未挂载报错
  const adminStore = useAdminStore()
  const doctorStore = useDoctorStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - MediCare+`
  }

  // 1. 获取目标路由需要的角色权限
  // (matched 数组包含了从父路由到子路由的所有 meta 信息)
  // 我们只需要看父级路由有没有定义 role 即可
  const requiredRole = to.meta.role || (to.matched[0] && to.matched[0].meta.role)

  // ----------------------------------------------------
  // 场景 A: 访问管理员页面 (/admin/*)
  // ----------------------------------------------------
  if (requiredRole === 'admin') {
    if (!adminStore.token) {
      // 没证件 -> 踢到管理员登录页
      return next('/admin/login')
    }
    return next()
  }

  // ----------------------------------------------------
  // 场景 B: 访问医生页面 (/doctor/*)
  // ----------------------------------------------------
  if (requiredRole === 'doctor') {
    if (!doctorStore.token) {
      // 没证件 -> 踢到医生登录页
      return next('/doctor/login')
    }
    return next()
  }

  // 其他情况直接放行 (如首页 / )
  next()
})

export default router