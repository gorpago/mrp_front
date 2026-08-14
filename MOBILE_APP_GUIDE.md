# MRP 모바일 앱 개발 가이드

## 📱 Capacitor 설정 완료

Vue.js 웹 애플리케이션이 Android/iOS 모바일 앱으로 변환되었습니다.

---

## 🚀 빠른 시작

### 1. 프로젝트 빌드
```bash
npm run build
```

### 2. 웹 자산을 네이티브 프로젝트에 복사
```bash
npx cap sync
```

### 3. Android 앱 실행
```bash
npx cap open android
```
Android Studio가 열리면 에뮬레이터나 실제 기기에서 실행할 수 있습니다.

### 4. iOS 앱 실행 (Mac에서만 가능)
```bash
npx cap open ios
```
Xcode가 열리면 시뮬레이터나 실제 기기에서 실행할 수 있습니다.

---

## 📂 프로젝트 구조

```
mrp_front/
├── src/                    # Vue.js 소스 코드
├── dist/                   # 빌드된 웹 자산
├── android/                # Android 네이티브 프로젝트
├── ios/                    # iOS 네이티브 프로젝트 (추가 시)
└── capacitor.config.json   # Capacitor 설정
```

---

## 🔧 개발 워크플로우

### 일반적인 개발 흐름

1. **Vue.js 코드 수정**
   ```bash
   # 개발 서버로 테스트
   npm run serve
   ```

2. **프로덕션 빌드**
   ```bash
   npm run build
   ```

3. **네이티브 프로젝트 동기화**
   ```bash
   npx cap sync
   ```

4. **모바일 앱 테스트**
   ```bash
   # Android
   npx cap run android
   
   # iOS (Mac에서만)
   npx cap run ios
   ```

---

## 📱 모바일 최적화 권장사항

### 1. 반응형 디자인 개선

현재 Element Plus를 사용 중이므로, 모바일 화면에 맞게 조정이 필요합니다.

**`src/App.vue` 또는 개별 컴포넌트에 추가:**
```css
/* 모바일 최적화 스타일 */
@media (max-width: 768px) {
  .el-button {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .el-dialog {
    width: 95% !important;
  }
}
```

### 2. 터치 인터페이스 개선

**버튼 크기 증가:**
```css
/* 터치하기 쉬운 크기 (최소 44x44px) */
.mobile-button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}
```

### 3. 뷰포트 메타 태그 확인

`public/index.html`에 다음이 있는지 확인:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

### 4. 상태 바 스타일 설정

`capacitor.config.json`에 추가:
```json
{
  "plugins": {
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#000000"
    }
  }
}
```

---

## 🔌 네이티브 기능 추가

### 카메라 접근
```bash
npm install @capacitor/camera
```

```javascript
import { Camera, CameraResultType } from '@capacitor/camera';

const takePicture = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });
};
```

### 푸시 알림
```bash
npm install @capacitor/push-notifications
```

### 파일 시스템 접근
```bash
npm install @capacitor/filesystem
```

### 네트워크 상태 확인
```bash
npm install @capacitor/network
```

---

## 🔐 권한 설정

### Android 권한 (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

### iOS 권한 (`ios/App/App/Info.plist`)
```xml
<key>NSCameraUsageDescription</key>
<string>카메라를 사용하여 사진을 촬영합니다.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>사진 라이브러리에 접근합니다.</string>
```

---

## 🌐 API 연동 주의사항

### CORS 문제 해결

모바일 앱에서는 CORS 정책이 적용되지 않지만, 개발 중에는 다음을 사용:

**`capacitor.config.json`에 개발 서버 설정:**
```json
{
  "server": {
    "url": "http://localhost:8080",
    "cleartext": true
  }
}
```

⚠️ **프로덕션 빌드 시에는 이 설정을 제거하세요!**

### 환경 변수 설정

모바일 앱에서도 `.env.production` 파일이 사용됩니다:
```
VUE_APP_API_BASE_URL=https://mrp-backend-971809459017.asia-northeast3.run.app
```

---

## 📦 앱 빌드 및 배포

### Android APK 빌드

1. Android Studio에서 프로젝트 열기:
   ```bash
   npx cap open android
   ```

2. **Build > Build Bundle(s) / APK(s) > Build APK(s)**

