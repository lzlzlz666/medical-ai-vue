<template>
  <div class="doctor-review-container" v-loading="pageLoading">
    <header class="review-header">
      <div class="header-left-group">
        <el-button link class="back-btn" @click="goBack">
          <el-icon :size="22" color="#303133"><ArrowLeft /></el-icon>
        </el-button>
        <div class="patient-info">
          <span class="label">当前审核患者：</span>
          <h2 class="name">{{ patientName }}</h2>
          <span class="meta">ID: {{ route.query.userId }}</span>
        </div>
      </div>
      <div class="header-actions">
        <el-button link :icon="Clock">历史病历</el-button>
      </div>
    </header>

    <main class="review-main">
      <div class="panel-layout">
        <section class="left-panel">
          <div class="panel-title">
            <div class="title-left">
              <el-icon class="icon-chat"><ChatDotSquare /></el-icon>
              <span>患者咨询内容</span>
            </div>
            <span class="time-label" v-if="lastMsgTime">提交时间: {{ lastMsgTime }}</span>
          </div>

          <el-card shadow="never" class="content-card">
            <div v-if="userTexts.length > 0" class="section-block">
              <h4 class="sub-title">患者描述</h4>
              <div v-for="(text, idx) in userTexts" :key="'txt'+idx" class="text-body mb-3">
                {{ text }}
              </div>
            </div>
            
            <div v-if="userImages.length > 0" class="section-block">
              <h4 class="sub-title">上传资料</h4>
              <div class="image-grid">
                <div v-for="(img, idx) in userImages" :key="'img'+idx" class="image-wrapper">
                  <el-image 
                    :src="img" 
                    :preview-src-list="userImages"
                    :initial-index="idx"
                    fit="cover" 
                    class="upload-img"
                  />
                </div>
              </div>
            </div>

            <el-empty v-if="userTexts.length === 0 && userImages.length === 0" description="无用户输入内容" :image-size="60" />
          </el-card>
        </section>

        <section class="right-panel">
          <div class="panel-title">
            <div class="title-left">
              <el-icon class="icon-ai"><MagicStick /></el-icon>
              <span>AI 建议回复</span>
            </div>
            <div class="ai-meta">
              <el-tag type="info" effect="plain" size="small">仅供参考</el-tag>
            </div>
          </div>

          <el-card shadow="never" class="content-card ai-card">
            <div class="reply-section">
              <h4 class="sub-title">AI 生成内容</h4>
              <div class="markdown-view-container">
                <div 
                  v-if="processedAiResponse" 
                  class="markdown-body" 
                  v-html="processedAiResponse"
                ></div>
                <el-empty v-else description="等待 AI 生成回复..." :image-size="60" />
              </div>
            </div>
          </el-card>
        </section>
      </div>
    </main>

    <footer class="audit-footer">
      <div class="footer-inner">
        <div class="input-area">
          <div class="label">医生批注 (message)</div>
            <el-input 
              v-model="doctorSummary" 
              type="textarea"  
              :rows="3"        placeholder="请输入审核意见..." 
              class="footer-input" 
              resize="none"    
            />
        </div>
        <div class="action-buttons">
          <el-button 
            type="primary" 
            size="large" 
            class="btn-pass" 
            :icon="CircleCheck" 
            :loading="submitting"
            @click="handleApprove"
          >
            审核并通过
          </el-button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, ChatDotSquare, MagicStick, CircleCheck, ArrowLeft } from '@element-plus/icons-vue'
import { marked } from 'marked' // 用于处理 Markdown 渲染
// 引入 API
import { getTempAuditMessages, submitAuditResult } from '@/api/consultation' 

const router = useRouter()
const route = useRoute()

// 状态管理
const pageLoading = ref(false)
const submitting = ref(false)
const patientName = ref(route.query.name || '患者')

// 数据模型
const aiResponse = ref('')      // 原始 AI 回复内容（包含 <think>）
const doctorSummary = ref('')   // 底部输入框：医生最终提交的 message
const userTexts = ref([])       // 左侧：用户文本
const userImages = ref([])      // 左侧：用户图片
const lastMsgTime = ref('')     // 最新消息时间

// === 改进：AI 内容处理逻辑 ===
const processedAiResponse = computed(() => {
  if (!aiResponse.value) return ''
  
  // 1. 正则过滤掉 <think>...</think> 标签及其内部所有内容
  // [\s\S]*? 用于匹配包含换行符在内的任意字符（非贪婪模式）
  const cleanContent = aiResponse.value.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  
  // 2. 将剩余内容解析为 Markdown HTML
  return marked.parse(cleanContent)
})

// === 1. 初始化：获取数据 ===
onMounted(async () => {
  const historyStateData = history.state.preloadedMessages
  if (historyStateData && Array.isArray(historyStateData) && historyStateData.length > 0) {
    processData(historyStateData)
  } else {
    await fetchAuditData()
  }
})

