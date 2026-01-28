<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { 
  Search, Picture, Folder, Cpu, Position, Loading, Collection, Close, MoreFilled, PhoneFilled
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

// === 工具函数 ===
const parseMessageContent = (rawContent) => {
  if (!rawContent) return { reasoning: '', content: '' }
  const regex = /<think>([\s\S]*?)<\/think>([\s\S]*)/
  const match = rawContent.match(regex)
  if (match) {
    return { reasoning: match[1].trim(), content: match[2].trim() }
  } else {
    return { reasoning: '', content: rawContent }
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

// === 图片上传逻辑 ===
const triggerFileUpload = () => fileInputRef.value.click()

const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  addFilesToQueue(files)
  event.target.value = '' 
}

const handlePaste = (event) => {
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

// === 加载逻辑 ===
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
      handleSelectSession(sessionList.value[0])
    }
  } catch (error) {
    console.error('加载会话列表失败', error)
  }
}

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
      
      const isImage = msg.msgType === 2
      const content = msg.content
      const lastMsg = groupedMessages[groupedMessages.length - 1]

      if (lastMsg && lastMsg.role === role) {
        if (msg.msgType === 2) {
          lastMsg.images.push(content)
          lastMsg.time = formatTime(msg.createTime)
          return 
        }
        if (msg.msgType === 1 && !lastMsg.content && lastMsg.images.length > 0) {
           const parsed = parseMessageContent(content)
           lastMsg.content = parsed.content
           lastMsg.reasoning = parsed.reasoning
           lastMsg.time = formatTime(msg.createTime)
           return
        }
      }

      const parsed = msg.msgType === 2 ? { content: '', reasoning: '' } : parseMessageContent(content)
      groupedMessages.push({
        id: msg.id,
        role: role,
        name: name,
        avatar: avatar,
        content: parsed.content, 
        reasoning: parsed.reasoning, 
        time: formatTime(msg.createTime),
        type: msg.msgType === 2 ? 'image' : 'text', 
        images: msg.msgType === 2 ? [content] : [],
        isThinking: false 
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

const handleSelectSession = (session) => {
  if (isSending.value) return ElMessage.warning('请等待当前对话结束')
  activeSessionId.value = session.id
  currentSession.value = session 
  loadMessages(session.id)
  uploadFiles.value = [] 
}

// === 核心发送逻辑 ===
const handleSendMessage = async () => {
  const text = inputContent.value.trim()
  const hasImages = uploadFiles.value.length > 0

  if (!text && !hasImages) return
  if (isSending.value) return

  const currentUserAvatar = userStore.userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
  const localImageUrls = uploadFiles.value.map(f => f.preview)
  
  chatHistory.value.push({
    id: Date.now(),
    role: 'user',
    name: '我',
    avatar: currentUserAvatar, 
    content: text,
    time: formatTime(new Date()),
    type: 'text',
    images: localImageUrls 
  })

  const aiMsgId = Date.now() + 1
  chatHistory.value.push({
    id: aiMsgId,
    role: 'ai',
    name: 'AI 医疗助手',
    avatar: '', 
    content: '',
    reasoning: '', 
    time: formatTime(new Date()),
    type: 'text',
    isThinking: true 
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
      payload = {
        chatId: activeSessionId.value,
        message: text || ' ', 
        imageUrls: serverImageUrls, 
        enableDeepThinking: isDeepThinking.value,
        enableRAG: useRAG 
      }
    } else {
      apiUrl = `${apiPrefix}/user/ai/stream`
      payload = {
        chatId: activeSessionId.value,
        message: text,
        enableDeepThinking: isDeepThinking.value,
        enableRAG: useRAG 
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authentication': userToken || '', 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) throw new Error(response.statusText)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = '' 

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
          if (data.thinking) currentAiMsg.reasoning += data.thinking
          if (data.answer) currentAiMsg.content += data.answer
          await new Promise(resolve => setTimeout(resolve, 10))
          scrollToBottom()
        } catch (e) {
          console.warn('JSON解析忽略:', e)
        }
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
          :class="['px-4 py-3 cursor-pointer transition-all duration-200 rounded-xl mb-1 border', activeSessionId === session.id ? 'bg-blue-50/80 border-blue-100 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50']"
        >
          <div class="flex gap-3.5 items-center">
            <div class="relative flex-shrink-0">
              <img :src="session.avatar" class="w-12 h-12 rounded-full bg-slate-100 object-cover border border-slate-100" />
              <span v-if="session.online" class="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-slate-800 text-sm truncate" :class="activeSessionId === session.id ? 'text-blue-700' : ''">{{ session.name }}</span>
                <span class="text-[10px] text-slate-400 font-medium">{{ session.time }}</span>
              </div>
              <p class="text-xs truncate" :class="activeSessionId === session.id ? 'text-blue-600/70' : 'text-slate-500'">{{ session.lastMsg }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col bg-[#F8F9FB] relative">
      
      <div class="h-[64px] bg-white border-b border-slate-100 px-6 flex items-center justify-between flex-shrink-0 z-10 sticky top-0">
        <div class="flex items-center">
           
           <div class="flex items-center mr-3">
              <div class="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white border-2 border-white relative z-0">
                 <el-icon :size="18"><Cpu /></el-icon>
              </div>
              <img 
                :src="currentSession.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" 
                class="w-9 h-9 rounded-full border-2 border-white -ml-3 relative z-10 bg-slate-200 object-cover" 
              />
           </div>

           <div class="flex items-center gap-2">
             <h3 class="font-bold text-slate-800 text-[15px]">
               AI 医疗助手 + {{ currentSession.name || '张主任' }}
             </h3>
             <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md border border-indigo-100 tracking-wide">
               AI CO-PILOT
             </span>
           </div>
        </div>

        <div class="flex items-center gap-4 text-slate-400">
           <el-icon class="hover:text-blue-600 cursor-pointer transition-colors" :size="20"><PhoneFilled /></el-icon>
           <el-icon class="hover:text-blue-600 cursor-pointer transition-colors" :size="20"><MoreFilled /></el-icon>
        </div>
      </div>

      <div ref="chatContainerRef" class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar scroll-smooth">
        <div v-for="msg in chatHistory" :key="msg.id" class="w-full animate-fade-in-up">
          
          <div v-if="msg.role === 'ai'" class="flex gap-4 max-w-[95%]">
             <div class="w-10 h-10 rounded-full bg-gradient-to-b from-blue-500 to-blue-700 flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-blue-200 mt-1 ring-2 ring-white">
                <el-icon :size="20"><Cpu /></el-icon>
             </div>
             <div class="flex-1 min-w-0 space-y-4">
                <div class="flex items-center gap-2">
                   <span class="text-xs font-bold text-slate-500">AI 医疗助手</span>
                   <span v-if="msg.isThinking && !msg.content" class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 border border-violet-200">
                      <el-icon class="is-loading text-violet-600" :size="12"><Loading /></el-icon>
                      <span class="text-[10px] text-violet-600 font-bold">R1 深度推理中...</span>
                   </span>
                </div>
                <div v-if="msg.reasoning" class="relative group">
                   <el-collapse :model-value="['1']" class="!border-none">
                      <el-collapse-item name="1">
                        <template #title>
                          <div class="flex items-center gap-2 text-xs font-bold select-none px-3 py-1 rounded-lg transition-colors hover:bg-slate-200/50 cursor-pointer w-full">
                            <div class="flex items-center justify-center w-5 h-5 rounded bg-violet-100 text-violet-600">
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                            </div>
                            <span class="text-slate-600">深度思考链路</span>
                            <span class="text-[10px] text-slate-400 font-normal ml-auto">{{ msg.reasoning.length }}字</span>
                          </div>
                        </template>
                        <div class="mt-2 mx-1 relative overflow-hidden rounded-r-lg border-l-4 border-violet-400 bg-white shadow-sm ring-1 ring-slate-900/5">
                          <div class="p-4 text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-wrap bg-slate-50/50">
                            {{ msg.reasoning }}
                            <span v-if="msg.isThinking && !msg.content" class="inline-block w-2 h-4 bg-violet-400 animate-pulse align-middle ml-1"></span>
                          </div>
                        </div>
                      </el-collapse-item>
                   </el-collapse>
                </div>
                <div v-if="msg.content" class="bg-white p-5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700 text-[15px] leading-7 tracking-wide relative z-10">
                   <div class="markdown-body" v-html="renderMarkdown(msg.content)"></div>
                   <span v-if="msg.isThinking" class="inline-block w-2 h-4 bg-blue-500 animate-pulse align-middle ml-1 rounded-sm"></span>
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
                
                <div v-if="msg.images && msg.images.length > 0" 
                     class="grid gap-1.5 transition-all duration-300" 
                     :class="msg.images.length >= 2 ? 'grid-cols-2 w-fit' : 'grid-cols-1'">
                   <div v-for="(imgUrl, idx) in msg.images" :key="idx" 
                        class="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-white"
                        :class="msg.images.length === 1 ? 'max-w-[280px]' : 'w-32 h-32'">
                      
                      <el-image 
                        :src="imgUrl" 
                        :preview-src-list="msg.images" 
                        :initial-index="idx" 
                        fit="cover" 
                        preview-teleported
                        hide-on-click-modal
                        class="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-105"
                        :class="msg.images.length === 1 ? 'h-auto max-h-[300px]' : ''" 
                      >
                        <template #placeholder>
                          <div class="flex items-center justify-center h-full bg-slate-100 text-slate-400 text-xs">...</div>
                        </template>
                      </el-image>
                   </div>
                </div>

                <div v-if="msg.content" 
                     class="bg-blue-600 px-4 py-3 rounded-2xl rounded-tr-none shadow-md shadow-blue-100 text-white text-[15px] leading-relaxed whitespace-pre-wrap min-w-[60px] max-w-full">
                   {{ msg.content }}
                </div>
                
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
         <div class="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 transition-all duration-300 focus-within:shadow-xl focus-within:border-blue-100 overflow-hidden relative">
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
              class="w-full bg-transparent border-none outline-none text-[15px] text-slate-700 px-4 py-3 resize-none h-14 min-h-[56px] max-h-32 custom-scrollbar placeholder-slate-400"
              placeholder="请描述您的症状、既往病史，或上传检查报告（支持 Ctrl+V 粘贴图片）..."
              @keydown.enter.prevent="handleSendMessage"
              @paste="handlePaste"
              :disabled="isSending"
            ></textarea>
            <div class="flex items-center justify-between px-4 pb-3 pt-2 bg-white">
               <div class="flex items-center gap-4">
                  <div class="flex gap-1 pr-4 border-r border-slate-100">
                      <el-tooltip content="上传图片" placement="top">
                         <button @click="triggerFileUpload" class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                           <el-icon :size="20"><Picture /></el-icon>
                         </button>
                      </el-tooltip>
                      <el-tooltip content="上传文件" placement="top">
                         <button class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><el-icon :size="20"><Folder /></el-icon></button>
                      </el-tooltip>
                  </div>
                  <div class="flex gap-2">
                    <button @click="isDeepThinking = !isDeepThinking" class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border select-none" :class="isDeepThinking ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'">
                      <el-icon :class="isDeepThinking ? 'animate-pulse' : ''"><Cpu /></el-icon><span>深度思考 R1</span>
                    </button>
                    <button @click="isRAGEnabled = !isRAGEnabled" class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border select-none transition-all duration-200" :class="isRAGEnabled ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'">
                      <el-icon><Collection /></el-icon><span>知识库 RAG {{ isRAGEnabled ? '(已启用)' : '(已关闭)' }}</span>
                    </button>
                  </div>
               </div>
               <button @click="handleSendMessage" :disabled="(!inputContent.trim() && uploadFiles.length === 0) || isSending" class="bg-blue-600 text-white w-10 h-10 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
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
.markdown-body :deep(h1), .markdown-body :deep(h2) { font-size: 17px; position: relative; padding-left: 12px; }
.markdown-body :deep(h1)::before, .markdown-body :deep(h2)::before { content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 4px; background: #3b82f6; border-radius: 2px; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { margin-bottom: 1em; padding-left: 1.5em; }
.markdown-body :deep(li) { margin-bottom: 0.4em; position: relative; }
.markdown-body :deep(ul) { list-style: none; }
.markdown-body :deep(ul li)::before { content: '•'; color: #3b82f6; position: absolute; left: -1em; font-weight: bold; }
.markdown-body :deep(code) { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #f1f5f9; color: #0f172a; padding: 0.2em 0.4em; border-radius: 4px; font-size: 85%; }
.markdown-body :deep(blockquote) { border-left: 4px solid #3b82f6; background: #eff6ff; color: #334155; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 1.5em 0; font-style: normal; }
.markdown-body :deep(a) { color: #2563eb; text-decoration: none; border-bottom: 1px dashed #2563eb; transition: all 0.2s; }
.markdown-body :deep(a):hover { background: #eff6ff; border-bottom-style: solid; }
</style>