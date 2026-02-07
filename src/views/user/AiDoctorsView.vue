<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import { 
  Search, Picture, Folder, Cpu, Position, Loading, Collection, Close, MoreFilled, PhoneFilled,
  Warning, CircleCheckFilled, EditPen, Lock 
} from '@element-plus/icons-vue'
import { getSessionList, getSessionMessages } from '@/api/consultation' 
import { uploadFile } from '@/api/user' 
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore() 

// === Markdown 配置 ===
const md = new MarkdownIt({ html: true, linkify: true, breaks: true })
const renderMarkdown = (text) => md.render(text || '')

// === 数据定义 ===
const activeSessionId = ref(null)
const searchKeyword = ref('')
const sessionList = ref([])      
const chatHistory = ref([])      
const inputContent = ref('')
const chatContainerRef = ref(null)
const loading = ref(false)
const isSending = ref(false) 
const currentSession = ref({})
const userToken = localStorage.getItem('user_token') 

// 开关状态
const isDeepThinking = ref(true) 
const isRAGEnabled = ref(true)   

// 图片上传
const fileInputRef = ref(null) 
const uploadFiles = ref([]) 

// 是否允许发送
const isInputDisabled = computed(() => {
  if (chatHistory.value.length === 0) return false
  const lastMsg = chatHistory.value[chatHistory.value.length - 1]
  if (isSending.value) return true
  return lastMsg.role === 'ai' && lastMsg.status === 0
})

// === 工具函数：解析历史消息 ===
const parseMessageContent = (rawContent) => {
  if (!rawContent) return { reasoning: '', content: '' }
  // 匹配 <think>...</think>
  const regex = /<think>([\s\S]*?)<\/think>/i
  const match = rawContent.match(regex)
  if (match) {
    const reasoning = match[1].trim() // 提取思考过程
    const content = rawContent.replace(match[0], '').trim() // 移除标签后的正文
    return { reasoning, content }
  } else {
    // 如果只有 <think> 开头但没结尾（极少见的历史数据异常），视为全思考
    if (rawContent.trim().startsWith('<think>')) {
      const reasoning = rawContent.replace('<think>', '').trim()
      return { reasoning, content: '' } 
    }
    // 普通文本，无思考过程
    return { reasoning: '', content: rawContent }
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

// === 图片上传逻辑 ===
const triggerFileUpload = () => {
  if (!isInputDisabled.value) fileInputRef.value.click()
}

const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  addFilesToQueue(files)
  event.target.value = '' 
}

const handlePaste = (event) => {
  if (isInputDisabled.value) return 
  const items = event.clipboardData && event.clipboardData.items
  const files = []
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }
  }
  if (files.length > 0) addFilesToQueue(files)
}

const addFilesToQueue = (files) => {
  if (!files.length) return
  if (uploadFiles.value.length + files.length > 4) {
    ElMessage.warning('为保证体验，一次最多发送 4 张图片')
    return
  }
  files.forEach(file => {
    const previewUrl = URL.createObjectURL(file)
    uploadFiles.value.push({ file, preview: previewUrl })
  })
}

const removeUploadFile = (index) => {
  URL.revokeObjectURL(uploadFiles.value[index].preview)
  uploadFiles.value.splice(index, 1)
}

const uploadImageToServer = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await uploadFile(formData)
    if (typeof res === 'string' && res.startsWith('http')) return res 
    if (res && res.data && typeof res.data === 'string') return res.data
    throw new Error('上传接口返回格式异常')
  } catch (error) {
    console.error('图片上传异常:', error)
    throw error 
  }
}

// === 加载会话 ===
const loadSessions = async () => {
  try {
    const res = await getSessionList()
    sessionList.value = res.map(item => ({
      id: item.id,
      name: item.doctorName ? `${item.doctorName} (${item.deptName || '专家'})` : '医生',
      role: item.title || '主治医师',
      avatar: item.doctorAvatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      lastMsg: item.aiSummary || '点击查看详情...', 
      time: formatTime(item.createTime),
      status: item.status, 
      online: item.status === 1
    }))
    
    if (sessionList.value.length > 0 && !activeSessionId.value) {
      const validSession = sessionList.value.find(s => s.status === 2)
      if (validSession) handleSelectSession(validSession)
    }
  } catch (error) {
    console.error('加载会话列表失败', error)
  }
}

