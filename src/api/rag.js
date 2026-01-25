import request from '@/utils/request'

// 1. 获取 Markdown 文件列表
export function getRagFileList() {
  return request({
    url: '/admin/common/rag/mds',
    method: 'get'
  })
}

// 2. 上传 Markdown 文件
// 注意：这个通常用 el-upload 的 http-request 或者 action 处理，
// 但如果需要手动调用，可以封装如下
export function uploadRagFile(formData) {
  return request({
    url: '/admin/common/upload/rag',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  })
}

// 3. 删除 Markdown 文件
export function deleteRagFile(filename) {
  return request({
    url: '/admin/common/rag/mds',
    method: 'delete',
    params: { filename }
  })
}