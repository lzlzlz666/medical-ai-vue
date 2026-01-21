<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Lock, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 引入 API
import { getUserPage, updateUserStatus, resetUserPassword } from '@/api/user'

// === 1. 搜索参数 ===
const queryForm = reactive({
  keyword: '',
  status: '' // 空字符串代表"全部"
})

// === 2. 表格数据 ===
const loading = ref(false)
const tableData = ref([]) // 初始为空，等待接口加载
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(6)

// === 3. 核心逻辑 ===

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await getUserPage({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: queryForm.keyword || undefined, // 如果为空串，不传给后端
      status: queryForm.status === '' ? undefined : queryForm.status
    })
    // 赋值给表格
    tableData.value = res.records || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取用户列表失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索按钮
const handleSearch = () => {
  currentPage.value = 1 // 搜索时重置到第一页
  loadData()
  ElMessage.success('列表已更新')
}

// 重置按钮
const handleReset = () => {
  queryForm.keyword = ''
  queryForm.status = ''
  handleSearch()
}

// 分页变化 (页码或每页条数变化时触发)
const handlePageChange = () => {
  loadData()
}

// 重置密码逻辑
const handleResetPassword = (row) => {
  ElMessageBox.confirm(`确定要重置用户 "${row.nickname}" 的密码吗？`, '安全警告', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await resetUserPassword(row.id)
      ElMessage.success('密码已重置为默认: 123456')
    } catch (error) {
      console.error(error)
    }
  })
}

// 启用/禁用逻辑
const handleToggleStatus = (row) => {
  const isBan = row.status === 1 // 当前是正常(1)，操作就是禁用(0)
  const targetStatus = isBan ? 0 : 1
  const actionText = isBan ? '禁用' : '启用'

  ElMessageBox.confirm(`确定要${actionText}该账号吗？`, '提示', {
    type: isBan ? 'error' : 'success',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await updateUserStatus(targetStatus, row.id)
      ElMessage.success(`已${actionText}`)
      // 成功后，刷新列表或者直接修改本地数据（为了体验更好，这里直接改本地）
      row.status = targetStatus
    } catch (error) {
      console.error(error)
    }
  })
}

// 初始化加载
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[calc(100vh-140px)]">
    
    <div class="flex flex-col md:flex-row gap-4 mb-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
      <div class="flex items-center gap-2 w-full md:w-auto">
        <span class="text-sm font-bold text-slate-600 w-40">昵称/账号</span>
        <el-input 
          v-model="queryForm.keyword" 
          placeholder="请输入关键词" 
          class="w-64" 
          clearable 
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto">
        <span class="text-sm font-bold text-slate-600 w-40">账号状态</span>
        <el-select 
          v-model="queryForm.status" 
          placeholder="全部状态" 
          class="w-40" 
          clearable
          @change="handleSearch"
        >
          <el-option label="正常" :value="1" />
          <el-option label="已禁用" :value="0" />
        </el-select>
      </div>
      <div class="flex gap-3 ml-auto">
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <el-table 
      :data="tableData" 
      v-loading="loading" 
      style="width: 100%" 
      size="large" 
      header-cell-class-name="!bg-slate-50 !text-slate-700"
    >
      <el-table-column label="头像" width="100" align="center">
        <template #default="scope">
          <el-avatar 
            :src="scope.row.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" 
            :size="40" 
            class="border border-slate-200" 
          />
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="username" 
        label="登录账号" 
        min-width="150" 
        show-overflow-tooltip 
      >
        <template #default="scope">
           <span class="font-bold text-slate-700">{{ scope.row.username }}</span>
        </template>
      </el-table-column>

      <el-table-column 
        prop="nickname" 
        label="昵称" 
        min-width="150" 
        show-overflow-tooltip
      >
        <template #default="scope">
           <span>{{ scope.row.nickname || '未设置昵称' }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="phone" label="手机号" width="150" />
      
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" effect="light" round>
            {{ scope.row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="createTime" label="注册时间" width="180" show-overflow-tooltip />
      
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="scope">
          <el-button link type="primary" :icon="Lock" @click="handleResetPassword(scope.row)">重置密码</el-button>
          <el-button 
            link 
            :type="scope.row.status === 1 ? 'danger' : 'success'" 
            :icon="scope.row.status === 1 ? VideoPause : VideoPlay"
            @click="handleToggleStatus(scope.row)"
          >
            {{ scope.row.status === 1 ? '禁用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end mt-6">
      <el-pagination 
        background 
        layout="total, prev, pager, next, jumper" 
        :total="total" 
        v-model:current-page="currentPage" 
        v-model:page-size="pageSize"
        @current-change="handlePageChange"
        @size-change="handlePageChange"
      />
    </div>
  </div>
</template>