# 레슨 런타임과 스텝 편집 계약

## 작업 상태

- 2026-07-17: 학습자 레슨을 서버 권위 상태 전이 계약으로 전환하고 공유 lesson runtime과 별도 어드민 QA 제품 화면을 제거했다.

## 경계

- `@workspace/contracts/learning`은 공개 레슨, stable item ID 제출, 서버 평가와 학습 상태 전이 계약을 소유한다.
- `packages/core`는 채점, 순서, 잠금, 진도, 레슨·코스 완료와 AI 피드백 전이를 소유한다.
- `apps/web/src/features/lessons`는 입력 중 상태, 세션 event, 화면 전환과 시각 컴포넌트 조립만 소유한다.
- `packages/ui/src/components/lesson`은 API 계약과 채점 규칙을 import하지 않는 순수 props 기반 시각 컴포넌트만 제공한다.
- `apps/admin` 코스 편집기는 내부 콘텐츠 계약을 검증하고 10개 스텝 편집 폼과 학습자 미리보기를 제공한다.

## 학습자 동작

- 레슨 시작은 `startLesson`, 일반 단계 제출은 `completeStep`, AI 코칭은 step-scoped AI feedback 요청으로 수행한다.
- 웹은 서버의 `retry`, `advanced`, `lesson_completed` 결과와 `learning.currentStepId`를 그대로 소비한다.
- 정답, 해설, 진도율, 다음 레슨과 완료 여부를 프론트엔드에서 다시 계산하지 않는다.
- 코스의 다음 레슨과 잠금 상태는 active 유닛의 `sortOrder`, 그 안의 active 레슨 `sortOrder` 순으로 서버가 계산한다.
- 코스와 진행 목록은 `{ items, nextCursor }`를 사용하며 다음 cursor가 있을 때만 추가 로딩을 제공한다.

## 검증

- 10개 공개 step schema가 제출 전에 solution을 노출하지 않는지 계약 테스트로 확인한다.
- stable ID 제출과 타입별 평가, 오답 재시도, 원자적 전이와 동시성은 core 테스트로 확인한다.
- 레슨 세션이 서버 전이 결과만으로 이동하는지 web 테스트로 확인한다.
- step 시각 상태는 Storybook fixture로, 어드민 편집 union은 editor 테스트로 확인한다.
