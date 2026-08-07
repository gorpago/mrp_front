# 참가자 이름 표시 문제 해결

## 🔍 문제 상황
메트로놈 세션에서 참가자 이름이 "참가자 1", "참가자 2"로 표시되고, 실제 가입자 이름이 표시되지 않음

## ✅ 해결 완료

### **수정 사항**

#### 1. MetronomeSession.vue - 참가자 이름 표시
**Before:**
```vue
<div class="participant-name">참가자 {{ index + 1 }}</div>
```

**After:**
```vue
<div class="participant-name">
  {{ session?.participantNames?.[index] || `참가자 ${index + 1}` }}
</div>
```

#### 2. 디버깅 로그 추가
- 세션 로드 시 참가자 정보 출력
- 세션 참가 시 전달되는 사용자 정보 출력

---

## 🔍 작동 방식

### **백엔드 (이미 구현됨)**

```java
// MetronomeSession.java
private List<String> participantIds;    // ["user-123", "user-456"]
private List<String> participantNames;  // ["홍길동", "김철수"]

// 참가자 추가 시 이름도 함께 저장
public boolean addParticipant(String userId, String userName) {
    participantIds.add(userId);
    participantNames.add(userName != null ? userName : "사용자");
    return true;
}
```

### **프론트엔드**

```javascript
// 세션 참가 시
await metronomeAPI.joinSession(
  sessionCode,
  userId,
  userName  // ← 사용자 이름 전달
)

// 참가자 목록 표시
<div v-for="(participantId, index) in session?.participantIds">
  {{ session?.participantNames?.[index] }}  // ← 이름 표시
</div>
```

---

## 🧪 테스트 방법

### **1. 브라우저 콘솔 확인**

**세션 참가 시:**
```javascript
세션 참가 요청: {
  sessionCode: "123456",
  userId: "user-1234567890",
  userName: "홍길동"  // ← 실제 이름 확인
}
```

**세션 로드 시:**
```javascript
참가자 정보: {
  participantIds: ["user-123", "user-456"],
  participantNames: ["홍길동", "김철수"],  // ← 이름 배열 확인
  count: 2
}
```

### **2. 실제 테스트**

1. **로그인한 사용자로 참가**
   - 소셜 로그인 (Google/Naver/Kakao)
   - 세션 참가
   - 참가자 목록에 실제 이름 표시 확인

2. **로그인하지 않은 사용자로 참가**
   - 세션 참가 시 이름 입력
   - 입력한 이름이 참가자 목록에 표시되는지 확인

---

## 🔍 문제가 계속되는 경우

### **증상 1: 여전히 "참가자 1"로 표시**

**원인:**
- 백엔드에서 `participantNames` 배열이 비어있음
- 세션 참가 시 `userName`이 전달되지 않음

**확인 방법:**
```javascript
// 브라우저 콘솔에서
console.log(session.participantNames)
// 결과: [] 또는 undefined → 문제!
// 결과: ["홍길동", "김철수"] → 정상
```

**해결:**
1. 브라우저 콘솔에서 "세션 참가 요청" 로그 확인
2. `userName`이 제대로 전달되는지 확인
3. 백엔드 로그 확인 (Spring Boot 콘솔)

### **증상 2: 일부는 이름, 일부는 "참가자 N"**

**원인:**
- 이전에 참가한 사용자는 이름이 저장되지 않았음
- 새로 참가한 사용자부터 이름이 표시됨

**해결:**
- 정상 동작입니다
- 기존 참가자는 세션을 나갔다가 다시 참가하면 이름이 표시됩니다

### **증상 3: "익명 사용자"로 표시**

**원인:**
- 로그인하지 않았고, 이름도 입력하지 않음
- 기본값 "익명 사용자" 사용

**해결:**
1. 소셜 로그인 후 참가
2. 또는 세션 참가 시 이름 입력

---

## 📊 데이터 구조

### **세션 객체 (Firestore)**

```javascript
{
  id: "session-abc123",
  sessionName: "밴드 연습",
  hostUserId: "user-host",
  hostUserName: "호스트 이름",
  
  // 참가자 정보 (인덱스로 매칭)
  participantIds: [
    "user-123",    // index 0
    "user-456",    // index 1
    "user-789"     // index 2
  ],
  participantNames: [
    "홍길동",      // index 0 → user-123의 이름
    "김철수",      // index 1 → user-456의 이름
    "이영희"       // index 2 → user-789의 이름
  ],
  
  bpm: 120,
  timeSignature: 4,
  isPlaying: false
}
```

### **중요: 배열 인덱스 일치**
- `participantIds[0]`의 이름은 `participantNames[0]`
- `participantIds[1]`의 이름은 `participantNames[1]`
- 순서가 중요합니다!

---

## 🎯 사용자 이름 설정 우선순위

### **세션 생성 시 (호스트)**
1. 로그인한 사용자 → `authStore.currentUser.name`
2. 로그인하지 않음 → "익명 사용자"

### **세션 참가 시 (게스트)**
1. 로그인한 사용자 → `authStore.currentUser.name`
2. 로그인하지 않음 → 사용자가 입력한 이름
3. 이름 미입력 → "익명 사용자"

---

## 🔧 추가 개선 사항 (선택)

### **1. 참가자 아바타 개선**
```vue
<el-avatar :size="40">
  <!-- 이름 첫 글자 표시 -->
  {{ session?.participantNames?.[index]?.charAt(0) || 'U' }}
</el-avatar>
```

### **2. 참가자 상태 표시**
```vue
<div class="participant-status">
  <el-tag size="small" :type="isOnline(participantId) ? 'success' : 'info'">
    {{ isOnline(participantId) ? '온라인' : '오프라인' }}
  </el-tag>
</div>
```

### **3. 참가자 정렬**
```javascript
// 호스트를 맨 위에, 나머지는 이름순
computed: {
  sortedParticipants() {
    const participants = this.session?.participantIds.map((id, index) => ({
      id,
      name: this.session?.participantNames?.[index] || `참가자 ${index + 1}`
    })) || []
    
    return participants.sort((a, b) => a.name.localeCompare(b.name))
  }
}
```

---

## 📝 요약

### **문제**
- 참가자 이름이 "참가자 1", "참가자 2"로 표시

### **원인**
- 프론트엔드에서 `participantNames` 배열을 사용하지 않음
- `participantId`만 표시하고 이름은 무시

### **해결**
- `session?.participantNames?.[index]` 사용
- Fallback: `참가자 ${index + 1}`

### **결과**
- ✅ 로그인한 사용자: 실제 이름 표시
- ✅ 이름 입력한 사용자: 입력한 이름 표시
- ✅ 이름 없는 경우: "참가자 N" 표시

---

**작성일:** 2026-08-07  
**상태:** 해결 완료 ✅  
**테스트:** 필요 (로그인 후 세션 참가)
