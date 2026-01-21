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

// 退出登录
export function logout() {
  return request({
    url: '/user/user/logout', // 注意：要和你后端 Controller 的完整路径一致
    method: 'post'
  })
}

// 示例：获取用户信息 (假设你需要)
export function getUserInfo() {
  return request({
    url: '/user/user',
    method: 'get'
  })
}

// 获取个人详细信息（包含今日健康状态）
export function getUserProfile() {
  return request({
    url: '/user/user/profile', // 对应你的 GET 截图
    method: 'get'
  })
}

// 修改个人信息 (假设接口, 根据你的后端习惯通常是 PUT /user/user)
export function updateUserProfile(data) {
  return request({
    url: '/user/user', 
    method: 'put',
    data
  })
}

// 修改密码
export function updateUserPassword(data) {
  return request({
    url: '/user/user/password', // 对应你截图里的接口地址
    method: 'put',
    data
  })
}

// 上传文件接口
export function uploadFile(data) {
  return request({
    url: '/user/common/upload', // 对应你后端的接口
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' }, // 这一行很关键，告诉 axios 这是文件上传
    data
  })
}

// 1. 分页查询用户
// 后端参数: page, pageSize, keyword, status
export function getUserPage(params) {
  return request({
    url: '/admin/user/page',
    method: 'get',
    params
  })
}

// 2. 启用/禁用用户
// 后端接口: @PostMapping("/status/{status}")  参数 id 用 param 传
export function updateUserStatus(status, id) {
  return request({
    url: `/admin/user/status/${status}`,
    method: 'post',
    params: { id }
  })
}

// 3. 重置密码
// 后端接口: @PutMapping("/resetPassword")
export function resetUserPassword(id) {
  return request({
    url: '/admin/user/resetPassword',
    method: 'put',
    params: { id }
  })
}