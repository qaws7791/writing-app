# Luma Learning Experience

이 문서는 `path`, `lesson`, `step`과 학습 도메인 컴포넌트를 설계하거나 변경할 때 `DESIGN.md`, `design/COMPONENTS.md`와 함께 읽는다.

학습 UI는 스텝 단위로 명확하게 진행하되 게임화의 장난스러움이나 보상 연출을 기본 언어로 쓰지 않는다. 사고와 문장을 다루는 학습에서는 콘텐츠, 질문과 피드백이 전경이고 인터페이스는 집중을 돕는 프레임이다. 진행감은 XP나 축하 효과가 아니라 현재 상태, 남은 맥락과 다음 행동으로 만든다.

## 1. Learning Hierarchy

학습 구조는 `코스 → 유닛 → 레슨 → 스텝`의 계층을 지킨다.

| 계층 | 역할                             | 기본 표면            |
| ---- | -------------------------------- | -------------------- |
| 코스 | 하나의 학습 주제와 전체 여정     | `path`               |
| 유닛 | 관련 레슨을 묶는 구간            | `PathUnit`           |
| 레슨 | 한 번에 진행하는 학습 세션       | `lesson`             |
| 스텝 | 사용자가 완료하는 가장 작은 활동 | `step` + 도메인 표면 |

- 코스와 유닛은 위치와 잠금 관계를 설명하고 레슨은 시작부터 완료까지의 세션을 책임진다.
- 레슨 완료 요약은 별도의 가짜 활동 스텝이 아니라 레슨 자체의 완료 상태로 보여 준다.
- 한 화면의 Primary 행동은 원칙적으로 하나다. 확인, 제출, 코칭 요청과 계속하기가 동시에 경쟁하지 않게 한다.
- 경로는 학습 순서를 안내하되 사용 가능한 범위와 잠긴 이유를 숨기지 않는다.

## 2. Component Composition

스텝 타입마다 독립된 대형 컴포넌트를 만들지 않는다. 공용 프레임과 도메인 표면을 조합해 행동과 상태 계약을 공유한다.

| 부품               | 역할                                                |
| ------------------ | --------------------------------------------------- |
| `path`             | 코스·유닛·레슨 경로와 노드 상태                     |
| `lesson`           | 진행률, 닫기, 하단 행동과 완료를 포함한 세션 chrome |
| `step`             | 제목, 본문과 행동을 정렬하는 활동 프레임            |
| `insight`          | 해설, 생각해 보기와 정오답 안내                     |
| `choice`           | 선택지와 채점 상태                                  |
| `verdict`          | 참·거짓 판정의 O·X 버튼                             |
| `token`            | 빈칸 슬롯과 단어 칩                                 |
| `segment`          | 문장·단락 구간 선택                                 |
| `sortable`         | 순서 재정렬                                         |
| `pair`             | 좌·우 짝 맞추기                                     |
| `classify`         | 카테고리 배치                                       |
| `prose`            | 읽기 본문, 삽화와 출처                              |
| `compare`          | 버전 비교                                           |
| `cadence`          | 최근 학습 리듬과 연속성                             |
| `goal`             | 오늘·이번 주 목표와 남은 작업                       |
| `mastery`          | 개념 숙련도 단계                                    |
| `milestone`        | 희소한 이정표와 완료 기록                           |
| `standing`         | 코호트 안에서의 상대 위치                           |
| `learning-profile` | 학습 목적·수준·장르·시간·피드백 선호 수집           |
| `next-action`      | 다음에 이어갈 활동 하나와 추천 이유·예상 시간       |
| `course-overview`  | 코스 목표·수준·기간·선수 개념·장르·샘플 활동        |
| `checkpoint`       | 유닛 경계 종합 평가와 다음 준비 여부                |
| `practice-queue`   | 복습·오답·취약 개념 기반 연습 추천                  |
| `mistake-journal`  | 오류 패턴별 오답 묶음과 재도전                      |
| `hint-ladder`      | 관찰→방향→예시 순의 점진적 힌트                     |
| `writing-brief`    | 쓰기 과제 브리프와 제출 조건                        |
| `source-pack`      | 인용 가능한 읽기·통계·발췌 자료                     |
| `outline`          | 개요 블록 작성과 재정렬                             |
| `argument-map`     | 주장·근거·반론·재반박 관계 점검                     |
| `draft`            | 장문 편집·저장·오프라인·제출 상태                   |
| `text-annotation`  | 원문 범위 첨삭과 수락·거절·해결                     |
| `rubric`           | 평가 기준·단계·가중치·판정                          |
| `feedback-summary` | 첨삭 우선순위와 이번 수정 할 일                     |
| `revision-history` | 초고·수정본·최종본 이력                             |
| `submission`       | 제출 상태와 기한                                    |
| `reflection`       | 변경·난점·다음 목표 성찰                            |
| `skill-map`        | 영역별 숙련·선수·다음 초점                          |
| `portfolio`        | 완성 글·피드백·공개 범위                            |

