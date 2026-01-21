import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const service = axios.create({
  baseURL: '/api',
  timeout: 5000
})

// === 1. 请求拦截器：根据 URL 自动挂载不同 Header ===
service.interceptors.request.use(
  config => {
    const url = config.url

    // 🛑 场景 A：管理员接口 (假设后端路径以 /admin 开头)
    if (url.startsWith('/admin')) {
      const token = localStorage.getItem('admin_token')
      if (token) {
        // 后端配置：admin-token-name: token
        config.headers['token'] = token 
      }
    } 
    // 🛑 场景 B：医生接口 (假设后端路径以 /doctor 开头)
    else if (url.startsWith('/doctor')) {
      const token = localStorage.getItem('doctor_token')
      if (token) {
        // 后端配置：doctor-token-name: authorization
        config.headers['authorization'] = token
      }
    }
    // 🛑 场景 C：普通用户接口 (默认)
    else {
      const token = localStorage.getItem('user_token')
      if (token) {
        // 后端配置：user-token-name: authentication
        config.headers['authentication'] = token
      }
    }
    
    return config
  },
  error =>  Promise.reject(error)
)

// === 2. 响应拦截器：处理不同角色的 401 ===
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 1) {
      if (res.code === 401) {
        // 判断是哪个角色过期了，跳回对应的登录页
        const currentPath = router.currentRoute.value.path
        
        if (currentPath.includes('/admin')) {
           localStorage.removeItem('admin_token')
           router.push('/admin/login')
        } else if (currentPath.includes('/doctor')) {
           localStorage.removeItem('doctor_token')
           router.push('/doctor/login') // 假设你有这个页面
        } else {
           localStorage.removeItem('user_token')
           router.push('/login')
        }
        return Promise.reject(new Error('Unauthorized'))
      }
      ElMessage.error(res.msg || 'Error')
      return Promise.reject(new Error(res.msg))
    }
    return res.data
  },
  error => {
    // 处理网络层面的 401 (同上逻辑)
    return Promise.reject(error)
  }
)

export default service