const handleSelectSession = (session) => {
  if (session.status !== 2) {
    ElMessage.warning('请您申请并等待医生的同意')
    return
  }
  if (isSending.value) return ElMessage.warning('请等待当前对话结束')
  
  activeSessionId.value = session.id
  currentSession.value = session 
  loadMessages(session.id)
  uploadFiles.value = [] 
}

// === 加载消息 ===
const loadMessages = async (sessionId) => {
  loading.value = true
  chatHistory.value = [] 
  try {
    const res = await getSessionMessages(sessionId)
    const groupedMessages = []

    res.forEach((msg) => {
      let role = 'user'
      let name = '我'
      let avatar = userStore.userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      
      if (msg.senderType === 'AI') {
        role = 'ai'
        name = 'AI 医疗助手'
      } else if (msg.senderType === 'DOCTOR') {
        role = 'doctor'
        name = currentSession.value.name 
        avatar = currentSession.value.avatar
      }
      
      const content = msg.content
      const status = msg.msgStatus !== undefined ? msg.msgStatus : 1
      const doctorSummary = msg.doctorSummary || null 

      // 🔥 历史消息合并逻辑：如果是 AI 消息，尝试解析出 reasoning
      const parsed = msg.msgType === 2 ? { content: '', reasoning: '' } : parseMessageContent(content)

      groupedMessages.push({
        id: msg.id,
        role: role,
        name: name,
        avatar: avatar,
        fullContent: content, // 原始数据备用
        content: parsed.content, // 用于 Markdown 渲染的正文
        reasoning: parsed.reasoning, // 用于折叠面板展示的思考过程
        time: formatTime(msg.createTime),
        type: msg.msgType === 2 ? 'image' : 'text', 
        images: msg.msgType === 2 ? [content] : [],
        isThinking: false,
        status: status,
        doctorSummary: doctorSummary 
      })
    })

    chatHistory.value = groupedMessages
    scrollToBottom()
  } catch (error) {
    console.error('加载消息失败', error)
  } finally {
    loading.value = false
  }
}

