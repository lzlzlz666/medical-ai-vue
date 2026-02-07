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

//申请专家审核
export function applyDoctorAudit(doctorId) {
  return request({
    url: `/user/doctor/apply/${doctorId}`,
    method: 'post'
  })
}


/**
 * 取消问诊/申请
 * 对应后端: @DeleteMapping("/cancel")
 * @param {Number|String} doctorId 医生ID
 */
export function cancelDoctorAudit(doctorId) {
  return request({
    url: '/user/consultation/cancel', 
    method: 'delete',
    params: {
      doctorId: doctorId
    }
  })
}

// 分页获取审核列表
// 后端参数: { queryDate: "yyyy-MM-dd", status: 1, page: 1, pageSize: 10 }
export function getDoctorAuditPage(data) {
  return request({
    url: '/doctor/user/page', // 根据你的截图 URL 填写
    method: 'post', // 截图有 Body，通常是 POST
    data // data 会被序列化为 JSON body
  })
}

/**
 * 处理患者咨询 (接收/拒绝)
 * 后端: @PutMapping("/doctor/user/process")
 * 参数: processId (2=接收, 3=拒绝), userId (用户ID)
 */
export function auditConsultation(params) {
  return request({
    url: '/doctor/user/process', // 修改为真实路径
    method: 'put',               // 修改为 PUT
    params: {                    // 使用 params (Query String)
      processId: params.status,  // 前端传过来的 status (2或3) 映射给 processId
      userId: params.userId      // 前端传过来的 userId
    }
  })
}