import request from '@/utils/request'

// 新增健康记录
export function addHealthRecord(data) {
  return request({
    url: '/user/healthRecord', // 对应你的 POST 截图
    method: 'post',
    data
  })
}

// 修改健康记录
export function updateHealthRecord(data) {
  return request({
    url: '/user/healthRecord', // 对应你的 PUT 截图
    method: 'put',
    data
  })
}

// 获取健康数据统计
// type: 'last7Days' | 'month'
export const getHealthStatistics = (params) => {
  return request({
    url: '/user/dashboard/statistics',
    method: 'get',
    params
  })
}