<template>
  <div class="metronome-session">
    <!-- 세션 헤더 -->
    <div class="session-header">
      <el-card>
        <div class="header-content">
          <div class="session-info">
            <h2>{{ session?.sessionName || '메트로놈 세션' }}</h2>
            <div class="session-meta">
              <el-tag :type="session?.isPlaying ? 'success' : 'info'">
                {{ session?.isPlaying ? '재생중' : '정지' }}
              </el-tag>
              <span class="session-code">세션 코드: {{ session?.sessionCode }}</span>
              <span class="host-info">호스트: {{ session?.hostUserName }}</span>
            </div>
          </div>
          
          <div class="session-actions">
            <el-button @click="leaveSession" type="danger">
              <el-icon><Back /></el-icon>
              세션 나가기
            </el-button>
            <el-button v-if="isHost" @click="showDeleteConfirm = true" type="danger" plain>
              <el-icon><Delete /></el-icon>
              세션 삭제
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 메트로놈 컨트롤 -->
    <div class="metronome-control">
      <el-card>
        <div class="metronome-display">
          <!-- BPM 디스플레이 -->
          <div class="bpm-display">
            <div class="bpm-number">{{ currentBpm }}</div>
            <div class="bpm-label">BPM</div>
          </div>

          <!-- 메트로놈 비주얼 -->
          <div class="metronome-visual">
            <div 
              class="metronome-circle" 
              :class="{ 'beat': isBeat, 'playing': isPlaying }"
            >
              <div class="beat-indicator"></div>
            </div>
          </div>

          <div class="time-signature">
            <span>{{ session?.timeSignature || 4 }}/4</span>
          </div>
        </div>

        <!-- 재생/정지 버튼 -->
        <div class="play-controls">
          <el-button 
            v-if="isHost"
            @click="startSyncedMetronome" 
            :loading="updating"
            :type="isPlaying ? 'danger' : 'success'"
            size="large"
            circle
            :disabled="isPlaying"
          >
            <el-icon v-if="!updating">
              <VideoPlay v-if="!isPlaying" />
              <VideoPause v-else />
            </el-icon>
          </el-button>
          
          <el-button 
            v-if="isHost && isPlaying"
            @click="stopMetronome" 
            type="danger"
            size="large"
            circle
          >
            <el-icon><Close /></el-icon>
          </el-button>
          
          <div v-else class="guest-status">
            <el-tag :type="isPlaying ? 'success' : 'info'" size="large">
              {{ isPlaying ? '재생중' : '대기중' }}
            </el-tag>
            <p>호스트가 메트로놈을 제어합니다</p>
            <div v-if="syncCountdown > 0" class="sync-countdown">
              <el-tag type="warning" size="large">
                {{ syncCountdown }}초 후 시작
              </el-tag>
            </div>
          </div>
        </div>

        <!-- BPM 조절 (호스트만) -->
        <div v-if="isHost" class="bpm-control">
          <h4>BPM 조절</h4>
          <el-row :gutter="10" align="middle">
            <el-col :span="4">
              <el-button @click="decreaseBpm" :disabled="currentBpm <= 60">
                <el-icon><Minus /></el-icon>
              </el-button>
            </el-col>
            <el-col :span="16">
              <el-slider 
                v-model="currentBpm" 
                :min="60" 
                :max="200" 
                @change="updateBpm"
                show-input
              />
            </el-col>
            <el-col :span="4">
              <el-button @click="increaseBpm" :disabled="currentBpm >= 200">
                <el-icon><Plus /></el-icon>
              </el-button>
            </el-col>
          </el-row>
        </div>

        <!-- 박자 조절 (호스트만) -->
        <div v-if="isHost" class="time-signature-control">
          <h4>박자 설정</h4>
          <el-radio-group v-model="currentTimeSignature" @change="updateTimeSignature">
            <el-radio :label="4">4/4</el-radio>
            <el-radio :label="3">3/4</el-radio>
            <el-radio :label="2">2/4</el-radio>
            <el-radio :label="6">6/8</el-radio>
          </el-radio-group>
        </div>
      </el-card>
    </div>

    <!-- 참가자 목록 -->
    <div class="participants-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>참가자 ({{ session?.currentParticipantCount || 0 }}/{{ session?.maxParticipants || 10 }})</span>
          </div>
        </template>
        
        <div class="participants-list">
          <div class="participant-item host">
            <el-avatar :size="40">
              <el-icon><Star /></el-icon>
            </el-avatar>
            <div class="participant-info">
              <div class="participant-name">{{ session?.hostUserName }}</div>
              <div class="participant-role">호스트</div>
            </div>
          </div>
          
          <div 
            v-for="(participantId, index) in session?.participantIds || []" 
            :key="participantId"
            class="participant-item"
          >
            <el-avatar :size="40">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="participant-info">
              <div class="participant-name">참가자 {{ index + 1 }}</div>
              <div class="participant-role">멤버</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 세션 정보 -->
    <div class="session-details">
      <el-card>
        <template #header>
          <span>세션 정보</span>
        </template>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="세션명">
            {{ session?.sessionName }}
          </el-descriptions-item>
          <el-descriptions-item label="장르">
            {{ session?.genre || '미설정' }}
          </el-descriptions-item>
          <el-descriptions-item label="생성일시">
            {{ formatDate(session?.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="시작일시">
            {{ session?.startedAt ? formatDate(session.startedAt) : '미시작' }}
          </el-descriptions-item>
          <el-descriptions-item label="설명" :span="2">
            {{ session?.description || '설명이 없습니다.' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <!-- 세션 삭제 확인 다이얼로그 -->
    <el-dialog v-model="showDeleteConfirm" title="세션 삭제 확인" width="400px">
      <div style="text-align: center; padding: 20px;">
        <el-icon style="font-size: 48px; color: #f56c6c; margin-bottom: 16px;"><WarningFilled /></el-icon>
        <h3>정말로 세션을 삭제하시겠습니까?</h3>
        <p style="color: #666; margin: 16px 0;">
          세션을 삭제하면 모든 참가자가 세션에서 나가게 되며,<br>
          이 작업은 되돌릴 수 없습니다.
        </p>
        <div style="margin-top: 24px;">
          <el-button @click="showDeleteConfirm = false">취소</el-button>
          <el-button type="danger" @click="deleteSession" :loading="updating">
            삭제하기
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { metronomeAPI } from '@/services/api'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoPause, Plus, Minus, Back, Delete, WarningFilled, Close } from '@element-plus/icons-vue'

export default {
  name: 'MetronomeSessionPage',
  components: {
    VideoPlay,
    VideoPause, 
    Close,
    Plus,
    Minus,
    Back,
    Delete,
    WarningFilled
  },
  props: {
    sessionId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      session: null,
      loading: false,
      updating: false,
      isPlaying: false,
      isBeat: false,
      currentBpm: 120,
      currentTimeSignature: 4,
      currentUserId: 'user-' + Date.now(), // 임시 사용자 ID
      metronomeInterval: null,
      beatCount: 0,
      audioContext: null,
      oscillator: null,
      showDeleteConfirm: false,
      // 동기화 관련
      syncCountdown: 0,
      syncStartTime: null,
      serverTimeOffset: 0,
      syncInterval: null
    }
  },
  computed: {
    isHost() {
      return this.session?.hostUserId === this.currentUserId
    }
  },
  async mounted() {
    await this.loadSession()
    this.setupAudio()
    this.startPolling()
    this.setupVisibilityHandler()
  },
  beforeUnmount() {
    this.stopMetronome()
    this.stopPolling()
    
    // 동기화 관련 타이머 정리
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
    }
  },
  methods: {
    async loadSession() {
      this.loading = true
      try {
        const response = await metronomeAPI.getSession(this.sessionId)
        this.session = response.data
        this.currentBpm = this.session.bpm
        this.currentTimeSignature = this.session.timeSignature
        this.isPlaying = this.session.isPlaying
        
        if (this.isPlaying) {
          this.startMetronome()
        }
      } catch (error) {
        console.error('세션 로드 실패:', error)
        ElMessage.error('세션을 불러오는데 실패했습니다')
        this.$router.push('/metronome')
      } finally {
        this.loading = false
      }
    },
    
    // 동기화된 메트로놈 시작
    async startSyncedMetronome() {
      if (!this.isHost) return
      
      this.updating = true
      try {
        console.log('동기화된 메트로놈 시작 요청...')
        
        // 서버에 동기화 시작 요청 (5초 딜레이)
        const response = await metronomeAPI.startSyncedMetronome(
          this.sessionId, 
          this.currentUserId, 
          5
        )
        
        if (response.data.success) {
          const { serverTime, startTime, delaySeconds } = response.data
          
          // 서버 시간 오프셋 계산
          const clientTime = Date.now()
          this.serverTimeOffset = serverTime - clientTime
          
          console.log('동기화 정보:', {
            serverTime,
            clientTime,
            startTime,
            delaySeconds,
            offset: this.serverTimeOffset
          })
          
          // 카운트다운 시작
          this.startCountdown(startTime)
          
          ElMessage.success(`${delaySeconds}초 후 모든 참가자와 동시에 시작됩니다!`)
        } else {
          ElMessage.error(response.data.message)
        }
      } catch (error) {
        console.error('동기화된 메트로놈 시작 실패:', error)
        ElMessage.error('메트로놈 시작에 실패했습니다')
      } finally {
        this.updating = false
      }
    },
    
    // 카운트다운 시작
    startCountdown(startTime) {
      this.syncStartTime = startTime
      
      // 기존 카운트다운 정리
      if (this.syncInterval) {
        clearInterval(this.syncInterval)
      }
      
      this.syncInterval = setInterval(() => {
        const now = Date.now() + this.serverTimeOffset
        const remaining = Math.ceil((startTime - now) / 1000)
        
        if (remaining > 0) {
          this.syncCountdown = remaining
          console.log(`카운트다운: ${remaining}초`)
        } else {
          // 시작 시간 도달
          this.syncCountdown = 0
          clearInterval(this.syncInterval)
          this.syncInterval = null
          
          console.log('동기화된 메트로놈 시작!')
          this.isPlaying = true
          this.startSyncedMetronomeLoop()
        }
      }, 100) // 100ms마다 체크
    },
    
    // 동기화된 메트로놈 루프 시작
    startSyncedMetronomeLoop() {
      if (this.metronomeInterval) {
        clearInterval(this.metronomeInterval)
      }
      
      const interval = 60000 / this.currentBpm // BPM을 밀리초로 변환
      
      console.log(`동기화된 메트로놈 시작 - BPM: ${this.currentBpm}, 간격: ${interval}ms`)
      
      // 첫 번째 비트는 정확한 시작 시간에 맞춰서
      const startDelay = this.syncStartTime - (Date.now() + this.serverTimeOffset)
      
      setTimeout(() => {
        this.playBeat()
        this.beatCount = 0
        
        // 정확한 간격으로 반복
        this.metronomeInterval = setInterval(() => {
          if (!this.isPlaying) {
            this.stopMetronome()
            return
          }
          
          this.beatCount = (this.beatCount + 1) % this.currentTimeSignature
          this.playBeat()
        }, interval)
        
      }, Math.max(0, startDelay))
    },
    
    async updateBpm(newBpm) {
      if (!this.isHost) return
      
      try {
        await metronomeAPI.updateSession(this.sessionId, {
          bpm: newBpm
        })
        
        this.currentBpm = newBpm
        if (this.isPlaying) {
          this.stopMetronome()
          this.startMetronome()
        }
      } catch (error) {
        console.error('BPM 업데이트 실패:', error)
        ElMessage.error('BPM 변경에 실패했습니다')
      }
    },
    
    // BPM 증가/감소 메서드들
    decreaseBpm() {
      if (this.currentBpm > 60) {
        this.updateBpm(this.currentBpm - 5)
      }
    },

    increaseBpm() {
      if (this.currentBpm < 200) {
        this.updateBpm(this.currentBpm + 5)
      }
    },
    
    async updateTimeSignature(newTimeSignature) {
      if (!this.isHost) return
      
      try {
        await metronomeAPI.updateSession(this.sessionId, {
          timeSignature: newTimeSignature
        })
        
        this.currentTimeSignature = newTimeSignature
        this.beatCount = 0
      } catch (error) {
        console.error('박자 업데이트 실패:', error)
        ElMessage.error('박자 변경에 실패했습니다')
      }
    },
    
    startMetronome() {
      this.stopMetronome()
      this.beatCount = 0
      
      console.log(`메트로놈 시작: ${this.currentBpm} BPM`)
      
      // 단순하고 안정적인 방식 사용 (Web Worker 제거)
      this.startSimpleMetronome()
    },
    
    startSimpleMetronome() {
      const interval = 60000 / this.currentBpm
      console.log(`간격: ${interval}ms`)
      
      // 첫 번째 비트 즉시 재생
      this.playBeat()
      
      // 가장 단순한 setInterval 사용
      this.metronomeInterval = setInterval(() => {
        console.log(`메트로놈 체크: isPlaying=${this.isPlaying}`)
        
        if (!this.isPlaying) {
          console.log('재생 상태 false - 정지')
          this.stopMetronome()
          return
        }
        
        this.beatCount = (this.beatCount + 1) % this.currentTimeSignature
        this.playBeat()
        console.log(`비트 재생: ${this.beatCount + 1}/${this.currentTimeSignature}`)
      }, interval)
      
      console.log('메트로놈 타이머 시작됨, ID:', this.metronomeInterval)
    },
    
    stopMetronome() {
      console.log('메트로놈 정지 시작')
      
      if (this.metronomeInterval) {
        console.log('타이머 정리, ID:', this.metronomeInterval)
        clearInterval(this.metronomeInterval)
        this.metronomeInterval = null
      }
      
      this.beatCount = 0
      this.isBeat = false
      console.log('메트로놈 정지 완료')
    },
    
    playBeat() {
      // 비주얼 효과
      this.isBeat = true
      setTimeout(() => {
        this.isBeat = false
      }, 100)
      
      // 오디오 재생
      this.playSound(this.beatCount === 0 ? 800 : 400) // 첫 박자는 높은 음
    },
    
    setupAudio() {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      } catch (error) {
        console.warn('Web Audio API를 지원하지 않습니다:', error)
      }
    },
    
    
    playSound(frequency = 400) {
      if (!this.audioContext) {
        console.warn('AudioContext가 없습니다')
        return
      }
      
      try {
        // AudioContext가 suspended 상태인 경우 resume
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume()
        }
        
        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
        
        oscillator.start(this.audioContext.currentTime)
        oscillator.stop(this.audioContext.currentTime + 0.1)
        
        console.log(`비트 재생: ${frequency}Hz, 박자: ${this.beatCount + 1}/${this.currentTimeSignature}`)
      } catch (error) {
        console.error('사운드 재생 실패:', error)
      }
    },
    
    async leaveSession() {
      try {
        console.log('세션 나가기 시도:', {
          sessionId: this.sessionId,
          userId: this.currentUserId
        })
        
        await metronomeAPI.leaveSession(this.sessionId, this.currentUserId)
        ElMessage.success('세션에서 나갔습니다')
        
        // 메트로놈 정지
        this.stopMetronome()
        
        // 메트로놈 공유 페이지로 이동
        this.$router.push('/metronome')
      } catch (error) {
        console.error('세션 나가기 실패 상세:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        
        let errorMessage = '세션 나가기에 실패했습니다'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        ElMessage.error(errorMessage)
        
        // 에러가 발생해도 메트로놈은 정지하고 페이지 이동
        this.stopMetronome()
        this.$router.push('/metronome')
      }
    },
    
    async deleteSession() {
      if (!this.isHost) {
        ElMessage.error('호스트만 세션을 삭제할 수 있습니다')
        return
      }
      
      this.updating = true
      try {
        console.log('세션 삭제 시도:', {
          sessionId: this.sessionId,
          hostUserId: this.currentUserId
        })
        
        await metronomeAPI.endSession(this.sessionId, this.currentUserId)
        ElMessage.success('세션이 삭제되었습니다')
        
        // 메트로놈 정지
        this.stopMetronome()
        
        // 다이얼로그 닫기
        this.showDeleteConfirm = false
        
        // 메트로놈 공유 페이지로 이동
        this.$router.push('/metronome')
      } catch (error) {
        console.error('세션 삭제 실패 상세:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status
        })
        
        let errorMessage = '세션 삭제에 실패했습니다'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
        ElMessage.error(errorMessage)
      } finally {
        this.updating = false
      }
    },
    
    startPolling() {
      // 5초마다 세션 상태 동기화
      this.pollingInterval = setInterval(async () => {
        try {
          const response = await metronomeAPI.getSession(this.sessionId)
          const updatedSession = response.data
          
          console.log('Polling 업데이트:', {
            serverPlaying: updatedSession.isPlaying,
            localPlaying: this.isPlaying,
            serverBpm: updatedSession.bpm,
            localBpm: this.currentBpm
          })
          
          // BPM 변경 시에만 메트로놈 재시작
          if (updatedSession.bpm !== this.currentBpm) {
            console.log('BPM 변경 감지:', this.currentBpm, '→', updatedSession.bpm)
            this.currentBpm = updatedSession.bpm
            if (this.isPlaying) {
              this.stopMetronome()
              this.startMetronome()
            }
          }
          
          // 박자 변경
          if (updatedSession.timeSignature !== this.currentTimeSignature) {
            console.log('박자 변경 감지:', this.currentTimeSignature, '→', updatedSession.timeSignature)
            this.currentTimeSignature = updatedSession.timeSignature
            this.beatCount = 0
          }
          
          // 동기화 시작 시간 확인 (참가자용)
          if (!this.isHost && updatedSession.syncStartTime && !this.syncStartTime) {
            console.log('참가자: 동기화 시작 시간 감지됨', updatedSession.syncStartTime)
            this.startCountdown(updatedSession.syncStartTime)
          }
          
          // 세션 정보는 업데이트하되 isPlaying은 보존
          const currentPlayingState = this.isPlaying
          this.session = updatedSession
          this.isPlaying = currentPlayingState
          
          console.log('Polling 완료 - isPlaying 보존됨:', this.isPlaying)
        } catch (error) {
          console.error('세션 동기화 실패:', error)
        }
      }, 5000)
    },
    
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
      }
    },
    
    formatDate(timestamp) {
      if (!timestamp) return ''
      return new Date(timestamp).toLocaleString('ko-KR')
    },
    
    setupVisibilityHandler() {
      // 탭이 비활성화/활성화될 때 메트로놈 상태 관리
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          console.log('탭 비활성화 - 메트로놈 백그라운드 모드')
          // 탭이 숨겨져도 메트로놈은 계속 실행 (requestAnimationFrame은 자동으로 throttle됨)
        } else {
          console.log('탭 활성화 - 메트로놈 상태 확인')
          // 탭이 다시 보일 때 메트로놈 상태 확인 및 재시작
          if (this.isPlaying && !this.metronomeInterval) {
            console.log('메트로놈 재시작 필요')
            this.startMetronome()
          }
        }
      })
      
      // 페이지 포커스 이벤트 처리
      window.addEventListener('focus', () => {
        if (this.isPlaying && !this.metronomeInterval) {
          console.log('윈도우 포커스 - 메트로놈 재시작')
          this.startMetronome()
        }
      })
      
      // 페이지 언로드 시 정리
      window.addEventListener('beforeunload', () => {
        this.stopMetronome()
      })
    }
  }
}
</script>