| 타입                 | 조합                                        |
| -------------------- | ------------------------------------------- |
| `READING`            | `step` + `prose`                            |
| `COMPARE`            | `step` + `compare` + `insight`              |
| `MULTIPLE_CHOICE`    | `step` + `choice` + `insight`               |
| `TRUE_FALSE`         | `step` + `verdict` + `insight`              |
| `FILL_BLANK`         | `step` + `token` + `insight`                |
| `SELECT`             | `step` + `segment` + `insight`              |
| `ORDER`              | `step` + `sortable` + `insight`             |
| `MATCH`              | `step` + `pair` + `insight`                 |
| `CATEGORIZE`         | `step` + `classify` + `insight`             |
| `SENTENCE_BUILD`     | `step` + `token` + `insight`                |
| `TRANSCRIBE`         | `step` + `compose` + `insight`              |
| `ERROR_CORRECT`      | `step` + `segment` + `choice` + `insight`   |
| `PARAGRAPH_ORGANIZE` | `step` + `segment` + `sortable` + `insight` |

읽기 본문을 카드로 다시 감싸지 않는다. `prose`는 캔버스의 주 콘텐츠로 직접 놓고 선택하거나 조작하는 영역만 표면 밀도와 경계로 구분한다. 새 타입은 기존 부품 조합으로 표현할 수 있는지 먼저 검토한다. 제목 아래에 사용법 문구를 두지 않는다. 클릭 가능한 타일과 칩은 작은 elevation으로 조작 가능함을 드러낸다.

## 3. Selection, Grading & Feedback

- 기본 상태는 `idle`, `selected` 또는 `active`, `correct`, `incorrect`, `missed`, `locked`다.
- 확인 전에는 사용자의 선택만 `info` 톤으로 강조하고 정답을 시각적으로 암시하지 않는다. 확인 전 `success`는 쓰지 않는다.
- `CATEGORIZE`와 `MATCH`의 병렬 항목은 `series-*`와 점·라벨로 정체를 구분한다. 정체 색은 평가 색과 겹치지 않는다.
- 정오답과 해설은 서버 채점 결과로만 표시한다. 화면 위치나 문구가 같아도 안정적인 ID로 판정한다.
- 확인 후에는 재정렬과 재선택을 잠근다. 오답이면 다시 풀 수 있고 정답일 때만 다음 스텝으로 진행한다.
- 정답은 큰 초록 면 대신 전경 농도, 가는 경계, 아이콘과 짧은 문구로 구분한다. 오답도 넓은 destructive 면을 사용하지 않는다.
- 텍스트, 아이콘, semantic과 접근성 속성 없이 색만으로 정오답을 전달하지 않는다.
- 해설은 판정과 다음 행동을 설명하며 정답만 반복하거나 사용자를 평가하는 어조를 쓰지 않는다.

## 4. Writing & AI Coaching

- 짧은 답은 `compose`, 장문은 `draft`다.
- AI 첨삭 전 단계는 `hint-ladder`, 결과 적용은 `text-annotation`·`feedback-summary`다.
- 채점과 첨삭의 loading은 현재 작업을 보존하는 조용한 대기 상태로 표현한다.

