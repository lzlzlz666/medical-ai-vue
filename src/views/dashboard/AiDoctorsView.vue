<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { Search, Picture, Microphone, Folder } from '@element-plus/icons-vue' // 需要安装 element-plus 图标

// === 1. 左侧咨询列表数据 ===
const activeSessionId = ref(1) // 当前选中的会话 ID
const searchKeyword = ref('')

const sessionList = reactive([
  {
    id: 1,
    name: 'AI 助手 + 张主任',
    role: '内分泌科专家团队',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doctor1',
    isAiGroup: true,
    lastMsg: 'AI: 根据您的CT片子，肺部炎症已基本吸收...',
    time: '10:30',
    unread: 0,
    online: true
  },
  {
    id: 2,
    name: '李主任 (心内科)',
    role: '主治医师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doctor2',
    isAiGroup: false,
    lastMsg: '您的心率监测报告显示恢复良好，继续保持。',
    time: '昨天',
    unread: 2,
    online: false
  },
  {
    id: 3,
    name: '营养师 王小美',
    role: '康复理疗师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nurse1',
    isAiGroup: false,
    lastMsg: '关于您的低糖水饮食方案已经更新...',
    time: '周三',
    unread: 0,
    online: true
  }
])

// === 2. 右侧聊天记录数据 ===
const chatHistory = reactive([
  {
    id: 1,
    role: 'ai',
    name: 'AI 医疗助手',
    content: '您好，张先生。我分析了您今早上传的连续血糖监测数据。您的空腹血糖值为 7.2 mmol/L，略高于上周平均值。这可能与您昨晚的晚餐摄入有关。正在生成深度分析报告...',
    time: '上午 10:15',
    type: 'text',
    tags: ['生成中...']
  },
  {
    id: 2,
    role: 'user',
    name: '我',
    content: '医生，这是我昨天的CT扫描结果。麻烦看下恢复情况。',
    time: '上午 10:18',
    type: 'mixed', // 混合类型：文字+图片
    images: [
      'https://plus.unsplash.com/premium_photo-1673984588722-b52973711915?q=80&w=300&auto=format&fit=crop', // 模拟CT图
      'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=300&auto=format&fit=crop'
    ]
  },
  {
    id: 3,
    role: 'doctor',
    name: '张主任',
    title: '内分泌科主任',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Doctor1',
    content: '看了你的CT片子，肺部的炎症已经基本吸收了。这是一个非常好的信号。继续保持目前的用药剂量，三天后再测一次血压报给我。',
    time: '上午 10:22',
    type: 'text',
    suggestions: ['恢复建议', '炎症吸收']
  }
])

// === 3. 输入框逻辑 ===
const inputContent = ref('')
const chatContainerRef = ref(null)

const handleSendMessage = () => {
  if (!inputContent.value.trim()) return
  
  // 模拟发送消息
  chatHistory.push({
    id: Date.now(),
    role: 'user',
    name: '我',
    content: inputContent.value,
    time: '刚刚',
    type: 'text'
  })
  
  inputContent.value = ''
  scrollToBottom()
  
  // 模拟 AI 回复
  setTimeout(() => {
    chatHistory.push({
      id: Date.now() + 1,
      role: 'ai',
      name: 'AI 医疗助手',
      content: '收到您的反馈，正在同步给张主任...',
      time: '刚刚',
      type: 'text'
    })
    scrollToBottom()
  }, 1000)
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  })
}