<style scoped>
.metronome-session {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.session-header {
  margin-bottom: 30px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-info h2 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.session-meta {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.session-code {
  font-family: monospace;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.host-info {
  color: #666;
  font-size: 0.9rem;
}

.metronome-control {
  margin-bottom: 30px;
}

.metronome-display {
  text-align: center;
  padding: 40px 20px;
}

.bpm-display {
  margin-bottom: 30px;
}

.bpm-number {
  font-size: 4rem;
  font-weight: bold;
  color: #667eea;
  line-height: 1;
}

.bpm-label {
  font-size: 1.2rem;
  color: #666;
  margin-top: 5px;
}

.metronome-visual {
  margin: 40px 0;
}

.metronome-circle {
  width: 200px;
  height: 200px;
  border: 4px solid #ddd;
  border-radius: 50%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.1s ease;
}

.metronome-circle.playing {
  border-color: #667eea;
}

.metronome-circle.beat {
  background: #667eea;
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
}

.beat-indicator {
  width: 20px;
  height: 20px;
  background: #667eea;
  border-radius: 50%;
  transition: all 0.1s ease;
}

.metronome-circle.beat .beat-indicator {
  background: white;
  transform: scale(1.5);
}

.time-signature {
  font-size: 1.5rem;
  color: #666;
  font-weight: 500;
}

.control-buttons {
  text-align: center;
  margin: 30px 0;
}

.bpm-control,
.time-signature-control {
  margin: 30px 0;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.bpm-control h4,
.time-signature-control h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.participants-section,
.session-details {
  margin-bottom: 30px;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  background: #f9f9f9;
}

.participant-item.host {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.participant-info {
  flex: 1;
}

.participant-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.participant-role {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .metronome-session {
    padding: 10px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .session-meta {
    justify-content: center;
  }
  
  .bpm-number {
    font-size: 3rem;
  }
  
  .metronome-circle {
    width: 150px;
    height: 150px;
  }
  
  .metronome-display {
    padding: 20px 10px;
  }
  
  .bpm-control .el-col {
    margin-bottom: 10px;
  }
}
</style>
