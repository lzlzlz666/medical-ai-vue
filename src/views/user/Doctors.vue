<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Timer, ArrowRight, CircleCloseFilled, WarningFilled, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus' 
import { getDoctorPage, applyDoctorAudit,cancelDoctorAudit } from '@/api/doctor'
import { getDepartments } from '@/api/department'

const router = useRouter() 

// === 1. 状态管理 ===
const loading = ref(false)
const searchQuery = ref('') 
const specialtyFilter = ref('') 
const isOnlineOnly = ref(false) 
const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0) 

const departmentList = ref([]) 
const doctorList = ref([]) 

// === 2. 静态配置 ===
const chronicTagsMap = {
  '内分泌科': ['糖尿病', '甲状腺', '痛风'],
  '心血管内科': ['高血压', '冠心病', '心衰'],
  '呼吸与危重症医学科': ['慢阻肺', '哮喘', '肺结节'],
  '神经内科': ['脑卒中', '帕金森', '失眠'],
  'default': ['慢病管理', '健康咨询']
}
const avatarColors = [
  { bg: 'bg-orange-50', text: 'text-orange-600' },
  { bg: 'bg-purple-50', text: 'text-purple-600' },
  { bg: 'bg-blue-50', text: 'text-blue-600' },
  { bg: 'bg-teal-50', text: 'text-teal-600' }
]

// === 3. 数据获取 ===
const loadDepartments = async () => {
  try {
    const res = await getDepartments() 
    departmentList.value = res || []
  } catch (error) {
    console.error('获取科室失败', error)
  }
}

const loadDoctors = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      realName: searchQuery.value || null, 
      deptId: specialtyFilter.value || null,
      workStatus: isOnlineOnly.value ? 1 : null 
    }

    const res = await getDoctorPage(params)
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

// 🔥🔥 数据处理核心逻辑 (修改) 🔥🔥
const processDoctorData = (doc, index) => {
  const colorStyle = avatarColors[index % avatarColors.length]
  const deptName = doc.deptName || '综合科'
  
  // 1. 基础状态
  const isBanned = doc.status === 0
  const isOffline = doc.workStatus === 0
  const hasQuota = doc.maxDailyAudit > 0
  
  // 2. 申请状态 (新增)
  // 假设后端返回 doc.isApply === 1 代表申请中
  const isApplying = doc.isApply === 1

  // 3. 计算按钮能否点击 
  // 逻辑：如果是申请中，任何情况下(除非封号)都应该能点取消；
  // 如果没申请，则需判断在线且有名额
  const canOperate = !isBanned && (isApplying || (!isOffline && hasQuota))

  // 4. 生成按钮文案和样式类型
  let btnText = ''
  let btnType = 'primary' // 默认蓝色

  if (isBanned) {
    btnText = '账号异常'
    btnType = 'disabled'
  } else if (isApplying) {
    btnText = '申请中 (点击取消)'
    btnType = 'warning' // 橙色/黄色，表示待定状态
  } else if (isOffline) {
    btnText = '暂不接诊'
    btnType = 'disabled'
  } else if (!hasQuota) {
    btnText = '今日额满'
    btnType = 'disabled'
  } else {
    btnText = '申请专家审核'
    btnType = 'primary'
  }

  // 5. 右上角状态文案 (Availability Text)
  let statusText = ''
  if (isBanned) statusText = '账号异常'
  else if (isApplying) statusText = '已提交申请'
  else if (isOffline) statusText = '暂不接诊'
  else if (!hasQuota) statusText = '今日额满'
  else statusText = `剩余名额 ${doc.maxDailyAudit}`

  return {
    ...doc,
    avatarUrl: doc.avatar, 
    avatarText: doc.realName ? doc.realName.charAt(0) : '医', 
    avatarBg: colorStyle.bg,
    avatarColor: colorStyle.text,
    tags: chronicTagsMap[deptName] || chronicTagsMap['default'],
    
    // 状态标识
    isBanned, 
    isOffline,
    isApplying, // 是否申请中
    canOperate, // 是否可操作(申请或取消)
    
    // UI展示
    btnText,
    btnType,
    statusText
  }
}

