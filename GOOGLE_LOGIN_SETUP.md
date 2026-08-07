# Google 로그인 프로덕션 설정 가이드

## 🚨 문제 상황
Firebase에 배포 후 Google 로그인이 작동하지 않음

## 🔍 원인
Google OAuth는 보안상 **승인된 도메인**에서만 작동합니다.
현재 `localhost:3000`만 등록되어 있고, Firebase 도메인이 등록되지 않았습니다.

## ✅ 해결 방법

### 1. Google Cloud Console 접속
https://console.cloud.google.com/apis/credentials

### 2. 프로젝트 선택
- Firebase 프로젝트와 연결된 Google Cloud 프로젝트 선택
- 프로젝트 ID: `musicplan-2df35` (또는 실제 프로젝트 ID)

### 3. OAuth 2.0 클라이언트 ID 편집
**현재 Client ID:**
```
326812627200-ddjmh5oa39477ukssgs5h536k08bvcd7.apps.googleusercontent.com
```

**편집 버튼 클릭** → 다음 항목 추가:

#### 승인된 JavaScript 원본 (Authorized JavaScript origins)
```
http://localhost:3000
https://musicplan-2df35.web.app
https://musicplan-2df35.firebaseapp.com
```

#### 승인된 리디렉션 URI (Authorized redirect URIs)
```
http://localhost:3000/login
https://musicplan-2df35.web.app/login
https://musicplan-2df35.firebaseapp.com/login
```

### 4. 저장 및 확인
1. **저장** 버튼 클릭
2. 변경사항이 적용될 때까지 **최대 5분** 대기
3. Firebase 배포된 사이트에서 Google 로그인 테스트

## 📋 체크리스트

- [ ] Google Cloud Console 접속
- [ ] OAuth 2.0 클라이언트 ID 찾기
- [ ] Firebase 도메인 2개 추가 (web.app, firebaseapp.com)
- [ ] 리디렉션 URI 2개 추가
- [ ] 저장 완료
- [ ] 5분 대기
- [ ] 프로덕션에서 테스트

## 🔧 디버깅

### 브라우저 콘솔에서 확인할 정보
```javascript
// 다음 정보가 콘솔에 출력됩니다:
🔑 Google Client ID: 326812627200-...
🌐 현재 도메인: https://musicplan-2df35.web.app
📝 환경: production
```

### 일반적인 오류 메시지
- **"origin_mismatch"**: 현재 도메인이 승인된 JavaScript 원본에 없음
- **"redirect_uri_mismatch"**: 리디렉션 URI가 등록되지 않음
- **"popup_closed_by_user"**: 사용자가 팝업을 닫음 (정상)

## 📝 참고사항

### 로컬 개발 환경
- ✅ 이미 설정 완료: `http://localhost:3000`
- 로컬에서는 정상 작동

### 프로덕션 환경
- ❌ 설정 필요: Firebase 도메인 2개
- 설정 전까지 Google 로그인 불가

### 다른 소셜 로그인
- **네이버**: 네이버 개발자 센터에서 별도 설정 필요
- **카카오**: 카카오 개발자 센터에서 별도 설정 필요

## 🌐 관련 링크

- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [Google Identity Services 문서](https://developers.google.com/identity/gsi/web/guides/overview)
- [Firebase Console](https://console.firebase.google.com/)

## ⚠️ 주의사항

1. **Client ID 노출**: Client ID는 공개되어도 안전합니다 (Client Secret과 다름)
2. **도메인 정확성**: `https://` 포함, 슬래시 없이 정확히 입력
3. **적용 시간**: 변경 후 최대 5분 소요
4. **캐시 삭제**: 안 되면 브라우저 캐시 삭제 후 재시도

## 🎯 완료 후 테스트

1. Firebase 배포된 사이트 접속: https://musicplan-2df35.web.app
2. "Google로 로그인" 버튼 클릭
3. Google 계정 선택
4. 로그인 성공 확인

---

**작성일**: 2026-08-07
**상태**: 설정 대기 중
