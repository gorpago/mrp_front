import axios from 'axios'

// API 기본 설정 - 환경변수에서 자동으로 가져옴
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8084/api'

// 현재 사용 중인 API 주소 로그 출력
console.log('🌐 현재 환경:', process.env.NODE_ENV)
console.log('🔗 API 서버 주소:', API_BASE_URL)
console.log('📝 환경변수 값:', process.env.VUE_APP_API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 요청 인터셉터
api.interceptors.request.use(
  config => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  error => {
    console.error('API Error 상세:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data
    })
    
    // 400 오류의 경우 백엔드 응답 메시지 출력
    if (error.response?.status === 400) {
      console.error('백엔드 400 오류 응답:', error.response.data)
    }
    
    // 네트워크 에러 처리
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('네트워크 연결 실패 - 백엔드 서버 확인 필요')
    }
    
    return Promise.reject(error)
  }
)

// 메트로놈 API
export const metronomeAPI = {
  // 세션 생성
  createSession: (sessionData) => api.post('/metronome/session/create', sessionData),
  
  // 세션 참가
  joinSession: (sessionCode, userId, userName) => 
    api.post(`/metronome/session/join/${sessionCode}?userId=${userId}&userName=${userName}`),
  
  // 세션 나가기
  leaveSession: (sessionId, userId) => 
    api.post(`/metronome/session/${sessionId}/leave?userId=${userId}`),
  
  // 세션 업데이트 (BPM, 재생상태 등)
  updateSession: (sessionId, updates) => 
    api.put(`/metronome/session/${sessionId}/update`, updates),
  
  // 세션 조회
  getSession: (sessionId) => api.get(`/metronome/session/${sessionId}`),
  
  // 활성 세션 목록
  getActiveSessions: () => api.get('/metronome/sessions/active'),
  
  // 사용자 세션 목록
  getUserSessions: (userId) => api.get(`/metronome/sessions/user/${userId}`),
  
  // 세션 종료
  endSession: (sessionId, hostUserId) => 
    api.delete(`/metronome/session/${sessionId}?hostUserId=${hostUserId}`),
  
  // 세션 삭제 (호스트 전용)
  deleteSession: (sessionId, hostUserId) => 
    api.delete(`/metronome/session/${sessionId}?hostUserId=${hostUserId}`),
  
  // 동기화된 메트로놈 시작
  startSyncedMetronome: (sessionId, hostUserId, delaySeconds = 5) => 
    api.post(`/metronome/session/${sessionId}/sync-start?hostUserId=${hostUserId}&delaySeconds=${delaySeconds}`),
  
  // 서버 시간 조회 (동기화용)
  getServerTime: () => api.get('/metronome/server-time'),
  
  // 테스트 세션 생성
  createTestSession: () => api.get('/metronome/test-create')
}

// 연주영상 API
export const performanceAPI = {
  // 연주영상 목록
  getVideos: () => api.get('/performance/videos'),
  
  // 특정 연주영상 조회
  getVideo: (videoId) => api.get(`/performance/video/${videoId}`),
  
  // 연주영상 업로드
  uploadVideo: (videoData) => api.post('/performance/video/upload', videoData),
  
  // 테스트 영상 생성
  createTestVideo: () => api.get('/performance/test-create')
}

// 사용자 API
export const userAPI = {
  // 사용자 생성
  createUser: (userData) => api.post('/users/create', userData),
  
  // 사용자 조회
  getUser: (userId) => api.get(`/users/${userId}`),
  
  // 모든 사용자 조회
  getAllUsers: () => api.get('/users/all'),
  
  // 사용자 업데이트
  updateUser: (userId, userData) => api.put(`/users/${userId}`, userData),
  
  // 사용자 삭제
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  
  // 테스트 사용자 생성
  createTestUser: () => api.get('/users/test-create')
}

// 인증 API
export const authAPI = {
  // 소셜 로그인
  socialLogin: (loginData) => api.post('/auth/social-login', loginData),
  
  // 로그아웃
  logout: (userId) => api.post(`/auth/logout?userId=${userId}`),
  
  // 인증 테스트
  testAuth: () => api.get('/auth/test')
}

export default api
