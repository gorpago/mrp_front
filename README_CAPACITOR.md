# Capacitor 앱 개발 가이드

## 📱 앱에서 API/DB 접속 설정

### 문제
Capacitor 앱에서 `localhost`는 안드로이드 기기 자체를 가리키므로, PC의 백엔드 서버에 접속할 수 없습니다.

### 해결 방법

#### 1. **PC의 IP 주소 확인**
```bash
# Windows
ipconfig

# 또는 npm run serve 실행 시 출력되는 Network 주소 확인
# 예: http://10.2.120.63:3000
```

#### 2. **환경변수 수정** (`.env.development`)
```bash
# 웹 브라우저 개발용 (주석 처리)
# VUE_APP_API_BASE_URL=http://localhost:8084/api

# Capacitor 앱 개발용 (주석 해제하고 PC IP로 변경)
VUE_APP_API_BASE_URL=http://10.2.120.63:8084/api
```

#### 3. **백엔드 서버 실행**
```bash
cd d:\pjt\mrp
mvn spring-boot:run
```

#### 4. **프론트엔드 빌드 및 동기화**
```bash
cd d:\pjt\mrp_front

# 빌드
npm run build

# 안드로이드 동기화
npx cap sync android
```

#### 5. **Android Studio에서 실행**
```bash
# Android Studio 열기
npx cap open android

# 또는 직접 실행
npx cap run android
```

---

## 🚀 라이브 리로드 개발 (빠른 개발)

매번 빌드하지 않고 코드 수정 시 자동 반영:

### 1. **capacitor.config.json 수정**
```json
{
  "server": {
    "url": "http://10.2.120.63:3000",  // PC의 IP 주소
    "cleartext": true,
    "androidScheme": "https"
  }
}
```

### 2. **개발 워크플로우**
```bash
# 터미널 1: 웹 개발 서버 실행
npm run serve

# 터미널 2: 백엔드 서버 실행
cd d:\pjt\mrp
mvn spring-boot:run

# 터미널 3: 안드로이드 앱 실행 (최초 1회)
npx cap sync android
npx cap run android
```

이제 코드 수정 시 앱이 자동으로 새로고침됩니다! 🎉

### 3. **프로덕션 빌드 시**
`capacitor.config.json`에서 `server.url` 제거:
```json
{
  "server": {
    "hostname": "localhost",
    "androidScheme": "https"
  }
}
```

---

## 🔧 완료된 설정

### ✅ 백엔드 CORS 설정
- `CorsConfig.java`에 Capacitor 앱 스킴 추가
  - `https://localhost`
  - `capacitor://localhost`
  - 로컬 네트워크 IP 패턴 (`10.*.*.*`)

### ✅ 안드로이드 네트워크 보안 설정
- `network_security_config.xml` 생성
  - 로컬 네트워크 HTTP 허용
  - 개발 환경용 cleartext 트래픽 허용

### ✅ AndroidManifest.xml 업데이트
- `networkSecurityConfig` 추가
- `usesCleartextTraffic` 활성화

---

## 🐛 문제 해결

### Google 로그인이 안될 때
Google OAuth는 웹 도메인만 허용하므로, 앱에서는 추가 설정이 필요합니다:

1. **Google Cloud Console** 접속
2. **OAuth 2.0 클라이언트 ID** → **Android** 추가
3. **패키지 이름**: `com.gorpago.mrp`
4. **SHA-1 인증서 지문** 생성:
   ```bash
   cd d:\pjt\mrp_front\android
   .\gradlew signingReport
   ```

### DB 접속이 안될 때
- 백엔드 서버가 실행 중인지 확인
- PC 방화벽에서 8084 포트 허용
- `.env.development`의 IP 주소가 올바른지 확인

### 네트워크 오류가 발생할 때
- PC와 안드로이드 기기가 같은 네트워크에 연결되어 있는지 확인
- `ipconfig`로 PC IP 주소 재확인
- 백엔드 서버가 `0.0.0.0`으로 바인딩되어 있는지 확인 (`application.properties`)

---

## 📝 유용한 명령어

```bash
# 빌드 + 동기화 + Android Studio 열기
npm run cap:android

# 빌드 + 동기화 + 직접 실행
npm run cap:run:android

# 안드로이드만 동기화
npx cap sync android

# 로그 확인
npx cap run android --livereload
```

---

## 🎯 개발 팁

1. **라이브 리로드 사용** - 빠른 개발을 위해 `npm run serve` + `server.url` 설정
2. **실제 기기 테스트** - 에뮬레이터보다 실제 기기에서 테스트 권장
3. **네트워크 로그 확인** - Chrome DevTools로 앱 디버깅 가능
   - Chrome 주소창에 `chrome://inspect` 입력
4. **환경 분리** - 웹 개발과 앱 개발 시 `.env.development` 수정 필요
