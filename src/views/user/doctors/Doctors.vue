<script setup>
import { ref, computed } from 'vue'
import { Search, Filter, Timer, StarFilled, Bell, Calendar, ArrowRight, Checked } from '@element-plus/icons-vue' // 引入 Checked 图标
import { ElMessage } from 'element-plus'

// === 1. 状态与筛选 ===
const searchQuery = ref('')
const specialtyFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(8)

// 针对慢性病平台的特定科室
const specialties = ['内分泌科', '心血管内科', '呼吸内科', '神经内科', '肾内科', '康复医学科']

// === 2. 模拟数据：最近合作的专家 ===
const recentConsultations = [
  {
    id: 101,
    name: '李华 主任医师',
    specialty: '内分泌科',
    availability: '今日可审', // 文案调整
    date: '昨天',
    avatarBg: 'bg-blue-100',
    avatarText: '李',
    avatarColor: 'text-blue-600'
  },
  {
    id: 102,
    name: '张伟 副主任医师',
    specialty: '心血管内科',
    availability: '明日可审',
    date: '2周前',
    avatarBg: 'bg-green-100',
    avatarText: '张',
    avatarColor: 'text-green-600'
  }
]

// === 3. 模拟数据：医生列表 ===
const chronicTags = {
  '内分泌科': ['糖尿病', '甲状腺', '痛风', '肥胖症'],
  '心血管内科': ['高血压', '冠心病', '心衰', '动脉硬化'],
  '呼吸内科': ['慢阻肺', '哮喘', '慢性咳嗽', '肺结节'],
  '神经内科': ['脑卒中康复', '帕金森', '偏头痛', '癫痫'],
  '肾内科': ['慢性肾炎', '肾功能不全', '尿毒症'],
  '康复医学科': ['运动康复', '术后恢复', '疼痛管理']
}

const allDoctors = Array.from({ length: 24 }).map((_, index) => {
  const specialty = specialties[index % specialties.length]
  const tags = chronicTags[specialty] || []
  
  return {
    id: index + 1,
    name: ['王强', '陈静', '刘洋', '赵敏', '孙赫', '周杰'][index % 6] + (index + 1),
    title: ['主任医师', '副主任医师', '主治医师'][index % 3],
    specialty: specialty,
    rating: (4.6 + Math.random() * 0.4).toFixed(1),
    reviewCount: Math.floor(Math.random() * 300) + 80, // 这里代表“已审核次数”
    // 逻辑调整：今日名额限制
    availability: index % 3 === 0 ? '名额充足' : (index % 3 === 1 ? '仅剩1席' : '今日额满'),
    availabilityType: index % 3 === 0 ? 'success' : (index % 3 === 1 ? 'warning' : 'info'),
    tags: tags.slice(0, 2),
    isOnline: Math.random() > 0.4,
    avatarBg: ['bg-orange-50', 'bg-purple-50', 'bg-pink-50', 'bg-indigo-50'][index % 4],
    avatarText: ['王', '陈', '刘', '赵', '孙', '周'][index % 6]
  }
})

// === 4. 计算属性 ===
const filteredDoctors = computed(() => {
  return allDoctors.filter(doc => {
    const matchQuery = doc.name.includes(searchQuery.value) || 
                       doc.specialty.includes(searchQuery.value) ||
                       doc.tags.some(t => t.includes(searchQuery.value))
    const matchSpecialty = !specialtyFilter.value || doc.specialty === specialtyFilter.value
    return matchQuery && matchSpecialty
  })
})

const paginatedDoctors = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredDoctors.value.slice(start, end)
})

// === 5. 核心逻辑方法 ===
const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleFilter = () => {
  currentPage.value = 1
  ElMessage.success('筛选已更新')
}

