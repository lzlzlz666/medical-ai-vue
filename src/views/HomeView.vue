<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goToLogin = () => router.push('/login')
const goToApp = () => router.push('/user/ai-consult')
</script>

<template>
  <div class="home-container">
    <nav class="navbar">
      <div class="nav-content">
        <div class="logo" @click="router.push('/')">
          <div class="logo-box">✚</div>
          <span class="logo-text">MediCore<span class="text-brand-blue">.ai</span></span>
        </div>
        
        <div class="nav-links">
          <a href="#">平台能力</a>
          <a href="#">解决方案</a>
          <a href="#">临床研究</a>
          <a href="#">关于我们</a>
        </div>

        <div class="nav-actions">
          <button @click="goToLogin" class="btn-text">登录</button>
          <button @click="goToApp" class="btn-dark">免费试用</button>
        </div>
      </div>
    </nav>

    <section class="hero-section">
      <div class="hero-grid">
        <div class="hero-text animate-stagger-in">
          <div class="status-badge">
            <span class="status-dot">
              <span class="ping"></span>
              <span class="dot"></span>
            </span>
            V3.0 系统实时在线
          </div>
          
          <h1 class="main-heading">
            数据驱动的 <br/>
            <span class="gradient-text">心脏智能</span> 引擎
          </h1>
          
          <p class="description">
            国内首个融合“多模态数据融合”与“生成式 AI”的企业级慢病管理平台。
          </p>
          
          <div class="cta-group">
            <button @click="goToApp" class="btn-primary group">
              立即开始体验 <span class="arrow">→</span>
            </button>
            <button class="btn-secondary">
              <span class="play-icon">▶</span> 观看演示
            </button>
          </div>

          <div class="trust-indicators">
             <div class="trust-item"><span>✔</span> 三甲医院合作</div>
             <div class="trust-item"><span>✔</span> 99.9% 诊断准确率</div>
          </div>
        </div>

        <div class="hero-visual perspective-container">
          <div class="dashboard-card group">
            <div class="dash-header">
              <div class="dots">
                <div class="d d-red"></div>
                <div class="d d-yellow"></div>
                <div class="d d-green"></div>
              </div>
              <div class="status">● SYSTEM NOMINAL</div>
            </div>

            <div class="dash-content">
              <div class="dash-left">
                <div class="stat-box">
                  <div class="label">HEART RATE</div>
                  <div class="value">78 <span class="unit">bpm</span></div>
                </div>
                <div class="stat-box active">
                  <div class="label">BLOOD PRESSURE</div>
                  <div class="value">120/80</div>
                  <div class="sub-status">● 正常范围</div>
                </div>
              </div>
              <div class="dash-chart">
                <div class="chart-bars">
                  <div class="bar" style="height: 40%"></div>
                  <div class="bar" style="height: 70%"></div>
                  <div class="bar" style="height: 50%"></div>
                  <div class="bar" style="height: 80%"></div>
                  <div class="bar" style="height: 60%"></div>
                  <div class="bar" style="height: 90%"></div>
                  <div class="bar" style="height: 45%"></div>
                </div>
                <div class="float-tag">AI 实时分析中...</div>
              </div>
            </div>
          </div>
          <div class="glow-bg"></div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="section-container">
        <div class="section-header">
          <span class="sub-label">WORKFLOW</span>
          <h2>从多源数据到精准诊断</h2>
          <p>只需三步，将复杂的生物特征转化为可执行的医疗洞察。</p>
        </div>

        <div class="features-grid">
          <div class="feature-card group">
            <div class="card-bg-num">1</div>
            <div class="icon-box bg-blue-50 text-brand-blue">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3>多模态数据采集</h3>
            <p>无缝接入可穿戴设备、EMR 电子病历及患者主诉文本，实现全维度数据实时汇聚。</p>
          </div>
           <div class="feature-card group">
             <div class="card-bg-num">2</div>
            <div class="icon-box bg-teal-50 text-brand-teal">
               <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
            </div>
            <h3>AI 智能分析引擎</h3>
            <p>基于 RAG 检索增强生成技术，对比百万级医疗知识图谱，精准识别异常风险。</p>
          </div>
           <div class="feature-card group">
             <div class="card-bg-num">3</div>
            <div class="icon-box bg-purple-50 text-purple-600">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h3>个性化干预方案</h3>
            <p>自动生成饮食、运动及用药建议，并实时推送至医生端审核，形成闭环管理。</p>
          </div>
        </div>
      </div>
    </section>

    <section class="preview-section">
      <div class="preview-grid">
        <div class="text-content">
          <h2>全景式 <br/> 患者监控驾驶舱</h2>
          <p class="preview-desc">
            体验深色模式下的沉浸式指挥中心。通过 ECharts 实时渲染的心电图与血压趋势，让每一处细微的生命体征波动都尽在掌握。
          </p>
          <ul class="check-list">
            <li>
              <span class="check-icon">✓</span> 
              <span>支持 <strong class="text-gray-900">百万级</strong> 数据点秒级渲染</span>
            </li>
             <li>
              <span class="check-icon">✓</span> 
              <span>集成 <strong class="text-gray-900">远程视频问诊</strong> 模块</span>
            </li>
            <li>
              <span class="check-icon">✓</span> 
              <span>自动化 <strong class="text-gray-900">风险分级</strong> 预警</span>
            </li>
          </ul>
          <button @click="goToApp" class="btn-explore group">
            探索驾驶舱功能 <span class="circle-arrow">→</span>
          </button>
        </div>
        
        <div class="ui-mockup-container group" @click="goToApp">
            <div class="mockup-bg-glow"></div>
            <div class="mockup-card">
              <div class="dash-header">
                <div class="dots">
                  <div class="d d-red"></div>
                  <div class="d d-yellow"></div>
                  <div class="d d-green"></div>
                </div>
                <div class="status">● SYSTEM NOMINAL</div>
              </div>
              
              <div class="grid grid-cols-3 gap-4">
                <div class="col-span-1 space-y-4">
                  <div class="stat-box">
                    <div class="label">OXYGEN (SPO2)</div>
                    <div class="value">98 <span class="unit">%</span></div>
                    <div class="text-[10px] text-gray-500 mt-1">Last updated: 1m ago</div>
                  </div>
                   <div class="stat-box active">
                    <div class="label">BLOOD PRESSURE</div>
                    <div class="value">120/80</div>
                    <div class="sub-status">● Optimal Range</div>
                  </div>
                </div>
                <div class="col-span-2 bg-gray-800/30 rounded-xl p-4 relative border border-gray-700/50 overflow-hidden flex items-center justify-center">
                   <div class="absolute inset-0 bg-gradient-to-t from-brand-blue/5 to-transparent"></div>
                   <div class="w-full h-12 flex items-center gap-1 opacity-50">
                      <div class="w-1 h-3 bg-brand-blue rounded-full animate-pulse"></div>
                      <div class="w-1 h-8 bg-brand-blue rounded-full"></div>
                      <div class="w-1 h-5 bg-brand-blue rounded-full"></div>
                      <div class="w-1 h-10 bg-brand-blue rounded-full animate-bounce"></div>
                      <div class="w-1 h-4 bg-brand-blue rounded-full"></div>
                      <div class="w-1 h-6 bg-brand-blue rounded-full"></div>
                      <div class="w-1 h-2 bg-brand-blue rounded-full"></div>
                      <div class="w-1 h-8 bg-brand-blue rounded-full"></div>
                      <div v-for="i in 10" :key="i" class="w-1 bg-brand-blue rounded-full" :style="{height: Math.random() * 40 + 'px'}"></div>
                   </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>

    <footer class="footer">
        <div class="footer-content">
            <div class="footer-logo">
               <span class="text-brand-blue font-bold text-xl">✚</span>
               <span class="font-bold text-lg">MediCore.ai</span>
            </div>
            <p>© 2026 Precision Medicine Platform. Designed for Graduation Project.</p>
        </div>
    </footer>
  </div>
