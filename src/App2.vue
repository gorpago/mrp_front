<template>
  <div id="app">
    <!-- 네비게이션 바 -->
    <el-container>
      <el-header class="app-header">
        <div class="header-content">
          <div class="nav-section" v-if="currentUser">
            <el-menu
              mode="horizontal"
              :default-active="$route.path"
              class="nav-menu"
              router
            >
              <el-menu-item index="/">홈</el-menu-item>
            </el-menu>
            
            <div class="user-section">
              <el-button 
                type="danger" 
                size="small" 
                @click="handleLogout"
                class="logout-btn"
              >
                <el-icon><SwitchButton /></el-icon>
                로그아웃
              </el-button>
            </div>
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { SwitchButton } from '@element-plus/icons-vue'
import { authAPI } from '@/services/api'
import { authStore } from '@/store/auth'

export default {
  name: 'MrpApp',
  components: {
    SwitchButton
  },
  data() {
    return {
      authStore
    }
  },
  computed: {
    currentUser() {
      return this.authStore.currentUser
    }
  },
  mounted() {
    // 앱 시작시 사용자 정보 로드
    this.authStore.loadUser()
    
    // 로그인 상태 변경 감지
    window.addEventListener('storage', this.handleStorageChange)
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.handleStorageChange)
  },
  methods: {
    handleStorageChange(event) {
      if (event.key === 'currentUser') {
        this.authStore.loadUser()
      }
    },
    
    async handleUserCommand(command) {
      switch (command) {
        case 'profile':
          ElMessage.info('프로필 기능을 준비 중입니다.')
          break
          
        case 'settings':
          ElMessage.info('설정 기능을 준비 중입니다.')
          break
          
        case 'logout':
          await this.handleLogout()
          break
      }
    },
    
    async handleLogout() {
      try {
        const result = await ElMessageBox.confirm(
          '정말 로그아웃하시겠습니까?',
          '로그아웃',
          {
            confirmButtonText: '로그아웃',
            cancelButtonText: '취소',
            type: 'warning'
          }
        )
        
        if (result === 'confirm') {
          // 서버에 로그아웃 요청 (선택사항)
          if (this.currentUser && !this.currentUser.isGuest) {
            try {
              await authAPI.logout(this.currentUser.id)
            } catch (error) {
              console.warn('서버 로그아웃 실패:', error)
            }
          }
          
          // 전역 상태에서 로그아웃 처리
          this.authStore.logout()
          
          // 로그인 페이지로 이동
          ElMessage.success('로그아웃되었습니다.')
          this.$router.push('/login')
        }
      } catch (error) {
        // 사용자가 취소한 경우
        console.log('로그아웃 취소됨')
      }
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  height: 56px !important;
  line-height: 56px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.nav-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.nav-menu {
  background: transparent !important;
  border: none !important;
  justify-content: flex-start !important;
  padding-left: 0 !important;
}

.nav-menu .el-menu-item {
  color: white !important;
  border-bottom: 2px solid transparent !important;
  font-weight: 500;
}

.nav-menu .el-menu-item:hover,
.nav-menu .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.1) !important;
  border-bottom-color: white !important;
}

.user-section {
  display: flex;
  align-items: center;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: white !important;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.app-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 56px);
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: 10px;
  }
  
  .app-header {
    height: auto !important;
    line-height: normal;
  }
  
  .logo h2 {
    font-size: 16px;
  }
  
  .nav-menu {
    width: 100%;
    justify-content: center;
  }
  
  .app-main {
    padding: 10px;
  }
  
  .user-section {
    flex-direction: column;
    gap: 8px;
  }
  
  .logout-btn {
    font-size: 12px;
    padding: 4px 8px;
  }
  
  /* 모바일 터치 최적화 */
  .el-button {
    min-height: 44px;
    padding: 12px 20px;
    font-size: 14px;
  }
  
  .el-dialog {
    width: 95% !important;
    margin: 0 auto;
  }
  
  .el-input__inner {
    min-height: 44px;
    font-size: 16px; /* iOS 자동 줌 방지 */
  }
  
  .el-menu-item {
    min-height: 44px;
    line-height: 44px;
  }
}

/* 모바일 가로 모드 */
@media (max-width: 768px) and (orientation: landscape) {
  .app-header {
    height: 60px !important;
  }
  
  .header-content {
    flex-direction: row;
    padding: 0 10px;
  }
  
  .logo h2 {
    font-size: 14px;
  }
  
  .nav-menu {
    width: auto;
  }
}
</style>
