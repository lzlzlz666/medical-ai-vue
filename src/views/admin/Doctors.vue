<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus, Refresh, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 引入 API
import { getDoctorPageByAdmin, addDoctor, updateDoctor, updateDoctorStatus } from '@/api/doctor'
import { getDepartmentsByAdmin } from '@/api/department' 

// === 1. 搜索与分页数据 ===
const searchForm = reactive({
  realName: '',
  deptId: '',
  workStatus: '', // 在线状态 (1在线 0离线)
  status: ''      // 账号状态 (1启用 0禁用)
})

const loading = ref(false)
const tableData = ref([])
const deptList = ref([]) 
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(8)

// === 2. 弹窗表单数据 ===
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const isSubmitting = ref(false)

// 提取 Token，防止在 template 中直接调用 localStorage 报错
const uploadHeaders = {
  token: localStorage.getItem('admin_token')
}

const formData = reactive({
  id: undefined,
  username: '', 
  realName: '', 
  deptId: '',   
  title: '',    
  maxDailyAudit: 30, 
  avatar: '',   
  intro: ''     
})

const rules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择所属科室', trigger: 'change' }],
  title: [{ required: true, message: '请选择或输入职称', trigger: 'change' }] 
}

// === 3. 核心逻辑 ===

const loadDepts = async () => {
  try {
    const res = await getDepartmentsByAdmin() 
    deptList.value = res || []
  } catch (error) {
    console.error(error)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getDoctorPageByAdmin({
      page: currentPage.value,
      pageSize: pageSize.value,
      realName: searchForm.realName || undefined,
      deptId: searchForm.deptId || undefined,
      // 传递在线状态
      workStatus: searchForm.workStatus === '' ? undefined : searchForm.workStatus,
      // 传递账号状态
      status: searchForm.status === '' ? undefined : searchForm.status
    })
    tableData.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
  ElMessage.success('列表已更新')
}

const handleReset = () => {
  searchForm.realName = ''
  searchForm.deptId = ''
  searchForm.workStatus = ''
  searchForm.status = '' 
  handleSearch()
}

const openDialog = (type, row = null) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'add' ? '新增医生' : '编辑医生信息'
  
  if (type === 'add') {
    formData.id = undefined
    formData.username = ''
    formData.realName = ''
    formData.deptId = ''
    formData.title = '主治医师'
    formData.maxDailyAudit = 30
    formData.avatar = ''
    formData.intro = ''
  } else {
    formData.id = row.id
    formData.username = row.username
    formData.realName = row.realName
    formData.deptId = row.deptId
    formData.title = row.title
    formData.maxDailyAudit = row.maxDailyAudit
    formData.avatar = row.avatar
    formData.intro = row.intro
  }
  
  setTimeout(() => formRef.value?.clearValidate(), 0)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true
      try {
        if (formData.id) {
          await updateDoctor(formData)
          ElMessage.success('修改成功')
        } else {
          await addDoctor(formData)
          ElMessage.success('新增成功，默认密码 123456')
        }
        dialogVisible.value = false
        loadData()
      } catch (error) {
        console.error(error)
      } finally {
        isSubmitting.value = false
      }
    }
  })
}

const handleToggle = (row) => {
  const targetStatus = row.status === 1 ? 0 : 1
  const actionText = row.status === 1 ? '禁用' : '启用'
  
  ElMessageBox.confirm(`确定要${actionText}该医生账号吗？`, '提示', {
    type: row.status === 1 ? 'error' : 'success',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await updateDoctorStatus(targetStatus, row.id)
      ElMessage.success(`已${actionText}`)
      row.status = targetStatus 
    } catch (e) {
      console.error(e)
    }
  })
}

