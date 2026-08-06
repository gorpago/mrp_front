<template>
  <div class="login-page">
    <!-- 배경 음표들 -->
    <div class="music-notes">
      <div class="note note-1">♪</div>
      <div class="note note-2">♫</div>
      <div class="note note-3">♪</div>
      <div class="note note-4">♬</div>
      <div class="note note-5">♩</div>
      <div class="note note-6">♪</div>
    </div>

    <div class="login-container">
      <div class="login-header">
        <div class="logo-section">
          <div class="guitar-icon">
            <svg viewBox="0 0 100 100" width="60" height="60">
              <path d="M20 30 Q30 20 40 30 L70 60 Q80 70 70 80 Q60 70 50 60 L20 30 Z" 
                    fill="#fff" stroke="#fff" stroke-width="2"/>
              <circle cx="35" cy="45" r="3" fill="#333"/>
              <line x1="25" y1="35" x2="65" y2="75" stroke="#333" stroke-width="1"/>
              <line x1="30" y1="30" x2="70" y2="70" stroke="#333" stroke-width="1"/>
              <line x1="35" y1="25" x2="75" y2="65" stroke="#333" stroke-width="1"/>
            </svg>
          </div>
          <h1>무작위취향</h1>
          <p>직장인밴드 무작위취향 입니다</p>
        </div>
      </div>

      <div class="login-form">
        <div class="social-buttons">
          <el-button 
            class="google-btn"
            size="large"
            @click="loginWithGoogle"
            :loading="loading.google"
          >
            <div class="btn-content">
              <div class="social-icon google-icon">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-2.7.75 4.8 4.8 0 0 1-4.52-3.36H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.46 10.41a4.8 4.8 0 0 1-.25-1.41c0-.49.09-.97.25-1.41V5.52H1.83a8 8 0 0 0 0 7.01l2.63-2.12z"/>
                  <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.54-2.54A8 8 0 0 0 8.98 1a8 8 0 0 0-7.15 4.48l2.63 2.09c.61-1.85 2.35-3.36 4.52-3.36z"/>
                </svg>
              </div>
              Google로 로그인
            </div>
          </el-button>

          <!-- 네이버, 카카오 버튼 숨김 -->
          <!-- <el-button class="naver-btn" style="display: none;">네이버</el-button> -->
          <!-- <el-button class="kakao-btn" style="display: none;">카카오</el-button> -->
        </div>

        <div class="divider">
          <span>또는</span>
        </div>

        <el-button 
          class="guest-btn"
          size="large"
          @click="continueAsGuest"
        >
          <el-icon><User /></el-icon>
          게스트로 계속하기
        </el-button>
      </div>

      <div class="login-footer">
        <p>로그인하면 <a href="#" @click.prevent>이용약관</a> 및 <a href="#" @click.prevent>개인정보처리방침</a>에 동의하는 것으로 간주됩니다.</p>
      </div>
    </div>

    <!-- 로딩 오버레이 -->
    <div v-if="isProcessing" class="loading-overlay" v-loading="true">
      <div class="loading-text">로그인 처리 중...</div>
    </div>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import { authAPI } from '@/services/api'
import { authStore } from '@/store/auth'
import { GoogleAuthService } from '@/services/googleAuth'
import { NaverAuthService } from '@/services/naverAuth'
import { KakaoAuthService } from '@/services/kakaoAuth'

