<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 引入 API
import { getDeptPage, addDept, updateDept, deleteDept } from '@/api/department'

// === 1. 表格与查询数据 ===
const loading = ref(false)
const keyword = ref('') // 搜索关键词
const tableData = ref([]) // 表格数据
const total = ref(0) // 总条数
const currentPage = ref(1)
const pageSize = ref(10)

// === 2. 弹窗与表单数据 ===
const dialogVisible = ref(false)
const dialogTitle = ref('') // '新增科室' 或 '编辑科室'
const formRef = ref(null)

const formData = reactive({
  id: undefined,
  name: '',
  intro: ''
})

// 表单校验规则
const rules = {
  name: [{ required: true, message: '请输入科室名称', trigger: 'blur' }],
  intro: [{ required: true, message: '请输入科室简介', trigger: 'blur' }]
}

// === 3. 核心方法 ===

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await getDeptPage({
      page: currentPage.value,
      pageSize: pageSize.value,
      name: keyword.value || undefined // 如果为空传 undefined
    })
    // 假设后端返回结构是 { total: 10, records: [...] }
    // 如果是 PageHelper 默认结构，可能是 res.list 或 res.rows
    // 这里按你之前提供的 PageResult 结构：res.records
    tableData.value = res.records || [] 
    total.value = res.total || 0
  } catch (error) {
    console.error('加载失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 打开弹窗 (新增/编辑)
const openDialog = (type, row = null) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'add' ? '新增科室' : '编辑科室'
  
  // 重置表单
  if (type === 'add') {
    formData.id = undefined
    formData.name = ''
    formData.intro = ''
  } else {
    // 编辑模式：回显数据
    formData.id = row.id
    formData.name = row.name
    formData.intro = row.intro
  }
  
  // 清除校验状态
  setTimeout(() => {
    formRef.value?.clearValidate()
  }, 0)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.id) {
          // 有 ID 是修改
          await updateDept(formData)
          ElMessage.success('修改成功')
        } else {
          // 无 ID 是新增
          await addDept(formData)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false // 关闭弹窗
        loadData() // 刷新列表
      } catch (error) {
        console.error(error)
      }
    }
  })
}

// 删除逻辑
const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除 "${row.name}" 吗？此操作不可恢复。`, '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--danger',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDept(row.id)
      ElMessage.success('删除成功')
      // 如果当前页只有一条数据且删除了，往前跳一页
      if (tableData.value.length === 1 && currentPage.value > 1) {
        currentPage.value--
      }
      loadData()
    } catch (error) {
      console.error(error)
    }
  })
}

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div class="flex items-center gap-4 w-1/2">
        <el-input 
          v-model="keyword" 
          placeholder="搜索科室名称..." 
          size="large"
          class="max-w-md"
          :prefix-icon="Search"
          clearable 
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button @click="handleSearch">搜索</el-button>
      </div>
      <el-button type="primary" size="large" :icon="Plus" class="!px-6 !font-bold" @click="openDialog('add')">
        新增科室
      </el-button>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <el-table 
        v-loading="loading"
        :data="tableData" 
        style="width: 100%" 
        size="large" 
        header-cell-class-name="!bg-slate-50 !text-slate-800 !font-bold"
      >
        <el-table-column prop="name" label="科室名称" width="200" class-name="font-bold text-slate-700" />
        
        <el-table-column prop="intro" label="科室简介" show-overflow-tooltip />
        
        <el-table-column prop="createTime" label="创建时间" width="200" />
        
        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-tooltip content="编辑" placement="top">
              <el-button type="primary" link :icon="Edit" class="!text-xl mr-2" @click="openDialog('edit', scope.row)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button type="danger" link :icon="Delete" class="!text-xl" @click="handleDelete(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <div class="p-4 border-t border-slate-100 flex justify-end">
        <el-pagination 
          background
          layout="total, prev, pager, next, jumper" 
          :total="total" 
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      align-center
      destroy-on-close
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px" class="mt-4">
        <el-form-item label="科室名称" prop="name">
          <el-input v-model="formData.name" placeholder="例如：心血管内科" />
        </el-form-item>
        <el-form-item label="科室简介" prop="intro">
          <el-input 
            v-model="formData.intro" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入该科室的主治方向和职能介绍..." 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认提交</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>