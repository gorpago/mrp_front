// 네이버 OAuth 설정
const NAVER_CLIENT_ID = process.env.VUE_APP_NAVER_CLIENT_ID || 'POFsQ7wbhDndWfVxDe6G'
const NAVER_CALLBACK_URL = process.env.VUE_APP_NAVER_CALLBACK_URL || 'http://localhost:3000/auth/naver/callback'

export class NaverAuthService {
  constructor() {
    this.isInitialized = false
    this.naverLogin = null
  }

  // 네이버 로그인 초기화 (SDK 없이 직접 구현)
  async initialize() {
    if (this.isInitialized) return
    
    // SDK 없이 직접 OAuth 2.0 구현
    this.isInitialized = true
    console.log('네이버 로그인 초기화 완료 (직접 구현)')
    return Promise.resolve()
  }

  // 네이버 로그인 (직접 OAuth 2.0 구현)
  async signIn(callback) {
    await this.initialize()
    
    // 이전 로그인 결과 정리
    localStorage.removeItem('naverLoginResult')
    
    return new Promise((resolve, reject) => {
      try {
        // 직접 OAuth 2.0 팝업 로그인
        this.startNaverLogin(callback, resolve, reject)
      } catch (error) {
        console.error('네이버 로그인 오류:', error)
        if (callback) callback(null, error)
        reject(error)
      }
    })
  }

  // 네이버 로그인 시작
  startNaverLogin(callback, resolve, reject) {
    let checkLocalStorage // localStorage 체크 변수 선언
    const state = Date.now().toString()
    const loginUrl = `https://nid.naver.com/oauth2.0/authorize?` +
      `response_type=code&` +
      `client_id=${NAVER_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(NAVER_CALLBACK_URL)}&` +
      `state=${state}`

    console.log('네이버 로그인 URL:', loginUrl)
    console.log('콜백 URL:', NAVER_CALLBACK_URL)

    // 네이버 로그인 팝업 열기
    const loginWindow = window.open(loginUrl, 'naverLogin', 'width=500,height=600,scrollbars=yes,resizable=yes')
    console.log('네이버 로그인 팝업 열림')
    console.log('팝업 창 객체:', loginWindow)
    
    // 팝업 URL 변화 모니터링
    const urlMonitor = setInterval(() => {
      try {
        if (loginWindow && !loginWindow.closed) {
          console.log('팝업 현재 URL:', loginWindow.location.href)
        }
      } catch (e) {
        // CORS로 인해 URL 접근이 안 될 수 있음
        console.log('팝업 URL 접근 불가 (CORS)')
      }
    }, 1000)
    if (!loginWindow) {
      reject(new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.'))
      return
    }

    console.log('네이버 로그인 팝업 열림')
    // 팝업 닫힘 감지
    const checkClosed = setInterval(() => {
      if (loginWindow.closed) {
        console.log('팝업이 닫힘 - 정리 작업 시작')
        clearInterval(checkClosed)
        clearInterval(checkLocalStorage) // localStorage 체크도 정리
        clearInterval(urlMonitor) // URL 모니터링도 정리
        window.removeEventListener('message', messageListener)
        
        // localStorage에서 결과 확인 (팝업이 닫혔지만 결과가 있을 수 있음)
        const result = localStorage.getItem('naverLoginResult')
        if (result) {
          localStorage.removeItem('naverLoginResult')
          
          try {
            const data = JSON.parse(result)
            if (data.type === 'NAVER_LOGIN_SUCCESS') {
              if (callback) callback(data.userInfo)
              resolve(data.userInfo)
              return
            }
          } catch (e) {
            console.error('localStorage 데이터 파싱 오류:', e)
          }
        }
        
        // 팝업이 닫혔지만 URL에서 코드를 확인해볼 수 있음
        // 하지만 일반적으로는 취소로 간주
        console.log('네이버 로그인 팝업이 닫혔습니다 - 실제 네이버 API 호출 시도');
        
        // 마지막 시도: 실제 네이버 API 호출은 복잡하므로 생략
        console.log('실제 네이버 API 호출은 콜백 페이지에서 처리됩니다.');
        
        // 결과가 없으면 취소로 간주
        const error = new Error('로그인이 취소되었습니다.')
        if (callback) callback(null, error)
        reject(error)
      }
    }, 1000)
        
    // 메시지 리스너 (콜백 페이지에서 전송)
    const messageListener = (event) => {
      console.log('메시지 수신:', event.data, 'from:', event.origin)
      
      if (event.origin !== window.location.origin) {
        console.log('Origin 불일치:', event.origin, '!==', window.location.origin)
        return
      }
      
      if (event.data.type === 'NAVER_LOGIN_SUCCESS') {
        console.log('네이버 로그인 성공 메시지 수신')
        clearInterval(checkClosed)
        clearInterval(checkLocalStorage)
        clearInterval(urlMonitor)
        window.removeEventListener('message', messageListener)
        
        const userInfo = event.data.userInfo
        console.log('네이버 사용자 정보:', userInfo)
        
        // 팝업 닫기
        if (loginWindow && !loginWindow.closed) {
          loginWindow.close()
        }
        
        if (callback) callback(userInfo)
        resolve(userInfo)
        
      } else if (event.data.type === 'NAVER_LOGIN_ERROR') {
        console.log('네이버 로그인 오류 메시지 수신:', event.data.error)
        clearInterval(checkClosed)
        clearInterval(checkLocalStorage)
        clearInterval(urlMonitor)
        window.removeEventListener('message', messageListener)
        
        // 팝업 닫기
        if (loginWindow && !loginWindow.closed) {
          loginWindow.close()
        }
        
        const error = new Error(event.data.error)
        if (callback) callback(null, error)
        reject(error)
      }
    }

    window.addEventListener('message', messageListener)
    console.log('메시지 리스너 등록 완료')
    
    // localStorage 백업 방법 - 주기적으로 확인 (성공 결과만)
    checkLocalStorage = setInterval(() => {
      const result = localStorage.getItem('naverLoginResult')
      if (result) {
        console.log('localStorage에서 네이버 로그인 결과 발견:', result)
        
        try {
          const data = JSON.parse(result)
          // 성공 결과만 처리, 오류는 무시하고 계속 대기
          if (data.type === 'NAVER_LOGIN_SUCCESS') {
            console.log('localStorage를 통한 네이버 로그인 성공')
            localStorage.removeItem('naverLoginResult')
            clearInterval(checkLocalStorage)
            clearInterval(checkClosed)
            clearInterval(urlMonitor)
            window.removeEventListener('message', messageListener)
            
            if (callback) callback(data.userInfo)
            resolve(data.userInfo)
            
            // 팝업 닫기
            if (loginWindow && !loginWindow.closed) {
              loginWindow.close()
            }
          } else {
            // 오류 결과는 삭제하고 계속 대기
            localStorage.removeItem('naverLoginResult')
          }
        } catch (e) {
          console.error('localStorage 데이터 파싱 오류:', e)
          localStorage.removeItem('naverLoginResult')
        }
      }
    }, 1000)
  }

  // 네이버 로그아웃
  async signOut() {
    // 직접 구현 - 로컬 상태만 정리
    console.log('네이버 로그아웃 완료')
  }
}