</template>

<style scoped>
/* === 基础容器 === */
.home-container {
  @apply min-h-screen bg-white font-sans text-gray-900 selection:bg-brand-blue selection:text-white;
}

/* === 导航栏 === */
.navbar { @apply fixed top-0 w-full bg-white/80 backdrop-blur-lg z-50 border-b border-gray-100 transition-all duration-300; }
.nav-content { @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between; }
.logo { @apply flex items-center gap-2 cursor-pointer; }
.logo-box { @apply w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-teal rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30; }
.logo-text { @apply text-gray-900 font-bold text-xl tracking-tight; }
.nav-links { @apply hidden md:flex gap-10 text-sm font-medium text-gray-500; }
.nav-links a { @apply hover:text-brand-blue transition-colors; }
.nav-actions { @apply flex items-center gap-4; }
.btn-text { @apply text-sm font-semibold text-gray-600 hover:text-brand-blue transition-colors; }
.btn-dark { @apply bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300; }

/* === Hero 区域 === */
.hero-section { @apply pt-40 pb-24 px-4 max-w-7xl mx-auto overflow-hidden; }
.hero-grid { @apply grid md:grid-cols-2 gap-16 items-center; }
.hero-text { @apply space-y-8; }
.status-badge { @apply inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-brand-blue px-4 py-1.5 rounded-full text-xs font-bold tracking-wide; }
.status-dot { @apply relative flex h-2 w-2; }
.ping { @apply animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75; }
.dot { @apply relative inline-flex rounded-full h-2 w-2 bg-brand-blue; }
.main-heading { @apply text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight; }
.gradient-text { @apply text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-teal; }
.description { @apply text-gray-500 text-lg leading-relaxed max-w-lg; }
.cta-group { @apply flex gap-4 pt-2; }
.btn-primary { @apply bg-brand-blue text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-blue-500/30 hover:bg-blue-600 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2; }
.arrow { @apply group-hover:translate-x-1 transition-transform; }
.btn-secondary { @apply px-8 py-4 rounded-full font-bold text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all duration-300 flex items-center gap-2; }
.play-icon { @apply w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs; }
.trust-indicators { @apply flex gap-8 text-sm font-medium text-gray-400 pt-4 border-t border-gray-100; }
.trust-item { @apply flex items-center gap-2; }
.trust-item span { @apply text-green-500 font-bold; }