export default {
  name: 'LoginPage',
  components: {
    User
  },
  data() {
    return {
      loading: {
        google: false,
        naver: false,
        kakao: false
      },
      isProcessing: false,
      // 실제 소셜 로그인 사용 여부 (개발/운영 환경 구분)
      useRealSocialLogin: true, // Google 설정 완료 후 true로 변경
      googleAuth: new GoogleAuthService(),
      naverAuth: new NaverAuthService(),
      kakaoAuth: new KakaoAuthService()
    }
  },
  async mounted() {
    // 이미 로그인된 사용자인지 확인
    if (authStore.currentUser) {
      this.$router.push('/')
      return
    }
    
    // 소셜 로그인 서비스 초기화
    if (this.useRealSocialLogin) {
      try {
        await this.googleAuth.initialize()
        await this.naverAuth.initialize()
      } catch (error) {
        console.error('소셜 로그인 초기화 실패:', error)
      }
    }
  },
  methods: {
    async loginWithGoogle() {
      this.loading.google = true
      try {
        if (this.useRealSocialLogin) {
          // 실제 Google 로그인 - 새로운 Google Identity Services 방식
          const result = await this.googleAuth.signIn()
          
          // Google 로그인 성공 시 처리
          const loginData = {
            provider: 'google',
            providerId: result.userInfo.id,
            email: result.userInfo.email,
            name: result.userInfo.name,
            profileImage: result.userInfo.picture,
            accessToken: result.accessToken,
            authType: 'oauth2'
          }
          
          await this.processSocialLogin(loginData)
        } else {
          // 테스트용 더미 데이터
          ElMessage.info('테스트 모드: Google 로그인')
          const loginData = {
            provider: 'google',
            accessToken: 'mock-google-token',
            idToken: 'mock-google-id-token'
          }
          
          await this.processSocialLogin(loginData)
        }
        
      } catch (error) {
        console.error('Google 로그인 실패:', error)
        ElMessage.error('Google 로그인에 실패했습니다.')
      } finally {
        this.loading.google = false
      }
    },

    // 네이버, 카카오 로그인 메서드는 숨김 처리
    async loginWithNaver() {
      // 숨김 처리된 기능
      console.log('네이버 로그인은 현재 비활성화되었습니다.')
    },

    async loginWithKakao() {
      // 숨김 처리된 기능
      console.log('카카오 로그인은 현재 비활성화되었습니다.')
    },

    async processSocialLogin(loginData) {
      this.isProcessing = true
      try {
        console.log('소셜 로그인 처리 시작:', loginData.provider)
        console.log('로그인 데이터 전체:', JSON.stringify(loginData, null, 2))
        console.log('API 요청 URL:', '/auth/social-login')
        console.log('API 요청 데이터:', loginData)
        
        // 테스트 모드에서는 API 호출 없이 바로 성공 처리
        if (!this.useRealSocialLogin) {
          console.log('테스트 모드: 가짜 사용자 생성')
          
          const mockUser = {
            id: 'test-user-' + Date.now(),
            name: loginData.provider === 'google' ? 'Google 테스트 사용자' : 
                  loginData.provider === 'naver' ? '네이버 테스트 사용자' : 
                  '카카오 테스트 사용자',
            email: `test@${loginData.provider}.com`,
            provider: loginData.provider,
            providerId: 'test-provider-id',
            isGuest: false
          }
          
          // 전역 상태에 사용자 정보 저장
          authStore.login(mockUser)
          console.log('authStore에 사용자 저장 완료:', authStore.currentUser)
          
          // 성공 메시지
          ElMessage.success(`안녕하세요, ${mockUser.name}님!`)
          
          // 메인 페이지로 이동
          console.log('메인 페이지로 이동 시도')
          await this.$router.push('/')
          console.log('메인 페이지 이동 완료')
          
          return
        }
        
        // 실제 API 호출
        const response = await authAPI.socialLogin(loginData)
        
        if (response.data.success) {
          const { user, isNewUser } = response.data
          
          // 전역 상태에 사용자 정보 저장
          authStore.login(user)
          
          // Java 서버에 로그인 성공 콜백 전송
          await this.sendLoginCallback(user, loginData.provider)
          
          // 성공 메시지
          if (isNewUser) {
            ElMessage.success(`환영합니다, ${user.name}님! 회원가입이 완료되었습니다.`)
          } else {
            ElMessage.success(`안녕하세요, ${user.name}님!`)
          }
          
          // 메인 페이지로 이동
          await this.$router.push('/')
          
        } else {
          ElMessage.error(response.data.message || '로그인에 실패했습니다.')
        }
      } catch (error) {
        console.error('소셜 로그인 API 호출 실패:', error)
        console.error('백엔드 응답 데이터:', error.response?.data)
        console.error('요청했던 데이터:', loginData)
        
        // 백엔드 API 실패 시 프론트엔드에서 직접 로그인 처리
        if (loginData.accessToken && (
          loginData.accessToken.startsWith('frontend_naver_token_') || 
          loginData.accessToken.startsWith('mock_naver_token_')
        )) {
          console.log('백엔드 API 실패 - 프론트엔드에서 직접 로그인 처리')
          
          // 임시 사용자 정보로 로그인 상태 설정
          const tempUser = {
            id: loginData.providerId,
            email: loginData.email,
            name: loginData.name,
            profileImageUrl: loginData.profileImage,
            provider: loginData.provider,
            providerId: loginData.providerId
          }
          
          // 인증 스토어에 사용자 정보 저장
          authStore.login(tempUser)
          
          ElMessage.success('네이버 로그인 성공!')
          this.$router.push('/')
          return
        }
        
        let errorMessage = '로그인 처리 중 오류가 발생했습니다.'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }
        
        ElMessage.error(`로그인 실패: ${errorMessage}`)
      } finally {
        this.isProcessing = false
      }
    },

    continueAsGuest() {
      ElMessageBox.confirm(
        '게스트로 계속하면 일부 기능이 제한될 수 있습니다. 계속하시겠습니까?',
        '게스트 모드',
        {
          confirmButtonText: '계속하기',
          cancelButtonText: '취소',
          type: 'info'
        }
      ).then(() => {
        // 게스트 사용자 정보 생성
        const guestUser = {
          id: 'guest-' + Date.now(),
          name: '게스트 사용자',
          email: null,
          provider: 'guest',
          providerId: null,
          isGuest: true
        }
        
        authStore.login(guestUser)
        ElMessage.success('게스트로 로그인되었습니다.')
        this.$router.push('/')
      }).catch(() => {
        // 취소됨
      })
    },

    // Java 서버에 로그인 성공 콜백 전송
    async sendLoginCallback(user, provider) {
      try {
        console.log('Java 서버에 로그인 콜백 전송:', { user, provider })
        
        const callbackData = {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          provider: provider,
          loginTime: new Date().toISOString(),
          environment: process.env.NODE_ENV
        }
        
        // 환경별 콜백 URL 설정
        const callbackUrl = process.env.VUE_APP_API_BASE_URL + '/auth/login-callback'
        
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(callbackData)
        })
        
        if (response.ok) {
          console.log('Java 서버 로그인 콜백 성공')
        } else {
          console.warn('Java 서버 로그인 콜백 실패:', response.status)
        }
      } catch (error) {
        console.warn('Java 서버 로그인 콜백 오류:', error)
        // 콜백 실패해도 로그인은 계속 진행
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 배경 음표 애니메이션 */
.music-notes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.note {
  position: absolute;
  color: rgba(255, 255, 255, 0.1);
  font-size: 2rem;
  animation: float 6s ease-in-out infinite;
}

.note-1 {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.note-2 {
  top: 20%;
  right: 15%;
  animation-delay: 1s;
}

.note-3 {
  bottom: 30%;
  left: 20%;
  animation-delay: 2s;
}

.note-4 {
  bottom: 20%;
  right: 10%;
  animation-delay: 3s;
}

.note-5 {
  top: 50%;
  left: 5%;
  animation-delay: 4s;
}

.note-6 {
  top: 70%;
  right: 25%;
  animation-delay: 5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
    opacity: 0.3;
  }
}

.login-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  padding: 50px 40px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  position: relative;
  z-index: 2;
}

