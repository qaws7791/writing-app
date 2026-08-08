# SCR-006 레슨 진행

## 구현 탐색

현재 route는 [학습자 앱 route source](../../../apps/web/src/app)에서 확인한다.

## 목적

학습자가 한 레슨을 시작하고 step 기반 학습을 완료한다.

## 주요 사용자

- 레슨을 진행하는 학습자

## 정보 구조

- 레슨 시작 화면(시작 전)
- 레슨 진행 헤더
- 중앙 레슨 콘텐츠
- 하단 주요 행동
- 나가기 확인 dialog
- 완료 화면

## UI 기준

- `AppShell`을 사용하지 않는 몰입형 전체 화면이다.
- root는 `h-dvh min-h-screen overflow-hidden bg-background text-foreground`이다.
- 상단 헤더·본문·하단 CTA는 동일 콘텐츠 열(`max-w-2xl`)과 동일 수평 패딩을 쓴다.
- 상단 진행 헤더와 하단 CTA는 고정 영역으로 유지한다.
- 중앙 콘텐츠만 스크롤된다.
- 몰입형 구조는 공유 `Lesson`, `LessonHeader`, `LessonBody`, `LessonFooter`를 사용한다.
- 주요 CTA는 `LessonActions` 안의 `Button`을 사용한다.
- 시작 전 화면은 학습 가능한 레슨(스텝 ≥ 1)만 표시한다. 레슨 없음·스텝 없음은 시작 화면이 아니라 조회 실패(route notice)로 끝난다. 빈 스텝은 `lesson-not-found`와 동일하게 취급한다.
- 시작 화면에는 `canStart`·시작 불가 disabled·불가 이유 UI가 없다. CTA 비활성은 시작 요청 중뿐이며, 카피는 `시작하는 중…`(또는 동등)과 busy 표시를 쓴다.
- 시작 화면은 제목, 카테고리(있을 때), 설명(있을 때), 활동 수 메타를 표시한다. 예상 시간(분)은 표시하지 않는다.
- 카테고리는 한국어 eyebrow로 두고 Latin `uppercase`·과도한 letter-spacing을 쓰지 않는다.
- 활동 수는 인라인 메타 행으로 표시하고, 이모지 대신 제품 아이콘을 쓴다.
- 나가기는 X 아이콘만 사용하며 최소 터치 목표를 만족하는 hit area와 `aria-label="나가기"`를 제공한다.
- 시작 화면 콘텐츠 영역은 제목 `h1`과 `aria-labelledby`로 연결한다.
- 나가기 확인은 `AlertDialog`를 사용한다. 취소는 `계속 학습`, 확인은 `나가기`이며 확인 action은 `default`(charcoal) variant를 쓴다.
- 완료 화면은 semantic `background` 위에 `LessonComplete` anatomy를 사용한다.
- markdown 본문은 앱의 `ReactMarkdown` 결과를 `ProseBody`로 감싼다.
- 선택형 UI는 `Choice`의 `data-state`를 사용해 `idle`, `selected`, `correct`, `incorrect`, `missed`, `locked` 상태를 표현한다.
- 완료 화면은 레슨 요약이 있으면 `이번 레슨 요약` 목록을 표시한다.
- 레슨 요약이 없으면 완료 화면의 핵심 요약 영역을 표시하지 않는다.
- 레슨 화면 구현은 시작, 진행, 완료 화면 파일을 분리하고, 다음 레슨 탐색은 `lesson-next-course-lesson.ts` selector가 담당한다.
- 같은 `/app/lesson` 경로에서 `lesson_id`만 바뀌는 soft navigation은 `LessonExperience`가 `lesson.id`로 세션을 remount해 이전 레슨의 완료 상태를 이어받지 않는다.
- 완료 화면의 다음 레슨 행동은 다음 레슨 시작 화면(또는 저장된 진행이 있으면 해당 스텝)으로 이동한다.
- 구간 선택 스텝의 `inline` layout은 문장 흐름 안에서 구간 선택 버튼을 이어 배치한다.
- 구간 선택 스텝의 `block` layout은 각 구간을 독립된 행 또는 블록 선택지로 배치한다.
- 순서 스텝은 `Sortable` 항목 목록과 드래그 핸들을 제공한다.
- 순서 스텝의 드래그 핸들은 pointer와 keyboard 입력을 모두 지원한다.
- 순서 스텝의 드래그 핸들은 항목 이름과 현재 위치를 이해할 수 있는 한국어 접근성 이름과 이동 안내를 제공한다.
- 쓰기 스텝은 제목 또는 프롬프트, 보조 라벨, 대상 주장, 안내, 참고 원문, 구조 가이드, 입력 영역, 글자 수 기준, 드래프트 저장 보조 행동, 참조 답안 영역을 조건부로 표시한다.
- 쓰기 스텝의 구조 가이드는 CommonMark 목록과 강조를 의미 있는 HTML 요소로 표시하고, Markdown 목록이 아닌 일반 여러 줄 텍스트의 줄바꿈도 보존한다.
- 쓰기 스텝의 `counter` 모드는 반박 쓰기 라벨과 대상 주장 맥락을 제공한다.
- 쓰기 스텝의 `self-rebut` 모드는 자기반박 라벨과 내 주장 맥락을 제공한다.
- 쓰기 스텝의 참조 답안은 답변 확인 뒤 표시할 수 있다.
- AI 코칭 스텝은 요청 전, 요청 중, 성공, 재시도 가능 실패, 일일 한도, 스텝당 3회 한도 상태를 구분해 표시한다. 일일 한도 응답에 재시도 시각이 있으면 서울 시간으로 안내한다.
- 학습 스텝은 `READING`의 `Prose`, `COMPARE`의 `Compare`, `MULTIPLE_CHOICE`의 `Choice`, `FILL_BLANK`의 `Token`, `SELECT`의 `Segment`, `ORDER`의 `Sortable`, `MATCH`의 `Pair`, `CATEGORIZE`의 `Classify`, `WRITE`의 `Compose`, `AI_FEEDBACK`의 `Coaching` 조합을 사용한다.
- AI 코칭 생성에 실패하거나 한도를 초과해도 `피드백 없이 계속하기`를 제공한다. 이 행동은 서버가 학습 전이를 확정한 뒤에만 하단 `다음으로` 행동을 활성화한다.
- 채점 가능 스텝(퀴즈)에서 오답인 경우 '계속하기'를 누르면 다음 스텝으로 넘어가지 않고, 정오답 피드백 바가 닫히며 사용자가 다시 답을 입력하고 재채점("확인하기")할 수 있는 상태로 돌아간다. 정답인 경우에만 다음 스텝으로 진행한다.
- 정오답, 해설, 다음 스텝과 완료 화면은 서버 evaluation과 transition 결과로만 표시한다. 클라이언트는 표시 문자열이나 배열 위치로 정답을 추론하지 않는다.

