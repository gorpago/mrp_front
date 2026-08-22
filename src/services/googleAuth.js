import { Browser } from '@capacitor/browser'

// Google OAuth 설정 - 환경변수에서 자동으로 가져옴
const GOOGLE_CLIENT_ID = process.env.VUE_APP_GOOGLE_CLIENT_ID || '326812627200-ddjmh5oa39477ukssgs5h536k08bvcd7.apps.googleusercontent.com'
const REDIRECT_URI = 'https://musicplan-2df35.web.app/auth/callback' // Firebase 호스팅 URL

// Capacitor 앱 환경 감지
const isCapacitorApp = () => {
  return window.location.protocol === 'capacitor:' || 
         window.location.protocol === 'https:' && window.location.hostname === 'localhost'
}

// 현재 Google OAuth 설정 로그 출력
console.log('🔑 Google Client ID:', GOOGLE_CLIENT_ID)
console.log('🌐 현재 도메인:', window.location.origin)
console.log('📝 환경:', process.env.NODE_ENV)
console.log('📱 Capacitor 앱:', isCapacitorApp())

export class GoogleAuthService {
  constructor() {
    this.isInitialized = false
    this.google = null
  }

  // Google Identity Services 초기화
  async initialize() {
    if (this.isInitialized) return

    return new Promise((resolve, reject) => {
      // Google Identity Services 스크립트 로드
      if (!window.google) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.onload = () => {
          try {
            // Google Identity Services 초기화
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: this.handleCredentialResponse.bind(this)
            })
            
            this.isInitialized = true
            this.google = window.google
            console.log('Google Identity Services 초기화 완료')
            resolve()
          } catch (error) {
            console.error('Google Identity Services 초기화 실패:', error)
            reject(error)
          }
        }
        script.onerror = (error) => {
          console.error('Google Identity Services 스크립트 로드 실패:', error)
          reject(error)
        }
        document.head.appendChild(script)
      } else {
        this.google = window.google
        this.isInitialized = true
        resolve()
      }
    })
  }

  // 자격 증명 응답 처리
  handleCredentialResponse(response) {
    console.log('Google 자격 증명 응답:', response)
    // 이 메서드는 팝업 방식에서는 사용되지 않음
  }

  // Google 로그인 (팝업 방식)
  async signIn() {
    await this.initialize()
    
    return new Promise((resolve, reject) => {
      try {
        // OAuth 2.0 팝업 방식 사용
        const client = this.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid profile email',
          callback: (response) => {
            if (response.error) {
              console.error('Google 로그인 오류:', response.error)
              console.error('오류 상세:', response)
              console.error('현재 도메인:', window.location.origin)
              console.error('Google Cloud Console에서 이 도메인을 승인된 JavaScript 원본에 추가해야 합니다.')
              reject(new Error(response.error))
              return
            }
            
            // 액세스 토큰으로 사용자 정보 가져오기
            this.getUserInfo(response.access_token)
              .then(userInfo => {
                resolve({
                  provider: 'google',
                  accessToken: response.access_token,
                  userInfo: userInfo
                })
              })
              .catch(reject)
          }
        })
        
        // 팝업으로 로그인 시작
        client.requestAccessToken()
        
      } catch (error) {
        console.error('Google 로그인 초기화 실패:', error)
        reject(error)
      }
    })
  }

  // 사용자 정보 가져오기
  async getUserInfo(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('사용자 정보 가져오기 실패')
      }
      
      const userInfo = await response.json()
      return {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      }
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error)
      throw error
    }
  }

  // Capacitor 앱용 Browser 플러그인 로그인
  async signInWithBrowser() {
    try {
      console.log('📱 Capacitor 앱에서 Browser 플러그인으로 Google 로그인 시작')
      
      // OAuth URL 생성
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=token&` +
        `scope=openid%20profile%20email`
      
      console.log('🔗 OAuth URL:', authUrl)
      
      // Browser 플러그인으로 OAuth 페이지 열기
      await Browser.open({ url: authUrl })
      
      // 현재는 게스트 로그인으로 대체 (OAuth 콜백 처리는 추가 구현 필요)
      console.warn('⚠️ OAuth 콜백 처리가 구현되지 않았습니다. 게스트로 계속하기를 사용해주세요.')
      throw new Error('현재 앱에서는 게스트 로그인만 지원됩니다. "게스트로 계속하기"를 사용해주세요.')
    } catch (error) {
      console.error('Browser 플러그인 로그인 실패:', error)
      throw error
    }
  }

  // Google 로그아웃
  async signOut() {
    if (this.isInitialized && this.google) {
      try {
        this.google.accounts.id.disableAutoSelect()
        console.log('Google 로그아웃 완료')
      } catch (error) {
        console.error('Google 로그아웃 실패:', error)
      }
    }
  }
}
