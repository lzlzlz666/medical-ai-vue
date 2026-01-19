<script setup>
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref(null)

onMounted(() => {
  const myChart = echarts.init(chartRef.value)
  
  const option = {
    // 悬浮提示框美化
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#f1f5f9',
      borderWidth: 1,
      textStyle: { color: '#334155', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 12px;'
    },
    // 边距调整
    grid: { left: '2%', right: '2%', bottom: '0%', top: '5%', containLabel: true },
    xAxis: { 
      type: 'category', 
      boundaryGap: false, 
      data: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'], 
      axisLine: { show: false }, 
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11, margin: 15 }
    },
    yAxis: { 
      type: 'value', 
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
      axisLabel: { show: false } // 隐藏Y轴数值，更干净
    },
    series: [
      {
        name: '血糖',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: [5.2, 6.1, 7.8, 6.5, 5.4, 5.8],
        itemStyle: { color: '#0066FF', borderColor: '#fff', borderWidth: 2 },
        lineStyle: { width: 3, shadowColor: 'rgba(0,102,255,0.2)', shadowBlur: 10 },
      },
      {
        name: '血压',
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: [118, 120, 122, 119, 121, 120],
        itemStyle: { color: '#22c55e' },
        lineStyle: { type: 'dashed', width: 3, color: '#22c55e' }
      }
    ]
  }

  myChart.setOption(option)
  window.addEventListener('resize', () => myChart.resize())
})
</script>
<template><div ref="chartRef" class="w-full h-full"></div></template>