import { WebPlugin } from '@capacitor/core'

export class NativeMetronomeWeb extends WebPlugin {
  constructor() {
    super()
    this.isPlaying = false
    this.audioContext = null
    this.intervalId = null
    this.bpm = 120
    this.currentBeat = 0
    this.timeSignature = 4
    this.listeners = []
  }

  async start(options) {
    const { bpm = 120, timeSignature = 4, syncStartTime } = options
    
    this.bpm = bpm
    this.timeSignature = timeSignature
    this.currentBeat = 0
    
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    
    if (syncStartTime) {
      const currentTime = Date.now()
      const delayMs = syncStartTime - currentTime
      
      if (delayMs > 0) {
        setTimeout(() => this.startMetronome(), delayMs)
        return { success: true, message: `Metronome scheduled to start in ${delayMs}ms` }
      }
    }
    
    this.startMetronome()
    return { success: true, message: 'Metronome started' }
  }

  startMetronome() {
    if (this.isPlaying) return
    
    this.isPlaying = true
    const intervalMs = 60000 / this.bpm
    
    this.playBeat(true)
    this.notifyBeat()
    
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.currentBeat = (this.currentBeat + 1) % this.timeSignature
        this.playBeat(this.currentBeat === 0)
        this.notifyBeat()
      }
    }, intervalMs)
  }

  playBeat(isAccent) {
    if (!this.audioContext) return
    
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    
    oscillator.frequency.setValueAtTime(
      isAccent ? 800 : 400,
      this.audioContext.currentTime
    )
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.1
    )
    
    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.1)
  }

  notifyBeat() {
    this.notifyListeners('beat', {
      beat: this.currentBeat,
      timestamp: Date.now()
    })
  }

  async stop() {
    this.isPlaying = false
    this.currentBeat = 0
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    
    return { success: true, message: 'Metronome stopped' }
  }

  async updateBpm(options) {
    const { bpm } = options
    
    if (bpm && bpm > 0) {
      this.bpm = bpm
      
      if (this.isPlaying) {
        // BPM 변경 시 재시작
        await this.stop()
        await this.start({ bpm: this.bpm, timeSignature: this.timeSignature })
      }
      
      return { success: true, bpm: this.bpm }
    }
    
    throw new Error('Invalid BPM value')
  }

  async getServerTimeOffset() {
    return {
      offset: 0,
      timestamp: Date.now()
    }
  }
}
