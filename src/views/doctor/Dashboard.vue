<template>
  <div class="workbench-container">
    <header class="page-header">
      <div class="header-content">
        <h1 class="app-title">
          <span class="brand-blue">COMMAND CENTER</span>
          <span class="divider">/</span>
          医生工作台
        </h1>
        <div class="system-status">
          <span class="status-dot pulse"></span>
          AI 知识引擎实时运行中
        </div>
      </div>
    </header>

    <section class="metrics-section">
      <div class="metric-card card-pending">
        <div class="card-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <div class="card-text">
          <span class="label">今日待处理申请</span>
          <span class="value">12</span>
        </div>
        <div class="card-tag">PRIORITY</div>
      </div>

      <div class="metric-card card-capacity">
        <div class="card-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div class="card-text">
          <span class="label">今日剩余可接纳人数</span>
          <div class="value-group">
            <span class="value">3</span>
            <span class="total">/ 20</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: 85%"></div>
          </div>
        </div>
      </div>

      <div class="metric-card card-total">
        <div class="card-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div class="card-text">
          <span class="label">本月接受总数</span>
          <span class="value">128</span>
        </div>
      </div>
    </section>

    <main class="graph-wrapper" ref="graphContainerRef">
      <div class="graph-card">
        <div class="graph-header">
          <div class="title-box">
            <span class="indicator"></span>
            <h3>慢性病多维知识空间</h3>
            <span class="subtitle">Multi-dimensional Knowledge Graph</span>
          </div>
          <div class="legend-box">
            <span class="legend-item"><i class="dot core"></i> 核心病种</span>
            <span class="legend-item"><i class="dot relation"></i> 并发症/关联</span>
          </div>
        </div>

        <div class="echarts-canvas" ref="chartRef"></div>

        <div class="ai-float-card">
          <div class="card-header">AI PREDICTION</div>
          <div class="card-body">
            <div class="icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
            <div class="info">
              <div class="main">高危风险预警</div>
              <div class="sub">匹配率 98.2%</div>
            </div>
          </div>
        </div>

        <div class="control-bar">
          <div class="control-group">
            <button class="ctrl-btn" @click="handleZoomIn" title="放大">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </button>
            <button class="ctrl-btn" @click="handleZoomOut" title="缩小">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </button>
            <button class="ctrl-btn" @click="handleReset" title="重置视图">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              <span class="btn-text">重置分布</span>
            </button>
            <button class="ctrl-btn" @click="handleFullscreen" title="全屏查看">
              <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

// Refs
const chartRef = ref(null);
const graphContainerRef = ref(null);
let myChart = null;

// 图谱配色 (深色背景下的高亮色)
const colors = {
  center: '#00D2FF', // 核心蓝
  disease: '#2E93fA', // 病种蓝
  complication: '#00E396', // 并发症绿
  symptom: '#FEB019', // 症状黄
  warn: '#FF4560' // 警告红
};

// 节点数据
const graphNodes = [
  { id: '0', name: '慢性病管理\nCORE_ENGINE', category: 0, symbolSize: 100, fixed: true, x: 400, y: 300 }, // 固定中心
  
  { id: '1', name: '糖尿病\nDiabetes', category: 1, symbolSize: 70 },
  { id: '2', name: '高血压\nHypertension', category: 1, symbolSize: 70 },
  { id: '3', name: '冠心病\nCHD', category: 1, symbolSize: 70 },
  
  { id: '11', name: '空腹血糖', category: 2, symbolSize: 45 },
  { id: '12', name: '视网膜病变', category: 2, symbolSize: 40 },
  { id: '21', name: '头晕头痛', category: 3, symbolSize: 40 },
  { id: '22', name: '脑卒中风险', category: 4, symbolSize: 50 },
  { id: '31', name: '心绞痛', category: 3, symbolSize: 40 },
  { id: '32', name: '动脉硬化', category: 2, symbolSize: 50 },
  
  { id: '4', name: '哮喘', category: 1, symbolSize: 60 },
  { id: '41', name: '呼吸困难', category: 3, symbolSize: 35 },
];

