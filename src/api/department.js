import request from '@/utils/request'

// 1. 分页查询科室
export function getDeptPage(params) {
  return request({
    url: '/admin/department/page',
    method: 'get',
    params // { page, pageSize, name }
  })
}

// 2. 新增科室
export function addDept(data) {
  return request({
    url: '/admin/department',
    method: 'post',
    data // { name, intro }
  })
}

// 3. 修改科室
export function updateDept(data) {
  return request({
    url: '/admin/department',
    method: 'put',
    data // { id, name, intro }
  })
}

// 4. 删除科室
export function deleteDept(id) {
  return request({
    url: '/admin/department',
    method: 'delete',
    params: { id } // 后端是用 @RequestParam 接收，所以是 params
  })
}

// 5. 根据ID查询 (可选，表格里如果数据全，可以直接用行数据回显)
export function getDeptById(id) {
  return request({
    url: `/admin/department/${id}`,
    method: 'get'
  })
}

// 1. 获取所有科室列表
export function getDepartments() {
  return request({
    url: '/user/department',
    method: 'get'
  })
}

// 1. 获取所有科室列表
export function getDepartmentsByAdmin() {
  return request({
    url: '/admin/department',
    method: 'get'
  })
}