# MRP Front - Music Rhythm Platform

Vue.js 기반 실시간 메트로놈 공유 및 음악 협업 플랫폼

## 🌐 웹 애플리케이션

### Project setup
```bash
npm install
```

### Compiles and hot-reloads for development
```bash
npm run serve
```

### Compiles and minifies for production
```bash
npm run build
```

### Lints and fixes files
```bash
npm run lint
```

---

## 📱 모바일 애플리케이션 (Capacitor)

이 프로젝트는 Capacitor를 사용하여 Android/iOS 네이티브 앱으로 변환할 수 있습니다.

### 빠른 시작

```bash
# 빌드 + 동기화 + Android Studio 열기
npm run cap:android

# 빌드 + 동기화 + Xcode 열기 (Mac만)
npm run cap:ios
```

### 모바일 개발 스크립트

```bash
# 빌드 및 네이티브 프로젝트 동기화
npm run cap:sync

# Android 앱 실행
npm run cap:run:android

# iOS 앱 실행 (Mac만)
npm run cap:run:ios
```

### 📚 상세 가이드

- **[빠른 시작 가이드](./MOBILE_QUICKSTART.md)** - 3단계로 앱 실행하기
- **[전체 개발 가이드](./MOBILE_APP_GUIDE.md)** - 상세한 설명 및 고급 기능

---

## 🚀 배포 정보

### 프론트엔드
- **URL**: https://musicplan-2df35.web.app
- **플랫폼**: Firebase Hosting

### 백엔드
- **URL**: https://mrp-backend-971809459017.asia-northeast3.run.app
- **플랫폼**: Google Cloud Run

---

## 🛠 기술 스택

### 웹
- **프레임워크**: Vue.js 3
- **UI 라이브러리**: Element Plus
- **상태 관리**: Vuex (authStore)
- **HTTP 클라이언트**: Axios
- **실시간 통신**: WebSocket (STOMP)

### 모바일
- **크로스 플랫폼**: Capacitor
- **지원 플랫폼**: Android, iOS

---

## 📖 추가 문서

- [배포 가이드](./README_DEPLOYMENT.md)
- [Google 로그인 설정](./GOOGLE_LOGIN_SETUP.md)
- [모바일 핫스팟 가이드](./MOBILE_HOTSPOT_GUIDE.md)
- [WebSocket 동기화 수정](./WEBSOCKET_SYNC_FIX.md)
- [메트로놈 동기화 설명](./METRONOME_SYNC_EXPLANATION.md)

---

## 🔧 Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
