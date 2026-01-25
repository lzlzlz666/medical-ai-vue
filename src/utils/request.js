import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

let isRelogging = false

const service = axios.create({
  baseURL: '/api',
  timeout: 5000
})

// === 1. 请求拦截器 (Request) ===
service.interceptors.request.use(
  config => {
    const url = config.url
    // 这里用 startsWith 是安全的
    if (url.startsWith('/admin')) {
      const token = localStorage.getItem('admin_token')
      if (token) config.headers['token'] = token 
    } else if (url.startsWith('/doctor')) {
      const token = localStorage.getItem('doctor_token')
      if (token) config.headers['authorization'] = token
    } else {
      const token = localStorage.getItem('user_token')
      if (token) config.headers['authentication'] = token
    }
    return config
  },
  error => Promise.reject(error)
)

// === 2. 响应拦截器 (Response) ===
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 1) {
      ElMessage.error(res.msg || 'Error')
      return Promise.reject(new Error(res.msg))
    }
    return res.data
  },
  error => {
    if (error.response) {
      const status = error.response.status
      
      // === 处理 401 ===
      if (status === 401) {
        if (!isRelogging) {
          isRelogging = true
          
          // 🔥🔥 核心修复：改用 startsWith 严格匹配路径开头 🔥🔥
          const currentPath = router.currentRoute.value.path
          
          if (currentPath.startsWith('/admin')) {
             // 只有访问 /admin/... 开头的页面才跳管理员登录
             localStorage.removeItem('admin_token')
             localStorage.removeItem('admin_info')
             router.push('/admin/login')
          } else if (currentPath.startsWith('/doctor')) {
             // 只有访问 /doctor/... 开头的页面才跳医生登录
             localStorage.removeItem('doctor_token')
             localStorage.removeItem('doctor_info')
             router.push('/doctor/login')
          } else {
             // 其他情况（包括 /user/doctor 等）统统跳普通用户登录
             localStorage.removeItem('user_token')
             localStorage.removeItem('user_info')
             router.push('/login')
          }
          
          ElMessage.error('登录已过期，请重新登录')

          setTimeout(() => {
            isRelogging = false
          }, 3000)
        }
      } else {
        ElMessage.error(error.message || '系统繁忙')
      }
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }
    return Promise.reject(error)
  }
)

export default service