// === 核心发送逻辑 ===
const handleSendMessage = async () => {
  if (isInputDisabled.value) {
    ElMessage.warning('请等待医生审核上一条回复后再提问')
    return
  }

  const text = inputContent.value.trim()
  const hasImages = uploadFiles.value.length > 0

  if (!text && !hasImages) return
  if (isSending.value) return

  // 1. 用户消息上屏
  const currentUserAvatar = userStore.userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
  chatHistory.value.push({
    id: Date.now(),
    role: 'user',
    name: '我',
    avatar: currentUserAvatar, 
    content: text,
    time: formatTime(new Date()),
    type: 'text',
    images: uploadFiles.value.map(f => f.preview) 
  })

  // 2. AI 占位消息
  const aiMsgId = Date.now() + 1
  chatHistory.value.push({
    id: aiMsgId,
    role: 'ai',
    name: 'AI 医疗助手',
    avatar: '', 
    fullContent: '', // 🔥 用来累积所有原始流数据
    content: '',     // 🔥 累积正文
    reasoning: '',   // 🔥 累积思考过程
    time: formatTime(new Date()),
    type: 'text',
    isThinking: true,
    status: 0, 
    doctorSummary: null
  })

  const currentAiMsg = chatHistory.value[chatHistory.value.length - 1]

  inputContent.value = ''
  isSending.value = true
  scrollToBottom()

  try {
    let serverImageUrls = []
    if (hasImages) {
       const uploadPromises = uploadFiles.value.map(item => uploadImageToServer(item.file))
       serverImageUrls = await Promise.all(uploadPromises)
       uploadFiles.value = [] 
    }

    let apiUrl = ''
    let payload = {}
    const apiPrefix = '/api' 
    const useRAG = isRAGEnabled.value

    if (serverImageUrls.length > 0) {
      apiUrl = `${apiPrefix}/user/ai/stream/images`
      payload = { chatId: activeSessionId.value, message: text || ' ', imageUrls: serverImageUrls, enableDeepThinking: isDeepThinking.value, enableRAG: useRAG }
    } else {
      apiUrl = `${apiPrefix}/user/ai/stream`
      payload = { chatId: activeSessionId.value, message: text, enableDeepThinking: isDeepThinking.value, enableRAG: useRAG }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authentication': userToken || '', 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) throw new Error(response.statusText)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '' 

    // === 🔥🔥🔥 流式数据处理核心修复 🔥🔥🔥 ===
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk 
      const lines = buffer.split('\n')
      buffer = lines.pop() 

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine.startsWith('data:')) continue
        const jsonStr = trimmedLine.slice(5).trim()
        if (!jsonStr) continue

        try {
          const data = JSON.parse(jsonStr)
          
          // 1. 处理思考过程 (DeepSeek 可能直接返回 thinking 字段)
          if (data.thinking) {
             currentAiMsg.reasoning += data.thinking
          }

          // 2. 处理正文内容
          // 有些模型(如DeepSeek)可能会把思考过程混在 content 里 (<think>...</think>)
          // 所以我们需要把收到的 content 拼接到 fullContent，然后实时解析
          let chunkContent = ''
          if (data.answer) chunkContent = data.answer
          else if (data.content) chunkContent = data.content
          
          if (chunkContent) {
            // 这里我们不做复杂的流式正则解析（太容易出错），
            // 而是简单地：如果 content 里包含 <think> 标签，我们暂且不显示，
            // 实际上 DeepSeek API 通常是 `thinking` 字段给思考，`content` 给正文，是分开的。
            // 但如果您的后端是混在一起发的，我们用一个临时变量累积
            currentAiMsg.fullContent += chunkContent
            
            // 尝试分离 (应对混在一起的情况)
            const parsed = parseMessageContent(currentAiMsg.fullContent)
            // 如果解析出了 reasoning，覆盖之前的（以防重复）
            if (parsed.reasoning) currentAiMsg.reasoning = parsed.reasoning
            // 正文部分
            currentAiMsg.content = parsed.content
          }

          // 3. 状态更新
          if (data.status !== undefined) currentAiMsg.status = Number(data.status)
          if (data.doctorSummary) currentAiMsg.doctorSummary = data.doctorSummary

          await new Promise(resolve => setTimeout(resolve, 10))
          scrollToBottom()
        } catch (e) {}
      }
    }
  } catch (error) {
    console.error('发送失败', error)
    currentAiMsg.content += `\n[错误: ${error.message || '网络请求失败'}]`
  } finally {
    currentAiMsg.isThinking = false
    isSending.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

onMounted(() => {
  loadSessions()
})
</script>

<template>
  <div class="flex h-[calc(100vh-100px)] bg-slate-50 rounded-3xl shadow-xl overflow-hidden border border-slate-200/60 font-sans">
  
    <input type="file" ref="fileInputRef" class="hidden" accept="image/*" multiple @change="handleFileChange" />

    <div class="w-80 border-r border-slate-200 flex flex-col bg-white z-10">
      <div class="p-6 pb-4">
        <h2 class="font-bold text-xl text-slate-800 mb-5 tracking-tight">医疗咨询</h2>
        <div class="relative group">
           <el-input v-model="searchKeyword" placeholder="搜索历史记录..." class="!w-full custom-search">
             <template #prefix><el-icon class="text-slate-400 group-hover:text-blue-500 transition-colors"><Search /></el-icon></template>
           </el-input>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4 space-y-1">
        <div 
          v-for="session in sessionList" :key="session.id" @click="handleSelectSession(session)"
          :class="[
            'px-4 py-3 transition-all duration-200 rounded-xl mb-1 border relative overflow-hidden',
            session.status !== 2 
              ? 'bg-slate-50 border-transparent opacity-60 grayscale cursor-not-allowed' 
              : (activeSessionId === session.id 
                  ? 'bg-blue-50/80 border-blue-100 shadow-sm cursor-pointer' 
                  : 'bg-transparent border-transparent hover:bg-slate-50 cursor-pointer')
          ]"
        >
          <div class="flex gap-3.5 items-center">
            <div class="relative flex-shrink-0">
              <img :src="session.avatar" class="w-12 h-12 rounded-full bg-slate-100 object-cover border border-slate-100" />
              <span v-if="session.status === 2 && session.online" class="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              <div v-if="session.status !== 2" class="absolute bottom-0 right-0 bg-slate-200 rounded-full p-0.5 border border-white">
                 <el-icon :size="10" color="#666"><Lock /></el-icon>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1">
                <span 
                  class="font-bold text-sm truncate" 
                  :class="session.status !== 2 ? 'text-slate-500' : (activeSessionId === session.id ? 'text-blue-700' : 'text-slate-800')"
                >
                  {{ session.name }}
                </span>
                <span class="text-[10px] text-slate-400 font-medium">{{ session.time }}</span>
              </div>
              <p 
                class="text-xs truncate" 
                :class="activeSessionId === session.id ? 'text-blue-600/70' : 'text-slate-500'"
              >
                {{ session.status !== 2 ? '等待医生审核中...' : session.lastMsg }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!currentSession.id" class="flex-1 flex flex-col items-center justify-center bg-[#F8F9FB] text-slate-400">
       <el-empty description="请选择一个已建立连接的会话" />
    </div>

    <div v-else class="flex-1 flex flex-col bg-[#F8F9FB] relative">
      <div class="h-[64px] bg-white border-b border-slate-100 px-6 flex items-center justify-between flex-shrink-0 z-10 sticky top-0">
        <div class="flex items-center">
           <div class="flex items-center mr-3">
              <div class="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white border-2 border-white relative z-0">
                 <el-icon :size="18"><Cpu /></el-icon>
              </div>
              <img :src="currentSession.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" class="w-9 h-9 rounded-full border-2 border-white -ml-3 relative z-10 bg-slate-200 object-cover" />
           </div>
           <div class="flex items-center gap-2">
             <h3 class="font-bold text-slate-800 text-[15px]">AI 医疗助手 + {{ currentSession.name || '医生' }}</h3>
             <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100 tracking-wide">AI CO-PILOT</span>
           </div>
        </div>
        <div class="flex items-center gap-4 text-slate-400">
           <el-icon class="hover:text-blue-600 cursor-pointer transition-colors" :size="20"><PhoneFilled /></el-icon>
           <el-icon class="hover:text-blue-600 cursor-pointer transition-colors" :size="20"><MoreFilled /></el-icon>
        </div>
      </div>

      <div ref="chatContainerRef" class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth">
        <div v-for="(msg, index) in chatHistory" :key="msg.id" class="w-full animate-fade-in-up">
          
          <div v-if="msg.role === 'ai'" class="flex gap-4 max-w-[95%]">
             <div class="w-10 h-10 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-blue-200 mt-1 ring-2 ring-white">
                <el-icon :size="20"><Cpu /></el-icon>
             </div>
             <div class="flex-1 min-w-0 space-y-2">
                <div class="flex items-center gap-2 mb-1">
                   <span class="text-xs font-bold text-slate-500">AI 医疗助手</span>
                   <span v-if="msg.isThinking && !msg.content" class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 border border-violet-200">
                      <el-icon class="is-loading text-violet-600" :size="12"><Loading /></el-icon>
                      <span class="text-[10px] text-violet-600 font-bold">R1 深度推理中...</span>
                   </span>
                </div>

                <div v-if="msg.reasoning" class="relative group mb-2">
                   <el-collapse :model-value="['1']" class="!border-none">
                      <el-collapse-item name="1">
                        <template #title>
                          <div class="flex items-center gap-2 text-xs font-bold select-none px-3 py-1 rounded-lg transition-colors hover:bg-slate-200/50 cursor-pointer w-full">
                            <div class="flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600"><el-icon><Cpu /></el-icon></div>
                            <span class="text-slate-600">深度思考链路</span>
                            <span class="text-[10px] text-slate-400 font-normal ml-auto">{{ msg.reasoning.length }}字</span>
                          </div>
                        </template>
                        <div class="mt-2 mx-1 relative overflow-hidden rounded-r-lg border-l-4 border-violet-400 bg-white shadow-sm ring-1 ring-slate-900/5">
                          <div class="p-4 text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-wrap bg-slate-50/50 max-h-60 overflow-y-auto custom-scrollbar">
                            {{ msg.reasoning }}
                            <span v-if="msg.isThinking && !msg.content" class="inline-block w-2 h-4 bg-violet-400 animate-pulse align-middle ml-1"></span>
                          </div>
                        </div>
                      </el-collapse-item>
                   </el-collapse>
                </div>

                <div class="relative">
                   <div 
                     v-if="msg.content" 
                     class="bg-white p-5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700 text-[15px] leading-7 tracking-wide relative z-10 transition-all duration-300"
                     :class="{'opacity-90 ring-2 ring-orange-100 border-orange-200': msg.status === 0 && index === chatHistory.length - 1}" 
                   >
                      <div class="markdown-body" v-html="renderMarkdown(msg.content)"></div>
                      <span v-if="msg.isThinking" class="inline-block w-2 h-4 bg-blue-500 animate-pulse align-middle ml-1 rounded-sm"></span>
                   </div>

                   <div v-if="msg.doctorSummary" class="mt-3 ml-1 animate-fade-in-up">
                      <div class="bg-green-50 border border-green-100 rounded-xl p-3 relative">
                        <div class="absolute -top-1.5 left-4 w-3 h-3 bg-green-50 border-t border-l border-green-100 transform rotate-45"></div>
                        <div class="flex items-start gap-2">
                          <div class="mt-0.5 p-1 bg-green-100 rounded-md text-green-600"><el-icon :size="14"><EditPen /></el-icon></div>
                          <div>
                            <div class="text-xs font-bold text-green-900 mb-1">医生批注 & 总结</div>
                            <div class="text-sm text-slate-700 leading-relaxed text-justify">{{ msg.doctorSummary }}</div>
                          </div>
                        </div>
                      </div>
                   </div>

                   <div v-if="msg.status === 0 && index === chatHistory.length - 1" class="flex items-center gap-1.5 mt-2 ml-1 text-orange-500 animate-pulse transition-all duration-300">
                      <el-icon :size="14"><Warning /></el-icon>
                      <span class="text-[11px] font-bold tracking-wide">内容审核中，等待医生确认...</span>
                   </div>
                   
                   <div v-else-if="msg.status === 1 && !msg.isThinking && index === chatHistory.length - 1" class="flex items-center gap-1.5 mt-2 ml-1 text-emerald-600 opacity-90 transition-all duration-500 animate-fade-in-up">
                      <el-icon :size="14"><CircleCheckFilled /></el-icon>
                      <span class="text-[11px] font-bold tracking-wide">医生已确认，内容合规</span>
                   </div>
                </div>

                <div v-if="!msg.reasoning && !msg.content && msg.isThinking" class="bg-white px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 w-fit">
                   <div class="flex items-center gap-2 text-slate-400 text-sm">
                      <span class="relative flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>
                      正在整理医疗建议...
                   </div>
                </div>
             </div>
          </div>

          <div v-if="msg.role === 'user'" class="flex flex-row-reverse gap-4 max-w-[85%] ml-auto">
             <img :src="msg.avatar" class="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex-shrink-0 object-cover" />
             <div class="flex flex-col items-end gap-2">
                <div v-if="msg.images && msg.images.length > 0" class="grid gap-1.5 transition-all duration-300" :class="msg.images.length >= 2 ? 'grid-cols-2 w-fit' : 'grid-cols-1'">
                   <div v-for="(imgUrl, idx) in msg.images" :key="idx" class="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-white" :class="msg.images.length === 1 ? 'max-w-[280px]' : 'w-32 h-32'">
                      <el-image :src="imgUrl" :preview-src-list="msg.images" :initial-index="idx" fit="cover" preview-teleported hide-on-click-modal class="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-105" :class="msg.images.length === 1 ? 'h-auto max-h-[300px]' : ''">
                        <template #placeholder><div class="flex items-center justify-center h-full bg-slate-100 text-slate-400 text-xs">...</div></template>
                      </el-image>
                   </div>
                </div>
                <div v-if="msg.content" class="bg-blue-600 px-4 py-3 rounded-2xl rounded-tr-none shadow-md shadow-blue-100 text-white text-[15px] leading-relaxed whitespace-pre-wrap min-w-[60px] max-w-full">{{ msg.content }}</div>
                <span class="text-[10px] text-slate-400 font-medium pr-1">{{ msg.time }}</span>
             </div>
          </div>

          <div v-if="msg.role === 'doctor'" class="flex gap-4 max-w-[85%]">
             <img :src="msg.avatar" class="w-10 h-10 rounded-full border border-slate-100 shadow-sm" />
             <div class="flex-1">
                <div class="flex items-center gap-2 mb-1"><span class="text-sm font-bold text-slate-800">{{ msg.name }}</span></div>
                <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-slate-700 text-sm leading-relaxed border border-slate-100">{{ msg.content }}</div>
             </div>
          </div>
        </div>
      </div>

      <div class="p-6 pt-2">
         <div 
           class="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 transition-all duration-300 focus-within:shadow-xl focus-within:border-blue-100 overflow-hidden relative"
           :class="{'opacity-75 pointer-events-none cursor-not-allowed grayscale-[0.5]': isInputDisabled}" 
         >
            <div v-if="isInputDisabled" class="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
               <div class="bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-xs font-bold border border-orange-100 shadow-sm flex items-center gap-2">
                 <el-icon><Warning /></el-icon>
                 请等待医生审核上一条建议后再进行提问
               </div>
            </div>

            <div v-if="uploadFiles.length > 0" class="flex gap-3 px-4 pt-3 pb-1 overflow-x-auto custom-scrollbar">
              <div v-for="(item, index) in uploadFiles" :key="index" class="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                <img :src="item.preview" class="w-full h-full object-cover" />
                <button @click="removeUploadFile(index)" class="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors">
                  <el-icon :size="12"><Close /></el-icon>
                </button>
              </div>
            </div>
            <textarea 
              v-model="inputContent"
              class="w-full bg-transparent border-none outline-none text-[15px] text-slate-700 px-4 py-3 resize-none h-14 min-h-[56px] max-h-32 custom-scrollbar placeholder-slate-400 disabled:bg-slate-50"
              :placeholder="isInputDisabled ? '等待医生审核中...' : '请描述您的症状、既往病史，或上传检查报告（支持 Ctrl+V 粘贴图片）...'"
              @keydown.enter.prevent="handleSendMessage"
              @paste="handlePaste"
              :disabled="isSending || isInputDisabled"
            ></textarea>
            <div class="flex items-center justify-between px-4 pb-3 pt-2 bg-white">
               <div class="flex items-center gap-4">
                  <div class="flex gap-1 pr-4 border-r border-slate-100">
                      <el-tooltip content="上传图片" placement="top">
                         <button @click="triggerFileUpload" class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" :disabled="isInputDisabled">
                           <el-icon :size="20"><Picture /></el-icon>
                         </button>
                      </el-tooltip>
                      <el-tooltip content="上传文件" placement="top">
                         <button class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" :disabled="isInputDisabled"><el-icon :size="20"><Folder /></el-icon></button>
                      </el-tooltip>
                  </div>
                  <div class="flex gap-2">
                    <button @click="isDeepThinking = !isDeepThinking" class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border select-none" :class="isDeepThinking ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'" :disabled="isInputDisabled">
                      <el-icon :class="isDeepThinking ? 'animate-pulse' : ''"><Cpu /></el-icon><span>深度思考 R1</span>
                    </button>
                    <button @click="isRAGEnabled = !isRAGEnabled" class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border select-none transition-all duration-200" :class="isRAGEnabled ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'" :disabled="isInputDisabled">
                      <el-icon><Collection /></el-icon><span>知识库 RAG {{ isRAGEnabled ? '(已启用)' : '(已关闭)' }}</span>
                    </button>
                  </div>
               </div>
               <button @click="handleSendMessage" :disabled="(!inputContent.trim() && uploadFiles.length === 0) || isSending || isInputDisabled" class="bg-blue-600 text-white w-10 h-10 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                  <el-icon :size="18" v-if="!isSending"><Position /></el-icon>
                  <el-icon :size="18" v-else class="is-loading"><Loading /></el-icon>
               </button>
            </div>
         </div>
         <div class="text-center mt-1"><span class="text-[11px] text-slate-400 font-medium">AI 生成内容仅供参考，不作为最终医疗诊断依据</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持原有样式不变 */
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
:deep(.custom-search .el-input__wrapper) { @apply rounded-xl bg-slate-50 shadow-none border border-transparent py-1.5 px-3 transition-all; }
:deep(.custom-search .el-input__wrapper.is-focus) { @apply bg-white border-blue-200 ring-4 ring-blue-50/50; }
:deep(.el-collapse) { border: none; }
:deep(.el-collapse-item__header) { border: none; background: transparent; height: 32px; }
:deep(.el-collapse-item__wrap) { border: none; background: transparent; }
:deep(.el-collapse-item__content) { padding-bottom: 0; }
.markdown-body { font-size: 15px; line-height: 1.75; color: #334155; }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) { font-weight: 700; color: #1e293b; margin-top: 1.2em; margin-bottom: 0.6em; line-height: 1.3; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { margin-bottom: 1em; padding-left: 1.5em; }
.markdown-body :deep(li) { margin-bottom: 0.4em; position: relative; }
.markdown-body :deep(ul) { list-style: none; }
.markdown-body :deep(ul li)::before { content: '•'; color: #3b82f6; position: absolute; left: -1em; font-weight: bold; }
.markdown-body :deep(code) { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #f1f5f9; color: #0f172a; padding: 0.2em 0.4em; border-radius: 4px; font-size: 85%; }
.markdown-body :deep(blockquote) { border-left: 4px solid #3b82f6; background: #eff6ff; color: #334155; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 1.5em 0; font-style: normal; }
.markdown-body :deep(a) { color: #2563eb; text-decoration: none; border-bottom: 1px dashed #2563eb; transition: all 0.2s; }
.markdown-body :deep(a):hover { background: #eff6ff; border-bottom-style: solid; }
</style>