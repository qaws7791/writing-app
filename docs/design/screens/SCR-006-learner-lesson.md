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
- root는 `fixed inset-0 h-dvh overflow-hidden bg-background text-foreground`이다.
- 상단 헤더·본문·하단 CTA는 동일 콘텐츠 열(`max-w-2xl`)과 동일 수평 패딩을 쓴다.
- 나가기 아이콘 글리프는 본문 왼쪽 엣지에 광학 정렬한다. hit area는 40×40 CSS px이다.
- 진행 헤더의 나가기·진행 막대·단계 수는 같은 행 높이에서 세로 중앙을 맞춘다.
- 하단 CTA는 상단 구분선 없이 본문과 이어지며 모바일 safe area inset을 반영한다.
- 완료 화면도 동일 `max-w-2xl` 열 폭을 유지한다.
- 상단 진행 헤더와 하단 CTA는 고정 영역으로 유지한다.
- 중앙 콘텐츠만 스크롤된다.
- 몰입형 구조는 공유 `Lesson`, `LessonHeader`, `LessonBody`, `LessonFooter`를 사용한다.
- 주요 CTA는 `LessonActions` 안의 `Button`을 사용한다.
- 시작 전 화면은 학습 가능한 레슨(스텝 ≥ 1)만 표시한다. 레슨 없음·스텝 없음은 시작 화면이 아니라 조회 실패(route notice)로 끝난다. 빈 스텝은 `lesson-not-found`와 동일하게 취급한다.
- 시작 화면에는 `canStart`·시작 불가 disabled·불가 이유 UI가 없다. CTA 비활성은 시작 요청 중뿐이며, 카피는 `시작하는 중…`(또는 동등)과 busy 표시를 쓴다.
- 시작 화면은 제목, 카테고리(있을 때), 설명(있을 때), 활동 수 메타와 활동 종류 목록을 표시한다. 예상 시간(분)은 표시하지 않는다.
- 시작 화면 설명은 Body 16/26 `foreground`로 둔다. `muted-foreground`는 활동 수 같은 메타에만 쓴다.
- 시작 화면 본문 블록은 콘텐츠 열 전체 폭을 쓰고 좌측 정렬을 유지한다. 제목은 열 폭에서 줄바꿈한다.
- 카테고리는 한국어 eyebrow로 두고 Latin `uppercase`·과도한 letter-spacing을 쓰지 않는다.
- 활동 수는 인라인 메타 행으로 표시하고, 이모지 대신 제품 아이콘을 쓴다.
- 나가기는 X 아이콘만 사용하며 40×40 CSS px hit area와 `aria-label="나가기"`를 제공한다.
- 시작 화면 콘텐츠 영역은 제목 `h1`과 `aria-labelledby`로 연결한다.
- 나가기 확인은 `AlertDialog`를 사용한다. 취소는 `계속 학습`, 확인은 `나가기`이며 확인 action은 `default`(charcoal) variant를 쓴다. 레슨은 입력을 보존할 수 있을 때만 코스로 이동한다.
- 완료 화면은 semantic `background` 위에 `LessonComplete` anatomy를 사용한다.
- markdown 본문은 앱의 `ReactMarkdown` 결과를 `ProseBody`로 감싼다.
- 선택형 UI는 `Choice`와 `Verdict`의 `data-state`를 사용해 `idle`, `selected`, `correct`, `incorrect`, `missed`, `locked` 상태를 표현한다. `TRUE_FALSE`는 `missed`를 쓰지 않는다.
- 확인 전 선택은 `info` 톤온톤으로 표시한다. 대기 상태의 O·X에 정답·오답 색을 입히지 않는다.
- `CATEGORIZE` 바구니 헤더는 `series-*`와 점으로 구분한다. 채점 후에도 헤더 정체 색은 유지한다.
- `MATCH` 짝은 점과 연결선에 `series-*`를 쓴다. 채점 후 카드는 정오답, 점과 선은 짝 정체를 유지한다.
- `ERROR_CORRECT`의 오류 구간 선택은 `warning` 톤으로 표시한다.
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
- 분류 스텝은 남은 항목 쟁반과 카테고리 바구니를 제공한다.
- 분류 스텝은 항목을 고른 뒤 바구니를 누르는 클릭-클릭과, 항목을 바구니로 끌어다 놓는 드래그를 모두 지원한다.
- 학습 스텝은 `READING`의 `Prose`, `COMPARE`의 `Compare`, `MULTIPLE_CHOICE`의 `Choice`, `TRUE_FALSE`의 `Verdict`, `FILL_BLANK`·`SENTENCE_BUILD`의 `Token`, `SELECT`·`ERROR_CORRECT`의 `Segment`, `ORDER`·`PARAGRAPH_ORGANIZE`의 `Sortable`, `MATCH`의 `Pair`, `CATEGORIZE`의 `Classify`, `TRANSCRIBE`의 `Compose`, `ERROR_CORRECT`의 `Choice` 조합을 사용한다.
- 제목 아래에 사용법 문구를 두지 않는다. 클릭·터치 가능한 선택 타일·칩·카드는 작은 그림자(`shadow-xs`)로 조작 가능함을 드러낸다.
- `SELECT`의 `inline` 구간은 문장 안에서도 작은 칩 표면으로 누를 수 있음을 드러낸다.
- `CATEGORIZE`는 제목 아래에 사용법 문구를 두지 않는다. 남은 항목 쟁반과 바구니 헤더가 담을 곳을 드러낸다.
- 참거짓 스텝은 본문 주장 아래에 1행 2열 O·X 버튼을 둔다. O는 참, X는 거짓이다. 보이는 텍스트 레이블은 두지 않고 접근 가능한 이름으로 참·거짓을 제공한다.
- 채점 가능 스텝(퀴즈)에서 확인 후 콘텐츠 영역은 항목별 `correct`·`incorrect`·`missed` 상태만 표시한다. 평가 문구와 해설은 하단 `LessonFeedback` 오버레이가 담당한다.
- `LessonFeedback` 배경은 레슨 shell 전체 너비다. 평가 문구와 CTA는 헤더·본문과 같은 `max-w-2xl` 열과 같은 수평 패딩을 쓴다.
- 정답 오버레이는 `success` 톤온톤, 오답 오버레이는 `warning` 톤온톤을 사용한다. 오버레이 CTA는 확인하기 버튼과 같은 하단 슬롯·같은 높이(`h-12`)를 유지한다.
- 정답 오버레이에는 `계속하기` CTA 하나를 둔다. 오답 오버레이에는 왼쪽 `다시 시도` 아이콘 버튼과 오른쪽 `계속하기` CTA를 둔다.
- 오답에서 `다시 시도`는 피드백을 닫고 같은 스텝을 다시 풀 수 있게 한다. 오답에서 `계속하기`는 같은 답안을 `acceptIncorrect: true`로 재제출해 다음 스텝으로 전진한다.
- 정답에서 `계속하기`는 서버가 이미 확정한 `advanced` 또는 `lesson_completed` 전이를 클라이언트에서 이어 받는다.
- 정오답, 해설, 다음 스텝과 완료 화면은 서버 evaluation과 transition 결과로만 표시한다. 클라이언트는 표시 문자열이나 배열 위치로 정답을 추론하지 않는다.
- 저장, 동기화, 오프라인, version과 충돌 상태는 레슨에 표시하지 않는다. 진행 중 문구는 학습자가 실행한 행동을 설명한다.