const handleAvatarSuccess = (response) => {
  if (response.code === 1) {
    formData.avatar = response.data
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

onMounted(() => {
  loadDepts()
  loadData()
})
</script>

<template>
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[calc(100vh-140px)] flex flex-col">
    
    <div class="flex flex-wrap items-center gap-4 mb-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
      <div class="w-48">
        <el-input 
          v-model="searchForm.realName" 
          placeholder="搜索医生姓名..." 
          :prefix-icon="Search" 
          clearable 
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="w-40">
        <el-select 
          v-model="searchForm.deptId" 
          placeholder="所属科室" 
          clearable
          @change="handleSearch"
        >
          <el-option 
            v-for="dept in deptList" 
            :key="dept.id" 
            :label="dept.name" 
            :value="dept.id" 
          />
        </el-select>
      </div>

      <div class="w-32">
        <el-select 
          v-model="searchForm.workStatus" 
          placeholder="在线状态" 
          clearable
          @change="handleSearch"
        >
          <el-option label="在线" :value="1" />
          <el-option label="离线" :value="0" />
        </el-select>
      </div>

      <div class="w-32">
        <el-select 
          v-model="searchForm.status" 
          placeholder="账号状态" 
          clearable
          @change="handleSearch"
        >
          <el-option label="已启用" :value="1" />
          <el-option label="已禁用" :value="0" />
        </el-select>
      </div>
      
      <div class="ml-auto flex gap-3">
        <el-button type="primary" :icon="Plus" class="!px-6 !font-bold" @click="openDialog('add')">新增医生</el-button>
        <el-button :icon="Refresh" circle @click="handleReset" />
      </div>
    </div>

    <el-table 
      :data="tableData" 
      v-loading="loading" 
      style="width: 100%" 
      class="flex-1" 
      header-cell-class-name="!bg-[#F8FAFC] !text-slate-600"
    >
      <el-table-column label="头像" width="80" align="center">
        <template #default="scope">
          <div class="relative inline-block">
            <el-avatar :src="scope.row.avatar" :size="36" />
            <span 
              class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
              :class="scope.row.workStatus === 1 ? 'bg-green-500' : 'bg-red-500'"
            ></span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="realName" label="姓名" class-name="font-bold text-slate-800" />
      <el-table-column prop="title" label="职称" />
      
      <el-table-column label="所属科室" min-width="120">
        <template #default="scope">
          <el-tag effect="light" round class="!bg-blue-50 !text-blue-600 !border-blue-100">
            {{ scope.row.deptName || '暂无科室' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="maxDailyAudit" label="每日审核上限" align="center" width="120" />
      
      <el-table-column label="状态" width="120">
        <template #default="scope">
          <div class="flex items-center gap-1.5">
            <span :class="['w-2 h-2 rounded-full', scope.row.status === 1 ? 'bg-green-500' : 'bg-slate-300']"></span>
            <span :class="scope.row.status === 1 ? 'text-green-600 font-bold' : 'text-slate-400'">
              {{ scope.row.status === 1 ? '已启用' : '已禁用' }}
            </span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip />
      
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button link type="primary" class="!font-bold" @click="openDialog('edit', scope.row)">编辑</el-button>
          <el-divider direction="vertical" />
          <el-button 
            link 
            :type="scope.row.status === 1 ? 'danger' : 'success'" 
            class="!font-bold"
            @click="handleToggle(scope.row)"
          >
            {{ scope.row.status === 1 ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="mt-6 flex justify-end">
      <el-pagination 
        background 
        layout="total, prev, pager, next, jumper" 
        :total="total" 
        v-model:current-page="currentPage" 
        v-model:page-size="pageSize"
        @current-change="loadData"
        @size-change="loadData"
      />
    </div>

    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="600px" 
      destroy-on-close
      align-center
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" class="mt-4">
        
        <el-form-item label="医生头像" prop="avatar">
          <el-upload
            class="avatar-uploader"
            action="/api/admin/common/upload" 
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            name="file" 
            :headers="uploadHeaders" 
          >
            <img v-if="formData.avatar" :src="formData.avatar" class="w-20 h-20 rounded-xl object-cover border" />
            <el-icon v-else class="w-20 h-20 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-colors flex items-center justify-center text-2xl"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="登录账号" prop="username">
            <el-input v-model="formData.username" placeholder="用于登录系统" :disabled="!!formData.id" />
          </el-form-item>
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="formData.realName" placeholder="例如：张三" />
          </el-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="所属科室" prop="deptId">
            <el-select v-model="formData.deptId" placeholder="请选择" class="w-full">
              <el-option v-for="dept in deptList" :key="dept.id" :label="dept.name" :value="dept.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="职称" prop="title">
            <el-select v-model="formData.title" placeholder="请选择" class="w-full" allow-create filterable>
              <el-option label="主任医师" value="主任医师" />
              <el-option label="副主任医师" value="副主任医师" />
              <el-option label="主治医师" value="主治医师" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="每日审核" prop="maxDailyAudit">
          <el-input-number v-model="formData.maxDailyAudit" :min="0" :max="1000" />
          <span class="text-xs text-slate-400 ml-2">单日最大处理 AI 诊断数量</span>
        </el-form-item>

        <el-form-item label="简介" prop="intro">
          <el-input v-model="formData.intro" type="textarea" :rows="3" placeholder="医生个人简介..." />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="isSubmitting" @click="handleSubmit">确认提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>