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
- root는 `h-dvh min-h-screen overflow-hidden bg-background text-foreground`이다.
- 상단 진행 헤더와 하단 CTA는 고정 영역으로 유지한다.
- 중앙 콘텐츠만 스크롤된다.
- 주요 CTA는 `Button`과 `StickyActionBar`를 사용한다.
- 나가기 확인은 `AlertDialog`를 사용한다. 취소는 `계속 학습`, 확인은 `나가기`이며 확인 action은 `default`(charcoal) variant를 쓴다.
- 완료 화면은 `action-selected-*` token 기반 fullscreen overlay를 사용한다.
- markdown 본문은 앱의 `ReactMarkdown` 결과를 `RichText`로 감싼다.
- 선택형 UI는 `ChoiceCard`의 `data-state`를 사용해 `idle`, `selected`, `correct`, `wrong`, `disabled` 상태를 표현한다.
- 완료 화면은 레슨 요약이 있으면 `이번 레슨 핵심 요약` 목록을 표시한다.
- 레슨 요약이 없으면 완료 화면의 핵심 요약 영역을 표시하지 않는다.
- 레슨 화면 구현은 시작, 진행, 완료 화면 파일을 분리하고, 다음 레슨 탐색은 `lesson-next-course-lesson.ts` selector가 담당한다.
- 같은 `/app/lesson` 경로에서 `lesson_id`만 바뀌는 soft navigation은 `LessonExperience`가 `lesson.id`로 세션을 remount해 이전 레슨의 완료 상태를 이어받지 않는다.
- 완료 화면의 다음 레슨 행동은 다음 레슨 시작 화면(또는 저장된 진행이 있으면 해당 스텝)으로 이동한다.
- 구간 선택 스텝의 `inline` layout은 문장 흐름 안에서 구간 선택 버튼을 이어 배치한다.
- 구간 선택 스텝의 `block` layout은 각 구간을 독립된 행 또는 블록 선택지로 배치한다.
- 순서 스텝은 항목 목록, 드래그 핸들, 위/아래 이동 행동을 제공한다.
- 순서 스텝의 드래그 핸들과 위/아래 이동 행동은 항목 이름과 위치를 이해할 수 있는 한국어 접근성 이름을 제공한다.
- 쓰기 스텝은 제목 또는 프롬프트, 보조 라벨, 대상 주장, 안내, 참고 원문, 구조 가이드, 입력 영역, 글자 수 기준, 드래프트 저장 보조 행동, 참조 답안 영역을 조건부로 표시한다.
- 쓰기 스텝의 `counter` 모드는 반박 쓰기 라벨과 대상 주장 맥락을 제공한다.
- 쓰기 스텝의 `self-rebut` 모드는 자기반박 라벨과 내 주장 맥락을 제공한다.
- 쓰기 스텝의 참조 답안은 답변 확인 뒤 표시할 수 있다.

## 상태

- `lesson_id` 없음
- 레슨 조회 실패
- 시작 전
- 시작 저장 중
- step 진행 중
- 답변 저장 실패
- 순서 스텝 재정렬 중
- 쓰기 답변 작성 중
- 쓰기 드래프트 저장 피드백
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
- 순서 스텝의 위/아래 이동 행동은 키보드로 실행 가능해야 한다.
- 오류는 한국어로 화면에 표시한다.