// === 4. 事件处理 (修改) ===
const handleFilter = () => {
  currentPage.value = 1 
  loadDoctors()
  ElMessage.success('列表已更新')
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadDoctors()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 🔥 核心修改：统一处理申请和取消
const handleApplyOrCancel = (doctor) => {
  // 1. 账号封禁拦截
  if (doctor.isBanned) {
    ElMessage.error('该医生账号目前处于禁用状态。')
    return
  }

  // === 分支A：如果是申请中 -> 执行取消逻辑 ===
  if (doctor.isApplying) {
    ElMessageBox.confirm(
      `您确定要撤回向 ${doctor.realName} 医生的审核申请吗？`,
      '取消申请',
      {
        confirmButtonText: '确定撤回',
        cancelButtonText: '保持申请',
        type: 'warning',
        icon: 'WarningFilled'
      }
    ).then(async () => {
      try {
        // 调用取消接口
        await cancelDoctorAudit(doctor.id) 
        ElMessage.success('申请已成功撤回')
        loadDoctors() // 刷新列表更新状态
      } catch (error) {
        console.error('取消失败', error)
      }
    }).catch(() => {})
    return
  }

  // === 分支B：如果是未申请 -> 执行申请逻辑 ===
  
  // 检查状态
  if (doctor.isOffline) {
    ElMessage.warning('该医生当前离线，请稍后再试。')
    return
  }
  if (!doctor.maxDailyAudit || doctor.maxDailyAudit <= 0) {
    ElMessage.warning(`抱歉，${doctor.realName} 当前名额已满。`)
    return
  }

  ElMessageBox.confirm(
    `确定向 ${doctor.realName} 医生发起复核申请吗？此操作将消耗一次名额。`,
    '申请确认',
    {
      confirmButtonText: '立即申请',
      cancelButtonText: '再想想',
      type: 'info',
      icon: 'UserFilled'
    }
  ).then(async () => {
    try {
      await applyDoctorAudit(doctor.id) 
      ElMessage.success('申请提交成功')
      // 申请成功后，不跳转，直接刷新列表变成“申请中”状态
      loadDoctors() 
    } catch (error) {
      console.error('申请失败', error)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadDepartments()
  loadDoctors()
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-8 min-h-screen pb-12 font-sans text-slate-600" v-loading="loading">
    
    <div class="flex flex-col md:flex-row justify-between items-end gap-4 pb-2 border-b border-slate-100">
      <div>
        <h1 class="text-3xl font-bold text-slate-800 tracking-tight">专家介入审核 <span class="text-2xl">👨‍⚕️</span></h1>
        <p class="text-slate-500 mt-2 text-sm">邀请三甲医院权威专家对 AI 诊断结果进行二次复核，双重保障。</p>
      </div>
    </div>

    <section class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center gap-4 sticky top-0 z-10 backdrop-blur-md bg-white/90">
      <div class="flex-1 w-full lg:w-auto">
        <el-input v-model="searchQuery" placeholder="搜索专家姓名..." size="large" class="w-full search-input-custom" :prefix-icon="Search" clearable @clear="handleFilter" @keyup.enter="handleFilter" />
      </div>
      <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
        <el-select v-model="specialtyFilter" placeholder="全部科室" size="large" class="w-full sm:w-48 filter-select-custom" clearable @change="handleFilter">
          <template #prefix><el-icon class="text-slate-400"><Filter /></el-icon></template>
          <el-option v-for="item in departmentList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-checkbox v-model="isOnlineOnly" label="仅看在线" size="large" border class="!mr-0 !rounded-xl !bg-slate-50 !border-slate-200" @change="handleFilter" />
        <el-button size="large" type="primary" color="#3b82f6" :icon="Search" class="w-full sm:w-auto !font-bold !px-6 !rounded-xl shadow-lg shadow-blue-100" @click="handleFilter">查找专家</el-button>
      </div>
    </section>

    <section>
      <div class="flex justify-between items-center mb-6 px-1">
        <h2 class="text-lg font-bold text-slate-800">专家列表</h2>
        <span class="text-xs font-medium bg-slate-100 px-2 py-1 rounded text-slate-500">共 {{ total }} 位</span>
      </div>

      <div v-if="doctorList.length === 0 && !loading" class="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <div class="text-4xl mb-4">🔍</div>
        <p class="text-slate-400">暂无符合条件的医生，换个条件试试？</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div 
          v-for="doc in doctorList" 
          :key="doc.id" 
          class="bg-white rounded-2xl p-6 border border-slate-100 transition-all duration-300 group flex flex-col items-center text-center relative hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-blue-200 hover:-translate-y-1"
          :class="{ 'opacity-80 grayscale-[0.8]': doc.isBanned }" 
        >
          <div class="absolute top-4 right-4">
             <span v-if="doc.isBanned" class="flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
               <el-icon class="text-red-500 text-xs"><CircleCloseFilled /></el-icon>
               <span class="text-[10px] text-red-600 font-bold">禁用</span>
             </span>
             <span v-else-if="doc.isApplying" class="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
               <span class="text-[10px] text-orange-600 font-bold">审核中</span>
             </span>
             <span v-else-if="!doc.isOffline" class="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
               <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
               <span class="text-[10px] text-emerald-600 font-bold">在线</span>
             </span>
             <span v-else class="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 flex items-center gap-1">
               <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>离线
             </span>
          </div>

          <div class="mb-4 relative">
             <img v-if="doc.avatarUrl" :src="doc.avatarUrl" class="w-20 h-20 rounded-full object-cover shadow-sm border-2 border-white group-hover:scale-105 transition-transform duration-300" :class="{ 'grayscale': doc.isBanned || doc.isOffline }" />
             <div v-else :class="['w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-sm transition-transform group-hover:scale-105 duration-300', doc.avatarBg, doc.avatarColor]" :style="doc.isBanned || doc.isOffline ? 'filter: grayscale(1); opacity: 0.7' : ''">
               {{ doc.avatarText }}
             </div>
          </div>

          <h3 class="text-lg font-bold text-slate-800 mb-1" :class="{ 'line-through decoration-slate-400 decoration-2 text-slate-400': doc.isBanned }">
            {{ doc.realName }}
          </h3>
          <div class="text-xs text-slate-500 font-medium mb-3 bg-slate-50 px-2 py-1 rounded border border-slate-100">
             {{ doc.deptName || '暂无科室' }} <span class="mx-1 text-slate-300">|</span> {{ doc.title || '医师' }}
          </div>
          
          <div class="flex flex-wrap justify-center gap-1.5 mb-6 min-h-[24px]">
             <span v-for="tag in doc.tags.slice(0, 3)" :key="tag" class="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600/80 font-medium">{{ tag }}</span>
          </div>

          <div class="w-full mt-auto space-y-3 pt-4 border-t border-slate-50">
             <div class="flex justify-between items-center text-xs px-2">
                <span class="text-slate-400">接诊状态</span>
                <span :class="[
                  doc.isBanned ? 'text-red-500 font-bold' : 
                  doc.isApplying ? 'text-orange-500 font-bold' :
                  doc.isOffline ? 'text-slate-400' : 
                  !doc.canAudit ? 'text-orange-500' : 
                  'font-bold text-emerald-600'
                ]">
                  {{ doc.statusText }}
                </span>
             </div>

             <button 
                @click="handleApplyOrCancel(doc)"
                :disabled="!doc.canOperate"
                class="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                :class="[
                  // 1. 禁用样式
                  doc.btnType === 'disabled' 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                    
                  // 2. 申请中(取消)样式 - 橙色
                  : doc.btnType === 'warning'
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                    
                  // 3. 默认申请样式 - 蓝色渐变
                  : 'bg-gradient-to-r from-brand-blue to-blue-600 text-white shadow-md hover:shadow-lg active:scale-95 bg-blue-500' 
                ]"
             >
                {{ doc.btnText }}

                <el-icon v-if="doc.isApplying" class="transition-transform"><RefreshLeft /></el-icon>
                <el-icon v-else-if="!doc.isBanned && !doc.isOffline && !doc.isApplying && doc.canAudit" class="transition-transform group-hover/btn:translate-x-1"><ArrowRight /></el-icon>
             </button>
          </div>

        </div>
      </div>
    </section>

    <div class="flex justify-center mt-12" v-if="total > 0">
      <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="handlePageChange" />
    </div>

  </div>
</template>

<style scoped>
/* 样式复用 */
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