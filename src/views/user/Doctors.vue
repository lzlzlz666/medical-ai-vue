<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { Search, Filter, Timer, StarFilled, ArrowRight, Checked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
// 引入刚刚定义的 API
import { getDoctorPage } from '@/api/doctor'
import { getDepartments } from '@/api/department'

// === 1. 状态管理 ===
const loading = ref(false)
const searchQuery = ref('') // 对应 realName
const specialtyFilter = ref('') // 对应 deptId (注意：现在存的是 ID)
const isOnlineOnly = ref(false) // 新增：只看在线医生
const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0) // 总条数

const departmentList = ref([]) // 真实科室列表
const doctorList = ref([]) // 真实医生列表

// === 2. 静态配置（用于 UI 美化，后端没存这些） ===
// 慢性病标签映射 (前端根据科室名手动匹配，保持界面好看)
const chronicTagsMap = {
  '内分泌科': ['糖尿病', '甲状腺', '痛风'],
  '心血管内科': ['高血压', '冠心病', '心衰'],
  '呼吸与危重症医学科': ['慢阻肺', '哮喘', '肺结节'],
  '神经内科': ['脑卒中', '帕金森', '失眠'],
  // 默认兜底
  'default': ['慢病管理', '健康咨询']
}
// 头像背景色池
const avatarColors = [
  { bg: 'bg-orange-50', text: 'text-orange-600' },
  { bg: 'bg-purple-50', text: 'text-purple-600' },
  { bg: 'bg-blue-50', text: 'text-blue-600' },
  { bg: 'bg-teal-50', text: 'text-teal-600' }
]

// === 3. 数据获取逻辑 ===

// 获取科室列表
const loadDepartments = async () => {
  try {
    const res = await getDepartments() // res 已经是 data 数组了 (request.js处理过)
    departmentList.value = res || []
  } catch (error) {
    console.error('获取科室失败', error)
  }
}

// 获取医生分页数据
const loadDoctors = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      realName: searchQuery.value || null, // 空字符串转 null
      deptId: specialtyFilter.value || null,
      workStatus: isOnlineOnly.value ? 1 : null // 勾选则只查 status=1 (在线)
    }

    const res = await getDoctorPage(params)
    // 根据你的截图，res 结构是 { total, records: [...] }
    if (res) {
      doctorList.value = res.records.map((doc, index) => processDoctorData(doc, index))
      total.value = res.total
    }
  } catch (error) {
    console.error('获取医生列表失败', error)
  } finally {
    loading.value = false
  }
}

// 数据预处理：把后端数据转成前端 UI 需要的格式
const processDoctorData = (doc, index) => {
  const colorStyle = avatarColors[index % avatarColors.length]
  const deptName = doc.deptName || '综合科'
  
  return {
    ...doc,
    // 如果后端没头像，取名字第一个字
    avatarText: doc.realName ? doc.realName.charAt(0) : '医', 
    avatarBg: colorStyle.bg,
    avatarColor: colorStyle.text,
    
    // 标签匹配
    tags: chronicTagsMap[deptName] || chronicTagsMap['default'],
    
    // 状态逻辑转换
    isOnline: doc.workStatus === 1,
    availabilityText: doc.workStatus === 1 ? `今日还可被 ${doc.maxDailyAudit || 0} 人申请` : '暂不在线',
    canAudit: doc.workStatus === 1 && doc.maxDailyAudit > 0
  }
}

// === 4. 事件处理 ===

// 搜索/筛选触发
const handleFilter = () => {
  currentPage.value = 1 // 重置到第一页
  loadDoctors()
  ElMessage.success('列表已更新')
}