AI 생성 결과와 source를 다루는 경우 `design/AI_AND_RISK.md`도 적용한다.

## 5. Path & Lesson Session

- 경로 노드는 `locked`, `available`, `current`, `completed`로만 진행 상태를 말한다.
- 현재 레슨은 하나만 강조하고 완료와 잠금은 색 외의 표식과 접근 가능한 이름을 함께 제공한다.
- 레슨 진행률은 가늘고 조용한 바로 제공하며 현재 위치와 전체 스텝 수를 보조 기술에도 전달한다.
- 하단 대표 행동은 필요한 경우 sticky로 유지하되 본문을 가리거나 콘텐츠보다 강한 무게를 갖지 않게 한다.
- 세션 이탈은 입력을 보존할 수 있을 때 완료한다. 저장, 동기화, 오프라인, version과 conflict는 레슨에 표시하지 않는다. 복원 가능한 진행은 새로고침과 재방문 뒤에도 유지한다.
- 폭죽, 스트릭, 캐릭터와 promo chip으로 동기부여를 대신하지 않는다.

## 6. Motivation Surfaces

동기부여 UI는 게이미피케이션의 외형을 복제하지 않고, 습관·목표·숙련·이정표·상대 위치가 만드는 사용자 문제를 Luma 언어로 번역한다. 레퍼런스 조사는 `design/REFERENCES.md`를 따른다.

| 사용자 문제                        | 가져올 원리                                    | 가져오지 않을 표현                     | Luma 표면   |
| ---------------------------------- | ---------------------------------------------- | -------------------------------------- | ----------- |
| 최근 학습이 끊기지 않았는가        | 연습 이력을 보이게 하고 다음 행동을 남긴다     | 불꽃 스트릭, 깨짐 연출, 손실 회피 극장 | `cadence`   |
| 오늘·이번 주 목표가 무엇인가       | 남은 작업량과 달성 조건을 분명하게 한다        | XP 링, 젬·재화, 가변 보상              | `goal`      |
| 이 개념을 얼마나 다루는가          | 이산적인 숙련 단계와 다음 연습 초점을 드러낸다 | 레벨 폭죽, 점수 파밍, 왕관             | `mastery`   |
| 의미 있는 완료가 있었는가          | 희소한 이정표를 날짜·맥락과 함께 기록한다      | 배지 벽, 수집형 achievement grid       | `milestone` |
| 비슷한 학습자 사이에 어디에 있는가 | 코호트 안 상대 위치를 조용히 보여 준다         | 주간 리그, 승급 연출, 경쟁 HUD         | `standing`  |

- 동기 표면은 홈·프로필·레슨 완료 요약처럼 세션 바깥 맥락에 두고, 활동 본문과 채점 피드백보다 앞서지 않는다.
- `cadence`는 연속 일수를 위협으로 쓰지 않는다. `practiced`, `rest`, `today`, `upcoming`으로 이력을 설명하고 다음 행동을 남긴다.
- `goal`은 점수 대신 레슨·분·세션처럼 실제 작업 단위로 남은 양을 말한다.
- `mastery`는 `emerging` → `developing` → `secure` → `fluent`처럼 의미 있는 단계만 쓰고, 색만으로 단계를 구분하지 않는다.
- `milestone`은 드물게 등장한다. 경로 진행과 다음 할 일을 대체하지 않는다.
- `standing`은 순위를 보여 주되 조롱이나 처벌을 암시하지 않는다. 지표는 학습량보다 완료한 작업으로 읽히게 한다.
- Hearts·lives·가상 재화·마스코트 리액션은 학습 동기 표면으로 추가하지 않는다.

## 7. Orientation & Diagnosis Surfaces

진단·개인화·코스 선택 표면은 레슨 활동과 Path 노드를 대체하지 않는다. 온보딩·홈·코스 상세처럼 세션 바깥에서 학습자가 다음에 무엇을 할지 결정하도록 돕는다.