// === 2. 兜底数据请求 ===
const fetchAuditData = async () => {
  const sessionId = route.query.id
  if (!sessionId) return
  
  pageLoading.value = true
  try {
    const res = await getTempAuditMessages(sessionId)
    const list = Array.isArray(res) ? res : (res.data || [])
    if (list.length > 0) {
      processData(list)
    } else {
      ElMessage.warning('当前没有需要审核的消息')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载数据失败')
  } finally {
    pageLoading.value = false
  }
}

// === 3. 数据解析与渲染 ===
const processData = (list) => {
  userTexts.value = []
  userImages.value = []
  aiResponse.value = ''
  
  list.forEach(msg => {
    lastMsgTime.value = msg.createTime
    if (msg.senderType === 'USER') {
      if (msg.msgType === 1) userTexts.value.push(msg.content)
      else if (msg.msgType === 2) userImages.value.push(msg.content)
    }
    if (msg.senderType === 'AI') {
      aiResponse.value = msg.content
    }
  })
}

// === 4. 提交审核 ===
const handleApprove = async () => {
  if (!doctorSummary.value.trim()) {
    ElMessage.warning('请输入审核意见或回复内容')
    return
  }

  try {
    await ElMessageBox.confirm('确定通过审核并发送消息吗？', '审核确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    submitting.value = true
    const sessionId = route.query.id
    await submitAuditResult(sessionId, doctorSummary.value)
    ElMessage.success('审核通过，信息添加成功')
    router.back()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('提交失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

const goBack = () => router.back()
</script>

<style scoped lang="scss">
/* 基础变量 */
$bg-color: #f5f7fa; 
$border-color: #e4e7ed; 
$primary-color: #0052d9; 
$text-main: #303133; 
$text-secondary: #909399;

.doctor-review-container { 
  display: flex; 
  flex-direction: column; 
  height: 100vh; 
  background-color: $bg-color; 
}

/* Header */
.review-header {
  height: 60px; 
  background: #fff; 
  border-bottom: 1px solid $border-color; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 0 24px; 
  flex-shrink: 0;
  
  .header-left-group { 
    display: flex; align-items: center; gap: 16px; 
    .back-btn { padding: 0; &:hover { background-color: #f2f3f5; border-radius: 4px; } }
    .patient-info { 
      display: flex; align-items: center; gap: 12px; 
      .label { font-size: 14px; color: $text-secondary; } 
      .name { font-size: 18px; font-weight: 600; color: $text-main; } 
      .meta { font-size: 13px; color: #606266; padding-left: 8px; border-left: 1px solid #ccc; } 
    }
  }
}

/* Main Content */
.review-main { 
  flex: 1; 
  overflow: hidden; 
  padding: 20px; 
  
  .panel-layout { display: flex; gap: 20px; height: 100%; }
  .left-panel { flex: 4; display: flex; flex-direction: column; min-width: 0; }
  .right-panel { flex: 6; display: flex; flex-direction: column; min-width: 0; }

  .panel-title { 
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    .title-left { 
      display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 16px; color: $text-main; 
      .icon-chat { color: #409eff; } .icon-ai { color: #67c23a; } 
    }
    .time-label { font-size: 12px; color: $text-secondary; }
  }

  .content-card { 
    flex: 1; display: flex; flex-direction: column; border-radius: 8px; border: none; 
    :deep(.el-card__body) { height: 100%; overflow-y: auto; padding: 24px; box-sizing: border-box; }
  }

  /* 改进：Markdown 展示容器样式 */
  .reply-section { 
    flex: 1; display: flex; flex-direction: column; height: 100%; 
    .sub-title { font-size: 14px; color: $text-secondary; margin-bottom: 8px; }
    
    .markdown-view-container {
      flex: 1;
      background-color: #f8f9fb;
      border-radius: 8px;
      padding: 16px 20px;
      overflow-y: auto;
      border: 1px solid transparent;
      transition: all 0.3s;
      
      &:hover {
        background-color: #ffffff;
        border-color: $primary-color;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      }
    }
  }
}

/* 改进：Markdown 内容样式定义 */
.markdown-body {
  line-height: 1.8;
  font-size: 15px;
  color: #333;

  :deep(p) { margin-bottom: 12px; }
  :deep(h1), :deep(h2), :deep(h3) { 
    margin: 16px 0 8px; 
    font-weight: 600; 
    color: #1a1a1a;
  }
  :deep(ul), :deep(ol) { padding-left: 20px; margin-bottom: 12px; }
  :deep(li) { margin-bottom: 4px; }
  :deep(strong) { font-weight: bold; color: #000; }
  :deep(code) { 
    background-color: rgba(0,0,0,0.06); 
    padding: 2px 4px; 
    border-radius: 4px; 
    font-family: monospace; 
  }
  :deep(blockquote) {
    border-left: 4px solid #dcdfe6;
    padding-left: 12px;
    color: #666;
    margin: 10px 0;
  }
}

.section-block { 
  margin-bottom: 24px; 
  .sub-title { font-size: 14px; color: $text-secondary; margin-bottom: 8px; }
  .text-body { background: #f8f9fb; padding: 12px 16px; border-radius: 8px; line-height: 1.6; font-size: 14px; color: $text-main; }
  .mb-3 { margin-bottom: 12px; }
  .image-grid { display: flex; flex-wrap: wrap; gap: 10px; }
  .image-wrapper { 
    width: 100px; height: 100px; border: 1px solid $border-color; border-radius: 8px; padding: 4px; background: #fff; 
    .upload-img { width: 100%; height: 100%; border-radius: 4px; cursor: pointer; }
  }
}

/* Footer */
.audit-footer { 
  height: auto; background: #fff; border-top: 1px solid $border-color; padding: 16px 24px; 
  .footer-inner { 
    display: flex; align-items: flex-end; gap: 20px; 
    .input-area { 
      flex: 1; 
      .label { font-size: 14px; font-weight: bold; color: $text-main; margin-bottom: 8px; } 
      .footer-input { :deep(.el-input__wrapper) { padding: 8px 12px; background-color: #fff; } } 
    }
    .action-buttons { 
      display: flex; gap: 12px; 
      .btn-pass { background-color: $primary-color; border-color: $primary-color; font-weight: 500; padding: 20px 24px; } 
    } 
  }
}
</style>