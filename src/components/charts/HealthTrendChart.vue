<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

// 接收父组件传来的数据
const props = defineProps({
  chartData: {
    type: Object,
    default: () => ({
      dates: [],
      glucose: [],
      systolic: [],
      diastolic: [],
      heartRate: []
    })
  }
})

const chartRef = ref(null)
let myChart = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  myChart = echarts.init(chartRef.value)
  setOptions()
  
  window.addEventListener('resize', resizeChart)
}

// 配置项 (核心)
const setOptions = () => {
  if (!myChart) return

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['收缩压', '舒张压', '血糖', '心率'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.chartData.dates, // X轴日期
      axisLine: { lineStyle: { color: '#94a3b8' } }
    },
    // 🔥 双 Y 轴配置
    yAxis: [
      {
        type: 'value',
        name: '血压/心率',
        position: 'left',
        min: 0,
        max: 200, // 血压一般不超过200
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      {
        type: 'value',
        name: '血糖 (mmol/L)',
        position: 'right', // 放在右边
        min: 0,
        max: 20, // 血糖一般不超过20
        axisLabel: { color: '#3b82f6' },
        splitLine: { show: false } // 右轴不显示网格线，防止太乱
      }
    ],
    series: [
      {
        name: '收缩压',
        type: 'line',
        smooth: true,
        yAxisIndex: 0, // 使用左轴
        data: props.chartData.systolic,
        itemStyle: { color: '#f97316' }, // 橙色
        lineStyle: { width: 3 }
      },
      {
        name: '舒张压',
        type: 'line',
        smooth: true,
        yAxisIndex: 0, // 使用左轴
        data: props.chartData.diastolic,
        itemStyle: { color: '#fdba74' }, // 浅橙色
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(253, 186, 116, 0.5)' },
            { offset: 1, color: 'rgba(253, 186, 116, 0.0)' }
          ])
        }
      },
      {
        name: '心率',
        type: 'line',
        smooth: true,
        yAxisIndex: 0, // 使用左轴
        data: props.chartData.heartRate,
        itemStyle: { color: '#ef4444' }, // 红色
        lineStyle: { type: 'dashed' }
      },
      {
        name: '血糖',
        type: 'line',
        smooth: true,
        yAxisIndex: 1, // 🔥 这里关键：使用右轴 (index 1)
        data: props.chartData.glucose,
        itemStyle: { color: '#3b82f6' }, // 蓝色
        symbolSize: 6
      }
    ]
  }
  myChart.setOption(option)
}

const resizeChart = () => myChart?.resize()

// 监听数据变化，重新渲染
watch(() => props.chartData, setOptions, { deep: true })

onMounted(initChart)
onUnmounted(() => window.removeEventListener('resize', resizeChart))
</script>

<template>
  <div ref="chartRef" class="w-full h-full"></div>
</template>