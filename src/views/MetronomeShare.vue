<template>
  <div class="metronome-share">
    <!-- 액션 버튼 섹션 -->
    <div class="action-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="12">
          <el-card class="action-card" shadow="hover" @click="showCreateDialog = true">
            <div class="action-content">
              <el-icon class="action-icon"><Plus /></el-icon>
              <h3>세션 생성</h3>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="12">
          <el-card class="action-card" shadow="hover" @click="showJoinDialog = true">
            <div class="action-content">
              <el-icon class="action-icon"><Connection /></el-icon>
              <h3>세션 참가</h3>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 활성 세션 목록 -->
    <div class="sessions-section">
      <div class="section-header">
        <h2>활성 세션 목록</h2>
        <div class="header-buttons">
          <el-button @click="loadActiveSessions" :loading="loading">
            <el-icon><Refresh /></el-icon>
            새로고침
          </el-button>
          <el-button @click="testConnection" type="info">
            <el-icon><Connection /></el-icon>
            연결 테스트
          </el-button>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="activeSessions.length === 0" class="empty-state">
        <el-empty description="현재 활성 세션이 없습니다">
          <el-button type="primary" @click="showCreateDialog = true">
            첫 번째 세션 만들기
          </el-button>
        </el-empty>
      </div>

      <el-row v-else :gutter="20">
        <el-col 
          v-for="session in activeSessions" 
          :key="session.id"
          :xs="24" :sm="12" :md="8"
        >
          <el-card class="session-card" shadow="hover">
            <div class="session-header">
              <h4>{{ session.sessionName }}</h4>
              <el-tag :type="session.isPlaying ? 'success' : 'info'">
                {{ session.isPlaying ? '재생중' : '정지' }}
              </el-tag>
            </div>
            
            <div class="session-info">
              <div class="info-item">
                <el-icon><User /></el-icon>
                <span>{{ session.hostUserName }}</span>
              </div>
              <div class="info-item">
                <el-icon><Timer /></el-icon>
                <span>{{ session.bpm }} BPM</span>
              </div>
              <div class="info-item">
                <el-icon><User /></el-icon>
                <span>{{ session.currentParticipantCount }}/{{ session.maxParticipants }}</span>
              </div>
              <div class="info-item">
                <el-icon><Headset /></el-icon>
                <span>{{ session.timeSignature }}/4</span>
              </div>
            </div>

            <div class="session-meta">
              <el-tag size="small" v-if="session.genre">{{ session.genre }}</el-tag>
              <span class="session-code">코드: {{ session.sessionCode }}</span>
            </div>

            <div class="session-actions">
              <el-button 
                v-if="isHost(session)"
                type="primary" 
                size="small" 
                @click="goToSession(session.id)"
              >
                내 세션
              </el-button>
              <el-button 
                v-else-if="isAlreadyParticipant(session)"
                type="primary" 
                size="small" 
                @click="goToSession(session.id)"
              >
                입장
              </el-button>
              <el-button 
                v-else
                type="primary" 
                size="small" 
                @click="joinSession(session.sessionCode)"
                :disabled="session.isFull"
              >
                {{ session.isFull ? '세션 가득함' : '참가하기' }}
              </el-button>
              
              <!-- 호스트만 삭제 버튼 표시 -->
              <el-button 
                v-if="isHost(session)"
                type="danger" 
                size="small" 
                @click="confirmDeleteSession(session)"
                :loading="deleting"
              >
                삭제
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 세션 생성 다이얼로그 -->
    <el-dialog v-model="showCreateDialog" title="새 세션 만들기" width="500px">
      <el-form :model="newSession" label-width="120px">
        <el-form-item label="세션명" required>
          <el-input v-model="newSession.sessionName" placeholder="세션 이름을 입력하세요" />
        </el-form-item>
        
        <el-form-item label="호스트 이름" required>
          <el-input 
            v-model="newSession.hostUserName" 
            placeholder="호스트 이름을 입력하세요"
          />
        </el-form-item>
        
        <el-form-item label="BPM">
          <el-slider v-model="newSession.bpm" :min="60" :max="200" show-input />
        </el-form-item>
        
        <el-form-item label="박자">
          <el-select v-model="newSession.timeSignature" placeholder="박자를 선택하세요">
            <el-option label="4/4" :value="4" />
            <el-option label="3/4" :value="3" />
            <el-option label="2/4" :value="2" />
            <el-option label="6/8" :value="6" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="장르">
          <el-select v-model="newSession.genre" placeholder="장르를 선택하세요">
            <el-option label="Rock" value="Rock" />
            <el-option label="Pop" value="Pop" />
            <el-option label="Jazz" value="Jazz" />
            <el-option label="Classical" value="Classical" />
            <el-option label="Blues" value="Blues" />
            <el-option label="Folk" value="Folk" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="최대 참가자">
          <el-input-number v-model="newSession.maxParticipants" :min="2" :max="20" />
        </el-form-item>
        
        <el-form-item label="설명">
          <el-input 
            v-model="newSession.description" 
            type="textarea" 
            placeholder="세션에 대한 설명을 입력하세요"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">취소</el-button>
        <el-button type="primary" @click="createSession" :loading="creating">
          세션 생성
        </el-button>
      </template>
    </el-dialog>

    <!-- 세션 참가 다이얼로그 -->
    <el-dialog v-model="showJoinDialog" title="세션 참가하기" width="400px">
      <el-form :model="joinForm" label-width="100px">
        <el-form-item label="세션 코드" required>
          <el-input 
            v-model="joinForm.sessionCode" 
            placeholder="6자리 세션 코드"
            maxlength="6"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="참여 아이디" required>
          <el-input 
            v-model="joinForm.userId" 
            placeholder="세션에서 사용할 아이디"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="당신의 이름" required>
          <el-input v-model="joinForm.userName" placeholder="이름을 입력하세요" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showJoinDialog = false">취소</el-button>
        <el-button type="primary" @click="joinSessionByCode" :loading="joining">
          참가하기
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { metronomeAPI } from '@/services/api'
import { ElMessage } from 'element-plus'
import { authStore } from '@/store/auth'