// 翻页
const handlePageChange = (page) => {
  currentPage.value = page
  loadDoctors()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 申请审核
const handleApplyAudit = (doctor) => {
  if (!doctor.canAudit) {
    ElMessage.warning(`抱歉，${doctor.realName} 当前无法接受审核申请。`)
    return
  }
  ElMessage.success({
    message: `已向 ${doctor.realName} 发送审核邀请`,
    duration: 3000
  })
}

// === 5. 初始化 ===
onMounted(() => {
  loadDepartments()
  loadDoctors()
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8 min-h-screen pb-10" v-loading="loading">
    
    <div class="flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">专家介入审核 👨‍⚕️</h1>
        <p class="text-slate-500 mt-1">邀请三甲专家对 AI 诊断结果进行二次复核</p>
      </div>
    </div>

    <section class="bg-white p-5 rounded-3xl shadow-md border border-slate-100/80 flex flex-col lg:flex-row items-center gap-4">
      <div class="flex-1 w-full lg:w-auto">
        <el-input
          v-model="searchQuery"
          placeholder="搜索专家姓名..."
          size="large"
          class="w-full search-input-custom"
          :prefix-icon="Search"
          clearable
          @clear="handleFilter"
          @keyup.enter="handleFilter"
        />
      </div>

      <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
        <el-select 
          v-model="specialtyFilter" 
          placeholder="全科室" 
          size="large" 
          class="w-full sm:w-56 filter-select-custom" 
          clearable
          @change="handleFilter"
        >
          <template #prefix><el-icon class="text-slate-400"><Filter /></el-icon></template>
          <el-option 
            v-for="item in departmentList" 
            :key="item.id" 
            :label="item.name" 
            :value="item.id" 
          />
        </el-select>
        
        <el-checkbox 
            v-model="isOnlineOnly" 
            label="仅看在线" 
            size="large" 
            border 
            class="!mr-0 !rounded-xl !bg-slate-50"
            @change="handleFilter"
        />

        <el-button 
          size="large" 
          type="primary" 
          color="#3b82f6" 
          :icon="Search" 
          class="w-full sm:w-auto !font-bold !px-8 !rounded-xl"
          @click="handleFilter"
        >
          查找
        </el-button>
      </div>
    </section>

    <section>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-lg font-bold text-slate-800">专家列表</h2>
        <span class="text-sm text-slate-500">共找到 {{ total }} 位专家</span>
      </div>

      <div v-if="doctorList.length === 0 && !loading" class="text-center py-20 text-slate-400">
        <p>暂无符合条件的医生</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div v-for="doc in doctorList" :key="doc.id" class="bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center text-center relative overflow-hidden">
          
          <span v-if="doc.isOnline" class="absolute top-4 right-4 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span class="text-[10px] text-green-600 font-bold">在线</span>
          </span>
          <span v-else class="absolute top-4 right-4 text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">离线</span>

          <div :class="['w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-sm transition-transform group-hover:scale-110', doc.avatarBg, doc.avatarColor]">
            {{ doc.avatarText }}
          </div>

          <h3 class="text-lg font-bold text-slate-800">{{ doc.realName }}</h3>
          <div class="text-sm text-brand-blue font-medium mb-1">
             {{ doc.deptName || '暂无科室' }} · {{ doc.title || '医师' }}
          </div>
          
          <div class="flex flex-wrap justify-center gap-2 mb-4 h-[28px] overflow-hidden mt-2">
             <span v-for="tag in doc.tags" :key="tag" class="px-2 py-0.5 rounded text-[10px] bg-slate-50 text-slate-500 border border-slate-100">
               {{ tag }}
             </span>
          </div>

          <div class="w-full mt-auto space-y-3">
             <div class="flex justify-center items-center gap-2 text-xs">
                <el-icon :class="doc.canAudit ? 'text-green-500' : 'text-slate-400'"><Timer /></el-icon>
                <span :class="doc.canAudit ? 'font-bold text-green-600' : 'text-slate-500'">
                  {{ doc.availabilityText }}
                </span>
             </div>

             <button 
                @click="handleApplyAudit(doc)"
                :disabled="!doc.canAudit"
                class="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2"
                :class="!doc.canAudit ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:bg-blue-600 shadow-md hover:shadow-lg active:scale-95'"
             >
                <span>{{ doc.canAudit ? '申请专家审核' : '暂不可用' }}</span>
                <el-icon v-if="doc.canAudit"><ArrowRight /></el-icon>
             </button>
          </div>

        </div>
      </div>
    </section>

    <div class="flex justify-center mt-12 pb-8" v-if="total > 0">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        v-model:current-page="currentPage"
        @current-change="handlePageChange"
      />
    </div>

  </div>
</template>

<style scoped>
/* 样式与之前保持一致 */
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
</style>