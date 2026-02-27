// Google OAuth 설정
const GOOGLE_CLIENT_ID = '326812627200-ddjmh5oa39477ukssgs5h536k08bvcd7.apps.googleusercontent.com'

export class GoogleAuthService {
  constructor() {
    this.isInitialized = false
    this.userCallback = null
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
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: this.handleCredentialResponse.bind(this)
          })
          this.isInitialized = true
          resolve()
        }
        script.onerror = reject
        document.head.appendChild(script)
      } else {
        this.isInitialized = true
        resolve()
      }
    })
  }

  // 인증 응답 처리
  handleCredentialResponse(response) {
    try {
      // JWT 토큰 디코딩
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      console.log('Google 로그인 성공:', payload)
      
      // 한글 이름 인코딩 문제 해결
      const userInfo = {
        id: payload.sub,
        email: payload.email,
        name: decodeURIComponent(escape(payload.name)) || payload.name, // 한글 디코딩
        picture: payload.picture,
        credential: response.credential // JWT credential 추가
      }
      
      // 콜백 함수가 있으면 호출
      if (this.userCallback) {
        this.userCallback(userInfo)
      }
      
      return userInfo
    } catch (error) {
      console.error('토큰 디코딩 실패:', error)
      if (this.userCallback) {
        this.userCallback(null, error)
      }
    }
  }

  // Google 로그인
  async signIn(callback) {
    this.userCallback = callback
    await this.initialize()
    
    // OAuth 2.0 방식으로 access token 요청
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid profile email',
        callback: (response) => {
          if (response.access_token) {
            // access token으로 사용자 정보 가져오기
            this.getUserInfoWithToken(response.access_token)
          }
        }
      })
      
      tokenClient.requestAccessToken()
    } catch (error) {
      console.error('OAuth 2.0 토큰 요청 실패:', error)
      
      // 실패 시 기존 One Tap 방식으로 fallback
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('One Tap 로그인 실패, 버튼 로그인 사용')
        }
      })
    }
  }

  // Access token으로 사용자 정보 가져오기
  async getUserInfoWithToken(accessToken) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
      const userInfo = await response.json()
      
      const processedUserInfo = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken: accessToken
      }
      
      console.log('OAuth 2.0 사용자 정보:', processedUserInfo)
      
      if (this.userCallback) {
        this.userCallback(processedUserInfo)
      }
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error)
      if (this.userCallback) {
        this.userCallback(null, error)
      }
    }
  }

  // 로그인 버튼 렌더링
  renderButton(elementId, options = {}) {
    const defaultOptions = {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular'
    }
    
    const buttonOptions = { ...defaultOptions, ...options }
    
    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      buttonOptions
    )
  }

  // Google 로그아웃
  async signOut() {
    if (this.isInitialized && window.google) {
      window.google.accounts.id.disableAutoSelect()
      console.log('Google 로그아웃 완료')
    }
  }
}