// 切换会话
const handleSelectSession = (id) => {
  activeSessionId.value = id
  // 这里可以加逻辑去加载对应的聊天记录
}

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div class="flex h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    
    <div class="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
      <div class="p-5">
        <h2 class="font-bold text-lg text-slate-800 mb-4">咨询历史</h2>
        <div class="relative">
           <el-input 
             v-model="searchKeyword" 
             placeholder="搜索咨询记录..." 
             class="!w-full custom-search"
           >
             <template #prefix>
               <el-icon class="text-slate-400"><Search /></el-icon>
             </template>
           </el-input>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div 
          v-for="session in sessionList" 
          :key="session.id"
          @click="handleSelectSession(session.id)"
          :class="[
            'px-5 py-4 cursor-pointer transition-colors border-l-4 hover:bg-white',
            activeSessionId === session.id ? 'bg-white border-brand-blue shadow-sm' : 'border-transparent'
          ]"
        >
          <div class="flex gap-3">
            <div class="relative">
              <img :src="session.avatar" class="w-11 h-11 rounded-xl bg-white border border-slate-100 p-0.5" />
              <span v-if="session.online" class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-0.5">
                <span class="font-bold text-slate-800 text-sm truncate">{{ session.name }}</span>
                <span class="text-[10px] text-slate-400">{{ session.time }}</span>
              </div>
              <p class="text-xs text-slate-500 truncate">{{ session.lastMsg }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col bg-[#F9FAFB]">
      
      <div class="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="relative">
             <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-blue to-cyan-500 flex items-center justify-center text-white font-bold">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
             </div>
             <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-slate-800">AI 助手 + 张主任 (内分泌科)</h3>
              <span class="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded border border-green-100">已认证专家</span>
            </div>
            <div class="text-xs text-slate-400">当前处于联合诊治模式</div>
          </div>
        </div>
        <div class="flex gap-4 text-slate-400">
           <button class="hover:text-brand-blue"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></button>
           <button class="hover:text-brand-blue"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg></button>
        </div>
      </div>

      <div ref="chatContainerRef" class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <div class="flex justify-center">
          <span class="bg-slate-200 text-slate-500 text-xs px-3 py-1 rounded-full">上午 10:15</span>
        </div>

        <div v-for="msg in chatHistory" :key="msg.id" class="w-full">
          
          <div v-if="msg.role === 'ai'" class="flex gap-4 max-w-[85%]">
             <div class="w-10 h-10 rounded-full bg-brand-blue flex-shrink-0 flex items-center justify-center text-white shadow-md">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
             </div>
             <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                   <span class="text-sm font-bold text-brand-blue">AI 医疗助手</span>
                   <span class="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">PRO</span>
                </div>
                <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700 text-sm leading-relaxed">
                   {{ msg.content }}
                   <div v-if="msg.tags" class="mt-2 text-xs text-slate-400 italic">{{ msg.tags[0] }}</div>
                </div>
             </div>
          </div>

          <div v-if="msg.role === 'user'" class="flex flex-row-reverse gap-4 max-w-[85%] ml-auto">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="w-10 h-10 rounded-full bg-orange-100 flex-shrink-0" />
             <div class="flex flex-col items-end">
                <div class="text-xs text-slate-400 mb-1 mr-1">张先生</div>
                <div class="bg-brand-blue p-4 rounded-2xl rounded-tr-none shadow-lg shadow-blue-200 text-white text-sm leading-relaxed">
                   {{ msg.content }}
                   <div v-if="msg.images" class="flex gap-2 mt-3">
                      <img v-for="(img, idx) in msg.images" :key="idx" :src="img" class="w-24 h-24 object-cover rounded-lg border-2 border-white/20 hover:border-white cursor-pointer transition-colors" />
                   </div>
                </div>
             </div>
          </div>

          <div v-if="msg.role === 'doctor'" class="flex gap-4 max-w-[85%]">
             <div class="relative flex-shrink-0">
                <img :src="msg.avatar" class="w-10 h-10 rounded-full border border-slate-100" />
                <span class="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
                   <svg class="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg>
                </span>
             </div>
             <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                   <span class="text-sm font-bold text-slate-800">{{ msg.name }}</span>
                   <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                   <span class="text-xs text-slate-500">{{ msg.title }}</span>
                </div>
                <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700 text-sm leading-relaxed">
                   {{ msg.content }}
                   <div v-if="msg.suggestions" class="flex gap-2 mt-3">
                      <span v-for="tag in msg.suggestions" :key="tag" class="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded hover:bg-slate-200 cursor-pointer">
                        # {{ tag }}
                      </span>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      <div class="bg-white border-t border-slate-100 p-5">
         <div class="bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-brand-blue/20 focus-within:border-brand-blue transition-all">
            <textarea 
              v-model="inputContent"
              class="w-full bg-transparent border-none outline-none text-sm text-slate-700 px-3 py-2 resize-none h-20 scrollbar-hide"
              placeholder="描述您的症状、用药情况或上传新的医学报告..."
              @keydown.enter.prevent="handleSendMessage"
            ></textarea>
            
            <div class="flex items-center justify-between px-2 pt-2">
               <div class="flex gap-2">
                  <button class="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors">
                     <el-icon :size="18"><Picture /></el-icon>
                  </button>
                  <button class="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors">
                     <el-icon :size="18"><Folder /></el-icon>
                  </button>
                  <button class="p-2 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors">
                     <el-icon :size="18"><Microphone /></el-icon>
                  </button>
                  <button class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors">
                     <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                     AI 深度分析
                  </button>
               </div>
               
               <button @click="handleSendMessage" class="bg-brand-blue text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2">
                  发送 
                  <svg class="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
               </button>
            </div>
         </div>
         <div class="text-center mt-3">
            <span class="text-[10px] text-slate-400">支持格式: JPG, PNG, PDF (最大 20MB) &nbsp;•&nbsp; 隐私保护: 医疗级加密传输</span>
         </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #CBD5E1; }

/* 覆盖 Element UI 输入框样式 */
:deep(.custom-search .el-input__wrapper) {
  @apply rounded-xl bg-slate-100 shadow-none border-transparent py-1;
}
:deep(.custom-search .el-input__wrapper.is-focus) {
  @apply bg-white border-brand-blue ring-2 ring-brand-blue/10;
}
</style>