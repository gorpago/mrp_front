import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import MetronomeShare from '../views/MetronomeShare.vue'
import MetronomeSession from '../views/MetronomeSession.vue'
import PerformanceVideos from '../views/PerformanceVideos.vue'
import NaverCallback from '../views/NaverCallback.vue'
import { authStore } from '../store/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/auth/naver/callback',
    name: 'NaverCallback',
    component: NaverCallback
  },
  {
    path: '/metronome',
    name: 'MetronomeShare',
    component: MetronomeShare,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/metronome/session/:sessionId',
    name: 'MetronomeSession',
    component: MetronomeSession,
    props: true,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/performance',
    name: 'PerformanceVideos',
    component: PerformanceVideos,
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 인증 가드
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // 앱 시작시 사용자 정보 로드
  if (!authStore.currentUser) {
    authStore.loadUser()
  }
  
  if (requiresAuth && !authStore.currentUser) {
    // 인증이 필요한 페이지인데 로그인하지 않은 경우
    next('/login')
  } else if (to.path === '/login' && authStore.currentUser) {
    // 이미 로그인한 사용자가 로그인 페이지에 접근하는 경우
    next('/')
  } else {
    next()
  }
})

export default router