3. 빌드된 APK 위치:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Android App Bundle (Google Play 배포용)

1. **Build > Generate Signed Bundle / APK**
2. **Android App Bundle** 선택
3. 키스토어 생성 또는 기존 키스토어 사용
4. 빌드된 AAB 파일을 Google Play Console에 업로드

### iOS 앱 빌드 (Mac에서만)

1. Xcode에서 프로젝트 열기:
   ```bash
   npx cap open ios
   ```

2. **Product > Archive**
3. App Store Connect에 업로드

---

## 🐛 디버깅

### Chrome DevTools로 Android 앱 디버깅

1. USB로 Android 기기 연결
2. Chrome에서 `chrome://inspect` 접속
3. 앱 실행 후 디버깅 시작

### Safari로 iOS 앱 디버깅 (Mac에서만)

1. iOS 기기를 Mac에 연결
2. Safari > 개발 > [기기 이름] > [앱 이름]

### 로그 확인

**Android:**
```bash
npx cap run android -l
```

**iOS:**
```bash
npx cap run ios -l
```

---

## 📝 package.json 스크립트 추가 권장

`package.json`에 다음 스크립트를 추가하면 편리합니다:

```json
{
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint",
    "cap:sync": "npm run build && npx cap sync",
    "cap:android": "npm run cap:sync && npx cap open android",
    "cap:ios": "npm run cap:sync && npx cap open ios",
    "cap:run:android": "npm run cap:sync && npx cap run android",
    "cap:run:ios": "npm run cap:sync && npx cap run ios"
  }
}
```

사용 예:
```bash
npm run cap:android  # 빌드 + 동기화 + Android Studio 열기
```

---

## 🎨 앱 아이콘 및 스플래시 스크린

### 아이콘 생성

1. 1024x1024 PNG 이미지 준비
2. 다음 도구 사용:
   - [Capacitor Assets](https://github.com/ionic-team/capacitor-assets)
   - [App Icon Generator](https://appicon.co/)

3. 생성된 아이콘을 다음 위치에 배치:
   - Android: `android/app/src/main/res/`
   - iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### 스플래시 스크린

Capacitor는 기본 스플래시 스크린을 제공합니다. 커스터마이징하려면:

```bash
npm install @capacitor/splash-screen
```

`capacitor.config.json`에 추가:
```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#ffffff",
      "showSpinner": false
    }
  }
}
```

---

## 🔄 업데이트 배포

### 웹 자산만 업데이트 (네이티브 코드 변경 없음)

1. 코드 수정
2. `npm run build`
3. `npx cap sync`
4. 앱 재빌드 및 배포

### 네이티브 플러그인 추가 시

1. 플러그인 설치
2. `npx cap sync`
3. Android Studio / Xcode에서 추가 설정 (필요 시)
4. 앱 재빌드 및 배포

---

## 📚 추가 리소스

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Capacitor 플러그인](https://capacitorjs.com/docs/plugins)
- [Android 개발자 가이드](https://developer.android.com/)
- [iOS 개발자 가이드](https://developer.apple.com/documentation/)

---

## ⚠️ 주의사항

1. **네이티브 프로젝트는 Git에 커밋하세요**
   - `android/` 및 `ios/` 폴더를 `.gitignore`에서 제외
   - 네이티브 설정 변경사항을 추적할 수 있습니다

2. **정기적으로 동기화**
   - 웹 코드 변경 후 항상 `npx cap sync` 실행

3. **플러그인 버전 관리**
   - Capacitor 버전과 플러그인 버전 호환성 확인

4. **테스트**
   - 실제 기기에서 테스트 (에뮬레이터/시뮬레이터만으로는 부족)
   - 다양한 화면 크기와 OS 버전에서 테스트

---

## 🎯 다음 단계

1. ✅ Capacitor 설치 및 설정 완료
2. ✅ Android 프로젝트 생성 완료
3. ⬜ iOS 프로젝트 추가 (선택사항)
4. ⬜ 모바일 UI/UX 최적화
5. ⬜ 네이티브 기능 추가 (카메라, 푸시 알림 등)
6. ⬜ 앱 아이콘 및 스플래시 스크린 설정
7. ⬜ 앱 스토어 배포

---

**문의사항이나 문제가 있으면 [Capacitor 커뮤니티](https://ionic.io/community)를 참고하세요!**
