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

// 分页查询医生列表（用户的操作）
// 参数 params: { page, pageSize, realName, deptId, workStatus }
export function getDoctorPage(params) {
  return request({
    url: '/user/doctor/page',
    method: 'get',
    params // axios 会自动把对象拼接到 URL ?page=1&...
  })
}

// 1. 分页查询医生（管理员的操作）
export function getDoctorPageByAdmin(params) {
  return request({
    url: '/admin/doctor/page',
    method: 'get',
    params // { page, pageSize, realName, deptId }
  })
}

// 2. 新增医生
export function addDoctor(data) {
  return request({
    url: '/admin/doctor',
    method: 'post',
    data // { username, realName, deptId, title, maxDailyAudit, avatar, intro }
  })
}

// 3. 修改医生
export function updateDoctor(data) {
  return request({
    url: '/admin/doctor',
    method: 'put',
    data // 包含 id
  })
}

// 4. 启用/禁用
export function updateDoctorStatus(status, id) {
  return request({
    url: `/admin/doctor/status/${status}`,
    method: 'post',
    params: { id }
  })
}

// 5. 文件上传 (头像)
// 注意：ElementPlus 的 Upload 组件通常自带 request 逻辑，但如果我们要手动调用，可以用这个
export function uploadFile(formData) {
  return request({
    url: '/admin/common/upload',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  })
}

// 3. (保留) 申请审核逻辑
// export function applyAudit(data) {
//   return request({
//     url: '/user/consultation/audit', // 假设的后端接口
//     method: 'post',
//     data
//   })
// }