.login-header {
  margin-bottom: 40px;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.guitar-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  margin-bottom: 8px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: 800;
  color: #2c3e50;
  margin: 0;
  letter-spacing: -1px;
}

.login-header p {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
  font-weight: 400;
}

.login-form {
  margin-bottom: 30px;
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 30px;
}

.social-buttons .el-button {
  height: 56px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.social-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.google-btn {
  background: #fff;
  border: 2px solid #e0e0e0;
  color: #5f6368;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.google-btn:hover {
  background: #f8f9fa;
  border-color: #dadce0;
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.divider {
  position: relative;
  margin: 30px 0;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, #e0e0e0, transparent);
}

.divider span {
  background: rgba(255, 255, 255, 0.95);
  padding: 0 20px;
  color: #7f8c8d;
  font-size: 14px;
  font-weight: 500;
}

.guest-btn {
  width: 100%;
  height: 56px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.guest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.login-footer {
  font-size: 12px;
  color: #95a5a6;
  line-height: 1.5;
  margin-top: 20px;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-footer a:hover {
  text-decoration: underline;
  color: #5a6fd8;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(44, 62, 80, 0.8);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  color: white;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .login-container {
    padding: 40px 30px;
    margin: 20px;
  }
  
  .login-header h1 {
    font-size: 28px;
  }
  
  .guitar-icon {
    width: 70px;
    height: 70px;
  }
  
  .social-buttons .el-button {
    height: 52px;
  }
  
  .guest-btn {
    height: 52px;
  }
}
</style>
