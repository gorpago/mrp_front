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

          <!-- 메트로놈 비주얼 - 흐르는 방식 -->
          <div class="metronome-visual-flow">
            <div 
              v-for="index in currentTimeSignature" 
              :key="index"
              class="beat-dot"
              :class="{ 
                'active': beatCount === index - 1 && isPlaying,
                'first-beat': index === 1
              }"
            >
            </div>
          </div>

          <div class="time-signature">
            <span>{{ session?.timeSignature || 4 }}/4</span>
          </div>
        </div>

        <!-- 재생/정지 버튼 -->
        <div class="play-controls">
          <el-button 
            v-if="isHost && !isPlaying"
            @click="startSyncedMetronome" 
            :loading="updating"
            type="success"
            size="large"
            circle
            :disabled="updating"
          >
            <el-icon v-if="!updating">
              <VideoPlay />
            </el-icon>
          </el-button>
          
          <el-button 
            v-if="isHost && isPlaying"
            @click="stopSyncedMetronome" 
            :loading="updating"
            type="danger"
            size="large"
            circle
            :disabled="updating"
          >
            <el-icon v-if="!updating"><Close /></el-icon>
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
import { metronomeWebSocket } from '@/services/websocket'
import { ElMessage } from 'element-plus'
import { VideoPlay, Plus, Minus, Back, Delete, WarningFilled, Close } from '@element-plus/icons-vue'

