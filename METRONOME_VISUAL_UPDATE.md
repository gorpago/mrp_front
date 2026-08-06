# 메트로놈 비주얼 업데이트 - 흐르는 방식

## 변경 내용

### Before (원형 방식)
- 하나의 큰 원이 박자에 맞춰 깜빡임
- 단순한 시각적 피드백

### After (흐르는 방식)
- 박자 수만큼 점들이 나열됨 (4/4박자면 4개)
- 현재 박자에 해당하는 점이 빛남
- 첫 박자는 다른 색상으로 강조
- 이미지와 동일한 사이버펑크 스타일

## 시각적 특징

### 🎨 디자인
- **배경**: 다크 그라데이션 (사이버펑크 스타일)
- **비활성 점**: 반투명 청록색 (#00d4ff, 30% 투명도)
- **활성 점**: 밝은 청록색 (#00d4ff) + 글로우 효과
- **첫 박자**: 밝은 녹색 (#00ffaa) + 글로우 효과

### ✨ 애니메이션
- **펄스 효과**: 활성화 시 크기 확대 (1.0 → 1.4 → 1.3)
- **글로우 효과**: 3단계 그림자 (30px, 60px, 90px)
- **부드러운 전환**: 0.15초 ease 트랜지션

### 📱 반응형
- **데스크톱**: 점 크기 50px, 간격 20px
- **모바일**: 점 크기 40px, 간격 12px

## 코드 변경

### 1. HTML 템플릿
```vue
<!-- Before -->
<div class="metronome-visual">
  <div class="metronome-circle" :class="{ 'beat': isBeat, 'playing': isPlaying }">
    <div class="beat-indicator"></div>
  </div>
</div>

<!-- After -->
<div class="metronome-visual-flow">
  <div 
    v-for="index in currentTimeSignature" 
    :key="index"
    class="beat-dot"
    :class="{ 
      'active': beatCount === index - 1 && isPlaying,
      'first-beat': index === 1
    }"
  >
  </div>
</div>
```

### 2. CSS 스타일
```css
/* 컨테이너 */
.metronome-visual-flow {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 30px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  min-height: 120px;
}

/* 비활성 점 */
.beat-dot {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 212, 255, 0.3);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
  transition: all 0.15s ease;
}

/* 활성 점 (일반 박자) */
.beat-dot.active {
  background: #00d4ff;
  box-shadow: 
    0 0 30px rgba(0, 212, 255, 0.8),
    0 0 60px rgba(0, 212, 255, 0.6),
    0 0 90px rgba(0, 212, 255, 0.4);
  transform: scale(1.3);
  animation: pulse 0.3s ease-out;
}

/* 활성 점 (첫 박자) */
.beat-dot.first-beat.active {
  background: #00ffaa;
  box-shadow: 
    0 0 30px rgba(0, 255, 170, 0.8),
    0 0 60px rgba(0, 255, 170, 0.6),
    0 0 90px rgba(0, 255, 170, 0.4);
}

/* 펄스 애니메이션 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1.3); }
}
```

### 3. 모바일 반응형
```css
@media (max-width: 768px) {
  .metronome-visual-flow {
    gap: 12px;
    padding: 20px;
    min-height: 90px;
  }
  
  .beat-dot {
    width: 40px;
    height: 40px;
  }
}
```

## 동작 방식

### 박자 표시 로직
```javascript
// beatCount: 0부터 시작 (0, 1, 2, 3...)
// index: 1부터 시작 (1, 2, 3, 4...)
// beatCount === index - 1 일 때 해당 점 활성화

// 예: 4/4 박자
// beatCount = 0 → 첫 번째 점 활성화 (index 1)
// beatCount = 1 → 두 번째 점 활성화 (index 2)
// beatCount = 2 → 세 번째 점 활성화 (index 3)
// beatCount = 3 → 네 번째 점 활성화 (index 4)
```

### 첫 박자 강조
```javascript
// index === 1이면서 활성화된 경우
// first-beat 클래스 추가 → 녹색으로 표시
:class="{ 
  'active': beatCount === index - 1 && isPlaying,
  'first-beat': index === 1
}"
```

## 박자별 표시

### 4/4 박자 (가장 일반적)
```
● ● ● ●
```
첫 박자: 녹색 글로우  
나머지: 청록색 글로우

### 3/4 박자 (왈츠)
```
● ● ●
```

### 2/4 박자 (행진곡)
```
● ●
```

### 6/8 박자 (복합박자)
```
● ● ● ● ● ●
```

## 사용자 경험 개선

### ✅ 장점
1. **직관적**: 현재 어느 박자인지 한눈에 파악
2. **시각적 흐름**: 박자가 흘러가는 느낌
3. **첫 박자 강조**: 첫 박자를 쉽게 인식
4. **세련된 디자인**: 사이버펑크 스타일로 현대적
5. **박자 변경 대응**: 박자가 바뀌면 점의 개수도 자동 변경

### 🎯 사용 시나리오
- **밴드 연습**: 모든 멤버가 같은 박자를 보며 연주
- **리듬 학습**: 박자감 훈련
- **녹음**: 정확한 타이밍 유지

## 테스트 방법

### 1. 프론트엔드 재시작
```bash
cd d:\pjt\mrp_front
npm run serve
```

### 2. 메트로놈 세션 접속
1. 세션 생성 또는 참가
2. 메트로놈 시작
3. 점들이 순차적으로 빛나는지 확인

### 3. 박자 변경 테스트
1. 호스트: 박자 변경 (4/4 → 3/4)
2. 점의 개수가 4개 → 3개로 변경되는지 확인

### 4. 첫 박자 확인
- 첫 번째 점이 녹색으로 빛나는지 확인
- 나머지 점들은 청록색으로 빛나는지 확인

## 브라우저 호환성

### 지원 브라우저
- ✅ Chrome/Edge (최신)
- ✅ Firefox (최신)
- ✅ Safari (최신)
- ✅ 모바일 브라우저 (iOS/Android)

### CSS 기능
- Flexbox
- CSS Gradients
- CSS Animations
- Box Shadow (multiple layers)
- Transform & Scale

## 향후 개선 가능 사항

### 1. 커스터마이징
- 사용자가 색상 선택 가능
- 점 크기 조절
- 애니메이션 속도 조절

### 2. 추가 효과
- 사운드와 동기화된 파형 표시
- 잔상 효과 (이전 박자 희미하게 표시)
- 리듬 패턴 시각화

### 3. 접근성
- 색맹 모드 (색상 대신 크기/모양으로 구분)
- 고대비 모드
- 화면 읽기 프로그램 지원

## 파일 변경 이력

### 수정된 파일
- `d:\pjt\mrp_front\src\views\MetronomeSession.vue`

### 변경 사항
1. HTML 템플릿: `.metronome-visual` → `.metronome-visual-flow`
2. CSS: 원형 스타일 제거, 흐르는 점 스타일 추가
3. 반응형: 모바일 크기 조정

### 삭제된 코드
- `.metronome-circle` 관련 CSS
- `.beat-indicator` 관련 CSS

### 추가된 코드
- `.metronome-visual-flow` CSS
- `.beat-dot` CSS
- `@keyframes pulse` 애니메이션