## 상태

- `lesson_id` 없음
- 레슨 조회 실패(레슨 없음·빈 스텝 포함, `lesson-not-found`)
- 시작 전(학습 가능 레슨만)
- 시작 요청 중
- step 편집 중
- draft 저장 중·저장 완료·오프라인·version 충돌
- 답안 확인 중
- 서버가 확정한 다음 step으로 이동 중
- 복구 가능한 네트워크·version 충돌 오류
- 답변 저장 실패
- 순서 스텝 재정렬 중
- 쓰기 답변 작성 중
- 쓰기 드래프트 저장 피드백
- AI 코칭 요청 중·성공
- AI 코칭 재시도 가능 실패·일일 한도·스텝당 3회 한도
- AI 코칭 없이 진행 저장 중·저장 실패
- 정답 피드백
- 오답 피드백
- 완료 저장 중
- 완료 저장 실패
- 완료
- 나가기 확인

## 접근성

- 진행률은 `role="progressbar"`와 ARIA 값을 제공한다.
- 콘텐츠 영역은 시작 화면에서 제목과 `aria-labelledby`로 연결하고, 그 외에는 `aria-label="레슨 콘텐츠"`를 사용한다.
- 행동 영역은 `aria-label="레슨 행동"`을 사용한다.
- 나가기 버튼은 `aria-label="나가기"`를 제공한다.
- 순서 스텝은 드래그 핸들에서 Space 또는 Enter로 항목을 들고 방향키로 이동한 뒤 Space 또는 Enter로 놓을 수 있어야 한다.
- 오류는 한국어로 화면에 표시한다.
