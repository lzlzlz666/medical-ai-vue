<template>
  <div class="audit-list-container">
    <header class="page-header">
      <div class="header-left">
        <h2 class="title">今日已接收患者</h2>
        <span class="count-badge" v-if="displayList.length > 0">{{ displayList.length }}</span>
      </div>
      <div class="header-right">
        <el-input
          v-model="queryParams.searchQuery"
          placeholder="搜索患者姓名..."
          class="search-input"
          :prefix-icon="Search"
          clearable
          @input="handleLocalSearch"
        />
        <el-date-picker
          v-model="queryParams.queryDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          class="custom-date-picker"
          :clearable="false"
          @change="loadData"
        />
        <el-button circle plain :icon="Refresh" @click="loadData" class="refresh-btn" />
      </div>
    </header>

    <main class="card-list" v-loading="loading">
      <el-row :gutter="24">
        <el-col 
          v-for="item in displayList" 
          :key="item.id" 
          :xs="24" :sm="12" :md="8" :lg="8" :xl="8" 
          class="mb-6"
        >
          <div class="patient-card" @click="goToReview(item)">
            <div class="card-header">
              <div class="user-profile">
                <el-avatar v-if="item.avatar" :size="44" :src="item.avatar" class="avatar-img" />
                <div v-else class="avatar-text" :style="getAvatarStyle(item.name).style">
                  {{ item.name ? item.name.charAt(0) : '患' }}
                </div>
                <div class="user-meta">
                  <div class="name">{{ item.name }}</div>
                  <div class="time">{{ formatTime(item.time) }}</div>
                </div>
              </div>
              
              <div class="status-badge is-accepted">
                <span class="dot"></span>
                <span>已接收</span>
              </div>
            </div>

            <div class="card-body">
              <div class="tags-row">
                <span class="ai-tag">AI 辅助</span>
                <span class="type-tag">咨询摘要</span>
              </div>
              <p class="complaint-content">
                {{ item.complaint || '暂无详细描述信息...' }}
              </p>
            </div>

            <div class="card-footer">
              <div class="status-indicator">
                <el-icon class="icon-success"><CircleCheckFilled /></el-icon>
                <span>AI 建议已就绪</span>
              </div>
              <div class="action-arrow">
                <span>进入审查与修改</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-empty v-if="displayList.length === 0 && !loading" description="暂无符合条件的记录" :image-size="120" />
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, CircleCheckFilled, Refresh, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getDoctorAuditPage } from '@/api/doctor'
import { getTempAuditMessages } from '@/api/consultation'

const router = useRouter()
const loading = ref(false)
const fullList = ref([])
const displayList = ref([])
const today = new Date().toISOString().split('T')[0]

const queryParams = reactive({ page: 1, pageSize: 10000, searchQuery: '', queryDate: today })

// 加载列表逻辑 (保持不变)
const loadData = async () => {
  loading.value = true
  try {
    const res = await getDoctorAuditPage({ page: 1, pageSize: 10000, queryDate: queryParams.queryDate, status: 2 })
    const records = res.records || (res.data && res.data.records) || []
    const mappedList = records.map(item => ({
      id: item.id, 
      userId: item.userId,
      name: item.username || '未知用户',
      avatar: item.avatar,
      complaint: item.aiSummary,
      status: item.status,
      time: item.createTime
    }))
    fullList.value = mappedList
    handleLocalSearch()
  } catch (error) { console.error(error) } finally { loading.value = false }
}

const handleLocalSearch = () => {
  const query = queryParams.searchQuery.trim()
  displayList.value = query ? fullList.value.filter(item => item.name.includes(query)) : fullList.value
}

// 辅助函数
const getAvatarStyle = (name) => {
  if (!name) return { style: { backgroundColor: '#F4F4F5', color: '#909399' } }
  const colors = [{ bg: '#E1F3D8', text: '#67C23A' }, { bg: '#ECF5FF', text: '#409EFF' }, { bg: '#FDF6EC', text: '#E6A23C' }, { bg: '#F2F6FC', text: '#722ED1' }]
  const idx = name.charCodeAt(0) % colors.length
  return { style: { backgroundColor: colors[idx].bg, color: colors[idx].text } }
}
const formatTime = (timeStr) => timeStr ? timeStr.substring(5, 16) : ''

