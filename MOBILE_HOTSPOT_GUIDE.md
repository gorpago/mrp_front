# 모바일 핫스팟 연결 가이드

## 문제 상황
모바일 핫스팟으로 연결 시 로그인 및 DB 조회가 안 되는 문제

## 원인
1. **localhost 바인딩**: 프론트엔드가 `localhost:8084`로 백엔드 호출 → 모바일 기기에서 접근 불가
2. **CORS 제한**: 로컬 네트워크 IP가 허용되지 않음
3. **서버 바인딩**: Spring Boot가 localhost에만 바인딩

## 해결 완료 사항 ✅

### 1. CORS 설정 업데이트
- `CorsConfig.java`에 로컬 네트워크 IP 패턴 추가
- `192.168.*.*` (모바일 핫스팟)
- `10.*.*.*` (일반 로컬 네트워크)

### 2. 서버 바인딩 설정
- `application.properties`에 `server.address=0.0.0.0` 추가
- 모든 네트워크 인터페이스에서 접근 가능

### 3. Vue 개발 서버 설정
- `vue.config.js`에 `host: '0.0.0.0'` 추가
- 외부 기기에서 프론트엔드 접근 가능

### 4. 환경 변수 파일 생성
- `.env.local` 파일 생성
- API 주소를 쉽게 변경 가능

---

## 사용 방법

### 1단계: PC IP 주소 확인

**Windows:**
```powershell
ipconfig
```

**출력 예시:**
```
무선 LAN 어댑터 Wi-Fi:
   IPv4 주소 . . . . . . . . : 192.168.137.1
```

→ **192.168.137.1**이 PC의 IP 주소

### 2단계: 환경 변수 설정

`d:\pjt\mrp_front\.env.local` 파일 수정:

```env
# localhost 주석 처리
# VUE_APP_API_BASE_URL=http://localhost:8084/api

# PC의 실제 IP 주소로 변경
VUE_APP_API_BASE_URL=http://192.168.137.1:8084/api
```

### 3단계: 서버 재시작

**백엔드 (Spring Boot):**
```bash
cd d:\pjt\mrp
# 기존 서버 종료 후
mvn spring-boot:run
```

**프론트엔드 (Vue):**
```bash
cd d:\pjt\mrp_front
# 기존 서버 종료 후
npm run serve
```

### 4단계: 모바일 기기에서 접속

**프론트엔드 접속:**
```
http://192.168.137.1:3000
```

**백엔드 API 테스트:**
```
http://192.168.137.1:8084/api/metronome/test-create
```

---

## 확인 사항

### ✅ 방화벽 설정
Windows 방화벽에서 포트 허용:
- **포트 3000** (Vue 개발 서버)
- **포트 8084** (Spring Boot)

**방화벽 규칙 추가:**
1. Windows 보안 → 방화벽 및 네트워크 보호
2. 고급 설정 → 인바운드 규칙 → 새 규칙
3. 포트 → TCP → 특정 로컬 포트: 3000, 8084
4. 연결 허용

### ✅ 모바일 핫스팟 활성화
1. PC에서 모바일 핫스팟 켜기
2. 모바일 기기를 PC 핫스팟에 연결

### ✅ 네트워크 확인
모바일 기기와 PC가 같은 네트워크에 있는지 확인

---

## 트러블슈팅

### 문제 1: 여전히 연결 안 됨
**원인:** 방화벽 차단  
**해결:** Windows Defender 방화벽에서 포트 3000, 8084 허용

### 문제 2: CORS 에러
**원인:** IP 주소가 CORS 패턴과 맞지 않음  
**해결:** `CorsConfig.java` 확인 및 서버 재시작

### 문제 3: WebSocket 연결 실패
**원인:** WebSocket도 IP 주소 변경 필요  
**해결:** `.env.local`의 IP 주소가 정확한지 확인

### 문제 4: Firebase 연결 안 됨
**원인:** Firebase는 외부 서비스라서 인터넷 연결 필요  
**해결:** 모바일 데이터 또는 Wi-Fi 연결 확인

---

## 개발 환경별 설정

### localhost (기본)
```env
VUE_APP_API_BASE_URL=http://localhost:8084/api
```

### 모바일 핫스팟
```env
VUE_APP_API_BASE_URL=http://192.168.137.1:8084/api
```

### 같은 Wi-Fi 네트워크
```env
VUE_APP_API_BASE_URL=http://192.168.0.x:8084/api
```

---

## 주의사항

⚠️ **보안 경고**
- `server.address=0.0.0.0`은 개발 환경에서만 사용
- 프로덕션 배포 시 적절한 보안 설정 필요

⚠️ **IP 주소 변경**
- 네트워크 변경 시 IP 주소가 바뀔 수 있음
- `.env.local` 파일을 매번 확인

⚠️ **Git 커밋**
- `.env.local`은 `.gitignore`에 포함되어 있음
- 개인 설정이므로 커밋하지 않음