## 상태

- `lesson_id` 없음
- 레슨 조회 실패(레슨 없음·빈 스텝 포함, `lesson-not-found`)
- 시작 전(학습 가능 레슨만)
- 시작 요청 중
- step 편집 중
- 답안 확인 중
- 서버가 확정한 다음 step으로 이동 중
- 복구 가능한 레슨 진행 오류
- 순서 스텝 재정렬 중
- 정답 피드백
- 오답 피드백
- 완료 확인 중·실패
- 완료
- 나가기 확인
- 입력 보존 불가로 나가기 보류

## 접근성

- 진행률은 `role="progressbar"`와 ARIA 값을 제공한다.
- 콘텐츠 영역은 시작 화면에서 제목과 `aria-labelledby`로 연결하고, 그 외에는 `aria-label="레슨 콘텐츠"`를 사용한다.
- 행동 영역은 `aria-label="레슨 행동"`을 사용한다.
- 나가기 버튼은 `aria-label="나가기"`를 제공한다.
- 순서 스텝은 드래그 핸들에서 Space 또는 Enter로 항목을 들고 방향키로 이동한 뒤 Space 또는 Enter로 놓을 수 있어야 한다.
- 분류 스텝은 항목을 선택한 뒤 바구니 이름을 활성화해 담을 수 있어야 한다. 선택한 항목을 다시 활성화하면 남은 항목으로 돌아간다.
- 오류는 한국어로 화면에 표시한다.
