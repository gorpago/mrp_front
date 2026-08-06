# 메트로놈 동기화 구조 설명

## 현재 구조 개요

### 🎯 목표
여러 사용자(호스트 + 게스트들)가 **정확히 같은 시간**에 메트로놈 비트를 듣고 보는 것

### ⚠️ 문제점
**약간의 시간차가 존재하는 이유:**
1. **네트워크 지연** (가장 큰 원인)
2. **브라우저 타이머 부정확성**
3. **각 기기의 시계 차이**
4. **오디오 재생 지연**

---

## 현재 메트로놈 동기화 방식

### 1단계: 호스트가 시작 버튼 클릭

```javascript
// 호스트: startSyncedMetronome()
async startSyncedMetronome() {
  // 1. 서버에 동기화 시작 요청 (5초 후 시작)
  const delaySeconds = 5
  const response = await metronomeAPI.startSyncedMetronome(
    this.sessionId, 
    this.currentUserId, 
    delaySeconds
  )
  
  // 2. 웹소켓으로 즉시 전송
  if (this.wsConnected) {
    metronomeWebSocket.startMetronome(this.sessionId, this.currentUserId)
  }
  
  // 3. 서버로부터 syncStartTime 받아옴
  // syncStartTime = 현재시간 + 5000ms
}
```

**서버가 계산:**
```java
// 백엔드: MetronomeWebSocketController.java
long syncStartTime = System.currentTimeMillis() + 5000; // 5초 후
```

### 2단계: 모든 참가자가 syncStartTime 수신

**웹소켓 메시지:**
```json
{
  "type": "SYNC_START",
  "sessionId": "abc123",
  "userId": "host-id",
  "syncStartTime": 1723456789000,  // 절대 시간 (밀리초)
  "delaySeconds": 5
}
```

**또는 Polling으로 수신:**
```javascript
// 5초마다 서버에서 세션 정보 가져옴
const updatedSession = await metronomeAPI.getSession(this.sessionId)
// updatedSession.syncStartTime 확인
```

### 3단계: 카운트다운 시작

```javascript
startCountdown(startTime) {
  this.syncStartTime = startTime
  
  // 100ms마다 체크
  this.syncInterval = setInterval(() => {
    const now = Date.now()
    const remainingMs = startTime - now
    const remaining = Math.floor(remainingMs / 1000) + 1
    
    if (remainingMs > 1000) {
      this.syncCountdown = remaining  // "5초", "4초", "3초"...
    } else if (remainingMs > 0) {
      this.syncCountdown = 1
    } else {
      // 시작 시간 도달!
      this.syncCountdown = 0
      clearInterval(this.syncInterval)
      
      this.isPlaying = true
      this.startSyncedMetronomeLoop()  // 메트로놈 시작
    }
  }, 100)
}
```

### 4단계: 메트로놈 실제 재생

현재 **2가지 방식**이 혼재되어 있음:

#### 방식 A: 정밀 동기화 (Web Audio API)
```javascript
startSyncedMetronomeLoop() {
  // Web Audio API 사용
  if (this.audioContext && this.audioContext.state === 'running') {
    const audioStartTime = this.audioContext.currentTime + (syncDelay / 1000)
    this.startPreciseMetronome(audioStartTime, beatInterval)
  }
}

startPreciseMetronome(startTime, interval) {
  let nextBeatTime = startTime
  let beatNumber = 0
  
  const scheduler = () => {
    // 100ms 앞서 미리 스케줄링
    while (nextBeatTime < this.audioContext.currentTime + 0.1) {
      this.scheduleNote(nextBeatTime, isAccent)  // 정확한 시간에 소리 재생
      
      // 비주얼도 정확한 시간에
      const visualDelay = (nextBeatTime - this.audioContext.currentTime) * 1000
      setTimeout(() => {
        this.beatCount = beatNumber % this.currentTimeSignature
        this.updateVisualBeat()
      }, visualDelay)
      
      nextBeatTime += interval
      beatNumber++
    }
    
    if (this.isPlaying) {
      setTimeout(scheduler, 25)  // 25ms마다 체크
    }
  }
  
  scheduler()
}
```

