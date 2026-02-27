# Firebase Hosting 배포 가이드

## 1. Firebase 프로젝트 설정

### Firebase Console에서 프로젝트 생성
1. https://console.firebase.google.com/ 접속
2. "Add project" 클릭
3. 프로젝트 이름: `mrp-frontend` (또는 원하는 이름)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

### Hosting 활성화
1. 생성된 프로젝트에서 "Hosting" 메뉴 클릭
2. "Get started" 클릭
3. Firebase CLI 설치 확인 (이미 완료됨)

## 2. 프로젝트 ID 업데이트

`.firebaserc` 파일에서 프로젝트 ID를 실제 Firebase 프로젝트 ID로 변경:

```json
{
  "projects": {
    "default": "실제-firebase-프로젝트-id"
  }
}
```

## 3. 네이버 콜백 URL 업데이트

### 3.1 Firebase 도메인 확인
배포 후 Firebase에서 제공하는 도메인을 확인:
- 기본 도메인: `프로젝트-id.web.app`
- 또는 `프로젝트-id.firebaseapp.com`

### 3.2 환경 변수 업데이트
`.env.production` 파일에서 콜백 URL 업데이트:

```env
VUE_APP_NAVER_CALLBACK_URL=https://실제-firebase-도메인.web.app/auth/naver/callback
```

### 3.3 네이버 개발자 센터 설정
1. https://developers.naver.com/apps 접속
2. 애플리케이션 선택
3. "API 설정" 탭에서 "Callback URL" 추가:
   - `https://실제-firebase-도메인.web.app/auth/naver/callback`

## 4. 배포 명령어

### 로그인 (브라우저에서 수동 실행)
```bash
firebase login
```

### 프로젝트 초기화 (이미 완료됨)
```bash
firebase init hosting
```

### 빌드 및 배포
```bash
npm run build
firebase deploy
```

## 5. 배포 후 확인사항

1. **네이버 로그인 테스트**: 실제 Firebase 도메인에서 네이버 로그인 동작 확인
2. **HTTPS 확인**: Firebase는 자동으로 HTTPS 제공
3. **콜백 URL 동작**: 네이버 로그인 후 콜백 처리 확인

## 6. 커스텀 도메인 설정 (선택사항)

Firebase Console에서 커스텀 도메인 연결 가능:
1. Hosting > "Add custom domain"
2. 도메인 입력 및 DNS 설정
3. SSL 인증서 자동 발급

## 7. 주의사항

- **Client Secret**: 네이버 Client Secret은 백엔드에서만 사용
- **CORS 설정**: 백엔드 API에서 Firebase 도메인 허용 필요
- **환경 분리**: 개발/프로덕션 환경 변수 분리 완료

## 8. 배포 자동화 (GitHub Actions)

향후 GitHub Actions를 통한 자동 배포 설정 가능:
- `.github/workflows/deploy.yml` 생성
- Firebase 토큰 설정
- 푸시 시 자동 배포
