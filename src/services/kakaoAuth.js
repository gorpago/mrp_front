// 카카오 OAuth 설정
const KAKAO_APP_KEY = 'YOUR_KAKAO_JAVASCRIPT_KEY'

export class KakaoAuthService {
  constructor() {
    this.isInitialized = false
  }

  // 카카오 SDK 초기화
  async initialize() {
    if (this.isInitialized) return

    return new Promise((resolve, reject) => {
      if (!window.Kakao) {
        const script = document.createElement('script')
        script.src = 'https://developers.kakao.com/sdk/js/kakao.js'
        script.onload = () => {
          window.Kakao.init(KAKAO_APP_KEY)
          this.isInitialized = true
          resolve()
        }
        script.onerror = reject
        document.head.appendChild(script)
      } else {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(KAKAO_APP_KEY)
        }
        this.isInitialized = true
        resolve()
      }
    })
  }

  // 카카오 로그인
  async signIn() {
    await this.initialize()

    return new Promise((resolve, reject) => {
      window.Kakao.Auth.login({
        success: (authObj) => {
          // 사용자 정보 가져오기
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: (userInfo) => {
              resolve({
                provider: 'kakao',
                accessToken: authObj.access_token,
                userInfo: {
                  id: userInfo.id.toString(),
                  name: userInfo.kakao_account?.profile?.nickname || '카카오 사용자',
                  email: userInfo.kakao_account?.email,
                  picture: userInfo.kakao_account?.profile?.profile_image_url
                }
              })
            },
            fail: (error) => {
              reject(new Error('사용자 정보 조회 실패: ' + error.msg))
            }
          })
        },
        fail: (error) => {
          reject(new Error('카카오 로그인 실패: ' + error.error_description))
        }
      })
    })
  }

  // 카카오 로그아웃
  async signOut() {
    if (this.isInitialized && window.Kakao.Auth.getAccessToken()) {
      return new Promise((resolve) => {
        window.Kakao.Auth.logout(() => {
          resolve()
        })
      })
    }
  }
}