#### 방식 B: 단순 타이머 (setInterval)
```javascript
startSimpleMetronome() {
  const interval = 60000 / this.currentBpm  // 예: 120 BPM = 500ms
  
  // 즉시 첫 비트
  this.beatCount = 0
  this.playBeat()
  
  // 이후 반복
  this.metronomeInterval = setInterval(() => {
    this.beatCount = (this.beatCount + 1) % this.currentTimeSignature
    this.playBeat()
  }, interval)
}

playBeat() {
  // 비주얼
  this.isBeat = true
  setTimeout(() => { this.isBeat = false }, 100)
  
  // 오디오
  this.playSound(this.beatCount === 0 ? 800 : 400)
}
```

---

## 시간차 발생 원인 분석

### 1. 네트워크 지연 (가장 큰 원인)

```
호스트 → 서버 → 게스트
  ↓        ↓        ↓
 10ms    서버     50ms
         처리
         5ms
```

**예시:**
- 호스트 → 서버: 10ms
- 서버 처리: 5ms
- 서버 → 게스트 A: 20ms (같은 Wi-Fi)
- 서버 → 게스트 B: 100ms (모바일 핫스팟)

**결과:** 게스트 B는 게스트 A보다 80ms 늦게 메시지 수신

### 2. 각 기기의 시계 차이

```javascript
// 서버 시간
syncStartTime = 1723456789000

// 호스트 기기 시간
Date.now() = 1723456789050  // +50ms 빠름

// 게스트 기기 시간
Date.now() = 1723456788900  // -100ms 느림
```

**결과:** 같은 syncStartTime이어도 각자 다른 시간에 시작

### 3. setInterval의 부정확성

```javascript
// 이론: 500ms마다 정확히 실행
setInterval(() => { playBeat() }, 500)

// 실제: 브라우저 부하에 따라 변동
// 실행 시간: 500ms, 503ms, 498ms, 505ms, 497ms...
```

**누적 오차:**
- 10번 비트 후: ±30ms
- 100번 비트 후: ±300ms (눈에 띄게 어긋남)

### 4. 오디오 재생 지연

```javascript
playSound(frequency) {
  const oscillator = this.audioContext.createOscillator()
  oscillator.frequency.value = frequency
  oscillator.start(this.audioContext.currentTime)  // 즉시 시작
  oscillator.stop(this.audioContext.currentTime + 0.1)
}
```

**문제:**
- 오디오 버퍼링: 5-20ms
- 스피커/이어폰 지연: 10-50ms
- 블루투스 이어폰: 100-300ms (심각!)

---

## 현재 구조의 문제점

### ❌ 문제 1: 두 가지 메트로놈 방식 혼재

```javascript
// 동기화 시작은 정밀하게
startSyncedMetronomeLoop() {
  this.startPreciseMetronome(...)  // Web Audio API
}

// 하지만 fallback은 부정확
startSimpleMetronome() {
  setInterval(...)  // 부정확한 타이머
}
```

**결과:** 어떤 사용자는 정밀, 어떤 사용자는 부정확

### ❌ 문제 2: 각 기기가 독립적으로 재생

```
호스트: [비트1] [비트2] [비트3] [비트4]
게스트A: [비트1] [비트2]  [비트3]  [비트4]
게스트B: [비트1]  [비트2]  [비트3]  [비트4]
         ↑ 시작은 같지만 점점 어긋남
```

**이유:** 각자의 타이머로 재생하므로 누적 오차 발생

### ❌ 문제 3: 서버 시간 동기화 없음

```javascript
// 서버 시간
const serverTime = System.currentTimeMillis()

// 클라이언트 시간
const clientTime = Date.now()

// 차이를 보정하지 않음!
```

---

## 시간차 측정 예시

### 시나리오: 120 BPM, 4/4 박자

**이론적 간격:** 500ms (60000ms / 120 BPM)

**실제 측정:**

| 사용자 | 네트워크 | 비트1 | 비트2 | 비트3 | 비트4 | 누적 오차 |
|--------|----------|-------|-------|-------|-------|-----------|
| 호스트 | - | 0ms | 500ms | 1000ms | 1500ms | 0ms |
| 게스트A | Wi-Fi 20ms | 20ms | 523ms | 1018ms | 1525ms | +25ms |
| 게스트B | 핫스팟 100ms | 100ms | 605ms | 1095ms | 1610ms | +110ms |

