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