| 사용자 문제                    | 가져올 원리                                     | 가져오지 않을 표현             | Luma 표면          |
| ------------------------------ | ----------------------------------------------- | ------------------------------ | ------------------ |
| 나에게 맞는 출발점이 무엇인가  | 목적·수준·관심·시간·피드백 선호를 짧게 수집한다 | 긴 심리 검사, 레벨 테스트 극장 | `learning-profile` |
| 지금 이어서 무엇을 해야 하는가 | 다음 활동 하나와 이유·예상 시간을 제시한다      | 추천 카드 더미, 피드형 목록    | `next-action`      |
| 이 코스가 나와 맞는가          | 목표·수준·기간·선수 개념·장르·샘플을 보여 준다  | 마케팅 히어로, 통계 대시보드   | `course-overview`  |

- `learning-profile`은 Goal의 일일 목표와 다르다. 장기 선호와 출발 조건을 수집하고, 설정 화면에서는 요약 읽기로도 쓴다.
- `next-action`은 Path의 전체 지도나 Goal의 진행률이 아니라 Primary 행동 하나를 좁힌다. 추천 이유는 개인화 근거를 숨기지 않는다.
- `course-overview`는 Path 노드 목록을 복제하지 않는다. 코스 선택·미리보기에 필요한 맥락만 제공한다.
- 진단 결과나 추천이 AI·규칙 기반이면 근거 범위를 드러내고, 학습자가 선택을 바꿀 수 있게 한다.

## 8. Review, Writing Studio & Growth Surfaces

장문 글쓰기·평가·복습 표면은 `compose`를 대체하지 않고 확장한다. 짧은 답은 `compose`, 장문은 `draft`다. AI 첨삭 전 단계는 `hint-ladder`, 결과 적용은 `text-annotation`·`feedback-summary`다.

| 사용자 문제                 | Luma 표면                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| 유닛을 넘길 준비가 됐는가   | `checkpoint`                                                                               |
| 무엇을 복습해야 하는가      | `practice-queue`, `mistake-journal`                                                        |
| 힌트를 답처럼 주지 않으려면 | `hint-ladder`                                                                              |
| 장문 과제 조건이 무엇인가   | `writing-brief`, `source-pack`, `outline`, `argument-map`                                  |
| 초고를 쓰고 고치려면        | `draft`, `text-annotation`, `rubric`, `feedback-summary`, `revision-history`, `submission` |
| 학습을 돌아보고 쌓으려면    | `reflection`, `skill-map`, `portfolio`                                                     |

관리자·운영 표면(`admin-overview`, `curriculum-*`, `lesson-builder`, `item-bank`, `publish-workflow`, `provenance-panel`, `audit-log` 등)은 학습자 세션 chrome과 분리하고, AI·게시·권한 변경에는 `design/AI_AND_RISK.md`를 적용한다.

## 9. Anti-patterns

- 마스코트, 폭죽, 스트릭 불꽃, 과도한 bounce와 원색 정답 폭발을 기본 피드백으로 사용하지 않는다.
- 스텝 타입마다 전용 theme color나 별도의 card skin을 만들지 않는다.
- `READING` 본문을 카드 더미 안에 가두지 않는다.
- 채점 전에 정답을 암시하거나 클라이언트가 만든 가짜 해설로 서버 피드백을 대체하지 않는다.
- 진행감을 XP와 badge 나열로 대신하지 않는다. 경로 상태, 레슨 진행률, `cadence`·`goal`·`mastery`와 다음 할 일로 전달한다.
- 오답을 lives로 처벌하거나 결제 유도용 하트 고갈을 학습 규칙처럼 쓰지 않는다.
- 홈에 추천 카드·통계·동기 표면을 동시에 경쟁시키지 않는다. `next-action` 하나를 Primary로 둔다.
- `course-overview`를 Path 대신 쓰지 않는다.
- `compose`와 `draft`를 혼용하지 않는다. 힌트 사다리를 한 번에 펼쳐 답을 노출하지 않는다.
- 관리자 화면에 통계 카드 벽을 기본값으로 두지 않는다. 조치 큐(`admin-overview`, `intervention-queue`)를 우선한다.
