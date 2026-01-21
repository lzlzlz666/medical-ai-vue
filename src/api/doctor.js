// src/api/doctor.js
import request from '@/utils/request'

// 登录接口
export function doctorLogin(data) {
  return request({
    url: '/doctor/doctor/login', 
    method: 'post',
    data // { username, password }
  })
}

// 退出登录
export function logout() {
  return request({
    url: '/doctor/doctor/logout', 
    method: 'post'
  })
}

// 示例：获取用户信息 (假设你需要)
export function getDoctorInfo() {
  return request({
    url: '/doctor/doctor',
    method: 'get'
  })
}

