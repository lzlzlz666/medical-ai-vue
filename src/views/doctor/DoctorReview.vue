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
        <el-button link :icon="Clock" @click="openHistory">历史询问与交流记录</el-button>
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
                <div v-if="processedAiResponse" class="markdown-body" v-html="processedAiResponse"></div>
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
          <div class="label-row">
            <span class="label">医生批注 / 最终回复 (message)</span>
            <el-popover placement="top-end" trigger="click" :width="320" popper-class="emoji-popover">
              <template #reference>
                <el-button link class="emoji-trigger-btn">
                  <span class="emoji-icon">😊</span> 添加表情
                </el-button>
              </template>
              <div class="emoji-container">
                <div class="emoji-group">
                  <div class="group-title">常用/鼓励</div>
                  <div class="emoji-list">
                    <span v-for="e in commonEmojis" :key="e" class="emoji-item" @click="addEmoji(e)">{{ e }}</span>
                  </div>
                </div>
                <div class="emoji-group">
                  <div class="group-title">医疗/健康</div>
                  <div class="emoji-list">
                    <span v-for="e in medicalEmojis" :key="e" class="emoji-item" @click="addEmoji(e)">{{ e }}</span>
                  </div>
                </div>
              </div>
            </el-popover>
          </div>
          
          <el-input 
            v-model="doctorSummary" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入审核意见或给患者的鼓励..." 
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

    <el-drawer
      v-model="historyVisible"
      title="历史诊疗时间轴"
      size="55%" 
      :destroy-on-close="true"
      class="history-drawer-styled"
    >
      <div v-loading="historyLoading" class="timeline-wrapper custom-scrollbar">
        <div v-if="groupedHistory.length === 0 && !historyLoading" class="empty-state">
          <el-empty description="暂无历史记录" :image-size="100" />
        </div>

        <div v-else class="timeline-list">
          <div v-for="(group, index) in groupedHistory" :key="index" class="timeline-item">
            
            <div class="timeline-axis">
              <div class="axis-dot"></div>
              <div class="axis-line" v-if="index !== groupedHistory.length - 1"></div>
            </div>

            <div class="timeline-content">
              <div class="date-header">
                <span class="date-text">{{ group.date }}</span>
                <span class="weekday-text">{{ group.weekday }}</span>
              </div>

              <div class="record-card">
                <div class="card-body-flow">
                  
                  <div v-for="msg in group.messages" :key="msg.id" class="flow-row">
                    
                    <div v-if="msg.senderType === 'USER'" class="msg-block user-side">
                      <div class="side-label">
                        <el-icon><ChatDotSquare /></el-icon> 患者描述
                      </div>
                      <div class="msg-content">
                        <div v-if="msg.msgType === 1" class="text-bubble">{{ msg.content }}</div>
                        
                        <div v-else-if="msg.msgType === 2" class="img-grid-container">
                          <div 
                            class="history-thumb-wrapper"
                            v-for="(imgUrl, idx) in msg.imgList" 
                            :key="idx"
                          >
                            <el-image 
                              :src="imgUrl" 
                              :preview-src-list="msg.imgList" 
                              :initial-index="idx"
                              fit="cover" 
                              class="history-thumb"
                            />
                          </div>
                        </div>
                        <div class="msg-time">{{ formatTimeOnly(msg.createTime) }}</div>
                      </div>
                    </div>

                    <div v-else class="msg-block medical-side">
                      <div class="side-label">
                        <el-icon><MagicStick /></el-icon> 诊疗反馈
                      </div>
                      <div class="msg-content">
                        <div v-if="msg.senderType === 'AI'" class="ai-box">
                          <div class="role-tag">AI 建议草稿 :</div>
                          <div class="markdown-text" v-html="renderMarkdownSimple(msg.content)"></div>
                        </div>
                        <div v-else class="doctor-box">
                          <div class="role-tag doc-tag">医生审核结论 :</div>
                          <div class="doc-text">{{ msg.content }}</div>
                        </div>
                        <div class="msg-time">{{ formatTimeOnly(msg.createTime) }}</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, ChatDotSquare, MagicStick, CircleCheck, ArrowLeft, ArrowRight, EditPen } from '@element-plus/icons-vue'
