<template>
  <div class="p-8 bg-[#F8FAFC] min-h-screen flex justify-center font-sans text-slate-600">
    <div class="w-full max-w-6xl">
      
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">知识库文件管理</h1>
        <p class="text-slate-500 mt-2 text-sm">上传并管理用于 RAG（检索增强生成）的 Markdown 知识文档，构建您的专属 AI 知识大脑。</p>
      </div>

      <div class="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6 border border-white">
        
        <div class="mb-8">
          <el-upload
            class="upload-demo w-full"
            drag
            action="#" 
            :http-request="customUpload" 
            :show-file-list="false" 
            accept=".md"
            multiple
          >
            <div class="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-400 transition-all duration-300 group cursor-pointer">
              <div class="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                <el-icon class="!text-indigo-500 !text-3xl"><UploadFilled /></el-icon>
              </div>
              <div class="text-slate-700 font-medium text-lg group-hover:text-indigo-600 transition-colors">
                点击或拖拽 Markdown 文件至此处
              </div>
              <div class="text-slate-400 text-xs mt-2">
                支持 .md 格式，单个文件建议不超过 10MB
              </div>
            </div>
          </el-upload>
        </div>

        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-white sticky top-0 z-10">
          <div class="relative w-full max-w-md group">
            <el-input
              v-model="searchQuery"
              placeholder="搜索文档名称..."
              size="large"
              class="custom-search shadow-sm hover:shadow transition-shadow"
              clearable
            >
              <template #prefix>
                <el-icon class="text-slate-400 group-hover:text-indigo-500 transition-colors"><Search /></el-icon>
              </template>
            </el-input>
          </div>
          
          <div class="flex items-center gap-3">
            <div class="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
              共 {{ filteredFiles.length }} 个文档
            </div>
            <el-button :icon="Refresh" circle class="!border-slate-200 hover:!border-indigo-500 hover:!text-indigo-500 hover:!bg-indigo-50" @click="loadData" :loading="loading" />
          </div>
        </div>

        <div class="rounded-xl border border-slate-100 overflow-hidden">
          <el-table 
            :data="filteredFiles" 
            style="width: 100%" 
            :header-cell-style="{ background: '#F8FAFC', color: '#64748B', fontWeight: '600' }"
            v-loading="loading"
          >
            <template #empty>
              <el-empty description="暂无相关文档" :image-size="100" />
            </template>

            <el-table-column label="文件名称" min-width="300">
              <template #default="scope">
                <div class="flex items-center gap-4 py-2">
                  <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div class="flex flex-col overflow-hidden">
                    <a 
                      :href="scope.row.url" 
                      target="_blank" 
                      class="font-semibold text-slate-700 hover:text-indigo-600 transition-colors truncate text-[15px]"
                      :title="scope.row.filename"
                    >
                      {{ scope.row.filename }}
                    </a>
                    <span class="text-xs text-slate-400">Markdown Document</span>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="大小" width="120" align="center">
              <template #default="scope">
                <span class="px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs font-mono">
                  {{ formatSize(scope.row.size) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="最后修改" width="200" align="left">
              <template #default="scope">
                <div class="flex items-center text-slate-500 text-sm">
                  <el-icon class="mr-1.5"><Clock /></el-icon>
                  {{ formatDate(scope.row.lastModified) }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="180" align="right" fixed="right">
              <template #default="scope">
                <div class="flex justify-end gap-2">
                  <el-tooltip content="预览文件" placement="top">
                    <a 
                      :href="scope.row.url" 
                      target="_blank" 
                      class="w-8 h-8 rounded-full flex items-center justify-center text-indigo-500 hover:bg-indigo-50 transition-colors"
                    >
                      <el-icon><View /></el-icon>
                    </a>
                  </el-tooltip>
                  
                  <el-tooltip content="删除文件" placement="top">
                    <button 
                      class="w-8 h-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors"
                      @click="handleDelete(scope.row)"
                    >
                      <el-icon><Delete /></el-icon>
                    </button>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  UploadFilled, Search, Refresh, Document, View, Delete, Clock 
} from '@element-plus/icons-vue'
import { getRagFileList, uploadRagFile, deleteRagFile } from '@/api/rag'

// --- 数据 ---
const searchQuery = ref('')
const fileList = ref([])
const loading = ref(false)

// --- 核心逻辑 ---

// 1. 加载列表
const loadData = async () => {
  loading.value = true
  try {
    const res = await getRagFileList()
    // 假设后端返回结构: [{ key, filename, url, size, lastModified }, ...]
    fileList.value = res || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取文件列表失败')
  } finally {
    loading.value = false
  }
}

// 2. 自定义上传
const customUpload = async (options) => {
  const { file } = options
  
  // 创建 FormData
  const formData = new FormData()
  formData.append('file', file)

  try {
    await uploadRagFile(formData)
    ElMessage.success({
      message: `文件 "${file.name}" 上传成功`,
      type: 'success',
      plain: true,
    })
    loadData() // 刷新列表
  } catch (error) {
    console.error(error)
    ElMessage.error(`上传失败: ${file.name}`)
  }
}

// 3. 删除文件
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除文档 "${row.filename}" 吗？此操作将从知识库索引中移除该文件，可能会影响 AI 回答的准确性。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      icon: Delete,
      customClass: 'delete-confirm-box' // 如果需要自定义样式
    }
  )
    .then(async () => {
      try {
        await deleteRagFile(row.filename) 
        ElMessage.success('删除成功')
        // 前端本地移除，避免重新请求闪烁
        fileList.value = fileList.value.filter(item => item.filename !== row.filename)
      } catch (error) {
        console.error(error)
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {})
}

// --- 工具函数 ---

// 🔥 核心：前端搜索实现 🔥
const filteredFiles = computed(() => {
  // 1. 如果没有搜索词，返回所有文件
  if (!searchQuery.value) return fileList.value
  
  // 2. 将搜索词转为小写，实现不区分大小写搜索
  const query = searchQuery.value.toLowerCase().trim()
  
  // 3. 过滤列表
  return fileList.value.filter(file => 
    file.filename && file.filename.toLowerCase().includes(query)
  )
})

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间戳
const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* 覆盖 Element UI 上传组件默认样式，使其透明以便展示我们的自定义背景 */
:deep(.el-upload) {
  display: block;
}
:deep(.el-upload-dragger) {
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 0.75rem; /* rounded-xl */
}
:deep(.el-upload-dragger:hover) {
  border: none; /* 移除默认的蓝色边框，使用我们自定义的 */
}

/* 搜索框美化 */
:deep(.custom-search .el-input__wrapper) {
  box-shadow: none;
  border: 1px solid #e2e8f0; /* slate-200 */
  border-radius: 0.75rem;
  padding-left: 1rem;
  transition: all 0.3s;
}
:deep(.custom-search .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #6366f1; /* indigo-500 */
  border-color: #6366f1;
}

/* 表格样式微调 */
:deep(.el-table__row) {
  transition: background-color 0.2s;
}
:deep(.el-table__row:hover) {
  background-color: #f8fafc !important; /* slate-50 hover */
}
:deep(.el-table__inner-wrapper::before) {
  display: none; /* 移除表格底部默认线条 */
}
</style>