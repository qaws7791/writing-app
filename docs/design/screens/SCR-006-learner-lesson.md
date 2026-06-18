# SCR-006 레슨 진행

## 라우트

- `apps/web`: `/app/lesson?lesson_id=...`

## 목적

학습자가 한 레슨을 시작하고 step 기반 학습을 완료한다.

## 주요 사용자

- 레슨을 진행하는 학습자

## 정보 구조

- 레슨 진행 헤더
- 중앙 레슨 콘텐츠
- 하단 주요 행동
- 나가기 확인 dialog
- 완료 화면

## UI 기준

- `AppShell`을 사용하지 않는 몰입형 전체 화면이다.
- root는 `h-dvh min-h-screen overflow-hidden bg-cream text-charcoal`이다.
- 상단 진행 헤더와 하단 CTA는 고정 영역으로 유지한다.
- 중앙 콘텐츠만 스크롤된다.
- 주요 CTA는 `LessonPrimaryButton`을 사용한다.
- 완료 화면은 `bg-primary` fullscreen overlay를 사용한다.

## 상태

- `lesson_id` 없음
- 레슨 조회 실패
- 시작 전
- 시작 저장 중
- step 진행 중
- 답변 저장 실패
- 정답 피드백
- 오답 피드백
- 완료 저장 중
- 완료 저장 실패
- 완료
- 나가기 확인

## 접근성

- 진행률은 `role="progressbar"`와 ARIA 값을 제공한다.
- 콘텐츠 영역은 `aria-label="레슨 콘텐츠"`를 사용한다.
- 행동 영역은 `aria-label="레슨 행동"`을 사용한다.
- 나가기 버튼은 `aria-label="나가기"`를 제공한다.
- 오류는 한국어로 화면에 표시한다.
