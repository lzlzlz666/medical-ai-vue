import request from '@/utils/request'

// 获取仪表盘统计数据 (医生数、科室数、图表数据)
// 参数 type: 'last7Days' 或 'last30Days'
export function getDashboardStatistics(type) {
  return request({
    url: '/admin/dashboard/statistics',
    method: 'get',
    params: { type }
  })
}

// 1. 获取近30天健康数据 
export function getHealthStatistics(params) {
  return request({
    url: '/user/dashboard/statistics',
    method: 'get',
    params: params
  })
}
// 2. 生成 AI 报告 
export function generateAiReport(data) {
  return request({
    url: '/user/ai/report',
    method: 'post',
    data, // { chatId, message, enableDeepThinking, enableRAG }
    timeout: 60000
  })
}