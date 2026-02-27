import { reactive } from 'vue'

// 전역 인증 상태
export const authStore = reactive({
  currentUser: null,
  isLoggedIn: false,

  // 사용자 로그인
  login(user) {
    this.currentUser = user
    this.isLoggedIn = true
    localStorage.setItem('currentUser', JSON.stringify(user))
    localStorage.setItem('loginTime', Date.now().toString())
  },

  // 사용자 로그아웃
  logout() {
    this.currentUser = null
    this.isLoggedIn = false
    localStorage.removeItem('currentUser')
    localStorage.removeItem('loginTime')
  },

  // 로컬 스토리지에서 사용자 정보 로드
  loadUser() {
    try {
      const userStr = localStorage.getItem('currentUser')
      if (userStr) {
        const user = JSON.parse(userStr)
        this.currentUser = user
        this.isLoggedIn = true
        return user
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error)
      this.logout() // 오류 시 로그아웃 처리
    }
    return null
  },

  // 사용자 정보 업데이트
  updateUser(userData) {
    if (this.currentUser) {
      Object.assign(this.currentUser, userData)
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
    }
  }
})