/* === Hero右侧 & Dashboard 通用样式 === */
.hero-visual, .ui-mockup-container { @apply relative cursor-pointer; }
.perspective-container { perspective: 1000px; }
.dashboard-card, .mockup-card {
  @apply bg-[#0F172A] rounded-[2.5rem] p-6 aspect-video md:aspect-square relative flex flex-col shadow-2xl shadow-blue-900/20 border border-gray-800 transform transition-transform duration-500 hover:rotate-1;
}
/* 复用之前的 dashboard 内部样式 */
.dash-header { @apply flex items-center justify-between mb-6 border-b border-gray-800 pb-4; }
.dots { @apply flex gap-2; }
.d { @apply w-3 h-3 rounded-full; }
.d-red { @apply bg-red-500; }
.d-yellow { @apply bg-yellow-500; }
.d-green { @apply bg-green-500; }
.status { @apply text-[10px] font-mono text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 animate-pulse; }
.dash-content { @apply flex-1 grid grid-cols-2 gap-4; }
.dash-left { @apply flex flex-col gap-4; }
.stat-box { @apply bg-gray-800/50 p-4 rounded-xl border border-gray-700/50; }
.stat-box.active { @apply border-l-4 border-brand-blue border-y border-r border-gray-700/50; }
.label { @apply text-[10px] text-gray-400 mb-1; }
.value { @apply text-3xl font-bold font-mono text-white; }
.unit { @apply text-sm font-normal text-gray-500; }
.sub-status { @apply text-xs text-green-400 mt-2; }
.dash-chart { @apply bg-gray-800/30 rounded-xl p-4 relative border border-gray-700/50 overflow-hidden flex items-end; }
.chart-bars { @apply w-full h-full flex items-end justify-between gap-2 z-10; }
.bar { @apply w-full bg-brand-blue/60 rounded-t-sm hover:bg-brand-blue transition-all duration-300; }
.float-tag { @apply absolute top-4 left-4 bg-white/10 text-white text-[10px] px-2 py-1 rounded backdrop-blur; }
.glow-bg { @apply absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-blue/20 blur-[100px] rounded-full; }

/* === 特性介绍区 === */
.features-section { @apply bg-slate-50 py-24; }
.section-container { @apply max-w-7xl mx-auto px-4; }
.section-header { @apply text-center mb-20 max-w-2xl mx-auto; }
.sub-label { @apply text-brand-blue text-xs font-bold uppercase tracking-[0.2em] mb-3 block; }
.section-header h2 { @apply text-3xl md:text-4xl font-bold text-gray-900 mb-4; }
.section-header p { @apply text-gray-500; }

.features-grid { @apply grid md:grid-cols-3 gap-8; }
.feature-card { @apply bg-white p-10 rounded-3xl shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-2 transition-all duration-300 border border-gray-100 relative overflow-hidden; }
.card-bg-num { @apply absolute top-0 right-0 p-8 opacity-5 text-9xl font-black text-gray-900 select-none group-hover:opacity-10 transition-opacity; }
.icon-box { @apply w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300; }
.feature-card h3 { @apply font-bold text-xl mb-4 text-gray-900; }
.feature-card p { @apply text-gray-500 text-sm leading-relaxed; }

/* === 预览区 === */
.preview-section { @apply py-24 max-w-7xl mx-auto px-4; }
.preview-grid { @apply grid md:grid-cols-2 gap-20 items-center; }
.text-content h2 { @apply text-3xl md:text-4xl font-bold mb-6 text-gray-900; }
.preview-desc { @apply text-gray-500 mb-8 leading-relaxed text-lg; }
.check-list { @apply space-y-5; }
.check-list li { @apply flex items-center gap-4 text-gray-700; }
.check-icon { @apply w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold; }
.btn-explore { @apply mt-10 text-brand-blue font-bold flex items-center gap-2 hover:gap-4 transition-all; }
.circle-arrow { @apply bg-blue-50 w-6 h-6 rounded-full flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors; }

.mockup-bg-glow { @apply absolute -inset-1 bg-gradient-to-r from-blue-600 to-teal-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200; }

/* === Footer === */
.footer { @apply bg-white border-t border-gray-100 py-12; }
.footer-content { @apply max-w-7xl mx-auto px-4 text-center; }
.footer-logo { @apply flex justify-center items-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all; }
.footer-content p { @apply text-gray-400 text-sm; }
</style>