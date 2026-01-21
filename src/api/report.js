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