import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// ResizeObserver 에러 무시 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  const resizeObserverError = window.console.error
  window.console.error = (...args) => {
    if (args[0]?.includes?.('ResizeObserver loop')) {
      return
    }
    resizeObserverError(...args)
  }
}

const app = createApp(App)

// Element Plus 아이콘 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')