// 跳转逻辑 (保持不变)
const goToReview = async (item) => {
  try {
    const res = await getTempAuditMessages(item.id)
    const messageList = res.data || res
    if (!messageList || messageList.length === 0) {
      ElMessage.warning('暂无详细消息记录')
      return
    }
    router.push({
      name: 'DoctorReview',
      query: { id: item.id, userId: item.userId, name: item.name },
      state: { preloadedMessages: JSON.parse(JSON.stringify(messageList)) }
    })
  } catch (error) {
    console.error(error)
    ElMessage.error('获取详情失败')
  }
}

onMounted(() => { loadData() })
</script>

<style scoped lang="scss">
/* 基础变量 */
$primary: #0052D9;
$success: #00A870;
$bg-color: #F7F8FA;
$text-main: #1D2129;
$text-sub: #86909C;
$card-hover-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);

.audit-list-container {
  min-height: 100vh;
  background-color: $bg-color;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Header 优化 */
.page-header {
  height: 72px;
  background: #fff;
  border-bottom: 1px solid #E5E6EB;
  padding: 0 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .title {
      font-size: 20px;
      font-weight: 600;
      color: $text-main;
      margin: 0;
    }
    .count-badge {
      background: #F2F3F5;
      color: $text-sub;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .search-input { width: 220px; }
    .custom-date-picker { width: 140px; }
    .refresh-btn { border-color: #E5E6EB; &:hover { color: $primary; border-color: $primary; background: #ECF2FE; } }
  }
}

/* 卡片列表容器 */
.card-list {
  padding: 24px 32px;
  
  .mb-6 { margin-bottom: 24px; }
  
  .patient-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #E5E6EB;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    min-height: 250px; /* 最小高度，内容少时也不会太扁 */
    position: relative;
    overflow: hidden;

    &:hover {
      transform: translateY(-4px);
      box-shadow: $card-hover-shadow;
      border-color: $primary;
      
      .action-arrow { color: $primary; transform: translateX(4px); }
    }

    /* 1. 头部：用户信息 + 状态 */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;

      .user-profile {
        display: flex;
        gap: 12px;
        align-items: center;

        .avatar-img { border: 1px solid #F2F3F5; }
        .avatar-text {
          width: 44px; height: 44px;
          border-radius: 50%;
          display: flex; justify-content: center; align-items: center;
          font-weight: 600; font-size: 16px;
        }

        .user-meta {
          .name { font-size: 16px; font-weight: 600; color: $text-main; line-height: 1.4; }
          .time { font-size: 12px; color: $text-sub; margin-top: 2px; }
        }
      }

      /* 🔥 改进后的状态标签 */
      .status-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        
        &.is-accepted {
          background-color: #E8FFEA; /* 极浅绿色背景 */
          color: #00A870;          /* 绿色文字 */
          border: 1px solid #B7F4D3; /* 绿色边框 */
          
          .dot {
            width: 6px; height: 6px; 
            border-radius: 50%; 
            background-color: #00A870;
          }
        }
      }
    }

    /* 2. 中间：内容区 */
    .card-body {
      flex: 1; /* 撑开中间 */
      margin-bottom: 16px;

      .tags-row {
        margin-bottom: 8px;
        display: flex; gap: 8px;
        
        .ai-tag {
          font-size: 11px; font-weight: 600;
          color: $primary; background: #ECF2FE;
          padding: 2px 6px; border-radius: 4px;
        }
        .type-tag {
          font-size: 11px; color: $text-sub;
          background: #F7F8FA; padding: 2px 6px; border-radius: 4px;
        }
      }

      .complaint-content {
        font-size: 14px;
        color: #4E5969;
        line-height: 1.6;
        margin: 0;
        /* 多行截断 */
        display: -webkit-box;
        -webkit-line-clamp: 2; /* 限制2行，自适应高度 */
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    /* 3. 底部：Footer */
    .card-footer {
      padding-top: 16px;
      border-top: 1px solid #F7F8FA;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .status-indicator {
        display: flex; align-items: center; gap: 6px;
        font-size: 12px; color: $text-sub;
        
        .icon-success { color: $success; font-size: 14px; }
      }

      .action-arrow {
        display: flex; align-items: center; gap: 4px;
        font-size: 13px; font-weight: 500; color: $text-sub;
        transition: all 0.3s ease;
      }
    }
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column; align-items: flex-start; height: auto; padding: 16px; gap: 12px;
    .header-right { width: 100%; justify-content: space-between; .search-input { width: 100%; } }
  }
  .card-list { padding: 16px; }
}
</style>