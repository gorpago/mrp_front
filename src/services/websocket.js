import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

class MetronomeWebSocket {
  constructor() {
    this.stompClient = null
    this.connected = false
    this.sessionId = null
    this.callbacks = {
      onMessage: null,
      onConnect: null,
      onDisconnect: null,
      onError: null
    }
  }

  connect(sessionId) {
    if (this.connected && this.sessionId === sessionId) {
      console.log('이미 연결되어 있습니다')
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        this.sessionId = sessionId
        
        // SockJS 연결 생성
        const socket = new SockJS(`${process.env.VUE_APP_API_BASE_URL.replace('/api', '')}/ws`)
        this.stompClient = Stomp.over(socket)
        
        // 디버그 로그 비활성화 (프로덕션에서)
        this.stompClient.debug = (str) => {
          console.log('STOMP:', str)
        }

        // 연결
        this.stompClient.connect({}, 
          (frame) => {
            console.log('웹소켓 연결 성공:', frame)
            this.connected = true
            
            // 세션별 메트로놈 메시지 구독
            this.stompClient.subscribe(`/topic/metronome/${sessionId}`, (message) => {
              const data = JSON.parse(message.body)
              console.log('메트로놈 메시지 수신:', data)
              
              if (this.callbacks.onMessage) {
                this.callbacks.onMessage(data)
              }
            })
            
            if (this.callbacks.onConnect) {
              this.callbacks.onConnect()
            }
            
            resolve()
          },
          (error) => {
            console.error('웹소켓 연결 실패:', error)
            this.connected = false
            
            if (this.callbacks.onError) {
              this.callbacks.onError(error)
            }
            
            reject(error)
          }
        )
      } catch (error) {
        console.error('웹소켓 초기화 실패:', error)
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect(() => {
        console.log('웹소켓 연결 해제')
        this.connected = false
        this.sessionId = null
        
        if (this.callbacks.onDisconnect) {
          this.callbacks.onDisconnect()
        }
      })
    }
  }

  // 메트로놈 시작 요청
  startMetronome(sessionId, userId) {
    if (!this.connected || !this.stompClient) {
      console.error('웹소켓이 연결되지 않았습니다')
      return
    }

    const message = {
      type: 'SYNC_START',
      sessionId,
      userId,
      timestamp: Date.now()
    }

    console.log('메트로놈 시작 요청 전송:', message)
    this.stompClient.send('/app/metronome/start', {}, JSON.stringify(message))
  }

  // 메트로놈 중지 요청
  stopMetronome(sessionId, userId) {
    if (!this.connected || !this.stompClient) {
      console.error('웹소켓이 연결되지 않았습니다')
      return
    }

    const message = {
      type: 'STOP',
      sessionId,
      userId,
      timestamp: Date.now()
    }

    console.log('메트로놈 중지 요청 전송:', message)
    this.stompClient.send('/app/metronome/stop', {}, JSON.stringify(message))
  }

  // BPM 변경 요청
  changeBpm(sessionId, userId, bpm) {
    if (!this.connected || !this.stompClient) {
      console.error('웹소켓이 연결되지 않았습니다')
      return
    }

    const message = {
      type: 'BPM_CHANGE',
      sessionId,
      userId,
      bpm,
      timestamp: Date.now()
    }

    console.log('BPM 변경 요청 전송:', message)
    this.stompClient.send('/app/metronome/bpm', {}, JSON.stringify(message))
  }

  // 콜백 등록
  onMessage(callback) {
    this.callbacks.onMessage = callback
  }

  onConnect(callback) {
    this.callbacks.onConnect = callback
  }

  onDisconnect(callback) {
    this.callbacks.onDisconnect = callback
  }

  onError(callback) {
    this.callbacks.onError = callback
  }

  // 연결 상태 확인
  isConnected() {
    return this.connected
  }
}

// 싱글톤 인스턴스
export const metronomeWebSocket = new MetronomeWebSocket()
export default metronomeWebSocket