import { marked } from 'marked'
// 引入 API
import { getTempAuditMessages, submitAuditResult } from '@/api/consultation'
import { getHistoryMessages } from '@/api/doctor'

const router = useRouter()
const route = useRoute()

// --- 状态定义 ---
const pageLoading = ref(false)
const submitting = ref(false)
const patientName = ref(route.query.name || '患者')

// 审核页面数据
const aiResponse = ref('')
const doctorSummary = ref('')
const userTexts = ref([])
const userImages = ref([])
const lastMsgTime = ref('')

// 历史记录数据
const historyVisible = ref(false)
const historyLoading = ref(false)
const historyList = ref([])

// 表情包
const commonEmojis = ['😊', '👋', '👍', '👌', '🙏', '❤️', '💪', '☀️', '🍵', '🌹']
const medicalEmojis = ['💊', '💉', '🩺', '🏥', '🚑', '🩹', '🩸', '🍎', '🏃']

// --- 方法 ---

const addEmoji = (emoji) => { doctorSummary.value += emoji }

const processedAiResponse = computed(() => {
  if (!aiResponse.value) return ''
  const cleanContent = aiResponse.value.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  return marked.parse(cleanContent)
})

const renderMarkdownSimple = (content) => {
  if (!content) return ''
  const clean = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  return marked.parse(clean)
}

const formatTimeOnly = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.split(' ')[1] || '' // 取 HH:mm
}

const getWeekday = (dateStr) => {
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return days[new Date(dateStr).getDay()]
}

// === 初始化 ===
onMounted(async () => {
  const historyStateData = history.state.preloadedMessages
  if (historyStateData && Array.isArray(historyStateData) && historyStateData.length > 0) {
    processData(historyStateData)
  } else {
    await fetchAuditData()
  }
})

const fetchAuditData = async () => {
  const sessionId = route.query.id
  if (!sessionId) return
  pageLoading.value = true
  try {
    const res = await getTempAuditMessages(sessionId)
    const list = Array.isArray(res) ? res : (res.data || [])
    if (list.length > 0) processData(list)
    else ElMessage.warning('当前没有需要审核的消息')
  } catch (error) {
    console.error(error)
    ElMessage.error('加载数据失败')
  } finally {
    pageLoading.value = false
  }
}

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
    if (msg.senderType === 'AI') aiResponse.value = msg.content
  })
}

// === 提交审核 ===
const handleApprove = async () => {
  if (!doctorSummary.value.trim()) {
    ElMessage.warning('请输入审核意见或回复内容')
    return
  }
  try {
    await ElMessageBox.confirm('确定通过审核并发送消息吗？', '审核确认', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'success'
    })
    submitting.value = true
    await submitAuditResult(route.query.id, doctorSummary.value)
    ElMessage.success('审核通过')
    router.back()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  } finally {
    submitting.value = false
  }
}

const goBack = () => router.back()

// === 历史记录获取 ===
const openHistory = async () => {
  const sessionId = route.query.id
  if (!sessionId) return
  historyVisible.value = true
  historyLoading.value = true
  try {
    const res = await getHistoryMessages(sessionId)
    historyList.value = Array.isArray(res) ? res : (res.data || [])
  } catch (error) {
    ElMessage.error('获取历史记录失败')
  } finally {
    historyLoading.value = false
  }
}

// === 🔥🔥🔥 核心：历史记录分组与排序 🔥🔥🔥 ===
const groupedHistory = computed(() => {
  if (!historyList.value || historyList.value.length === 0) return []

  // 1. 先整体按时间【升序】排序（从早到晚），确保对话流正确
  const sorted = [...historyList.value].sort((a, b) => new Date(a.createTime) - new Date(b.createTime))

  // 2. 分组并合并图片
  const groups = {}
  const groupOrder = []

  sorted.forEach(msg => {
    // 假设 createTime 格式 "2026-02-07 13:55"
    const dateStr = msg.createTime ? msg.createTime.split(' ')[0] : '未知日期'
    
    if (!groups[dateStr]) {
      groups[dateStr] = {
        date: dateStr,
        weekday: getWeekday(dateStr),
        messages: []
      }
      groupOrder.push(dateStr)
    }
    
    const currentList = groups[dateStr].messages
    const lastMsg = currentList[currentList.length - 1]

    // 图片合并逻辑：同人、同类型、连续
    if (msg.msgType === 2 && lastMsg && lastMsg.msgType === 2 && lastMsg.senderType === msg.senderType) {
      if (!lastMsg.imgList) lastMsg.imgList = [lastMsg.content]
      lastMsg.imgList.push(msg.content)
    } else {
      if (msg.msgType === 2) msg.imgList = [msg.content]
      currentList.push(msg)
    }
  })

  // 3. 返回：日期正序 ，组内消息正序 (从早到晚)
  return groupOrder.map(date => groups[date])
})
</script>

