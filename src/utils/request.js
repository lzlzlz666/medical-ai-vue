import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router' // 1. 引入路由，用于跳转

const service = axios.create({
  baseURL: '/api',
  timeout: 5000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['authentication'] = token 
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    // 业务逻辑错误处理
    if (res.code !== 1) {
      
      // === 核心修改：处理业务逻辑层面的 401 ===
      if (res.code === 401) {
        ElMessage.error('您还未登录，请先登录')
        // 清除过期 Token 和用户信息
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        // 跳转到登录页
        router.push('/login')
        return Promise.reject(new Error('Unauthorized'))
      }
      
      // 其他错误直接弹窗
      ElMessage.error(res.msg || '系统未知错误')
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      return res.data 
    }
  },
  error => {
    console.error('Request Err:', error)
    let msg = '网络连接失败'
    
    // === 核心修改：处理 HTTP 状态码层面的 401 ===
    if (error.response) {
       switch (error.response.status) {
          case 401: 
            msg = '您还未登录，请先登录'
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            router.push('/login')
            break;
          case 403: msg = '拒绝访问 (403)'; break;
          case 404: msg = '接口地址未找到 (404)'; break;
          case 500: msg = '服务器内部错误 (500)'; break;
          default: msg = error.message;
       }
    }
    
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default service