// 🔥 核心改名：applyAudit (申请审核)
const handleApplyAudit = (doctor) => {
  if (doctor.availability === '今日额满') {
    ElMessage.warning(`抱歉，${doctor.name} 今日审核名额（3个）已用完，请明天再试。`)
  } else {
    // 这里模拟发送请求
    ElMessage.success({
      message: `已邀请 ${doctor.name} 审核您的AI问诊记录，请留意消息通知。`,
      duration: 3000
    })
    // 实际逻辑：调用后端接口，把当前对话ID传给医生
    // api.audit.apply({ doctorId: doctor.id, conversationId: currentId })
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8 min-h-screen pb-10">
    
    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">专家介入审核 👨‍⚕️</h1>
        <p class="text-slate-500 mt-1">邀请三甲专家对 AI 诊断结果进行二次复核，确保方案准确安全</p>
        <p class="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <el-icon><Checked /></el-icon>
          注: 为保证审核质量，每位专家每日仅接受 3 次 AI 问答复核申请
        </p>
      </div>
      <div class="flex gap-3">
        <el-button type="primary" color="#3b82f6" :icon="Calendar" class="!px-6 !font-bold !rounded-xl shadow-md hover:shadow-lg transition-all">
          我的审核记录
        </el-button>
      </div>
    </div>

    <section v-if="recentConsultations.length > 0">
      <div class="mb-4">
        <h2 class="text-lg font-bold text-slate-800">最近合作专家</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div v-for="item in recentConsultations" :key="item.id" class="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
          <div class="flex items-center gap-4">
            <div :class="['w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold transition-colors', item.avatarBg, item.avatarColor]">
              {{ item.avatarText }}
            </div>
            <div>
              <div class="font-bold text-slate-800 text-lg">{{ item.name }}</div>
              <div class="text-xs text-slate-500 mt-0.5">{{ item.specialty }} • 上次审核: {{ item.date }}</div>
            </div>
          </div>
          <div>
            <el-button 
              type="primary" 
              plain 
              round
              class="!font-bold !border-blue-200 hover:!bg-blue-50"
              @click="handleApplyAudit(item)"
            >
              再次邀请审核
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white p-5 rounded-3xl shadow-md border border-slate-100/80 flex flex-col lg:flex-row items-center gap-4 transition-all hover:shadow-lg">
      <div class="flex-1 w-full lg:w-auto">
        <el-input
          v-model="searchQuery"
          placeholder="搜索专家姓名 / 专科方向..."
          size="large"
          class="w-full search-input-custom"
          :prefix-icon="Search"
          clearable
          @keyup.enter="handleFilter"
        />
      </div>

      <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
        <el-select 
          v-model="specialtyFilter" 
          placeholder="选择审核专科" 
          size="large" 
          class="w-full sm:w-56 filter-select-custom" 
          clearable
        >
          <template #prefix><el-icon class="text-slate-400"><Filter /></el-icon></template>
          <el-option v-for="item in specialties" :key="item" :label="item" :value="item" />
        </el-select>
        
        <el-button 
          size="large" 
          type="primary" 
          color="#3b82f6" 
          :icon="Search" 
          class="w-full sm:w-auto !font-bold !px-8 !rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
          @click="handleFilter"
        >
          查找专家
        </el-button>
      </div>
    </section>

    <section>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-slate-800">可邀请专家</h2>
        <span class="text-sm text-slate-500">共找到 {{ filteredDoctors.length }} 位审核专家</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div v-for="doc in paginatedDoctors" :key="doc.id" class="bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center text-center relative overflow-hidden">
          
          <span v-if="doc.isOnline" class="absolute top-4 right-4 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span class="text-[10px] text-green-600 font-bold">在线</span>
          </span>

          <div :class="['w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-sm transition-transform group-hover:scale-110', doc.avatarBg, 'text-slate-700']">
            {{ doc.avatarText }}
          </div>

          <h3 class="text-lg font-bold text-slate-800">{{ doc.name }}</h3>
          <div class="text-sm text-brand-blue font-medium mb-1">{{ doc.specialty }} · {{ doc.title }}</div>
          
          <div class="flex items-center gap-1 mb-4">
            <el-icon class="text-yellow-400"><StarFilled /></el-icon>
            <span class="text-sm font-bold text-slate-700">{{ doc.rating }}</span>
            <span class="text-xs text-slate-400">({{ doc.reviewCount }} 次审核)</span>
          </div>

          <div class="flex flex-wrap justify-center gap-2 mb-4 h-[28px] overflow-hidden">
             <span v-for="tag in doc.tags" :key="tag" class="px-2 py-0.5 rounded text-[10px] bg-slate-50 text-slate-500 border border-slate-100">
               {{ tag }}
             </span>
          </div>

          <div class="w-full mt-auto space-y-3">
             <div class="flex justify-center items-center gap-2 text-xs">
                <el-icon :class="doc.availabilityType === 'success' ? 'text-green-500' : (doc.availabilityType === 'warning' ? 'text-orange-500' : 'text-slate-400')"><Timer /></el-icon>
                <span :class="doc.availabilityType === 'success' ? 'font-bold text-green-600' : (doc.availabilityType === 'warning' ? 'font-bold text-orange-500' : 'text-slate-500')">
                  {{ doc.availability }}
                </span>
             </div>

             <button 
                @click="handleApplyAudit(doc)"
                class="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2"
                :class="doc.availability === '今日额满' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-blue-600 shadow-md hover:shadow-lg active:scale-95'"
             >
                <span>{{ doc.availability === '今日额满' ? '今日额满' : '申请专家审核' }}</span>
                <el-icon v-if="doc.availability !== '今日额满'"><ArrowRight /></el-icon>
             </button>
          </div>

        </div>
      </div>
    </section>

    <div class="flex justify-center mt-12 pb-8">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="filteredDoctors.length"
        :page-size="pageSize"
        v-model:current-page="currentPage"
        @current-change="handlePageChange"
      />
    </div>

  </div>
</template>

<style scoped>
/* 样式保持不变，复用之前的 Tailwind 风格 */
:deep(.search-input-custom .el-input__wrapper),
:deep(.filter-select-custom .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: none !important;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  background-color: #f8fafc;
  transition: all 0.3s;
}

:deep(.search-input-custom .el-input__wrapper:hover),
:deep(.filter-select-custom .el-input__wrapper:hover) {
    background-color: #fff;
    border-color: #cbd5e1;
}

:deep(.search-input-custom .el-input__wrapper.is-focus),
:deep(.filter-select-custom.is-focus .el-input__wrapper) {
  border-color: #3b82f6;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #3b82f6;
}
:deep(.el-pagination.is-background .el-pager li) {
  border-radius: 8px;
  background-color: #fff;
  border: 1px solid #e2e8f0;
}
</style>

