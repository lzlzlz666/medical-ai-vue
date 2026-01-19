// src/api/user.js
import request from '@/utils/request'

// 登录接口
export function login(data) {
  return request({
    url: '/user/user/login', // 对应你 Postman 里的路径
    method: 'post',
    data // { username, password }
  })
}

// ✅ 新增注册方法
export function register(data) {
  return request({
    url: '/user/user/register', // 对应你 Postman 里的地址
    method: 'post',
    data // 包含 username 和 password
  })
}

// 示例：获取用户信息 (假设你需要)
export function getUserInfo(id) {
  return request({
    url: `/user/user/${id}`,
    method: 'get'
  })
}