<style scoped lang="scss">
/* 基础变量 */
$bg-color: #f5f7fa; 
$border-color: #e4e7ed; 
$primary-color: #0052d9; 
$text-main: #303133; 
$text-secondary: #909399;

.doctor-review-container { 
  display: flex; flex-direction: column; height: 100vh; background-color: $bg-color; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Header */
.review-header {
  height: 60px; background: #fff; border-bottom: 1px solid $border-color; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; flex-shrink: 0;
  .header-left-group { 
    display: flex; align-items: center; gap: 16px; 
    .back-btn { padding: 0; &:hover { background-color: #f2f3f5; border-radius: 4px; } }
    .patient-info { display: flex; align-items: center; gap: 12px; .label { font-size: 14px; color: $text-secondary; } .name { font-size: 18px; font-weight: 600; color: $text-main; } .meta { font-size: 13px; color: #606266; padding-left: 8px; border-left: 1px solid #ccc; } }
  }
}

/* Main */
.review-main { 
  flex: 1; overflow: hidden; padding: 20px; 
  .panel-layout { display: flex; gap: 20px; height: 100%; }
  .left-panel { flex: 4; display: flex; flex-direction: column; min-width: 0; }
  .right-panel { flex: 6; display: flex; flex-direction: column; min-width: 0; }

  .panel-title { 
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    .title-left { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 16px; color: $text-main; .icon-chat { color: #409eff; } .icon-ai { color: #67c23a; } }
    .time-label { font-size: 12px; color: $text-secondary; }
    .ai-meta { font-size: 12px; color: $text-secondary; }
  }

  .content-card { 
    flex: 1; display: flex; flex-direction: column; border-radius: 8px; border: none; 
    :deep(.el-card__body) { height: 100%; overflow-y: auto; padding: 24px; box-sizing: border-box; }
  }

  .section-block { margin-bottom: 24px; .sub-title { font-size: 14px; color: $text-secondary; margin-bottom: 8px; font-weight: normal; } .text-body { background: #f8f9fb; padding: 12px 16px; border-radius: 8px; line-height: 1.6; font-size: 14px; color: $text-main; } .mb-3 { margin-bottom: 12px; } .image-grid { display: flex; flex-wrap: wrap; gap: 10px; } .image-wrapper { width: 100px; height: 100px; border: 1px solid $border-color; border-radius: 8px; padding: 4px; background: #fff; .upload-img { width: 100%; height: 100%; border-radius: 4px; cursor: pointer; } } }
  
  .reply-section { flex: 1; display: flex; flex-direction: column; height: 100%; .sub-title { font-size: 14px; color: $text-secondary; margin-bottom: 8px; } .markdown-view-container { flex: 1; background-color: #f8f9fb; border-radius: 8px; padding: 16px 20px; overflow-y: auto; border: 1px solid transparent; transition: all 0.3s; &:hover { background-color: #ffffff; border-color: $primary-color; box-shadow: 0 2px 12px rgba(0,0,0,0.04); } } }
}

/* Footer */
.audit-footer { 
  height: auto; background: #fff; border-top: 1px solid $border-color; padding: 16px 24px; 
  .footer-inner { 
    display: flex; align-items: flex-end; gap: 20px; 
    .input-area { flex: 1; .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; .label { font-size: 14px; font-weight: bold; color: $text-main; } .emoji-trigger-btn { padding: 0; font-size: 13px; color: $text-secondary; &:hover { color: $primary-color; } .emoji-icon { font-size: 16px; margin-right: 4px; } } } .footer-input { :deep(.el-input__wrapper) { padding: 8px 12px; background-color: #fff; } } }
    .action-buttons { display: flex; gap: 12px; .btn-pass { background-color: $primary-color; border-color: $primary-color; font-weight: 500; padding: 20px 24px; } }
  }
}

.markdown-body { line-height: 1.8; font-size: 15px; color: #333; :deep(p) { margin-bottom: 12px; } :deep(ul) { padding-left: 20px; margin-bottom: 12px; } }

/* 🔥🔥🔥 历史记录 Drawer 样式 🔥🔥🔥 */
.timeline-wrapper {
  padding: 10px 20px 40px 10px;
  height: 100%;
  overflow-y: auto;
}
.timeline-item {
  display: flex; margin-bottom: 30px; position: relative;
  .timeline-axis {
    display: flex; flex-direction: column; align-items: center; margin-right: 20px; padding-top: 6px; width: 20px; flex-shrink: 0;
    .axis-dot { width: 14px; height: 14px; border-radius: 50%; background-color: #fff; border: 3px solid #165DFF; z-index: 1; }
    .axis-line { width: 2px; flex: 1; background-color: #E5E6EB; margin-top: 4px; min-height: 100px; }
  }
  .timeline-content {
    flex: 1; min-width: 0;
    .date-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; .date-text { font-size: 18px; font-weight: 700; color: #1D2129; } .weekday-text { font-size: 13px; color: #86909C; } }
    
    .record-card {
      background: #fff; border: 1px solid #E5E6EB; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;
      .card-body-flow { padding: 20px; background-color: #FAFBFC; }
      .flow-row { display: flex; margin-bottom: 24px; &:last-child { margin-bottom: 0; } }

      .msg-block {
        max-width: 85%; min-width: 40%;
        .side-label { font-size: 12px; color: #86909C; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
        .msg-content {
          background: #fff; border: 1px solid #E5E6EB; border-radius: 8px; padding: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.03);
          
          .text-bubble { font-size: 14px; line-height: 1.6; color: #1D2129; white-space: pre-wrap; }
          
          /* 图片九宫格 */
          .img-grid-container {
            display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;
            .history-thumb-wrapper {
              width: 80px; height: 80px; border-radius: 6px; overflow: hidden; border: 1px solid #eee;
              .history-thumb { width: 100%; height: 100%; cursor: zoom-in; transition: transform 0.2s; &:hover { transform: scale(1.05); } }
            }
          }

          .ai-box { margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 8px; }
          .doctor-box { background-color: #F0F9FF; border-radius: 6px; padding: 8px; margin-top: 8px; }
          .role-tag { font-size: 12px; color: #86909C; margin-bottom: 4px; font-style: italic; }
          .doc-tag { color: #165DFF; font-weight: 600; font-style: normal; }
          .doc-text { font-size: 14px; font-weight: 500; color: #1D2129; }
          .markdown-text { font-size: 13px; color: #4E5969; line-height: 1.5; :deep(p){margin-bottom: 4px;} }
          .msg-time { font-size: 11px; color: #C9CDD4; text-align: right; margin-top: 6px; }
        }
      }

      .user-side { margin-right: auto; .msg-content { border-top-left-radius: 2px; } }
      .medical-side { margin-left: auto; .msg-content { border-top-right-radius: 2px; border-color: #CBEAFF; background-color: #F7FBFF; } }
    }
  }
}
</style>

<style lang="scss">
/* 全局样式: 表情面板 */
.emoji-popover {
  padding: 12px !important;
  .emoji-container {
    .emoji-group {
      margin-bottom: 10px;
      &:last-child { margin-bottom: 0; }
      .group-title { font-size: 12px; color: #909399; margin-bottom: 6px; font-weight: bold; }
      .emoji-list {
        display: flex; flex-wrap: wrap; gap: 8px;
        .emoji-item { font-size: 20px; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s; &:hover { background-color: #f2f3f5; transform: scale(1.1); } }
      }
    }
  }
}
</style>