**10초 후 (20비트):**
- 호스트: 10000ms
- 게스트A: 10050ms (+50ms)
- 게스트B: 10220ms (+220ms) ← **눈에 띄게 어긋남**

---

## 개선 방안

### 🎯 방안 1: 서버 시간 동기화 (NTP 방식)

```javascript
// 1. 서버 시간 측정
async syncServerTime() {
  const clientSendTime = Date.now()
  
  const response = await metronomeAPI.getServerTime()
  const serverTime = response.data.serverTime
  
  const clientReceiveTime = Date.now()
  const roundTripTime = clientReceiveTime - clientSendTime
  
  // 서버 시간 오프셋 계산
  this.serverTimeOffset = serverTime - (clientSendTime + roundTripTime / 2)
  
  console.log('서버 시간 오프셋:', this.serverTimeOffset, 'ms')
}

// 2. 동기화된 시간 사용
getSyncedTime() {
  return Date.now() + this.serverTimeOffset
}
```

### 🎯 방안 2: 주기적 재동기화

```javascript
// 5초마다 서버 시간과 재동기화
setInterval(() => {
  if (this.isPlaying) {
    this.resyncWithServer()
  }
}, 5000)

async resyncWithServer() {
  const session = await metronomeAPI.getSession(this.sessionId)
  const serverTime = session.currentServerTime
  const expectedBeat = Math.floor((serverTime - session.syncStartTime) / beatInterval)
  
  // 현재 비트와 예상 비트 비교
  if (Math.abs(this.beatCount - expectedBeat) > 1) {
    console.warn('동기화 어긋남 감지, 재조정')
    this.beatCount = expectedBeat
  }
}
```

### 🎯 방안 3: Web Audio API만 사용 (정밀도 향상)

```javascript
// setInterval 제거, Web Audio API만 사용
startMetronome() {
  if (!this.audioContext) {
    this.setupAudio()
  }
  
  // 항상 Web Audio API 사용
  this.startPreciseMetronome(...)
}
```

### 🎯 방안 4: 네트워크 지연 측정 및 보정

```javascript
async measureNetworkLatency() {
  const pings = []
  
  for (let i = 0; i < 5; i++) {
    const start = Date.now()
    await metronomeAPI.ping()
    const latency = Date.now() - start
    pings.push(latency)
  }
  
  // 평균 지연 시간
  this.networkLatency = pings.reduce((a, b) => a + b) / pings.length
  
  console.log('네트워크 지연:', this.networkLatency, 'ms')
}

// 시작 시간 보정
const adjustedStartTime = syncStartTime - (this.networkLatency / 2)
```

---

## 현실적인 동기화 정확도

### ✅ 달성 가능한 정확도

| 환경 | 정확도 | 사용자 체감 |
|------|--------|-------------|
| 같은 Wi-Fi | ±10ms | 거의 못 느낌 |
| 유선 LAN | ±5ms | 완전히 동기화 |
| 모바일 핫스팟 | ±30ms | 약간 느낌 |
| 4G/5G | ±50ms | 눈에 띔 |
| 블루투스 이어폰 | ±100-300ms | 심각하게 어긋남 |

### ⚠️ 한계

**물리적 한계:**
- 빛의 속도: 유한
- 네트워크 경로: 가변적
- 각 기기 성능: 다름

**실용적 목표:**
- **±20ms 이내**: 대부분 사용자가 못 느낌
- **±50ms 이내**: 허용 가능
- **±100ms 이상**: 개선 필요

---

## 요약

### 현재 상황
✅ **기본 동기화 구조**: 있음 (syncStartTime 기반)  
⚠️ **시간차 발생**: 네트워크 지연 + 타이머 부정확성  
❌ **서버 시간 동기화**: 없음  
❌ **재동기화**: 없음  

### 시간차 원인 순위
1. **네트워크 지연** (50-200ms) ← 가장 큰 원인
2. **setInterval 부정확성** (누적 ±50ms)
3. **기기 시계 차이** (±10-100ms)
4. **오디오 재생 지연** (10-50ms)

### 개선 우선순위
1. **서버 시간 동기화** (NTP 방식) ← 가장 효과적
2. **Web Audio API 전용** (setInterval 제거)
3. **주기적 재동기화** (5초마다)
4. **네트워크 지연 측정 및 보정**

이 중 **서버 시간 동기화**만 구현해도 대부분의 시간차가 해결됩니다!