const graphLinks = [
  { source: '0', target: '1' }, { source: '0', target: '2' }, { source: '0', target: '3' }, { source: '0', target: '4' },
  { source: '1', target: '11' }, { source: '1', target: '12' },
  { source: '2', target: '21' }, { source: '2', target: '22' },
  { source: '3', target: '31' }, { source: '3', target: '32' },
  { source: '1', target: '32' }, // 交叉：糖尿病->动脉硬化
  { source: '2', target: '32' }, // 交叉：高血压->动脉硬化
  { source: '32', target: '3' }, // 动脉硬化->冠心病
  { source: '4', target: '41' }
];

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return;
  myChart = echarts.init(chartRef.value);

  // 处理节点样式 (光晕效果)
  const data = graphNodes.map(node => {
    let color = colors.disease;
    if (node.category === 0) color = colors.center;
    if (node.category === 2) color = colors.complication;
    if (node.category === 3) color = colors.symptom;
    if (node.category === 4) color = colors.warn;

    return {
      ...node,
      itemStyle: {
        color: 'rgba(0,0,0,0.6)', // 内部半透明
        borderColor: color,
        borderWidth: 2,
        shadowBlur: 20,
        shadowColor: color // 外发光
      },
      label: {
        show: true,
        formatter: '{b}',
        color: '#fff',
        fontSize: node.symbolSize > 60 ? 12 : 10,
        fontWeight: 'bold',
        textShadowBlur: 5,
        textShadowColor: color
      }
    };
  });

  const option = {
    backgroundColor: 'transparent', // 透明背景，使用 CSS 背景
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: data,
        links: graphLinks,
        roam: true, // 允许缩放和平移
        draggable: true,
        zoom: 0.8,
        label: { position: 'inside' },
        force: {
          repulsion: 1000,
          gravity: 0.05,
          edgeLength: [80, 200],
          layoutAnimation: true
        },
        lineStyle: {
          color: '#374151', // 深灰线条
          curveness: 0.1,
          width: 1.5,
          opacity: 0.6
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3, color: '#00E5FF', opacity: 1 }
        }
      }
    ]
  };

  myChart.setOption(option);
  window.addEventListener('resize', resizeChart);
};

const resizeChart = () => myChart?.resize();

// --- 🔥🔥🔥 按钮功能实现 🔥🔥🔥 ---

// 1. 放大
const handleZoomIn = () => {
  if (!myChart) return;
  const currentZoom = myChart.getOption().series[0].zoom;
  myChart.setOption({ series: [{ zoom: currentZoom * 1.2 }] });
};

// 2. 缩小
const handleZoomOut = () => {
  if (!myChart) return;
  const currentZoom = myChart.getOption().series[0].zoom;
  myChart.setOption({ series: [{ zoom: currentZoom * 0.8 }] });
};

// 3. 重置 (恢复初始位置和缩放)
const handleReset = () => {
  if (!myChart) return;
  myChart.setOption({
    series: [{
      zoom: 0.8, // 恢复初始 zoom
      center: null // 居中
    }]
  });
};