export default {
  name: 'MetronomeSessionPage',
  components: {
    VideoPlay,
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
      currentUserId: null, // 사용자 ID (로그인 정보에서 가져옴)
      metronomeInterval: null,
      beatCount: 0,
      audioContext: null,
      oscillator: null,
      showDeleteConfirm: false,
      // 동기화 관련
      syncCountdown: 0,
      syncStartTime: null,
      serverTimeOffset: 0,
      syncInterval: null,
      requestStartTime: 0,
      // 웹소켓 관련
      wsConnected: false,
      // 서버 시간 동기화
      timeSyncInterval: null,
      lastSyncTime: 0
    }
  },
  computed: {
    isHost() {
      return this.session?.hostUserId === this.currentUserId
    }
  },
  async mounted() {
    this.loadUserInfo()
    await this.syncServerTime()  // 서버 시간 동기화 먼저
    await this.loadSession()
    this.setupAudio()
    this.connectWebSocket()  // 웹소켓 연결 추가
    this.startPolling()
    this.setupVisibilityHandler()
    this.startTimeSyncInterval()  // 주기적 시간 동기화
  },
  beforeUnmount() {
    this.stopMetronome()
    this.stopPolling()
    
    // 웹소켓 연결 해제
    if (this.wsConnected) {
      metronomeWebSocket.disconnect()
      this.wsConnected = false
    }
    
    // 동기화 관련 타이머 정리
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    
    // 시간 동기화 타이머 정리
    if (this.timeSyncInterval) {
      clearInterval(this.timeSyncInterval)
      this.timeSyncInterval = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
    }
  },
  methods: {
    // 사용자 정보 로드
    loadUserInfo() {
      // authStore에서 사용자 정보 가져오기
      const { authStore } = require('@/store/auth')
      
      if (authStore.isLoggedIn && authStore.currentUser) {
        this.currentUserId = authStore.currentUser.id
        console.log('로그인한 사용자 ID:', this.currentUserId)
      } else {
        // 로그인하지 않은 경우 localStorage에서 임시 ID 가져오기
        const tempUserId = localStorage.getItem('tempUserId') || 'user-' + Date.now()
        localStorage.setItem('tempUserId', tempUserId)
        this.currentUserId = tempUserId
        console.log('임시 사용자 ID:', this.currentUserId)
      }
    },
    
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
        
        console.log('세션 로드 완료:', this.session)
        console.log('호스트 권한 확인:', {
          sessionHostUserId: this.session?.hostUserId,
          currentUserId: this.currentUserId,
          isHost: this.isHost
        })
      } catch (error) {
        console.error('세션을 불러오는데 실패했습니다')
        ElMessage.error('세션을 불러오는데 실패했습니다')
        this.$router.push('/metronome')
      } finally {
        this.loading = false
      }
    },
    
    // 동기화된 메트로놈 시작
    async startSyncedMetronome() {
      if (!this.isHost) {
        console.error('호스트가 아닙니다')
        return
      }
      
      console.log('메트로놈 시작 요청 시작:', {
        sessionId: this.sessionId,
        currentUserId: this.currentUserId,
        isHost: this.isHost
      })
      
      this.updating = true
      try {
        console.log('동기화된 메트로놈 시작 요청...')
        
        // AudioContext 활성화 (사용자 상호작용 필요)
        const audioReady = await this.ensureAudioContext()
        if (!audioReady) {
          ElMessage.error('오디오 시스템을 초기화할 수 없습니다')
          return
        }
        
        // 서버에 동기화 시작 요청하고 서버 시간 기준으로 동기화
        const delaySeconds = 5
        const response = await metronomeAPI.startSyncedMetronome(
          this.sessionId, 
          this.currentUserId, 
          delaySeconds
        )
        
        console.log('서버 응답:', response.data)
        
        if (response.data.success) {
          console.log('호스트 - 메트로놈 시작 요청 성공')
          console.log('서버 응답:', response.data)
          
          // 웹소켓으로 시작 메시지 전송 (즉시 동기화)
          if (this.wsConnected && response.data.syncStartTime) {
            metronomeWebSocket.startMetronome(this.sessionId, this.currentUserId)
            console.log('웹소켓으로 시작 메시지 전송 완료')
          }
          
          // 호스트도 서버 polling을 통해 동기화하도록 함
          // 즉시 polling을 한 번 실행해서 syncStartTime을 받아옴
          ElMessage.success(`${delaySeconds}초 후 모든 참가자와 동시에 시작됩니다!`)
          
          // 즉시 세션 상태를 다시 로드해서 syncStartTime 확인
          setTimeout(async () => {
            try {
              const sessionResponse = await metronomeAPI.getSession(this.sessionId)
              const updatedSession = sessionResponse.data
              
              console.log('호스트 - 업데이트된 세션 정보:', updatedSession)
              
              if (updatedSession.syncStartTime) {
                console.log('호스트 - syncStartTime 감지, 카운트다운 시작')
                this.startCountdown(updatedSession.syncStartTime)
              }
            } catch (error) {
              console.error('호스트 - 세션 재로드 실패:', error)
            }
          }, 100) // 100ms 후 세션 재로드
        } else {
          console.error('서버 응답 실패:', response.data)
          ElMessage.error(response.data.message || '메트로놈 시작에 실패했습니다')
        }
      } catch (error) {
        console.error('동기화된 메트로놈 시작 실패 상세:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config
        })
        
        let errorMessage = '메트로놈 시작에 실패했습니다'
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.message) {
          errorMessage = `오류: ${error.message}`
        }
        
        ElMessage.error(errorMessage)
      } finally {
        this.updating = false
      }
    },
    
    // 카운트다운 시작 (서버 시간 동기화 적용)
    startCountdown(startTime) {
      this.syncStartTime = startTime
      
      // 기존 카운트다운 정리
      if (this.syncInterval) {
        clearInterval(this.syncInterval)
      }
      
      // 동기화된 시간 사용
      const now = this.getSyncedTime()
      const initialRemaining = Math.floor((startTime - now) / 1000) + 1
      this.syncCountdown = Math.max(0, initialRemaining)
      console.log(`✅ 동기화된 카운트다운 시작: ${this.syncCountdown}초`)
      console.log(`시작시간: ${new Date(startTime).toISOString()}`)
      console.log(`동기화된 현재시간: ${new Date(now).toISOString()}`)
      console.log(`서버 시간 오프셋: ${this.serverTimeOffset}ms`)
      console.log(`실제 남은 밀리초: ${startTime - now}ms`)
      
      this.syncInterval = setInterval(() => {
        const now = this.getSyncedTime()  // 동기화된 시간 사용
        const remainingMs = startTime - now
        const remaining = Math.floor(remainingMs / 1000) + 1
        
        console.log(`카운트다운 체크: 남은ms=${remainingMs}, 남은초=${remaining}`)
        
        if (remainingMs > 1000) {
          this.syncCountdown = remaining
          console.log(`카운트다운: ${remaining}초`)
        } else if (remainingMs > 0) {
          this.syncCountdown = 1
          console.log(`카운트다운: 1초 (곧 시작)`)
        } else {
          // 시작 시간 도달
          this.syncCountdown = 0
          clearInterval(this.syncInterval)
          this.syncInterval = null
          
          console.log('✅ 동기화된 메트로놈 시작!')
          this.stopMetronome()
          this.isPlaying = true
          console.log('isPlaying 상태 설정:', this.isPlaying)
          this.startSyncedMetronomeLoop()
        }
      }, 100) // 100ms마다 체크
    },
    
    // 동기화된 메트로놈 루프 시작 (서버 시간 동기화 적용)
    startSyncedMetronomeLoop() {
      if (this.metronomeInterval) {
        clearInterval(this.metronomeInterval)
      }
      
      if (!this.audioContext) {
        console.error('AudioContext가 없습니다')
        this.startSimpleMetronome()
        return
      }
      
      if (this.audioContext.state !== 'running') {
        console.error('AudioContext가 실행 중이 아닙니다:', this.audioContext.state)
        this.startSimpleMetronome()
        return
      }
      
      const beatInterval = 60 / this.currentBpm
      console.log(`✅ 동기화된 메트로놈 시작 - BPM: ${this.currentBpm}, 간격: ${beatInterval}초`)
      
      // 동기화된 시간 사용
      const now = this.getSyncedTime()
      const syncDelay = Math.max(0, this.syncStartTime - now)
      
      console.log(`동기화 시작 계산:`)
      console.log(`- 동기화된 현재 시간: ${now}`)
      console.log(`- 동기화 시작 시간: ${this.syncStartTime}`)
      console.log(`- 지연 시간: ${syncDelay}ms`)
      console.log(`- 서버 시간 오프셋: ${this.serverTimeOffset}ms`)
      
      // Web Audio API를 사용한 정밀한 동기화
      if (this.audioContext && this.audioContext.state === 'running') {
        const audioStartTime = this.audioContext.currentTime + (syncDelay / 1000)
        console.log(`Web Audio API 동기화 시작: ${audioStartTime}`)
        this.startPreciseMetronome(audioStartTime, beatInterval)
      } else {
        if (syncDelay > 0) {
          console.log(`${syncDelay}ms 후 정확히 시작`)
          setTimeout(() => {
            console.log('✅ 동기화된 시간에 메트로놈 시작!')
            this.startSimpleMetronome()
          }, syncDelay)
        } else {
          console.log('즉시 메트로놈 시작')
          this.startSimpleMetronome()
        }
      }
    },
    
    // Web Audio API를 사용한 정밀한 메트로놈
    startPreciseMetronome(startTime, interval) {
      console.log(`정밀 메트로놈 시작: ${startTime}, 간격: ${interval}초`)
      
      let nextBeatTime = startTime
      let beatNumber = 0
      
      const scheduleAheadTime = 0.1 // 100ms 앞서 스케줄링
      const lookahead = 25.0 // 25ms마다 체크
      
      const scheduler = () => {
        // 현재 시간 + 스케줄링 여유시간 내의 비트들을 미리 스케줄링
        while (nextBeatTime < this.audioContext.currentTime + scheduleAheadTime) {
          if (this.isPlaying) {
            const isAccent = beatNumber % this.currentTimeSignature === 0
            this.scheduleNote(nextBeatTime, isAccent)
            
            // 비주얼 업데이트 (약간의 지연으로 정확한 타이밍에)
            const visualDelay = (nextBeatTime - this.audioContext.currentTime) * 1000
            if (visualDelay >= 0) {
              setTimeout(() => {
                this.beatCount = beatNumber % this.currentTimeSignature
                this.updateVisualBeat()
              }, visualDelay)
            }
            
            nextBeatTime += interval
            beatNumber++
          } else {
            break
          }
        }
        
        if (this.isPlaying) {
          setTimeout(scheduler, lookahead)
        }
      }
      
      scheduler()
    },
    
    // Web Audio API로 정확한 비트 스케줄링
    scheduleBeats(startTime, interval) {
      if (!this.audioContext || !this.isPlaying) return
      
      const scheduleAheadTime = 25.0 // 25ms 앞서 스케줄링
      const lookahead = 25.0 // 25ms마다 체크
      
      let nextBeatTime = startTime
      let beatNumber = 0
      
      const scheduler = () => {
        // 현재 시간 + 스케줄링 여유시간 내의 비트들을 미리 스케줄링
        while (nextBeatTime < this.audioContext.currentTime + (scheduleAheadTime / 1000)) {
          if (this.isPlaying) {
            this.scheduleNote(nextBeatTime, beatNumber % this.currentTimeSignature === 0)
            nextBeatTime += interval
            beatNumber++
          } else {
            break
          }
        }
        
        if (this.isPlaying) {
          setTimeout(scheduler, lookahead)
        }
      }
      
      scheduler()
    },
    
    // 개별 비트 스케줄링
    scheduleNote(time, isAccent) {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      oscillator.frequency.setValueAtTime(isAccent ? 800 : 400, time)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, time)
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1)
      
      oscillator.start(time)
      oscillator.stop(time + 0.1)
    },
    
    // 비주얼 업데이트만 담당
    updateVisualBeat() {
      this.beatCount = (this.beatCount + 1) % this.currentTimeSignature
      
      // 비주얼 효과
      this.isBeat = true
      setTimeout(() => {
        this.isBeat = false
      }, 100)
      
      console.log(`비주얼 비트: ${this.beatCount + 1}/${this.currentTimeSignature}`)
    },
    
    // 동기화된 메트로놈 중지
    async stopSyncedMetronome() {
      if (!this.isHost) return
      
      this.updating = true
      try {
        console.log('메트로놈 중지 요청...')
        
        // 서버에 중지 상태 업데이트
        const response = await metronomeAPI.updateSession(this.sessionId, {
          isPlaying: false
        })
        
        console.log('서버 중지 응답:', response.data)
        
        // 웹소켓으로 중지 메시지 전송 (즉시 동기화)
        if (this.wsConnected) {
          metronomeWebSocket.stopMetronome(this.sessionId, this.currentUserId)
          console.log('웹소켓으로 중지 메시지 전송 완료')
        }
        
        // 로컬 메트로놈 완전 중지
        this.isPlaying = false
        this.stopMetronome()
        
        // 모든 동기화 관련 상태 정리
        if (this.syncInterval) {
          clearInterval(this.syncInterval)
          this.syncInterval = null
        }
        this.syncCountdown = 0
        this.syncStartTime = null
        
        console.log('메트로놈 완전 중지 완료')
        ElMessage.success('메트로놈이 중지되었습니다')
      } catch (error) {
        console.error('메트로놈 중지 실패:', error)
        ElMessage.error('메트로놈 중지에 실패했습니다')
      } finally {
        this.updating = false
      }
    },
    
    async updateBpm(newBpm) {
      if (!this.isHost) return
      
      try {
        await metronomeAPI.updateSession(this.sessionId, {
          bpm: newBpm
        })
        
        // 웹소켓으로 BPM 변경 메시지 전송 (즉시 동기화)
        if (this.wsConnected) {
          metronomeWebSocket.changeBpm(this.sessionId, this.currentUserId, newBpm)
          console.log('웹소켓으로 BPM 변경 메시지 전송 완료:', newBpm)
        }
        
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
      console.log(`간격: ${interval}ms, isPlaying: ${this.isPlaying}`)
      
      if (!this.isPlaying) {
        console.log('isPlaying이 false이므로 메트로놈 시작 중단')
        return
      }
      
      // 첫 번째 비트를 정확한 시간에 시작하기 위해 약간의 지연
      console.log('메트로놈 시작 - 첫 번째 비트 재생')
      
      // 즉시 첫 번째 비트 재생
      this.beatCount = 0
      this.playBeat()
      
      // 정확한 간격으로 후속 비트들 재생
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
        console.log('AudioContext 생성됨:', this.audioContext.state)
      } catch (error) {
        console.error('Web Audio API를 지원하지 않습니다:', error)
      }
    },
    
    // AudioContext 활성화 (사용자 상호작용 필요)
    async ensureAudioContext() {
      if (!this.audioContext) {
        this.setupAudio()
      }
      
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume()
          console.log('AudioContext 활성화됨:', this.audioContext.state)
        } catch (error) {
          console.error('AudioContext 활성화 실패:', error)
          return false
        }
      }
      
      return this.audioContext && this.audioContext.state === 'running'
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
          
          // 재생 상태 변경 감지 (undefined 체크 추가)
          const serverPlaying = updatedSession.isPlaying === true // undefined를 false로 처리
          if (serverPlaying !== this.isPlaying) {
            console.log('재생 상태 변경 감지:', this.isPlaying, '→', serverPlaying, '(원본:', updatedSession.isPlaying, ')')
            
            if (serverPlaying) {
              // 서버에서 재생 상태가 되었을 때
              // 동기화된 시작 시간이 있으면 카운트다운 시작 (호스트와 참가자 공통)
              if (updatedSession.syncStartTime && this.syncCountdown === 0) {
                const syncStartTime = updatedSession.syncStartTime
                const now = Date.now()
                const remainingMs = syncStartTime - now
                
                console.log(`${this.isHost ? '호스트' : '참가자'} - 동기화된 시작 시간 감지:`, {
                  syncStartTime,
                  now,
                  remainingMs,
                  syncStartTimeISO: new Date(syncStartTime).toISOString()
                })
                
                if (remainingMs > 500) {
                  // 500ms 이상 남았을 때 카운트다운 시작
                  console.log(`${this.isHost ? '호스트' : '참가자'} - 카운트다운 시작`)
                  this.startCountdown(syncStartTime)
                  return
                } else if (remainingMs > 0) {
                  // 500ms 이하 남았으면 정확한 시간에 시작
                  console.log(`${this.isHost ? '호스트' : '참가자'} - ${remainingMs}ms 후 시작 예정`)
                  setTimeout(() => {
                    this.isPlaying = true
                    this.startSyncedMetronomeLoop()
                  }, remainingMs)
                  return
                } else {
                  // 이미 시작 시간이 지났으면 즉시 시작
                  console.log(`${this.isHost ? '호스트' : '참가자'} - 시작 시간이 이미 지남, 즉시 시작`)
                  this.isPlaying = true
                  this.startSyncedMetronomeLoop()
                  return
                }
              }
              
              // 동기화된 카운트다운이 진행 중이면 자동 시작하지 않음
              if (this.syncCountdown > 0) {
                console.log('카운트다운 진행 중이므로 자동 시작 건너뜀')
                return
              }
              
              this.isPlaying = serverPlaying
              if (!this.metronomeInterval) {
                this.startMetronome()
              }
            } else {
              // 서버에서 중지 상태가 되었을 때
              console.log('서버에서 중지 상태 수신 - 메트로놈 중지')
              this.isPlaying = serverPlaying
              this.stopMetronome()
              // 카운트다운도 정리
              if (this.syncInterval) {
                clearInterval(this.syncInterval)
                this.syncInterval = null
              }
              this.syncCountdown = 0
              this.syncStartTime = null
            }
          }
          
          // 동기화 시작 시간 확인 (참가자용)
          if (!this.isHost && updatedSession.syncStartTime && !this.syncStartTime) {
            console.log('참가자: 동기화 시작 시간 감지됨', updatedSession.syncStartTime)
            this.startCountdown(updatedSession.syncStartTime)
          }
          
          // 세션 정보 업데이트
          this.session = updatedSession
          
          console.log('Polling 완료 - isPlaying 동기화됨:', this.isPlaying)
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
    },
    
    // 웹소켓 연결
    async connectWebSocket() {
      try {
        console.log('웹소켓 연결 시도:', this.sessionId)
        
        await metronomeWebSocket.connect(this.sessionId)
        this.wsConnected = true
        
        // 웹소켓 메시지 핸들러 등록
        metronomeWebSocket.onMessage((data) => {
          console.log('웹소켓 메시지 수신:', data)
          this.handleWebSocketMessage(data)
        })
        
        metronomeWebSocket.onConnect(() => {
          console.log('웹소켓 연결 성공')
          this.wsConnected = true
        })
        
        metronomeWebSocket.onDisconnect(() => {
          console.log('웹소켓 연결 해제')
          this.wsConnected = false
        })
        
        metronomeWebSocket.onError((error) => {
          console.error('웹소켓 에러:', error)
          this.wsConnected = false
        })
        
        console.log('웹소켓 연결 완료')
      } catch (error) {
        console.error('웹소켓 연결 실패:', error)
        ElMessage.warning('실시간 동기화 연결에 실패했습니다. Polling 방식으로 동작합니다.')
      }
    },
    
    // 웹소켓 메시지 처리
    handleWebSocketMessage(data) {
      console.log('웹소켓 메시지 처리:', data)
      
      switch (data.type) {
        case 'SYNC_START':
          // 동기화된 시작 메시지
          console.log('웹소켓: 동기화 시작 메시지 수신')
          if (data.syncStartTime) {
            this.startCountdown(data.syncStartTime)
          }
          break
          
        case 'STOP':
          // 중지 메시지
          console.log('웹소켓: 중지 메시지 수신')
          this.isPlaying = false
          this.stopMetronome()
          
          // 카운트다운 정리
          if (this.syncInterval) {
            clearInterval(this.syncInterval)
            this.syncInterval = null
          }
          this.syncCountdown = 0
          this.syncStartTime = null
          break
          
        case 'BPM_CHANGE':
          // BPM 변경 메시지
          console.log('웹소켓: BPM 변경 메시지 수신', data.bpm)
          if (data.bpm && data.bpm !== this.currentBpm) {
            this.currentBpm = data.bpm
            if (this.isPlaying) {
              this.stopMetronome()
              this.startMetronome()
            }
          }
          break
          
        case 'PARTICIPANT_JOINED':
          // 참가자 입장 메시지
          console.log('웹소켓: 참가자 입장', data.userName)
          ElMessage.info(`${data.userName}님이 입장했습니다`)
          // 세션 정보 새로고침
          this.loadSession()
          break
          
        case 'PARTICIPANT_LEFT':
          // 참가자 퇴장 메시지
          console.log('웹소켓: 참가자 퇴장', data.userId)
          ElMessage.warning(`참가자가 퇴장했습니다`)
          // 세션 정보 새로고침하여 참가자 목록 업데이트
          this.loadSession()
          break
          
        default:
          console.log('웹소켓: 알 수 없는 메시지 타입:', data.type)
      }
    },
    
    // 서버 시간 동기화 (NTP 방식)
    async syncServerTime() {
      try {
        const measurements = []
        
        // 3번 측정하여 평균값 사용
        for (let i = 0; i < 3; i++) {
          const clientSendTime = Date.now()
          
          const response = await metronomeAPI.getServerTime()
          const serverTime = response.data.serverTime
          
          const clientReceiveTime = Date.now()
          const roundTripTime = clientReceiveTime - clientSendTime
          
          // 서버 시간 오프셋 계산 (왕복 시간의 절반을 보정)
          const offset = serverTime - (clientSendTime + roundTripTime / 2)
          
          measurements.push({
            offset,
            roundTripTime
          })
          
          console.log(`시간 동기화 측정 ${i + 1}:`, {
            roundTripTime: roundTripTime + 'ms',
            offset: offset + 'ms'
          })
          
          // 다음 측정 전 짧은 대기
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
        
        // 가장 빠른 응답 시간의 오프셋 사용 (네트워크 지연이 가장 적은 것)
        measurements.sort((a, b) => a.roundTripTime - b.roundTripTime)
        this.serverTimeOffset = measurements[0].offset
        this.lastSyncTime = Date.now()
        
        console.log('✅ 서버 시간 동기화 완료:', {
          offset: this.serverTimeOffset + 'ms',
          bestRoundTrip: measurements[0].roundTripTime + 'ms'
        })
        
        ElMessage.success(`서버 시간 동기화 완료 (오프셋: ${this.serverTimeOffset}ms)`)
      } catch (error) {
        console.error('서버 시간 동기화 실패:', error)
        this.serverTimeOffset = 0
      }
    },
    
    // 동기화된 현재 시간 가져오기
    getSyncedTime() {
      return Date.now() + this.serverTimeOffset
    },
    
    // 주기적 시간 재동기화 (30초마다)
    startTimeSyncInterval() {
      this.timeSyncInterval = setInterval(async () => {
        console.log('주기적 시간 재동기화...')
        await this.syncServerTime()
      }, 30000) // 30초
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

/* 흐르는 메트로놈 비주얼 */
.metronome-visual-flow {
  margin: 40px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 30px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  min-height: 120px;
}

.beat-dot {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
  transition: all 0.15s ease;
  position: relative;
}

.beat-dot.active {
  background: #00d4ff;
  box-shadow: 
    0 0 30px rgba(0, 212, 255, 0.8),
    0 0 60px rgba(0, 212, 255, 0.6),
    0 0 90px rgba(0, 212, 255, 0.4);
  transform: scale(1.3);
  animation: pulse 0.3s ease-out;
}

.beat-dot.first-beat.active {
  background: #00ffaa;
  box-shadow: 
    0 0 30px rgba(0, 255, 170, 0.8),
    0 0 60px rgba(0, 255, 170, 0.6),
    0 0 90px rgba(0, 255, 170, 0.4);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.4);
  }
  100% {
    transform: scale(1.3);
  }
}

.time-signature {
  font-size: 1.5rem;
  color: #666;
  font-weight: 500;
}

.play-controls {
  text-align: center;
  margin: 30px 0;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guest-status {
  text-align: center;
}

.guest-status p {
  margin: 10px 0;
  color: #666;
  font-size: 0.9rem;
}

.sync-countdown {
  margin-top: 15px;
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
  
  .metronome-visual-flow {
    gap: 12px;
    padding: 20px;
    min-height: 90px;
  }
  
  .beat-dot {
    width: 40px;
    height: 40px;
  }
  
  .metronome-display {
    padding: 20px 10px;
  }
  
  .bpm-control .el-col {
    margin-bottom: 10px;
  }
}
</style>