export default {
  name: 'MetronomeSharePage',
  data() {
    return {
      loading: false,
      creating: false,
      joining: false,
      deleting: false,
      activeSessions: [],
      showCreateDialog: false,
      showJoinDialog: false,
      newSession: {
        sessionName: '',
        hostUserName: '',
        hostUserId: '',
        bpm: 120,
        timeSignature: 4,
        genre: '',
        maxParticipants: 10,
        description: ''
      },
      joinForm: {
        sessionCode: '',
        userName: '',
        userId: '' // loadUserInfo에서 설정
      }
    }
  },
  computed: {
    authStore() {
      return authStore
    }
  },
  async mounted() {
    // 로그인한 사용자 정보 로드
    this.loadUserInfo()
    await this.loadActiveSessions()
  },
  async activated() {
    // 페이지에 다시 들어올 때마다 사용자 정보 새로 로드
    this.loadUserInfo()
    await this.loadActiveSessions()
  },
  methods: {
    // 로그인한 사용자 정보 로드
    loadUserInfo() {
      // authStore에서 사용자 정보 로드
      authStore.loadUser()
      
      // localStorage에 저장된 참여 아이디 우선 사용
      const savedGuestId = localStorage.getItem('guestUserId')
      
      if (authStore.isLoggedIn && authStore.currentUser) {
        const userId = savedGuestId || authStore.currentUser.id || 'guest-' + Date.now()
        const userName = authStore.currentUser.name || '익명 사용자'
        
        // 현재 사용자 ID를 localStorage와 동기화
        authStore.currentUser.id = userId
        authStore.updateUser(authStore.currentUser)
        
        // 세션 생성 폼에 설정
        this.newSession.hostUserName = userName
        this.newSession.hostUserId = userId
        
        // 참가 폼에도 설정
        this.joinForm.userName = userName
        this.joinForm.userId = userId
        
        console.log('로그인한 사용자 정보 로드됨:', authStore.currentUser)
      } else {
        // 로그인하지 않은 경우
        const tempId = savedGuestId || 'guest-' + Date.now()
        localStorage.setItem('guestUserId', tempId)
        this.newSession.hostUserName = '익명 사용자'
        this.newSession.hostUserId = tempId
        this.joinForm.userName = '익명 사용자'
        this.joinForm.userId = tempId
        console.log('게스트 사용자 ID 사용:', tempId)
      }
    },
    
    // 참여 아이디/이름을 현재 사용자로 저장
    saveParticipantId(userId, userName) {
      localStorage.setItem('guestUserId', userId)
      
      if (authStore.isLoggedIn && authStore.currentUser) {
        authStore.currentUser.id = userId
        authStore.currentUser.name = userName
        authStore.updateUser(authStore.currentUser)
      } else {
        const guestUser = {
          id: userId,
          name: userName,
          email: null,
          provider: 'guest',
          providerId: null,
          isGuest: true
        }
        authStore.login(guestUser)
      }
    },
    
    async loadActiveSessions() {
      this.loading = true
      try {
        const response = await metronomeAPI.getActiveSessions()
        this.activeSessions = response.data
      } catch (error) {
        console.error('활성 세션 로드 실패:', error)
        ElMessage.error('활성 세션을 불러오는데 실패했습니다')
      } finally {
        this.loading = false
      }
    },
    
    async createSession() {
      if (!this.newSession.sessionName || !this.newSession.hostUserName) {
        ElMessage.warning('세션명과 호스트 이름은 필수입니다')
        return
      }
      
      this.creating = true
      try {
        console.log('세션 생성 요청 데이터:', this.newSession)
        const response = await metronomeAPI.createSession(this.newSession)
        const session = response.data
        
        console.log('세션 생성 성공:', session)
        // 세션 코드를 강조해서 보여주는 다이얼로그
        this.$alert(
          `세션이 성공적으로 생성되었습니다!\n\n세션 코드: ${session.sessionCode}\n\n다른 멤버들이 이 코드로 참가할 수 있습니다.`,
          '세션 생성 완료',
          {
            confirmButtonText: '세션으로 이동',
            type: 'success',
            showClose: false
          }
        ).then(() => {
          this.showCreateDialog = false
          // 생성된 세션으로 이동
          this.$router.push(`/metronome/session/${session.id}`)
        })
        
        // 추가로 일반 메시지도 표시
        ElMessage.success(`세션 코드: ${session.sessionCode}`)
      } catch (error) {
        console.error('세션 생성 실패 상세:', error)
        console.error('에러 응답:', error.response?.data)
        console.error('에러 상태:', error.response?.status)
        
        let errorMessage = '세션 생성에 실패했습니다'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        ElMessage.error(errorMessage)
      } finally {
        this.creating = false
      }
    },
    
    async joinSessionByCode() {
      const { sessionCode, userId, userName } = this.joinForm
      
      if (!sessionCode || !userName || !userId) {
        ElMessage.warning('세션 코드, 아이디, 이름은 필수입니다')
        return
      }
      
      // 참여 아이디/이름 저장
      this.saveParticipantId(userId, userName)
      
      this.joining = true
      try {
        // 활성 세션 목록에서 해당 세션 찾기
        const targetSession = this.activeSessions.find(s => s.sessionCode === sessionCode)
        
        if (targetSession && (this.isHost(targetSession) || this.isAlreadyParticipant(targetSession))) {
          ElMessage.warning('이미 참가 중이거나 내가 생성한 세션입니다. 세션으로 이동합니다.')
          this.showJoinDialog = false
          this.$router.push(`/metronome/session/${targetSession.id}`)
          return
        }
        
        // 이미 같은 아이디로 참가 중인 세션인지 확인
        const userSessionsResponse = await metronomeAPI.getUserSessions(userId)
        const userSessions = userSessionsResponse.data || []
        const alreadyJoined = userSessions.find(s => s.sessionCode === sessionCode)
        
        if (alreadyJoined) {
          ElMessage.warning('이미 참가 중인 세션입니다. 세션으로 이동합니다.')
          this.showJoinDialog = false
          this.$router.push(`/metronome/session/${alreadyJoined.id}`)
          return
        }
        
        console.log('세션 참가 요청:', { sessionCode, userId, userName })
        
        const response = await metronomeAPI.joinSession(sessionCode, userId, userName)
        
        if (response.data.success) {
          ElMessage.success('세션에 참가했습니다!')
          this.showJoinDialog = false
          
          // 참가한 세션으로 이동
          this.$router.push(`/metronome/session/${response.data.session.id}`)
        } else {
          ElMessage.error(response.data.message)
        }
      } catch (error) {
        console.error('세션 참가 실패:', error)
        const message = error.response?.data?.message || error.message
        if (message && (message.includes('이미 참가') || message.includes('already') || message.includes('duplicate') || message.includes('중복'))) {
          ElMessage.error('이미 세션에 참가 중인 아이디입니다. 다른 아이디를 사용해주세요.')
        } else {
          ElMessage.error(message || '세션 참가에 실패했습니다')
        }
      } finally {
        this.joining = false
      }
    },
    
    joinSession(sessionCode) {
      this.joinForm.sessionCode = sessionCode
      this.showJoinDialog = true
    },
    
    async testConnection() {
      try {
        console.log('백엔드 연결 테스트 시작...')
        const response = await metronomeAPI.createTestSession()
        console.log('연결 테스트 성공:', response.data)
        ElMessage.success('백엔드 연결 성공!')
      } catch (error) {
        console.error('연결 테스트 실패:', error)
        if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          ElMessage.error('백엔드 서버에 연결할 수 없습니다. Spring Boot 서버가 실행 중인지 확인하세요.')
        } else {
          ElMessage.error(`연결 테스트 실패: ${error.message}`)
        }
      }
    },
    
    // 현재 사용자 ID 가져오기
    getCurrentUserId() {
      return this.joinForm.userId || 
             (authStore.isLoggedIn && authStore.currentUser?.id) || 
             localStorage.getItem('guestUserId')
    },
    
    // 호스트 권한 확인
    isHost(session) {
      const currentUserId = this.getCurrentUserId()
      
      console.log('호스트 권한 확인:', {
        sessionHostUserId: session.hostUserId,
        currentUserId: currentUserId,
        isHost: session.hostUserId === currentUserId
      })
      
      return session.hostUserId === currentUserId
    },
    
    // 이미 참가자인지 확인
    isAlreadyParticipant(session) {
      const currentUserId = this.getCurrentUserId()
      const participants = session.participants || []
      
      return participants.some(p => {
        const pId = p.userId || p
        return String(pId) === String(currentUserId)
      })
    },
    
    // 세션으로 이동
    goToSession(sessionId) {
      this.$router.push(`/metronome/session/${sessionId}`)
    },
    
    // 세션 삭제 확인 다이얼로그
    confirmDeleteSession(session) {
      this.$confirm(
        `"${session.sessionName}" 세션을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 참가자가 세션에서 나가게 됩니다.`,
        '세션 삭제 확인',
        {
          confirmButtonText: '삭제',
          cancelButtonText: '취소',
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      ).then(() => {
        this.deleteSession(session)
      }).catch(() => {
        // 취소됨
      })
    },
    
    // 세션 삭제 실행
    async deleteSession(session) {
      this.deleting = true
      try {
        console.log('세션 삭제 요청:', session.id, session.hostUserId)
        
        const response = await metronomeAPI.deleteSession(session.id, session.hostUserId)
        
        if (response.data.success) {
          ElMessage.success('세션이 성공적으로 삭제되었습니다!')
          
          // 세션 목록에서 제거
          this.activeSessions = this.activeSessions.filter(s => s.id !== session.id)
        } else {
          ElMessage.error(response.data.message || '세션 삭제에 실패했습니다')
        }
      } catch (error) {
        console.error('세션 삭제 실패:', error)
        
        let errorMessage = '세션 삭제에 실패했습니다'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        ElMessage.error(errorMessage)
      } finally {
        this.deleting = false
      }
    }
  }
}
</script>

<style scoped>
.metronome-share {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 20px;
}

.action-section {
  margin-bottom: 20px;
}

.action-card {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-card:hover {
  transform: translateY(-5px);
  border-color: #667eea;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
}

.action-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 16px;
}

.action-icon {
  font-size: 40px;
  color: #667eea;
  flex-shrink: 0;
}

.action-content h3 {
  font-size: 1.4rem;
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.sessions-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.section-header h2 {
  color: #2c3e50;
  margin: 0;
}

.loading-container {
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.session-card {
  margin-bottom: 12px;
  height: 100%;
}

.session-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.session-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
}

.session-info {
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 0.85rem;
}

.session-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.session-code {
  font-size: 0.8rem;
  color: #999;
  font-family: monospace;
}

.session-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
  
  .action-content {
    padding: 20px 15px;
  }
  
  .action-icon {
    font-size: 36px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .session-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .session-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
