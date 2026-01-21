<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import HealthTrendChart from '@/components/charts/HealthTrendChart.vue'
import { getHealthStatistics } from '@/api/health'
import dayjs from 'dayjs'

const router = useRouter()
const username = ref('用户')
const currentType = ref('last7Days')
const isLoading = ref(false)

const chartData = ref({
  dates: [],
  glucose: [],
  systolic: [],
  diastolic: [],
  heartRate: []
})

const vitals = ref([
  { 
    id: 'heart',
    label: '心率', value: '--', unit: 'bpm', 
    status: '暂无数据', statusType: 'info',
    measureTime: '--:--', tag: '静息',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    iconBg: 'bg-green-100', iconColor: 'text-green-600'
  },
  { 
    id: 'glucose',
    label: '血糖水平', value: '--', unit: 'mmol/L', 
    status: '暂无数据', statusType: 'info',
    measureTime: '--:--', tag: '☀️ 晨起空腹', // 🔥 固定标签
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', 
    iconBg: 'bg-blue-100', iconColor: 'text-brand-blue'
  },
  { 
    id: 'bp',
    label: '血压', value: '--/--', unit: 'mmHg', 
    status: '暂无数据', statusType: 'info',
    measureTime: '--:--', tag: '☀️ 晨起',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z', 
    iconBg: 'bg-orange-100', iconColor: 'text-orange-600' 
  },
])

onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    const userInfo = JSON.parse(userInfoStr)
    username.value = userInfo.nickname || userInfo.username
    fetchHealthData('last7Days')
  } else {
    ElMessage.warning('请先登录')
    router.push('/login')
  }
})

const fetchHealthData = async (type) => {
  currentType.value = type
  isLoading.value = true
  try {
    const res = await getHealthStatistics({ type })
    const backendList = res.healthList || (res.data && res.data.healthList) || []
    processChartData(backendList, type)
    updateTodayVitals(backendList)
  } catch (error) {
    console.error("获取数据失败", error)
  } finally {
    isLoading.value = false
  }
}

const processChartData = (dataList, type) => {
  const dates = [], systolic = [], diastolic = [], glucose = [], heartRate = []
  const daysCount = type === 'last7Days' ? 7 : 30
  
  // ❌ 之前的错误写法：时间冻结
  // const today = dayjs('2026-01-20') 

  // ✅ 修正后的写法：使用当前真实时间
  const today = dayjs() 

  for (let i = daysCount - 1; i >= 0; i--) {
    // 动态生成最近7天的日期字符串
    const dateStr = today.subtract(i, 'day').format('YYYY-MM-DD')
    dates.push(dateStr)
    
    const record = dataList.find(item => item.recordDate === dateStr)
    if (record) {
      systolic.push(record.systolicBp)
      diastolic.push(record.diastolicBp)
      glucose.push(record.glucose)
      heartRate.push(record.heartRate)
    } else {
      systolic.push(0); diastolic.push(0); glucose.push(0); heartRate.push(0)
    }
  }
  chartData.value = { dates, systolic, diastolic, glucose, heartRate }
}

// 🔥 核心更新：严格的【空腹血糖】评判标准
const analyzeGlucoseFasting = (val) => {
  const num = parseFloat(val)
  
  if (num < 3.9) return { text: '低血糖(危险)', type: 'danger' } // < 3.9
  if (num <= 6.1) return { text: '血糖正常', type: 'success' }    // 3.9 - 6.1
  if (num <= 7.0) return { text: '空腹受损', type: 'warning' }    // 6.1 - 7.0 (警戒)
  return { text: '血糖偏高', type: 'danger' }                     // > 7.0
}

// 血压标准
const analyzeBloodPressure = (sys, dia) => {
  const s = parseInt(sys)
  const d = parseInt(dia)
  if (s >= 140 || d >= 90) return { text: '血压偏高', type: 'danger' }
  if (s < 90 || d < 60) return { text: '血压偏低', type: 'warning' }
  if ((s >= 120 && s <= 139) || (d >= 80 && d <= 89)) return { text: '正常高值', type: 'warning' }
  return { text: '理想血压', type: 'success' }
}

