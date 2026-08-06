# 연결 문제 디버깅 가이드

## 현재 상태 확인

### 1. 백엔드 서버 확인 ✅
```bash
# PC에서 테스트
curl http://192.168.137.1:8084/api/metronome/sessions/active
```
→ **정상 작동 중**

### 2. 프론트엔드 환경 변수 확인 ⚠️

**브라우저 개발자 도구 콘솔**에서 확인:
```
🌐 현재 환경: development
🔗 API 서버 주소: http://192.168.137.1:8084/api
```

만약 `http://localhost:8084/api`로 나온다면 → **환경 변수가 적용 안 됨**

---

## 해결 방법

### ✅ 방법 1: 프론트엔드 완전 재시작 (필수!)

`.env.local` 파일을 수정한 후 **반드시 서버를 완전히 재시작**해야 합니다.

```bash
# 1. 기존 프로세스 종료 (Ctrl+C)
# 2. 재시작
cd d:\pjt\mrp_front
npm run serve
```

### ✅ 방법 2: 브라우저 캐시 삭제

1. **Ctrl + Shift + R** (강력 새로고침)
2. 또는 개발자 도구 → Network 탭 → **Disable cache** 체크

### ✅ 방법 3: 환경 변수 확인

**d:\pjt\mrp_front\.env.local** 파일 내용:
```env
VUE_APP_API_BASE_URL=http://192.168.137.1:8084/api
```

주의사항:
- ❌ 앞뒤 공백 없어야 함
- ❌ 따옴표 없어야 함
- ✅ `VUE_APP_` 접두사 필수

---

## 모바일 기기에서 접속

### 1. 프론트엔드 접속
```
http://192.168.137.1:3000
```

### 2. 브라우저 콘솔 확인
- F12 → Console 탭
- 다음 로그 확인:
  ```
  🔗 API 서버 주소: http://192.168.137.1:8084/api
  ```

### 3. 네트워크 요청 확인
- F12 → Network 탭
- 페이지 새로고침
- API 요청 URL 확인:
  - ✅ `http://192.168.137.1:8084/api/...`
  - ❌ `http://localhost:8084/api/...`

---

## 여전히 안 될 경우

### 체크리스트

#### 1. 방화벽 확인
```powershell
# Windows 방화벽에서 포트 허용 확인
netsh advfirewall firewall show rule name=all | findstr 8084
```

#### 2. 서버 바인딩 확인
```powershell
netstat -ano | findstr :8084
```
출력 예시:
```
TCP    0.0.0.0:8084    <- 0.0.0.0이어야 외부 접근 가능
```

#### 3. CORS 에러 확인
브라우저 콘솔에서 CORS 에러 확인:
```
Access to XMLHttpRequest at 'http://192.168.137.1:8084/api/...' 
from origin 'http://192.168.137.1:3000' has been blocked by CORS policy
```

→ 백엔드 `CorsConfig.java` 재확인

#### 4. 네트워크 연결 확인
```powershell
# 모바일 기기에서 PC로 ping
ping 192.168.137.1
```

---

## 빠른 테스트

### PC에서 테스트
```bash
# 1. 백엔드 API 직접 호출
curl http://192.168.137.1:8084/api/metronome/sessions/active

# 2. 프론트엔드 접속
http://192.168.137.1:3000
```

### 모바일 기기에서 테스트
```
1. 브라우저 주소창: http://192.168.137.1:3000
2. F12 콘솔 확인
3. 로그인 또는 세션 목록 조회 시도
4. Network 탭에서 실제 요청 URL 확인
```

---

## 환경 변수가 적용 안 될 때

### 임시 해결책: 하드코딩 테스트

**d:\pjt\mrp_front\src\services\api.js** 수정:
```javascript
// 기존
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8084/api'

// 임시 테스트용 (환경 변수 무시)
const API_BASE_URL = 'http://192.168.137.1:8084/api'
```

이렇게 수정 후:
1. 저장
2. 브라우저 새로고침 (Ctrl+Shift+R)
3. 테스트

⚠️ **주의**: 테스트 후 반드시 원래대로 되돌려야 합니다!

---

## 성공 확인

### 브라우저 콘솔 로그
```
🌐 현재 환경: development
🔗 API 서버 주소: http://192.168.137.1:8084/api
API Request: GET /metronome/sessions/active
API Response: 200 /metronome/sessions/active
```

### 화면
- 활성 세션 목록이 표시됨
- 로그인 가능
- 세션 생성/참가 가능
