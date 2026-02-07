import request from '@/utils/request'

// 1. 获取会话列表
export function getSessionList() {
  return request({
    url: '/user/consultation/list',
    method: 'get'
  })
}

// 2. 获取指定会话的聊天记录
export function getSessionMessages(sessionId) {
  return request({
    url: `/user/consultation/messages/${sessionId}`,
    method: 'get'
  })
}

// 🔥🔥🔥 获取待审核的临时数据 (用于医生审核) 🔥🔥🔥
export function getTempAuditMessages(sessionId) {
  return request({
    url: `/doctor/consultation/tempAudit/${sessionId}`,
    method: 'get'
  })
}

// 🔥🔥🔥 新增：提交审核结果 (通过/修改) 🔥🔥🔥
// 对应截图接口: PUT /doctor/consultation/audit/{sessionId}?message=...
export function submitAuditResult(sessionId, message) {
  return request({
    url: `/doctor/consultation/audit/${sessionId}`,
    method: 'put',
    params: { 
      message 
    }
  })
}