const updateTodayVitals = (dataList) => {
  // 🔥 调试重点：
  // 如果你数据库里的数据是 "2026-01-20"，但今天是 "2026-01-21"，
  // 请暂时取消下面第一行的注释，注释掉第二行，否则永远查不到数据。
  
  // const todayStr = '2026-01-20' // 🛠️ 调试用：强制指定有数据的日期
  const todayStr = dayjs().format('YYYY-MM-DD') // 🚀 生产用：获取系统今天日期

  console.log('正在查找日期:', todayStr)
  
  const todayRecord = dataList.find(item => item.recordDate === todayStr)

  if (todayRecord) {
    // ===========================
    // 1. 心率 (Heart Rate) 修复
    // ===========================
    vitals.value[0].value = todayRecord.heartRate
    const hr = parseInt(todayRecord.heartRate) // 强制转数字

    if (hr > 100) {
        vitals.value[0].status = '心率过快'
        vitals.value[0].statusType = 'danger'
    } else if (hr < 60) {
        vitals.value[0].status = '心率过慢'
        vitals.value[0].statusType = 'warning'
    } else {
        // ✅ 核心修复：这里包含了 [60, 100] 的区间
        vitals.value[0].status = '心率正常'
        vitals.value[0].statusType = 'success'
    }

    // ===========================
    // 2. 血糖 (Glucose)
    // ===========================
    vitals.value[1].value = todayRecord.glucose
    const gluStatus = analyzeGlucoseFasting(todayRecord.glucose) // 调用你上面定义好的函数
    vitals.value[1].status = gluStatus.text
    vitals.value[1].statusType = gluStatus.type

    // ===========================
    // 3. 血压 (Blood Pressure)
    // ===========================
    vitals.value[2].value = `${todayRecord.systolicBp}/${todayRecord.diastolicBp}`
    const bpStatus = analyzeBloodPressure(todayRecord.systolicBp, todayRecord.diastolicBp) // 调用你上面定义好的函数
    vitals.value[2].status = bpStatus.text
    vitals.value[2].statusType = bpStatus.type

    // 更新测量时间 (如果有这个字段的话，没有就显示当前时间)
    const timeStr = dayjs().format('HH:mm')
    vitals.value.forEach(v => v.measureTime = timeStr)

  } else {
    // 没有找到今天的数据 -> 重置为默认
    vitals.value.forEach(v => {
        v.value = '--'
        v.status = '暂无数据'
        v.statusType = 'info'
        v.measureTime = '--:--'
    })
    vitals.value[2].value = '--/--'
  }
}
</script>

<template>
  <div class="space-y-8 max-w-6xl">
    <div>
      <h1 class="text-3xl font-bold text-slate-800">你好啊😘, {{ username }}</h1>
      <p class="text-slate-500 mt-2">这是您今天的健康数据摘要。</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="item in vitals" :key="item.label" class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
        
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
                <div class="text-slate-500 text-sm font-medium">{{ item.label }}</div>
                
                <span v-if="item.tag" :class="[
                    'text-[10px] px-1.5 py-0.5 rounded border',
                    'bg-slate-50 text-slate-400 border-slate-100'
                ]">
                    {{ item.tag }}
                </span>
            </div>
            
            <div class="flex items-baseline gap-1.5">
              <span class="text-4xl font-bold text-slate-800 tracking-tight">{{ item.value }}</span>
              <span class="text-sm text-slate-400 font-medium translate-y-[-2px]">{{ item.unit }}</span>
            </div>
          </div>

          <div :class="['w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-colors shadow-sm', item.iconBg, item.iconColor]">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path>
             </svg>
          </div>
        </div>

        <div class="h-px bg-slate-50 w-full mb-4"></div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
             <span :class="['w-2 h-2 rounded-full', 
               item.statusType === 'success' ? 'bg-green-500' : 
               (item.statusType === 'warning' ? 'bg-orange-500' : 
               (item.statusType === 'danger' ? 'bg-red-500' : 'bg-slate-400'))
             ]"></span>
             <span :class="['text-xs font-bold', 
               item.statusType === 'success' ? 'text-green-600' : 
               (item.statusType === 'warning' ? 'text-orange-600' : 
               (item.statusType === 'danger' ? 'text-red-600' : 'text-slate-500'))
             ]">
               {{ item.status }}
             </span>
          </div>

          <button 
            @click.stop="router.push('/user/settings')"
            class="group/btn flex items-center gap-1 text-xs font-bold text-brand-blue bg-blue-50/80 hover:bg-brand-blue hover:text-white px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer active:scale-95"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
            <span>录入</span>
            <svg class="w-3 h-3 opacity-0 -ml-2 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

      </div>
    </div>

    <div class="bg-white p-8 rounded-3xl shadow-sm border border-slate-100/50" v-loading="isLoading">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h3 class="font-bold text-xl text-slate-800">实时趋势分析</h3>
          <p class="text-slate-400 text-sm mt-1">监测指标：血糖 (蓝线) & 血压 (橙线)</p>
        </div>
        <div class="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button @click="fetchHealthData('last7Days')" :class="['px-4 py-1.5 text-xs font-bold rounded-lg transition-all', currentType === 'last7Days' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500']">本周</button>
          <button @click="fetchHealthData('month')" :class="['px-4 py-1.5 text-xs font-bold rounded-lg transition-all', currentType === 'month' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500']">本月</button>
        </div>
      </div>
      <div class="h-80 w-full">
        <HealthTrendChart :chartData="chartData" />
      </div>
    </div>
    
  </div>
</template>