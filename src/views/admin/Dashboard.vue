<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { User, FirstAidKit, OfficeBuilding, Plus } from '@element-plus/icons-vue'
// 引入 API
import { getDashboardStatistics } from '@/api/report'

// === 1. 顶部卡片数据 (响应式) ===
// 我们用 reactive 包裹，方便直接更新里面的 value
const stats = reactive([
  {
    key: 'totalUser', // 自定义key，方便匹配
    title: '用户总数',
    value: '0', // 初始值
    icon: User,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50'
  },
  {
    key: 'doctorCount',
    title: '在职医生数',
    value: '0',
    icon: FirstAidKit,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50'
  },
  {
    key: 'deptCount',
    title: '科室总数',
    value: '0',
    icon: OfficeBuilding,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50'
  },
  {
    key: 'newUserToday',
    title: '当日新增用户',
    value: '0',
    icon: Plus,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-50'
  },
])

// === 2. 图表相关 ===
const chartRef = ref(null)
let myChart = null
const timeRange = ref('last7Days') // 默认查近7天，对应后端 type 参数

// === 3. 核心：加载数据并渲染 ===
const loadData = async () => {
  try {
    // 调用接口，传入当前选择的时间范围
    const res = await getDashboardStatistics(timeRange.value)

    const data = res 
    // A. 更新顶部卡片数字
    stats[1].value = data.doctorCount
    stats[2].value = data.deptCount
    
    // 取 newUserList 数组的最后一个值作为“当日新增”
    const totalArr = data.totalUserList ? data.totalUserList.split(',') : []
    const newArr = data.newUserList ? data.newUserList.split(',') : []
    
    if (totalArr.length > 0) stats[0].value = totalArr[totalArr.length - 1]
    if (newArr.length > 0) stats[3].value = newArr[newArr.length - 1]

    // B. 更新图表
    updateChart(data)

  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

// 初始化图表实例
const initChart = () => {
  if (!chartRef.value) return
  myChart = echarts.init(chartRef.value)
  // 先设置一个空的基础配置，数据等 loadData 填进去
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#E2E8F0',
      textStyle: { color: '#1E293B' }
    },
    legend: {
      data: ['当日新增', '总用户数'],
      bottom: 0,
      icon: 'circle'
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [], // 待填充
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94A3B8' }
    },
    yAxis: [
      { type: 'value', name: '新增人数', position: 'left', splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } }, axisLabel: { color: '#94A3B8' } },
      { type: 'value', name: '总用户数', position: 'right', splitLine: { show: false }, axisLabel: { color: '#94A3B8' } }
    ],
    series: [
      {
        name: '当日新增',
        type: 'line',
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: '#3B82F6' },
        itemStyle: { color: '#3B82F6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.01)' }
          ])
        },
        data: [] // 待填充
      },
      {
        name: '总用户数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, type: 'dashed', color: '#10B981' },
        itemStyle: { color: '#10B981' },
        data: [] // 待填充
      }
    ]
  }
  myChart.setOption(option)
}

// 更新图表数据
const updateChart = (data) => {
  if (!myChart) return

  // 后端返回的是逗号分隔的字符串，需要转为数组
  const dateList = data.dateList ? data.dateList.split(',') : []
  const newUserList = data.newUserList ? data.newUserList.split(',') : []
  const totalUserList = data.totalUserList ? data.totalUserList.split(',') : []

  myChart.setOption({
    xAxis: {
      data: dateList
    },
    series: [
      {
        name: '当日新增',
        data: newUserList
      },
      {
        name: '总用户数',
        data: totalUserList
      }
    ]
  })
}

// 切换时间范围 (近7天 / 近30天)
const handleTimeChange = (type) => {
  timeRange.value = type
  loadData() // 重新请求数据
}

// 响应式调整
const handleResize = () => myChart && myChart.resize()

onMounted(() => {
  initChart()
  loadData() // 页面加载时请求数据
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (myChart) myChart.dispose()
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="(item, index) in stats" :key="index" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="text-slate-500 text-sm font-medium mb-1">{{ item.title }}</div>
            <div class="text-3xl font-bold text-slate-800">{{ item.value }}</div>
          </div>
          <div :class="['p-3 rounded-xl', item.iconBg]">
            <component :is="item.icon" :class="['w-6 h-6', item.iconColor]" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-lg font-bold text-slate-800">用户增长趋势</h3>
          <p class="text-slate-400 text-sm mt-1">过去{{ timeRange === 'last7Days' ? '7' : '30' }}天的每日活跃及新增用户数据</p>
        </div>
        <div class="bg-slate-100 p-1 rounded-lg flex text-xs font-bold text-slate-500">
          <button 
            @click="handleTimeChange('last7Days')"
            :class="['px-4 py-1.5 rounded-md transition-all', timeRange === 'last7Days' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700']"
          >
            近7天
          </button>
          <button 
            @click="handleTimeChange('last30Days')"
            :class="['px-4 py-1.5 rounded-md transition-all', timeRange === 'last30Days' ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700']"
          >
            近30天
          </button>
        </div>
      </div>
      
      <div ref="chartRef" class="w-full h-[400px]"></div>
    </div>
  </div>
</template>