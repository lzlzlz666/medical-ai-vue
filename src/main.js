import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

// === 新增 Element Plus ===
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // 引入样式
// =========================

const app = createApp(App)

app.use(createPinia()) // 2. 必须在 use(router) 之前或之后注册
app.use(router)
app.use(ElementPlus) // 挂载
app.mount('#app')