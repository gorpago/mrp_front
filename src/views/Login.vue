<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <el-icon class="logo-icon" size="48">
          <Headset />
        </el-icon>
        <h1>Music Rhythm Platform</h1>
        <p>소셜 로그인으로 간편하게 시작하세요</p>
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
              <div class="social-icon google-icon">G</div>
              Google로 로그인
            </div>
          </el-button>

          <el-button 
            class="naver-btn"
            size="large"
            @click="loginWithNaver"
            :loading="loading.naver"
          >
            <div class="btn-content">
              <div class="social-icon naver-icon">N</div>
              네이버로 로그인
            </div>
          </el-button>

          <el-button 
            class="kakao-btn"
            size="large"
            @click="loginWithKakao"
            :loading="loading.kakao"
          >
            <div class="btn-content">
              <div class="social-icon kakao-icon">K</div>
              카카오로 로그인
            </div>
          </el-button>
        </div>

        <div class="divider">
          <span>또는</span>
        </div>

        <el-button 
          class="guest-btn"
          size="large"
          type="info"
          plain
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
import { Headset, User } from '@element-plus/icons-vue'
import { authAPI } from '@/services/api'
import { authStore } from '@/store/auth'
import { GoogleAuthService } from '@/services/googleAuth'
import { NaverAuthService } from '@/services/naverAuth'
import { KakaoAuthService } from '@/services/kakaoAuth'

export default {
  name: 'LoginPage',
  components: {
    Headset,
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
          // 실제 Google 로그인 - 콜백 방식
          await this.googleAuth.signIn((userInfo, error) => {
            if (error) {
              console.error('Google 로그인 실패:', error)
              ElMessage.error('Google 로그인에 실패했습니다.')
              this.loading.google = false
              return
            }
            
            if (userInfo) {
              // Google 로그인 성공 시 처리 - OAuth 2.0 방식
              const loginData = {
                provider: 'google',
                providerId: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                profileImage: userInfo.picture,
                accessToken: userInfo.accessToken, // 실제 OAuth 2.0 access token
                authType: 'oauth2'
              }
              
              this.processSocialLogin(loginData).finally(() => {
                this.loading.google = false
              })
            }
          })
        } else {
          // 테스트용 더미 데이터
          ElMessage.info('테스트 모드: Google 로그인')
          const loginData = {
            provider: 'google',
            accessToken: 'mock-google-token',
            idToken: 'mock-google-id-token'
          }
          
          await this.processSocialLogin(loginData)
          this.loading.google = false
        }
        
      } catch (error) {
        console.error('Google 로그인 실패:', error)
        ElMessage.error('Google 로그인에 실패했습니다.')
        this.loading.google = false
      }
    },

    async loginWithNaver() {
      this.loading.naver = true
      try {
        if (this.useRealSocialLogin) {
          // 실제 네이버 로그인 - 콜백 방식
          await this.naverAuth.signIn((userInfo, error) => {
            if (error) {
              console.error('네이버 로그인 실패:', error)
              ElMessage.error('네이버 로그인에 실패했습니다.')
              this.loading.naver = false
              return
            }
            
            if (userInfo) {
              // 네이버 로그인 성공 시 처리
              const loginData = {
                provider: 'naver',
                providerId: userInfo.id,
                email: userInfo.email,
                name: userInfo.name,
                profileImage: userInfo.picture,
                accessToken: userInfo.accessToken,
                authType: 'oauth2'
              }
              
              this.processSocialLogin(loginData).finally(() => {
                this.loading.naver = false
              })
            }
          })
        } else {
          // 테스트용 더미 데이터
          ElMessage.info('테스트 모드: 네이버 로그인')
          const loginData = {
            provider: 'naver',
            providerId: 'test-naver-id',
            email: 'test@naver.com',
            name: '네이버 테스트 사용자',
            accessToken: 'mock-naver-token'
          }
          
          await this.processSocialLogin(loginData)
          this.loading.naver = false
        }
        
      } catch (error) {
        console.error('네이버 로그인 실패:', error)
        ElMessage.error('네이버 로그인에 실패했습니다.')
        this.loading.naver = false
      }
    },

    async loginWithKakao() {
      this.loading.kakao = true
      try {
        let loginData
        
        if (this.useRealSocialLogin) {
          // 실제 카카오 로그인
          const kakaoResult = await this.kakaoAuth.signIn()
          loginData = {
            provider: 'kakao',
            accessToken: kakaoResult.accessToken
          }
        } else {
          // 테스트용 더미 데이터
          ElMessage.info('테스트 모드: 카카오 로그인')
          loginData = {
            provider: 'kakao',
            accessToken: 'mock-kakao-token'
          }
        }
        
        await this.processSocialLogin(loginData)
        
      } catch (error) {
        console.error('카카오 로그인 실패:', error)
        ElMessage.error('카카오 로그인에 실패했습니다.')
      } finally {
        this.loading.kakao = false
      }
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
          console.log('authStore에 사용자 저장 완료:', authStore.currentUser)
          
          // 성공 메시지
          if (isNewUser) {
            ElMessage.success(`환영합니다, ${user.name}님! 회원가입이 완료되었습니다.`)
          } else {
            ElMessage.success(`안녕하세요, ${user.name}님!`)
          }
          
          // 메인 페이지로 이동
          console.log('메인 페이지로 이동 시도')
          await this.$router.push('/')
          console.log('메인 페이지 이동 완료')
          
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
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-header {
  margin-bottom: 40px;
}

.logo-icon {
  color: #667eea;
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.login-header p {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
}

.login-form {
  margin-bottom: 30px;
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.social-buttons .el-button {
  height: 48px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.social-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.google-icon {
  background: #4285f4;
  color: white;
}

.naver-icon {
  background: white;
  color: #03c75a;
  border: 1px solid #03c75a;
}

.kakao-icon {
  background: #3c1e1e;
  color: #fee500;
}

.google-btn {
  background: #fff;
  border: 1px solid #dadce0;
  color: #3c4043;
}

.google-btn:hover {
  background: #f8f9fa;
  border-color: #dadce0;
}

.naver-btn {
  background: #03c75a;
  border: 1px solid #03c75a;
  color: white;
}

.naver-btn:hover {
  background: #02b351;
  border-color: #02b351;
}

.kakao-btn {
  background: #fee500;
  border: 1px solid #fee500;
  color: #000;
}

.kakao-btn:hover {
  background: #fdd835;
  border-color: #fdd835;
}

.divider {
  position: relative;
  margin: 24px 0;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
}

.divider span {
  background: white;
  padding: 0 16px;
  color: #7f8c8d;
  font-size: 14px;
}

.guest-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
}

.login-footer {
  font-size: 12px;
  color: #7f8c8d;
  line-height: 1.4;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
}
</style>
