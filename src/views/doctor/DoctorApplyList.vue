<template>
  <div class="consultation-manage-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">患者咨询申请管理</h2>
        <span class="quota-tag">
          <span class="dot"></span> 今日待处理: {{ pendingCount }}
        </span>
      </div>
      <div class="header-right">
        <el-date-picker
          v-model="queryParams.queryDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="custom-date-picker"
          :clearable="false"
          @change="handleSearch"
        />
        
        <div class="status-filter">
          <span 
            v-for="tab in tabs" 
            :key="tab.value"
            :class="['filter-item', { active: queryParams.status === tab.value }]"
            @click="handleTabChange(tab.value)"
          >
            {{ tab.label }}
          </span>
        </div>
      </div>
    </div>

    <div class="table-card">
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        :header-cell-style="{ background: '#FAFAFA', color: '#606266', fontWeight: 'bold' }"
        size="large"
        v-loading="loading"
        @row-click="handleRowClick"
        class="clickable-table"
      >
        <el-table-column label="患者姓名" min-width="140">
          <template #default="{ row }">
            <div class="patient-cell">
              <img v-if="row.avatar" :src="row.avatar" class="avatar-img" alt="头像" />
              <div v-else class="avatar-text" :style="getAvatarStyle(row.username).style">
                {{ row.username ? row.username.charAt(0) : '患' }}
              </div>
              <span class="name">{{ row.username || '未知用户' }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="aiSummary" label="咨询摘要" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.aiSummary || '暂无摘要' }}
          </template>
        </el-table-column>

        <el-table-column prop="updateTime" label="申请时间" min-width="180" />

        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <div class="status-badge" :class="getStatusClass(row.status)">
              {{ getStatusText(row.status) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" align="right">
          <template #default="{ row }">
            <div v-if="row.status === 1" class="action-group" @click.stop>
              <el-tooltip 
                :content="isToday(row.updateTime) ? '接收申请' : '仅能处理当天的申请'" 
                placement="top"
                :disabled="isToday(row.updateTime)"
              >
                <span>
                  <el-button 
                    link 
                    type="primary" 
                    class="btn-action" 
                    :disabled="!isToday(row.updateTime)"
                    @click="handleAccept(row)"
                  >
                    接受
                  </el-button>
                </span>
              </el-tooltip>

              <el-tooltip 
                :content="isToday(row.updateTime) ? '拒绝申请' : '仅能处理当天的申请'" 
                placement="top" 
                :disabled="isToday(row.updateTime)"
              >
                <span>
                  <el-button 
                    link 
                    type="danger" 
                    class="btn-action" 
                    :disabled="!isToday(row.updateTime)"
                    @click="handleReject(row)"
                  >
                    拒绝
                  </el-button>
                </span>
              </el-tooltip>
            </div>
            
            <div v-else class="processed-text">
              <span v-if="row.status === 2" class="text-accepted">已接收</span>
              <span v-if="row.status === 3" class="text-rejected">已拒绝</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-footer">
        <span class="page-info">共 {{ total }} 条记录</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="queryParams.pageSize"
          v-model:current-page="queryParams.page"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDoctorAuditPage, auditConsultation } from '@/api/doctor'

const router = useRouter()
const loading = ref(false)
const total = ref(0)
const tableData = ref([])

const queryParams = reactive({
  queryDate: new Date().toISOString().split('T')[0],
  status: 1,
  page: 1,
  pageSize: 10
})

const tabs = [
  { label: '全部', value: null },
  { label: '待处理', value: 1 },
  { label: '已处理', value: 2 } 
]

const pendingCount = computed(() => {
  return tableData.value.filter(item => item.status === 1).length
})

// 🔥🔥🔥 新增：判断日期是否是今天 🔥🔥🔥
const isToday = (dateStr) => {
  if (!dateStr) return false
  // 兼容 "2026-02-06 17:14" 或 "2026-02-06"
  const inputDate = new Date(dateStr)
  const today = new Date()

  return inputDate.getFullYear() === today.getFullYear() &&
         inputDate.getMonth() === today.getMonth() &&
         inputDate.getDate() === today.getDate()
}

const loadData = async () => {
  loading.value = true
  try {
    let apiParams = { ...queryParams }
    if (queryParams.status === 2) {
      apiParams.status = null 
    }

    const res = await getDoctorAuditPage(apiParams)
    
    const recordsData = res.records || (res.data && res.data.records) || []
    const totalCount = res.total || (res.data && res.data.total) || 0

    if (recordsData) {
      // 过滤 status=0
      let records = recordsData.filter(item => item.status !== 0)

      // 筛选已处理 (2和3)
      if (queryParams.status === 2) {
        records = records.filter(item => item.status === 2 || item.status === 3)
      }

      tableData.value = records
      total.value = totalCount
    }
  } catch (error) {
    console.error('加载失败', error)
  } finally {
    loading.value = false
  }
}

// 样式与文案辅助函数
const getStatusText = (status) => {
  if (status === 1) return '待审核'
  if (status === 2 || status === 3) return '已审核'
  return '未知'
}

const getStatusClass = (status) => {
  if (status === 1) return 'status-pending'
  if (status === 2 || status === 3) return 'status-audited'
  return ''
}

const getAvatarStyle = (name) => {
  if (!name) return { style: { backgroundColor: '#F4F4F5', color: '#909399' } }
  const colors = [
    { bg: '#E1F3D8', text: '#67C23A' }, 
    { bg: '#ECF5FF', text: '#409EFF' },
    { bg: '#FDF6EC', text: '#E6A23C' },
    { bg: '#F2F6FC', text: '#722ED1' }
  ]
  const idx = name.charCodeAt(0) % colors.length
  return { style: { backgroundColor: colors[idx].bg, color: colors[idx].text } }
}

const handleSearch = () => { queryParams.page = 1; loadData() }
const handleTabChange = (val) => { queryParams.status = val; queryParams.page = 1; loadData() }
const handlePageChange = (val) => { queryParams.page = val; loadData() }

// 跳转详情页
const goToReview = (row) => {
  router.push({
    name: 'DoctorReview', 
    query: {
      id: row.id,
      name: row.username || '患者',
      userId: row.userId,
      avatar: row.avatar
    }
  })
}

const handleRowClick = (row) => {
  if (row.status === 1) {
    // 只有今天是待审核状态，且是今天的单子，才建议跳转去处理
    // 不过查看详情一般允许查看历史，这里不做拦截，仅拦截操作按钮
    goToReview(row)
  }
}

// 🔥🔥🔥 修改：接收操作 (增加日期校验) 🔥🔥🔥
const handleAccept = async (row) => {
  if (!isToday(row.updateTime)) {
    ElMessage.warning('只能处理当天的咨询申请')
    return
  }

  try {
    await auditConsultation({ userId: row.userId, status: 2 })
    ElMessage.success('已成功接收')
    goToReview(row)
  } catch (e) {
    console.error('接受失败', e)
  }
}

// 🔥🔥🔥 修改：拒绝操作 (增加日期校验) 🔥🔥🔥
const handleReject = (row) => {
  if (!isToday(row.updateTime)) {
    ElMessage.warning('只能处理当天的咨询申请')
    return
  }

  ElMessageBox.confirm(
    `确定拒绝 ${row.username} 的申请吗？`,
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    try {
      await auditConsultation({ userId: row.userId, status: 3 })
      ElMessage.success('操作成功')
      loadData()
    } catch (e) { console.error(e) }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
/* 样式保持不变 */
.consultation-manage-container {
  padding: 24px;
  background-color: #F5F7FA;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.clickable-table { cursor: pointer; }

/* Header */
.page-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
  .header-left {
    display: flex; align-items: center; gap: 16px;
    .page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
    .quota-tag {
      background-color: #F0F9EB; color: #67C23A; font-size: 13px; padding: 4px 12px; border-radius: 14px; border: 1px solid #E1F3D8;
      display: flex; align-items: center; gap: 6px;
      .dot { width: 6px; height: 6px; background-color: #67C23A; border-radius: 50%; }
    }
  }
  .header-right {
    display: flex; align-items: center; gap: 16px;
    .custom-date-picker { width: 140px; :deep(.el-input__wrapper) { border-radius: 4px; } }
    .status-filter {
      background-color: #fff; border: 1px solid #DCDFE6; border-radius: 4px; display: flex; overflow: hidden;
      .filter-item {
        padding: 6px 16px; font-size: 14px; color: #606266; cursor: pointer; transition: all 0.3s; border-right: 1px solid #DCDFE6;
        &:last-child { border-right: none; }
        &:hover { color: #409EFF; }
        &.active { background-color: #ECF5FF; color: #409EFF; font-weight: 500; }
      }
    }
  }
}

/* Table Card */
.table-card {
  background: #fff; border-radius: 8px; border: 1px solid #EBEEF5; overflow: hidden;
  :deep(.el-table__inner-wrapper::before) { display: none; }
  :deep(.el-table .el-table__cell) { padding: 16px 0; }
}

/* Patient Cell */
.patient-cell {
  display: flex; align-items: center; gap: 12px;
  .avatar-img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #EBEEF5; }
  .avatar-text { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; }
  .name { font-weight: 500; color: #303133; font-size: 15px; }
}

/* Status Styles */
.status-badge {
  display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 13px;
  &.status-pending { background-color: #FDF6EC; color: #E6A23C; border: 1px solid #FAECD8; }
  &.status-audited { background-color: #F0F9EB; color: #67C23A; border: 1px solid #E1F3D8; }
}

/* Action & Footer */
.action-group .btn-action { font-size: 14px; margin-left: 12px; &:first-child { margin-left: 0; } }

.processed-text { 
  font-size: 14px; font-style: normal; padding-right: 12px; 
  .text-accepted { color: #18b069; font-weight: 500; } 
  .text-rejected { color: #a10d0d; font-weight: 500; } 
}

.pagination-footer {
  padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #EBEEF5;
  .page-info { font-size: 13px; color: #909399; }
  :deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #0052D9; }
}
</style>