// 4. 全屏
const handleFullscreen = () => {
  if (!graphContainerRef.value) return;
  if (!document.fullscreenElement) {
    graphContainerRef.value.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};

onMounted(() => {
  setTimeout(initChart, 100);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  myChart?.dispose();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');

/* 全局容器 */
.workbench-container {
  min-height: 100vh;
  background-color: #F3F6F9; /* 浅色背景 */
  font-family: 'Inter', sans-serif;
  padding: 24px 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 1. 顶部 Header */
.page-header {
  margin-bottom: 24px;
}
.header-content {
  display: flex; justify-content: space-between; align-items: center;
}
.app-title {
  margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: 0.5px;
}
.brand-blue { color: #165DFF; }
.divider { color: #cbd5e1; margin: 0 8px; font-weight: 300; }
.system-status {
  font-size: 12px; color: #64748b; background: #fff; padding: 6px 12px; border-radius: 20px;
  display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.status-dot { width: 6px; height: 6px; background: #10b981; border-radius: 50%; }
.pulse { animation: pulse 2s infinite; }
@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

/* 2. 指标卡片 (Metrics) */
.metrics-section {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 24px;
}
.metric-card {
  background: #fff; border-radius: 16px; padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02); border: 1px solid #fff;
  display: flex; align-items: flex-start; gap: 16px; position: relative; overflow: hidden;
  transition: transform 0.2s;
}
.metric-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.05); }

.card-icon-wrapper {
  width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.card-icon-wrapper svg { width: 24px; height: 24px; }

.card-text { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.card-text .label { font-size: 13px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
.card-text .value { font-size: 28px; font-weight: 800; color: #1e293b; line-height: 1; }

/* 待处理 (Blue) */
.card-pending .card-icon-wrapper { background: #E8F3FF; color: #165DFF; }
.card-tag { position: absolute; top: 16px; right: 16px; background: #165DFF; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; }

/* 剩余名额 (Green) */
.card-capacity .card-icon-wrapper { background: #E8FFEA; color: #00B42A; }
.value-group { display: flex; align-items: baseline; gap: 4px; }
.total { font-size: 14px; color: #94a3b8; font-weight: 600; }
.progress-bar-bg { width: 100%; height: 4px; background: #f1f5f9; border-radius: 2px; margin-top: 10px; }
.progress-bar-fill { height: 100%; background: #00B42A; border-radius: 2px; }

/* 本月总数 (Purple) */
.card-total .card-icon-wrapper { background: #F5F2FF; color: #722ED1; }

/* 3. 知识图谱 (Graph) - 重点打造深色炫酷感 */
.graph-wrapper { flex: 1; min-height: 500px; display: flex; flex-direction: column; }
.graph-card {
  flex: 1; background: #0B1120; /* 深色背景 */
  border-radius: 20px; overflow: hidden; position: relative;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  display: flex; flex-direction: column;
}

/* 图谱 Header */
.graph-header {
  position: absolute; top: 0; left: 0; right: 0; padding: 20px 30px;
  display: flex; justify-content: space-between; align-items: flex-start; z-index: 10;
}
.title-box { display: flex; align-items: center; gap: 10px; }
.title-box .indicator { width: 8px; height: 8px; background: #00E5FF; border-radius: 50%; box-shadow: 0 0 10px #00E5FF; }
.title-box h3 { margin: 0; color: #fff; font-size: 16px; font-weight: 700; }
.title-box .subtitle { color: #64748b; font-size: 12px; margin-left: 8px; }

.legend-box { display: flex; gap: 15px; }
.legend-item { color: #94a3b8; font-size: 12px; display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.core { background: #00E5FF; }
.dot.relation { background: #00E396; }

/* ECharts 容器 */
.echarts-canvas { flex: 1; width: 100%; height: 100%; }

/* AI 悬浮卡片 */
.ai-float-card {
  position: absolute; top: 50%; right: 30px; transform: translateY(-50%);
  width: 180px; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px;
  z-index: 5;
}
.ai-float-card .card-header { font-size: 10px; color: #64748b; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px; }
.ai-float-card .card-body { display: flex; align-items: center; gap: 10px; }
.ai-float-card .icon-box { width: 32px; height: 32px; background: rgba(0, 229, 255, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.ai-float-card .icon-box svg { width: 18px; height: 18px; }
.ai-float-card .info .main { color: #fff; font-size: 12px; font-weight: 600; margin-bottom: 2px; }
.ai-float-card .info .sub { color: #00E5FF; font-size: 10px; }

/* 底部控制栏 */
.control-bar {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(8px);
  padding: 6px 10px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1);
  display: flex; gap: 4px; z-index: 20;
}
.control-group { display: flex; align-items: center; gap: 4px; }
.ctrl-btn {
  background: transparent; border: none; color: #94a3b8; cursor: pointer;
  padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.ctrl-btn svg { width: 18px; height: 18px; }
.ctrl-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
.ctrl-btn .btn-text { font-size: 12px; margin-left: 6px; font-weight: 500; }
/* 特殊样式的重置按钮 */
.ctrl-btn:nth-child(3) { border-radius: 20px; padding: 8px 16px; background: #165DFF; color: #fff; }
.ctrl-btn:nth-child(3):hover { background: #1352d1; }

/* 响应式 */
@media (max-width: 1024px) {
  .metrics-section { grid-template-columns: 1fr; }
  .ai-float-card { display: none; }
}
</style>