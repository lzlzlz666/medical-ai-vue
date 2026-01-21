// src/api/admin.js
import request from '@/utils/request'

// 登录接口
export function adminLogin(data) {
  return request({
    url: '/admin/admin/login', 
    method: 'post',
    data // { username, password }
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/admin/admin/logout', 
    method: 'post'
  })
}

// 示例：获取用户信息 (假设你需要)
export function getAdminInfo() {
  return request({
    url: '/admin/admin',
    method: 'get'
  })
}

