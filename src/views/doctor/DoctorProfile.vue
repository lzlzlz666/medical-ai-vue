<template>
  <div class="profile-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="title">个人资料与状态</h2>
        <p class="subtitle">查看您的执业信息，实时管理接诊状态</p>
      </div>
      <div class="header-right">
        <el-badge is-dot class="notification-badge">
          <el-button circle :icon="Bell" class="icon-btn" />
        </el-badge>
        <el-button link class="logout-btn" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon> 退出
        </el-button>
      </div>
    </div>

    <div class="profile-card">
      <div class="profile-content">
        <el-upload
          class="avatar-uploader"
          action="#" 
          :show-file-list="false"
          :http-request="customUpload"
          :before-upload="beforeAvatarUpload"
        >
          <div class="avatar-wrapper">
            <el-avatar 
              :size="100" 
              :src="doctorForm.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" 
              class="doctor-avatar" 
            />
            
            <div class="upload-mask" v-if="!isUploading">
              <el-icon><Camera /></el-icon>
            </div>
            <div class="upload-mask loading" v-else>
              <el-icon class="is-loading"><Loading /></el-icon>
            </div>
            
            <div class="verified-badge" :class="doctorForm.workStatus === 1 ? 'is-online' : 'is-offline'">
              <el-icon v-if="doctorForm.workStatus === 1"><CircleCheckFilled /></el-icon>
              <el-icon v-else><CircleCloseFilled /></el-icon>
            </div>
          </div>
        </el-upload>

        <div class="info-section">
          <div class="name-row">
            <h1 class="name">{{ doctorForm.realName || doctorForm.username || '医生' }}</h1>
            <span class="role-tag">{{ doctorForm.title || '医师' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-item"><el-icon><Suitcase /></el-icon> 工号 : {{ doctorForm.id }}</span>
            <span class="meta-item"><el-icon><OfficeBuilding /></el-icon> 所属科室 : {{ doctorForm.deptName || '神经内科' }}</span>
            <span class="meta-item" :class="doctorForm.status === 1 ? 'status-active' : 'status-inactive'">
              <span class="dot"></span> 账号状态 : {{ doctorForm.status === 1 ? '已启用' : '已停用' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <div class="left-column">
        <div class="panel-card status-panel">
          <div class="panel-header">
            <span class="panel-title"><el-icon><Connection /></el-icon> 工作状态</span>
            <el-tag type="info" effect="plain" size="small" round>实时同步</el-tag>
          </div>
          
          <div class="status-selector">
            <div 
              class="status-option" 
              :class="{ active: doctorForm.workStatus === 1 }" 
              @click="toggleWorkStatus(1)"
            >
              <div class="status-icon online"></div>
              <div class="status-info">
                <div class="label">在线接诊</div>
                <div class="desc">公开状态，接收新申请</div>
              </div>
            </div>

            <div 
              class="status-option offline-opt" 
              :class="{ active: doctorForm.workStatus === 0 }" 
              @click="toggleWorkStatus(0)"
            >
              <div class="status-icon offline"></div>
              <div class="status-info">
                <div class="label">离线休息</div>
                <div class="desc">暂停接诊，不再接收申请</div>
              </div>
            </div>
          </div>

          <div class="quota-section">
            <div class="quota-row">
              <span class="label">每日审核上限</span>
              <span class="value-box">{{ DAILY_LIMIT }} 例/日</span>
            </div>
            <div class="quota-row highlight">
              <span class="label">今日已审核</span>
              <span class="value-highlight">{{ todayAuditCount }} 例</span>
            </div>
            <el-progress 
              :percentage="auditPercentage" 
              :show-text="false" 
              color="#165DFF" 
              stroke-width="6" 
              class="custom-progress"
            />
          </div>
        </div>
      </div>

      <div class="right-column">
        <div class="panel-card details-panel">
          <div class="panel-header"><span class="panel-title"><el-icon><Document /></el-icon> 专业详情</span></div>
          <div class="info-grid">
            <div class="info-block">
              <div class="block-label">执业科室</div>
              <div class="block-value"><div class="icon-box blue"><el-icon><FirstAidKit /></el-icon></div><span>{{ doctorForm.deptName || '神经内科' }}</span></div>
            </div>
            <div class="info-block">
              <div class="block-label">技术职称</div>
              <div class="block-value"><div class="icon-box blue"><el-icon><Medal /></el-icon></div><span>{{ doctorForm.title || '暂无职称' }}</span></div>
            </div>
          </div>
          <div class="bio-section"><div class="bio-label">医生简介</div><div class="bio-content">{{ doctorForm.intro || '暂无简介' }}</div></div>
          <div class="panel-footer">
            <div class="footer-item"><el-icon><User /></el-icon><span class="label">入驻时间</span><span class="val">{{ formatDate(doctorForm.createTime) }}</span></div>
            <div class="footer-item"><el-icon><Refresh /></el-icon><span class="label">资料最后更新</span><span class="val">{{ formatDate(doctorForm.updateTime) }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { 
  Bell, SwitchButton, CircleCheckFilled, CircleCloseFilled, Suitcase, OfficeBuilding, 
  Connection, Document, FirstAidKit, Medal, User, Refresh, Camera, Loading
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getDoctorInfo, uploadDoctorFile, updateDoctorProfile } from '@/api/doctor' 

// 🔥 1. 引入 Store
import { useDoctorStore } from '@/stores/doctor'
const doctorStore = useDoctorStore()

const DAILY_LIMIT = 3
const isUploading = ref(false)

const doctorForm = reactive({
  id: '', username: '', realName: '', avatar: '', deptId: null, deptName: '', title: '', intro: '', status: 1, workStatus: 1, maxDailyAudit: 3, createTime: '', updateTime: '' 
})

const todayAuditCount = computed(() => {
  const remaining = doctorForm.maxDailyAudit ?? DAILY_LIMIT
  const used = DAILY_LIMIT - remaining
  return Math.max(0, used)
})

const auditPercentage = computed(() => {
  return Math.min((todayAuditCount.value / DAILY_LIMIT) * 100, 100)
})

// === 获取信息 ===
const fetchDoctorInfo = async () => {
  try {
    const res = await getDoctorInfo()
    const data = res.data || res 
    
    // 更新本地表单
    Object.assign(doctorForm, data)
    
    // 🔥 2. 同步最新信息到 Store (防止 Store 里是旧数据)
    doctorStore.setDoctorInfo(data)
    
  } catch (error) {
    console.error('获取失败:', error)
    ElMessage.error('获取个人信息失败')
  }
}

// === 头像上传逻辑 ===
const beforeAvatarUpload = (rawFile) => {
  const isJpgOrPng = rawFile.type === 'image/jpeg' || rawFile.type === 'image/png';
  const isLt2M = rawFile.size / 1024 / 1024 < 2;
  if (!isJpgOrPng) { ElMessage.error('头像只能是 JPG 或 PNG 格式!'); return false; }
  if (!isLt2M) { ElMessage.error('头像大小不能超过 2MB!'); return false; }
  return true;
}

const customUpload = async (options) => {
  const { file } = options
  isUploading.value = true
  
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await uploadDoctorFile(formData)
    const newAvatarUrl = res.data || res 
    
    if (newAvatarUrl) {
      // 1. 调后端接口更新
      await updateDoctorProfile({ avatar: newAvatarUrl })
      
      // 2. 更新当前页面显示
      doctorForm.avatar = newAvatarUrl 
      
      // 🔥 3. 同步更新 Pinia Store (侧边栏会自动变化)
      doctorStore.updateAvatar(newAvatarUrl)
      
      ElMessage.success('头像修改成功')
    } else {
      throw new Error('未获取到图片链接')
    }
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('头像修改失败')
  } finally {
    isUploading.value = false
  }
}

// === 状态切换逻辑 ===
const toggleWorkStatus = async (status) => {
  if (doctorForm.workStatus === status) return
  
  try {
    // 1. 调后端接口
    await updateDoctorProfile({ workStatus: status })
    
    // 2. 更新当前页面
    doctorForm.workStatus = status
    
    // 🔥 3. 同步更新 Pinia Store
    doctorStore.setDoctorInfo({ workStatus: status })
    
    const statusText = status === 1 ? '在线接诊' : '离线休息'
    ElMessage.success(`状态已切换为：${statusText}`)
  } catch (error) {
    console.error('状态切换失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', { hour12: false })
}

const handleLogout = () => {
  // 🔥 4. 调用 Store 的 logout 清理 Token
  doctorStore.logout()
  ElMessage.success('已退出登录')
  // 这里通常需要跳转路由，例如: router.push('/login')
}

onMounted(() => { fetchDoctorInfo() })
</script>

<style scoped lang="scss">
$bg-color: #F7F8FA; $primary-color: #165DFF; $danger-color: #F56C6C; $text-main: #1D2129; $text-sub: #86909C; $card-bg: #FFFFFF; $border-color: #E5E6EB;

.profile-container { padding: 24px; background-color: $bg-color; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

/* Header */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;
  .header-left { .title { font-size: 24px; font-weight: 600; color: $text-main; margin: 0 0 8px 0; } .subtitle { font-size: 14px; color: $text-sub; margin: 0; } }
  .header-right { display: flex; align-items: center; gap: 16px; .icon-btn { border: none; background: transparent; font-size: 20px; color: $text-sub; &:hover { color: $primary-color; background: #fff; } } .logout-btn { color: $text-sub; font-size: 14px; &:hover { color: $danger-color; } } }
}

/* Profile Card */
.profile-card {
  background: linear-gradient(180deg, #E8F3FF 0%, #FFFFFF 40%); border-radius: 16px; padding: 32px; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #fff;
  .profile-content {
    display: flex; align-items: center; gap: 24px;

    /* 头像容器 */
    .avatar-wrapper {
      position: relative; cursor: pointer; border-radius: 50%;
      /* 移除了 overflow: hidden */
      
      .doctor-avatar { border: 4px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: all 0.3s; display: block; }
      
      /* 上传遮罩 */
      .upload-mask {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%;
        background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.3s; color: #fff; font-size: 24px; z-index: 2;
        &.loading { opacity: 1; background: rgba(255, 255, 255, 0.8); color: $primary-color; }
      }
      &:hover .upload-mask { opacity: 1; }
      
      /* 状态角标 */
      .verified-badge {
        position: absolute; bottom: 4px; right: 4px; 
        background: #fff; border-radius: 50%; width: 26px; height: 26px; 
        display: flex; align-items: center; justify-content: center; 
        font-size: 26px; z-index: 10;
        border: 2px solid #fff;
        
        &.is-online { color: #00B42A; }
        &.is-offline { color: $danger-color; }
      }
    }

    .info-section {
      .name-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; .name { font-size: 28px; font-weight: 700; color: $text-main; margin: 0; } .role-tag { background: #E8F3FF; color: $primary-color; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 12px; } }
      .meta-row {
        display: flex; gap: 24px; color: $text-sub; font-size: 14px;
        .meta-item { display: flex; align-items: center; gap: 6px; &.status-active { color: #00B42A; font-weight: 500; } &.status-inactive { color: $danger-color; font-weight: 500; } .dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; } }
      }
    }
  }
}

/* Layout */
.main-layout { display: flex; gap: 24px; .left-column { flex: 4; min-width: 320px; } .right-column { flex: 8; } 
  .panel-card { background: $card-bg; border-radius: 16px; padding: 24px; height: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.02); .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; .panel-title { font-size: 16px; font-weight: 600; color: $text-sub; display: flex; align-items: center; gap: 8px; } } }
  
  .status-panel {
    .status-selector {
      display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px;
      .status-option { 
        display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; border: 1px solid $border-color; cursor: pointer; transition: all 0.3s; 
        
        .status-icon { width: 12px; height: 12px; border-radius: 50%; }
        .status-info { .label { font-size: 16px; font-weight: 600; color: $text-main; margin-bottom: 4px; } .desc { font-size: 12px; color: $text-sub; } } 
        
        /* 在线样式 */
        &.active { border-color: $primary-color; background-color: #F2F8FF; .label { color: $primary-color; } }
        .status-icon.online { background: #00B42A; box-shadow: 0 0 0 4px #E8FFEA; }
        
        /* 离线样式 */
        &.offline-opt {
           .status-icon.offline { background: $danger-color; box-shadow: 0 0 0 4px #FEF0F0; } 
           &.active { border-color: $danger-color; background-color: #FEF0F0; .label { color: $danger-color; } }
        }
        
        &:hover:not(.active) { background-color: #F7F8FA; } 
      }
    }
    .quota-section { border-top: 1px solid #F2F3F5; padding-top: 24px; .quota-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; .label { color: $text-sub; } .value-box { background: #F2F3F5; padding: 2px 8px; border-radius: 4px; color: $text-main; font-weight: 500; } &.highlight { margin-bottom: 16px; .value-highlight { color: $primary-color; font-weight: 700; font-size: 16px; } } } .custom-progress { :deep(.el-progress-bar__outer) { background-color: #F2F3F5 !important; } } }
  }
  
  .details-panel {
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; .info-block { .block-label { font-size: 12px; color: $text-sub; margin-bottom: 12px; } .block-value { background: #F7F8FA; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 600; color: $text-main; .icon-box { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; &.blue { background: #E8F3FF; color: $primary-color; } } } } }
    .bio-section { margin-bottom: 40px; .bio-label { font-size: 12px; color: $text-sub; margin-bottom: 12px; } .bio-content { background: #F7F8FA; border-radius: 12px; padding: 24px; font-size: 14px; color: #4E5969; line-height: 1.8; text-align: justify; } }
    .panel-footer { border-top: 1px solid #F2F3F5; padding-top: 24px; display: flex; gap: 40px; .footer-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: $text-sub; .val { color: $text-main; margin-left: 4px; } } }
  }
}

@media (max-width: 1024px) { .main-layout { flex-direction: column; } .left-column, .right-column { flex: 1; } }
</style>