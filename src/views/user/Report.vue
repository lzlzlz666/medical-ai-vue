<script setup>
import { ref, reactive, onMounted } from 'vue'
import { 
  DataAnalysis, TrendCharts, WarnTriangleFilled, CircleCheckFilled, 
  FirstAidKit, Lightning, Loading, Document, Check, Refresh, Odometer,
  Monitor, Star
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getHealthStatistics, generateAiReport } from '@/api/report'

// === 1. 状态管理 ===
const loadingData = ref(false)
const generating = ref(false)
const reportReady = ref(false)
const rawData = ref([])

// 选中的分析维度
const selectedTypes = ref(['glucose', 'bp', 'heartRate'])

// 左侧卡片统计摘要
const stats = reactive({
  glucose: { avg: '-', status: 'unknown', hasData: false },
  bp: { avgSys: '-', avgDia: '-', status: 'unknown', hasData: false },
  heartRate: { avg: '-', status: 'unknown', hasData: false }
})

// AI 报告结果
const aiReport = reactive({
  title: '',
  score: 0,
  suggestions: [],
  summary: '' 
})

// === 2. 核心逻辑：获取数据 ===
const loadData = async () => {
  loadingData.value = true
  try {
    const res = await getHealthStatistics({ type: 'month' })
    // request.js 拦截器已处理，res即为数据
    const list = res?.healthList || []
    
    if (list.length > 0) {
      rawData.value = list
      calculateStats(list)
      ElMessage.success(`数据同步完成，获取到 ${list.length} 条记录`)
    } else {
      ElMessage.info('近30天暂无体征数据')
      rawData.value = []
      calculateStats([]) 
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('数据加载失败')
  } finally {
    loadingData.value = false
  }
}

const calculateStats = (list) => {
  // 1. 血糖
  const glucoseList = list.filter(i => i.glucose > 0).map(i => i.glucose)
  if (glucoseList.length > 0) {
    const avg = (glucoseList.reduce((a, b) => a + b, 0) / glucoseList.length).toFixed(1)
    stats.glucose.avg = avg
    stats.glucose.status = avg > 7.0 ? 'warning' : 'normal'
    stats.glucose.hasData = true
  } else {
    stats.glucose.hasData = false
    stats.glucose.avg = '-'
  }

  // 2. 血压
  const bpList = list.filter(i => i.systolicBp > 0)
  if (bpList.length > 0) {
    const avgSys = Math.round(bpList.reduce((a, b) => a + b.systolicBp, 0) / bpList.length)
    const avgDia = Math.round(bpList.reduce((a, b) => a + b.diastolicBp, 0) / bpList.length)
    stats.bp.avgSys = avgSys
    stats.bp.avgDia = avgDia
    stats.bp.status = avgSys > 140 || avgDia > 90 ? 'warning' : 'normal'
    stats.bp.hasData = true
  } else {
    stats.bp.hasData = false
    stats.bp.avgSys = '-'
  }

  // 3. 心率
  const heartList = list.filter(i => i.heartRate > 0).map(i => i.heartRate)
  if (heartList.length > 0) {
    stats.heartRate.avg = Math.round(heartList.reduce((a, b) => a + b, 0) / heartList.length)
    stats.heartRate.status = 'normal'
    stats.heartRate.hasData = true
  } else {
    stats.heartRate.hasData = false
    stats.heartRate.avg = '-'
  }
}

// === 3. 生成报告逻辑 ===
const handleGenerateReport = async () => {
  if (selectedTypes.value.length === 0) return ElMessage.warning('请至少选择一个分析维度')
  if (rawData.value.length === 0) return ElMessage.error('暂无数据，无法生成报告')

  generating.value = true
  reportReady.value = false
  
  try {
    // 构造 Prompt
    let messagePrompt = "请扮演一位资深全科医生，基于患者近30天的监测数据生成一份专业的健康评估报告。\n\n【患者监测数据详情】：\n"
    
    let validCount = 0
    const dataDesc = rawData.value.map(item => {
      let parts = []
      if (selectedTypes.value.includes('glucose') && item.glucose) parts.push(`空腹血糖：${item.glucose}mmol/L`)
      if (selectedTypes.value.includes('bp') && item.systolicBp) parts.push(`血压：${item.systolicBp}/${item.diastolicBp}mmHg`)
      if (selectedTypes.value.includes('heartRate') && item.heartRate) parts.push(`心率：${item.heartRate}bpm`)
      
      if (parts.length > 0) {
        validCount++
        return `日期：${item.recordDate} -> ${parts.join('，')}`
      }
      return null
    }).filter(i => i !== null).join("\n")

    if (validCount === 0) {
      generating.value = false
      return ElMessage.warning('选择的维度无有效数据')
    }

    messagePrompt += dataDesc
    messagePrompt += "\n\n【任务要求】：\n1. 分析数据的波动趋势、最高值/最低值及异常频率。\n2. 给出具体的饮食、运动和就医建议。\n3. 如果数据严重异常，请给予警示。\n4. 返回格式必须为纯JSON结构，包含字段: title(字符串), score(整数0-100), suggestions(字符串数组)。不要包含Markdown。"

    const randomChatId = Math.floor(Math.random() * 1000000) + 100000
    const res = await generateAiReport({
      chatId: randomChatId,
      message: messagePrompt, 
      enableDeepThinking: false, 
      enableRAG: true
    })

    // 你确认 res 已经是正确的数据结构
    if (res) {
      aiReport.title = res.title || '多维健康综合分析报告'
      aiReport.score = Math.round(res.score || 80) 
      aiReport.suggestions = res.suggestions || []
      aiReport.summary = `AI 已完成对您过去 30 天数据的深度建模分析。本次分析涵盖了 ${selectedTypes.value.length} 个维度，共计分析了 ${validCount} 条有效监测记录。综合健康评分为 ${aiReport.score} 分。`
      
      reportReady.value = true
      ElMessage.success('报告生成成功')
      
      // 平滑滚动
      setTimeout(() => {
        const reportElement = document.getElementById('report-section')
        if (reportElement) reportElement.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }

  } catch (error) {
    console.error(error)
    ElMessage.error('生成超时或失败，请重试')
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-700 pb-20">
    
    <div class="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-50 to-transparent pointer-events-none z-0"></div>
    <div class="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none z-0"></div>
    <div class="absolute top-20 -left-20 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none z-0"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-6 py-10">
      
      <div class="flex flex-col items-center mb-12">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mb-4 border border-blue-200 shadow-sm">
          <el-icon><Monitor /></el-icon> AI MEDICAL ANALYSIS
        </div>
        <h1 class="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">AI 智能健康监测报告</h1>
        <p class="text-slate-500 text-base max-w-2xl text-center">
          基于您近30天的真实体征数据，利用大模型生成精准的个性化医疗建议。
        </p>
      </div>

      <div class="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-white/50 mb-10">
        <div class="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div class="flex flex-wrap justify-center gap-4">
            <label class="cursor-pointer group relative" v-for="type in [
              { key: 'glucose', label: '血糖分析', icon: FirstAidKit, color: 'emerald' },
              { key: 'bp', label: '血压分析', icon: TrendCharts, color: 'orange' },
              { key: 'heartRate', label: '心率分析', icon: Lightning, color: 'rose' }
            ]" :key="type.key">
              <input type="checkbox" :value="type.key" v-model="selectedTypes" class="peer hidden">
              
              <div class="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 transition-all duration-300 peer-checked:hidden hover:bg-slate-100">
                <el-icon class="text-lg grayscale opacity-60"><component :is="type.icon" /></el-icon>
                <span class="font-medium text-sm">{{ type.label }}</span>
              </div>

              <div class="hidden peer-checked:flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 shadow-md transform scale-105"
                :class="{
                  'bg-emerald-50 border-emerald-200 text-emerald-700': type.color === 'emerald',
                  'bg-orange-50 border-orange-200 text-orange-700': type.color === 'orange',
                  'bg-rose-50 border-rose-200 text-rose-700': type.color === 'rose'
                }"
              >
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow-sm"
                  :class="{
                    'bg-emerald-500': type.color === 'emerald',
                    'bg-orange-500': type.color === 'orange',
                    'bg-rose-500': type.color === 'rose'
                  }"
                >
                  <el-icon><Check /></el-icon>
                </div>
                <span class="font-bold text-sm">{{ type.label }}</span>
              </div>
            </label>
          </div>

          <div class="flex items-center gap-3">
             <button 
              @click="loadData" 
              class="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              title="刷新数据"
            >
              <el-icon :class="loadingData ? 'animate-spin' : ''"><Refresh /></el-icon>
            </button>

            <button 
              @click="handleGenerateReport"
              :disabled="generating || loadingData"
              class="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <el-icon v-if="generating" class="is-loading"><Loading /></el-icon>
              <el-icon v-else><Star /></el-icon>
              <span>{{ generating ? 'AI 分析中...' : '生成深度报告' }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
        <div class="lg:col-span-4 space-y-6">
          <div class="flex items-center gap-2 mb-2 px-1">
            <h3 class="font-bold text-slate-800 text-lg">数据源概览</h3>
            <span class="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">近30天</span>
          </div>

          <div class="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
             <div class="absolute right-0 top-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
             <div class="flex justify-between items-start mb-4 relative z-10">
               <div class="flex items-center gap-3">
                 <div class="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                   <el-icon class="text-lg"><FirstAidKit /></el-icon>
                 </div>
                 <span class="font-bold text-slate-600">平均血糖</span>
               </div>
               <span v-if="stats.glucose.hasData" class="text-xs font-bold px-2 py-1 rounded-lg" 
                  :class="stats.glucose.status === 'warning' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'">
                  {{ stats.glucose.status === 'warning' ? '偏高' : '正常' }}
               </span>
             </div>
             <div class="flex items-baseline gap-2 relative z-10">
               <span class="text-4xl font-extrabold text-slate-800 tracking-tight">{{ stats.glucose.avg }}</span>
               <span class="text-xs text-slate-400 font-bold uppercase">mmol/L</span>
             </div>
             <div v-if="!stats.glucose.hasData" class="text-xs text-slate-400 mt-2">暂无数据</div>
          </div>

          <div class="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
             <div class="absolute right-0 top-0 w-20 h-20 bg-orange-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
             <div class="flex justify-between items-start mb-4 relative z-10">
               <div class="flex items-center gap-3">
                 <div class="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
                   <el-icon class="text-lg"><TrendCharts /></el-icon>
                 </div>
                 <span class="font-bold text-slate-600">平均血压</span>
               </div>
               <span v-if="stats.bp.hasData" class="text-xs font-bold px-2 py-1 rounded-lg"
                  :class="stats.bp.status === 'warning' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'">
                  {{ stats.bp.status === 'warning' ? '需注意' : '正常' }}
               </span>
             </div>
             <div class="flex items-baseline gap-2 relative z-10">
               <span class="text-4xl font-extrabold text-slate-800 tracking-tight">{{ stats.bp.avgSys }}/{{ stats.bp.avgDia }}</span>
               <span class="text-xs text-slate-400 font-bold uppercase">mmHg</span>
             </div>
             <div v-if="!stats.bp.hasData" class="text-xs text-slate-400 mt-2">暂无数据</div>
          </div>

          <div class="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-rose-500/10 hover:border-rose-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
             <div class="absolute right-0 top-0 w-20 h-20 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110"></div>
             <div class="flex justify-between items-start mb-4 relative z-10">
               <div class="flex items-center gap-3">
                 <div class="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                   <el-icon class="text-lg"><Lightning /></el-icon>
                 </div>
                 <span class="font-bold text-slate-600">平均心率</span>
               </div>
             </div>
             <div class="flex items-baseline gap-2 relative z-10">
               <span class="text-4xl font-extrabold text-slate-800 tracking-tight">{{ stats.heartRate.avg }}</span>
               <span class="text-xs text-slate-400 font-bold uppercase">bpm</span>
             </div>
             <div v-if="!stats.heartRate.hasData" class="text-xs text-slate-400 mt-2">暂无数据</div>
          </div>
        </div>

        <div class="lg:col-span-8 space-y-6" id="report-section">
          
          <div v-if="!reportReady && !generating" class="bg-white/60 backdrop-blur-md rounded-3xl p-10 border border-slate-200 border-dashed text-center min-h-[450px] flex flex-col items-center justify-center">
            <div class="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <el-icon class="text-4xl text-blue-200"><DataAnalysis /></el-icon>
            </div>
            <h3 class="text-xl font-bold text-slate-700 mb-2">等待生成分析报告</h3>
            <p class="text-slate-400 max-w-sm leading-relaxed">请确保左侧有有效数据，并在上方选择需要分析的维度，点击生成按钮开始。</p>
          </div>

          <div v-if="generating" class="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl min-h-[450px] flex flex-col items-center justify-center relative overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/30 to-transparent w-full h-full animate-pulse pointer-events-none"></div>
            <div class="relative z-10 flex flex-col items-center">
               <div class="w-20 h-20 relative mb-8">
                  <div class="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div class="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                  <div class="absolute inset-4 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <el-icon class="text-2xl animate-pulse"><Lightning /></el-icon>
                  </div>
               </div>
               <h3 class="text-xl font-bold text-slate-800 mb-2">AI 正在深度思考</h3>
               <p class="text-slate-500 text-sm">正在检索医疗知识库，比对您的 30 天体征趋势...</p>
            </div>
          </div>

          <transition name="el-fade-in-linear">
            <div v-if="reportReady" class="space-y-6">
              
              <div class="bg-white rounded-3xl p-8 border border-white shadow-xl shadow-blue-500/5 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full -mr-20 -mt-20 z-0 opacity-60"></div>
                <div class="relative z-10">
                  <div class="flex items-start justify-between mb-4">
                     <h2 class="text-2xl font-extrabold text-slate-800">{{ aiReport.title }}</h2>
                     <span class="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-500/30">AI GENERATED</span>
                  </div>
                  
                  <div class="flex gap-5 items-start bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                    <el-icon class="text-blue-600 text-2xl mt-1 flex-shrink-0"><Document /></el-icon>
                    <p class="text-sm text-slate-600 leading-7 text-justify font-medium">
                      {{ aiReport.summary }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-3xl p-8 border border-white shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-10">
                <div class="relative w-40 h-40 flex-shrink-0">
                  <el-progress 
                    type="dashboard" 
                    :percentage="aiReport.score" 
                    :color="[
                      { color: '#f56c6c', percentage: 60 },
                      { color: '#e6a23c', percentage: 80 },
                      { color: '#10b981', percentage: 100 }
                    ]"
                    :width="160"
                    :stroke-width="12"
                    stroke-linecap="round"
                  >
                    <template #default="{ percentage }">
                      <div class="flex flex-col items-center">
                        <span class="text-4xl font-black text-slate-800">{{ percentage }}</span>
                        <span class="text-xs text-slate-400 font-bold uppercase mt-1">Health Score</span>
                      </div>
                    </template>
                  </el-progress>
                </div>
                <div class="flex-1 text-center md:text-left">
                  <h3 class="text-xl font-bold text-slate-800 mb-3">综合健康评估</h3>
                  <p class="text-sm text-slate-500 leading-6 mb-4">
                    根据 AI 模型分析，您的健康状况处于 
                    <span class="font-black text-lg px-2" 
                      :class="aiReport.score >= 80 ? 'text-emerald-500' : aiReport.score >= 60 ? 'text-orange-500' : 'text-red-500'">
                      {{ aiReport.score >= 80 ? '良好 (Good)' : aiReport.score >= 60 ? '一般 (Average)' : '风险 (Risk)' }}
                    </span> 
                    水平。
                  </p>
                  <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000 ease-out"
                         :style="{ width: aiReport.score + '%', backgroundColor: aiReport.score >= 80 ? '#10b981' : aiReport.score >= 60 ? '#f59e0b' : '#ef4444' }">
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-3xl p-8 border border-white shadow-xl shadow-indigo-500/5">
                <div class="flex items-center gap-3 mb-8">
                  <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <el-icon class="text-xl"><Lightning /></el-icon>
                  </div>
                  <h3 class="font-bold text-xl text-slate-800">AI 智能干预方案</h3>
                </div>
                
                <div class="space-y-4">
                  <div 
                    v-for="(item, index) in aiReport.suggestions" 
                    :key="index"
                    class="group flex gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all duration-300"
                    :style="{ animationDelay: index * 100 + 'ms' }" 
                  >
                    <div class="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 transition-colors shadow-sm">
                      {{ index + 1 }}
                    </div>
                    <p class="text-sm text-slate-700 leading-7 font-medium">{{ item }}</p>
                  </div>
                </div>
              </div>
            </div>
          </transition>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 修复进度条字体样式 */
:deep(.el-progress__text) {
  font-family: ui-sans-serif, system-ui, sans-serif;
}
</style>