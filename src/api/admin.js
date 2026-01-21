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

// 示例：获取管理员信息 (假设你需要)
export function getAdminInfo() {
  return request({
    url: '/admin/admin',
    method: 'get'
  })
}

// 1. 获取当前登录员工的个人信息
export function getAdminProfile() {
  return request({
    url: '/admin/admin',
    method: 'get'
  })
}

// 2. 修改个人基础信息 (昵称、头像)
export function updateAdminProfile(data) {
  return request({
    url: '/admin/admin/profile',
    method: 'put',
    data // { nickname, avatar }
  })
}

// 3. 修改密码
export function updateAdminPassword(data) {
  return request({
    url: '/admin/admin/editPassword',
    method: 'put',
    data // { oldPassword, newPassword }
  })
}

// 4. 文件上传 (头像)
// 注意：通常建议用 el-upload 的 action 直接调，但如果你想手动调也可以用这个
export function uploadFile(formData) {
  return request({
    url: '/admin/common/upload',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  })
}

