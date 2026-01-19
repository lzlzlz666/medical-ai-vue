<script setup>
import { ref } from 'vue'

// 模拟聊天记录 (汉化)
const messages = ref([
  { id: 1, role: 'ai', content: '您好！我是您的 RAG 智能助手。我已经分析了您的最新体征，血糖数据略有波动，建议注意饮食。', type: 'text' },
  { id: 2, role: 'user', content: '帮我看看这张胸片正常吗？', type: 'text' },
  { id: 3, role: 'user', content: '', type: 'image', url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=2670&auto=format&fit=crop' },
  { id: 4, role: 'ai', content: '正在分析影像特征...', type: 'analyzing' }
])
</script>

<template>
  <div class="flex flex-col h-full bg-white border-l border-slate-100 font-sans">
    <div class="h-20 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center text-white shadow-lg shadow-blue-200">
           <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        </div>
        <div>
          <div class="font-bold text-sm text-slate-800">RAG 智能顾问</div>
          <div class="flex items-center gap-1.5 text-[11px] font-medium text-green-500">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> 在线 • 知识库已挂载
          </div>
        </div>
      </div>
      <button class="text-slate-400 hover:text-slate-600">⋮</button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]">
      <div class="text-center text-xs text-slate-400 font-medium my-4">今天 09:41</div>
      
      <div v-for="msg in messages" :key="msg.id" :class="['flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '']">
        <div v-if="msg.role === 'ai'" class="w-8 h-8 rounded-full bg-brand-blue flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md">AI</div>
        <div v-else class="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs text-slate-500 font-bold">我</div>
        
        <div class="max-w-[80%] space-y-2">
           <div v-if="msg.type === 'text'" 
             :class="['p-4 rounded-2xl text-sm leading-relaxed shadow-sm', 
               msg.role === 'ai' ? 'bg-white text-slate-600 rounded-tl-none border border-slate-100' : 'bg-brand-blue text-white rounded-tr-none']"
           >
             {{ msg.content }}
           </div>

           <div v-if="msg.type === 'image'" class="rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-white p-1">
              <img :src="msg.url" class="rounded-lg w-full h-32 object-cover" />
              <div class="text-[10px] text-slate-400 p-2 flex items-center gap-1">
                 <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                 胸部X光片.png
              </div>
           </div>

           <div v-if="msg.type === 'analyzing'" class="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm w-64">
              <div class="flex items-center gap-2 mb-3 text-xs font-bold text-brand-blue">
                 <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 正在进行多模态分析...
              </div>
              <div class="text-xs text-slate-500 mb-2">正在提取肺部纹理特征...</div>
              <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div class="h-full bg-brand-blue w-2/3 animate-pulse"></div>
              </div>
           </div>
        </div>
      </div>
    </div>

    <div class="p-6 bg-white border-t border-slate-100">
      <div class="flex items-center gap-2 mb-3 justify-center">
         <span class="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">🔒 数据已加密传输</span>
      </div>
      <div class="relative">
        <input 
          type="text" 
          placeholder="询问医生或上传报告..." 
          class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all placeholder-slate-400"
        />
        <button class="absolute left-3 top-3 text-slate-400 hover:text-slate-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </button>
        <button class="absolute right-2 top-2 p-1.5 bg-brand-blue text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
        </button>
      </div>
    </div>
  </div>
</template>