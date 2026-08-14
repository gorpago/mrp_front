# 🚀 MRP 모바일 앱 빠른 시작 가이드

## ✅ 설정 완료 항목

- ✅ Capacitor 설치 및 초기화
- ✅ Android 프로젝트 생성
- ✅ 모바일 반응형 CSS 추가
- ✅ 터치 최적화 (버튼 크기 44px 이상)
- ✅ 메타 태그 최적화 (viewport, theme-color 등)
- ✅ 상태 바 및 스플래시 스크린 설정

---

## 📱 Android 앱 실행 (3단계)

### 1단계: 프로젝트 빌드 및 동기화
```bash
npm run cap:sync
```

### 2단계: Android Studio 열기
```bash
npm run cap:android
```
또는
```bash
npx cap open android
```

### 3단계: 앱 실행
Android Studio에서:
1. 상단의 기기 선택 (에뮬레이터 또는 실제 기기)
2. 재생 버튼(▶) 클릭

---

## 🔄 개발 워크플로우

### 코드 수정 후 앱 업데이트

```bash
# 방법 1: 한 번에 실행
npm run cap:android

# 방법 2: 단계별 실행
npm run build
npx cap sync
npx cap open android
```

### 실시간 개발 (선택사항)

개발 중에는 웹 브라우저에서 테스트:
```bash
npm run serve
```
http://localhost:8080 에서 확인

---

## 📦 사용 가능한 NPM 스크립트

```bash
# 웹 개발 서버 실행
npm run serve

# 프로덕션 빌드
npm run build

# 빌드 + 동기화
npm run cap:sync

# 빌드 + 동기화 + Android Studio 열기
npm run cap:android

# 빌드 + 동기화 + iOS Xcode 열기 (Mac만)
npm run cap:ios

# 빌드 + 동기화 + Android 실행
npm run cap:run:android

# 빌드 + 동기화 + iOS 실행 (Mac만)
npm run cap:run:ios
```

---

## 🐛 문제 해결

### Android Studio가 없는 경우
[Android Studio 다운로드](https://developer.android.com/studio)

### 빌드 오류 발생 시
```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# Capacitor 재동기화
npx cap sync
```

### Android 프로젝트 재생성
```bash
# android 폴더 삭제 후
npx cap add android
```

---

## 📱 실제 기기에서 테스트

### Android 기기 연결

1. **개발자 옵션 활성화**
   - 설정 > 휴대전화 정보 > 빌드 번호를 7번 탭

2. **USB 디버깅 활성화**
   - 설정 > 개발자 옵션 > USB 디버깅 ON

3. **USB로 기기 연결**
   - Android Studio에서 기기가 표시됨

4. **앱 실행**
   - 기기 선택 후 재생 버튼 클릭

---

## 🎯 다음 단계

### 1. 앱 아이콘 추가
1024x1024 PNG 이미지를 준비하고 [App Icon Generator](https://appicon.co/)에서 생성

### 2. 네이티브 기능 추가
```bash
# 카메라
npm install @capacitor/camera

# 푸시 알림
npm install @capacitor/push-notifications

# 파일 시스템
npm install @capacitor/filesystem
```

### 3. APK 빌드 (배포용)
Android Studio에서:
- **Build > Build Bundle(s) / APK(s) > Build APK(s)**

생성된 APK 위치:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📚 더 알아보기

- [전체 가이드](./MOBILE_APP_GUIDE.md) - 상세한 설명 및 고급 기능
- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Android 개발자 가이드](https://developer.android.com/)

---

## 💡 팁

- **빠른 테스트**: 웹 브라우저에서 먼저 테스트 (`npm run serve`)
- **정기적 동기화**: 코드 변경 후 항상 `npx cap sync` 실행
- **실제 기기 테스트**: 에뮬레이터보다 실제 기기에서 테스트 권장
- **Chrome DevTools**: `chrome://inspect`에서 Android 앱 디버깅 가능

---

**문제가 있으면 [MOBILE_APP_GUIDE.md](./MOBILE_APP_GUIDE.md)를 참고하세요!**
