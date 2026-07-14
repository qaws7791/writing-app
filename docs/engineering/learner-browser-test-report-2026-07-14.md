# 학습자 플랫폼 브라우저 테스트 보고서 (2026-07-14)

## 결론

`apps/web` 학습자 플랫폼을 로컬 개발 환경에서 검증한 결과는 **부분 실패**다.

공개 랜딩, 테스트 로그인, 보호 경로, 학습 홈, 코스 탐색, 코스 상세, 프로필, 테마, 로그아웃, 모바일 내비게이션, 오류 화면과 대부분의 레슨 활동은 정상 동작했다. 그러나 AI 코칭은 직전 쓰기 답변을 찾지 못해 실제 요청을 보내지 못하고 레슨 진행을 차단한다. 이외에 콘텐츠 계약 불일치, 동작하지 않는 랜딩 푸터 링크, Markdown 표시와 접근성 문제가 확인되었다.

발견 문제는 총 6건이다.

- 높음: 1건
- 중간: 3건
- 낮음: 2건

## 실행 환경

| 항목               | 값                                                                      |
| ------------------ | ----------------------------------------------------------------------- |
| 테스트 일자        | 2026-07-14 (Asia/Seoul)                                                 |
| 대상               | `apps/web`, `apps/api`                                                  |
| 웹 URL             | `http://localhost:3000`                                                 |
| API URL            | `http://localhost:4000`                                                 |
| 브라우저           | Codex 인앱 브라우저                                                     |
| 브라우저 엔진 버전 | 확인 필요. 플러그인 API가 버전을 노출하지 않는다.                       |
| Bun                | 1.3.10                                                                  |
| Node.js            | 24.15.0                                                                 |
| Next.js            | 16.2.6                                                                  |
| React              | 19.2.4                                                                  |
| 인증               | `ENABLE_TEST_AUTH=true` 테스트 전용 학습자 로그인                       |
| 데이터베이스       | `data/learner-browser-test-2026-07-14.sqlite` 전용 SQLite               |
| AI 설정            | 로컬 `OPENAI_API_KEY` 구성 여부만 확인하고 값은 읽거나 기록하지 않았다. |

`bun run dev:app:setup`으로 전용 데이터베이스를 migration·seed한 뒤 `bun run dev:app`을 실행했다. 기존 `data/api.sqlite`는 사용하지 않았다.

## 기준과 범위

- 학습자 유저 스토리 `US-LRN-1`~`US-LRN-11`
- 학습자 요구사항 `REQ-LRN-1`~`REQ-LRN-10`
- `docs/design/ia-spec.md`
- `docs/engineering/testing.md`

프로젝트 지침에 따라 Google OAuth 자체는 자동화하지 않고 `ENABLE_TEST_AUTH=true` 로그인 이후의 제품 흐름을 검증했다. Google 로그인 버튼 노출은 확인했지만 외부 OAuth provider 왕복은 미검증이다.

## 기능별 결과

| 영역                | 검증 내용                                                                        | 결과                                 |
| ------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| 공개 랜딩           | 주요 섹션, CTA, 미리보기, 스크롤 진입 후 통계 `120+`, `5,000+`, `98%` count-up   | 통과                                 |
| 랜딩 푸터           | 제품·회사·리소스 12개 링크의 목적지와 클릭 결과                                  | 실패. `BUG-LRN-003`                  |
| 인증                | 보호 경로의 `/login?next=...` 이동, 테스트 로그인, 로그인 후 원래 경로 복귀      | 통과                                 |
| 학습 홈             | 초기 empty state, 진행중·완료 탭, 완료 수·연속 학습일·코스별 진행률 반영         | 통과                                 |
| 데스크톱 내비게이션 | 홈, 배우기, 계정 메뉴, 프로필 메뉴 이동                                          | 통과. 계정 메뉴 이름은 `BUG-LRN-005` |
| 모바일 내비게이션   | 390×844 viewport에서 홈·배우기·프로필 하단 내비게이션과 활성 상태                | 통과                                 |
| 코스 목록           | 검색 debounce와 URL query, 검색 초기화, 카테고리 필터                            | 통과                                 |
| 코스 정렬           | 기본 순·레슨 많은 순 메뉴와 `sort=lessons-desc` 결과                             | 통과. 숨은 입력 노출은 `BUG-LRN-006` |
| 코스 상세           | 진행률, 다음 레슨, 유닛 accordion, 잠금 상태, 레슨 링크                          | 통과                                 |
| 레슨 shell          | 시작 화면, 진행률, 시작 전 즉시 나가기, 진행 중 나가기 확인창과 계속 학습        | 통과                                 |
| 읽기                | Markdown 본문, 강조·목록·인용·구분선, `이해했어요` 진행                          | 통과                                 |
| 매칭                | 미완성 제출 차단, 오답 피드백·재시도·답안 수정, 정답 진행                        | 통과                                 |
| 분류                | 태그 선택 전 항목 비활성화, 전체 분류, 정답 피드백                               | 통과                                 |
| 객관식              | 미선택 제출 차단, 오답 피드백·재시도, 정답 진행                                  | 통과                                 |
| 빈칸 채우기         | 단어 선택·선택 해제 접근성 이름, 전체 답안, 정답 피드백                          | 통과                                 |
| 구간 선택           | 복수 구간 선택과 정답 피드백                                                     | 통과                                 |
| 순서 배열           | 키보드 `ArrowUp` 재정렬, 번호 갱신, 정답 순서와 해설                             | 통과                                 |
| 쓰기                | 최소 글자 수 전후 버튼 상태, 글자 수, 서버 저장, 다음 단계 이동                  | 통과. 구조 가이드는 `BUG-LRN-004`    |
| 비교                | 두 버전 전환과 본문 교체                                                         | 통과                                 |
| AI 코칭             | 직전 답변 표시, 코칭 요청, 결과·재시도, 다음 단계 진행                           | 실패. `BUG-LRN-001`                  |
| 레슨 완료           | 완료 화면, 요약, 완료 수 `+1`, 코스 진행률, 다음 레슨 이동                       | 통과. 기능 소개 요약은 `BUG-LRN-002` |
| 프로필              | 사용자 정보, 완료 레슨·연속 학습일 반영                                          | 통과                                 |
| 테마                | 다크 전환, `html.dark`·`color-scheme` 반영, 새로고침 유지, 시스템 복귀           | 통과                                 |
| 로그아웃            | 세션 종료 후 `/` 이동, 보호 경로 재접근 시 로그인 이동                           | 통과                                 |
| 오류 화면           | 공개 404의 홈 링크, `/app` 404의 대시보드 링크, 없는 코스·레슨, `lesson_id` 누락 | 통과                                 |
| 브라우저 진단       | 전체 흐름의 `console.warn`, `console.error`, page error                          | 통과. 0건                            |
| 서버 진단           | 예상한 미인증 401과 의도한 없는 항목 404 외 5xx                                  | 통과. 5xx 0건                        |

## 발견 문제

### BUG-LRN-001: AI 코칭이 직전 답변을 찾지 못하고 레슨을 차단한다

- 심각도: 높음
- 영향: `l6`의 AI 코칭을 완료할 수 없어 뒤의 쓰기 단계와 레슨 완료로 진행할 수 없다. 같은 `target: "wr"`를 사용하는 `l25`도 영향 가능성이 높다.

재현 절차:

1. 테스트 계정으로 로그인한다.
2. `/app/lesson?lesson_id=l6`에서 레슨을 시작한다.
3. 읽기와 비교를 통과한 뒤 제품 주장·근거 쓰기에 30자 이상 답변을 작성하고 `다음으로 →`를 누른다.
4. AI 코칭 화면의 작성 내용과 `AI 코칭 받기` 결과를 확인한다.

기대 결과:

- 직전 쓰기 답변이 `작성 내용`에 표시된다.
- `/ai-feedback` 본 요청이 전송되고 코칭 결과 또는 서버가 반환한 구체적 오류를 표시한다.
- 성공 시 `다음으로 →`가 활성화된다.

실제 결과:

- 직전 답변 대신 `(작성된 내용이 없습니다)`가 표시된다.
- 버튼을 누르면 `네트워크 연결을 확인해 주세요.`가 즉시 표시된다.
- 서버 로그에는 `/ai-feedback`의 CORS `OPTIONS 204`만 있고 `POST`가 없다.
- `다음으로 →`는 계속 비활성화되어 레슨이 중단된다.

코드 대조 결과, seed의 AI 단계는 `target: "wr"`를 사용하지만 실제 step ID는 `l6-s3`처럼 `${lesson.id}-s${stepIndex + 1}`로 생성된다. UI는 `step.target`을 key로 draft를 읽으므로 서로 일치하지 않는다. `l6`과 `l25`의 두 AI 단계가 모두 같은 값을 사용한다.

추가 코드 대조 결과, 웹은 `/ai-feedback` 요청에 `Idempotency-Key`를 보내지만 API CORS 설정의 `allowHeaders`는 `Authorization`, `Content-Type`만 허용한다. 따라서 브라우저가 `OPTIONS 204` 뒤 본 `POST`를 차단하며, 잘못된 target과 별개의 두 번째 원인이다.

해결 작업 상태: **구현 및 자동 검증 완료**

- `AI_FEEDBACK.target`을 같은 레슨의 앞선 `WRITE` 스텝 ID로 제한하고 seed와 기존 데이터를 보정한다.
- API CORS가 `Idempotency-Key`를 명시적으로 허용하게 한다.
- 서버가 클라이언트 본문의 임의 답변이 아니라 현재 사용자의 저장된 target 답변을 AI 코칭 입력으로 사용하게 한다.
- 잘못된 target, 저장 답변 없음, 네트워크 실패, AI 제공자 실패를 서로 다른 오류로 처리한다.
- seed 참조 무결성, CORS preflight, 저장 답변 조회, `l6`·`l25` 레슨 흐름을 자동 검증한다.

구현 결과:

- 기준 seed의 두 AI 코칭 target을 각각 `l6-s3`, `l25-s3`로 보정했고, seed upsert 시 기존 행의 `contentJson`도 같은 값으로 갱신한다.
- 콘텐츠와 어드민 저장 계약은 target의 동일 레슨 존재 여부, WRITE 타입, 앞선 정렬 순서를 검증한다. 어드민 편집기는 조건을 만족하는 WRITE 스텝만 선택지로 제공한다.
- 브라우저의 `Idempotency-Key` preflight를 허용하고, AI 코칭 요청 본문에서 학습자 답변을 제거했다.
- core 서비스가 현재 사용자의 target WRITE 저장 답변을 조회해 제공자 입력으로 사용한다. 답변 없음은 `AI_FEEDBACK_ANSWER_NOT_FOUND`, target 설정 오류는 `AI_FEEDBACK_TARGET_INVALID`로 구분한다.
- 계약, seed, core, API, web, admin, UI 테스트로 참조 무결성, preflight, 저장 답변 조회, 오류 매핑, 렌더러 요청 계약을 검증했다.
- `ENABLE_TEST_AUTH=true` 격리 브라우저 검증에서 `l6`와 `l25` 모두 target WRITE 답변 표시, `OPTIONS 204` 이후 `POST /ai-feedback` 전송, 제공자 미설정 시 전용 한국어 오류 표시를 확인했다.

수정 후 검증:

- `bun run typecheck`: 통과
- `bun run lint`: 통과
- `bun run test`: 통과. 14개 워크스페이스 테스트 작업
- `bun run format:check`, `git diff --check`: 통과
- 운영 origin과 API URL을 명시한 `@workspace/web`, `@workspace/admin` 프로덕션 빌드: 통과

남은 실환경 확인:

- OpenAI 제공자의 실제 응답 품질과 점수는 유효한 운영 키를 사용하는 별도 수동 검증 대상이다. 이 확인은 target·CORS·저장 답변 연결 수정의 완료 여부와 분리한다.

관련 위치:

- `packages/db/src/seeds/content-seed-data.json:876`
- `packages/db/src/seeds/content-seed-data.json:1253`
- `packages/db/src/seeds/seed-content.ts:192`
- `packages/ui/src/lesson-runtime/renderer.tsx:265`

### BUG-LRN-002: 기능 소개 레슨의 설명·단계·완료 요약이 서로 다르다

- 심각도: 중간
- 영향: 학습자는 체험하지 않은 활동을 완료한 것으로 오해할 수 있고, 제품이 약속한 활동 수와 실제 진행률 `4/4`가 충돌한다.

재현 절차:

1. `/app/lesson?lesson_id=l-new`를 연다.
2. 시작 화면의 설명과 스텝 수를 확인한다.
3. 4개 스텝을 완료한 뒤 핵심 요약을 확인한다.

기대 결과:

- 설명, 실제 단계, 완료 요약이 같은 활동 집합을 나타낸다.

실제 결과:

- 설명은 `매칭·분류·계획·교정·자가 점검 다섯 가지 활동`을 약속한다.
- 실제로는 매칭, 분류, 계획 쓰기, 띄어쓰기 교정의 4개 스텝만 있다.
- 완료 요약은 수행하지 않은 `자가 점검`을 다시 언급한다.
- 완료 요약에 한국어 문맥과 맞지 않는 `mechanics`가 노출된다.

관련 위치:

- `packages/db/src/seeds/content-seed-data.json:33`
- `packages/db/src/seeds/content-seed-data.json:126`
- `packages/db/src/seeds/content-seed-data.json:129`

### BUG-LRN-003: 랜딩 푸터의 링크 12개가 모두 빈 hash 링크다

- 심각도: 중간
- 영향: 코스, 레슨, 학습 통계, 요금제, 소개, 블로그, 채용, 문의, 도움말, 커뮤니티, 이용약관, 개인정보 링크가 어떤 콘텐츠에도 도달하지 않는다.

재현 절차:

1. `/`의 푸터로 이동한다.
2. `이용약관`을 누른다.

기대 결과:

- 해당 정보 페이지 또는 유효한 외부 문서로 이동한다.

실제 결과:

- 모든 링크의 `href`가 `#`다.
- `이용약관` 클릭 후 URL만 `http://localhost:3000/#`로 바뀌고 콘텐츠는 변하지 않는다.

관련 위치:

- `apps/web/src/features/landing/landing-content.tsx:170`
- `apps/web/src/features/landing/landing-sections.tsx:288`

### BUG-LRN-004: 쓰기 구조 가이드가 Markdown 문법을 그대로 노출한다

- 심각도: 중간
- 영향: 사용자가 계획 양식을 읽기 어렵고 강조 의도가 전달되지 않는다.

재현 절차:

1. `/app/lesson?lesson_id=l-new`의 3번째 `쓰기 전 5분 계획` 단계로 이동한다.
2. `구조 가이드`를 확인한다.

기대 결과:

- 독자·목적·키워드·핵심 주장이 목록과 강조 형식으로 표시된다.

실제 결과:

- `- **독자**`, `- **목적**` 같은 Markdown marker가 일반 문장 안에 그대로 표시된다.

코드 대조 결과, seed는 Markdown 문자열을 제공하지만 `WriteAnswer`는 이를 Markdown renderer가 아닌 `<p className="whitespace-pre-line">`으로 출력한다.

관련 위치:

- `packages/db/src/seeds/content-seed-data.json:105`
- `packages/ui/src/components/lesson/write-answer.tsx:126`

### BUG-LRN-005: 데스크톱 계정 메뉴 버튼의 접근성 이름이 이모지만으로 구성된다

- 심각도: 낮음
- 영향: 보조 기술 사용자가 `✍️` 버튼의 목적이 계정 메뉴 열기임을 알기 어렵다.

재현 절차:

1. 로그인 후 데스크톱 `/app`을 연다.
2. 접근성 트리에서 전역 내비게이션의 계정 메뉴 trigger를 확인한다.

기대 결과:

- `계정 메뉴 열기`, `프로필 메뉴`처럼 목적을 설명하는 접근성 이름이 있다.

실제 결과:

- 버튼과 열린 menu의 접근성 이름이 모두 `✍️`다.

관련 위치:

- `apps/web/src/components/layout/global-nav-account-menu.tsx:17`

### BUG-LRN-006: 코스 정렬 Select가 이름 없는 텍스트 입력을 접근성 트리에 노출한다

- 심각도: 낮음
- 영향: 보조 기술이 이름 없는 `textbox`와 정상 `정렬` combobox를 함께 탐색해 중복되거나 혼란스러운 제어로 안내할 수 있다.

재현 절차:

1. `/app/courses`를 연다.
2. 접근성 트리에서 검색과 정렬 제어를 확인한다.

기대 결과:

- `검색` textbox와 `정렬` combobox만 노출된다.

실제 결과:

- `정렬` combobox 다음에 현재 값 `latest`를 가진 이름 없는 `textbox`가 추가로 노출된다.

확인 필요:

- 이 입력은 `@base-ui/react/select`가 생성한 form input으로 보인다. 실제 NVDA·VoiceOver에서 같은 중복 노출이 발생하는지는 별도 수동 검증이 필요하다.

관련 위치:

- `apps/web/src/features/courses/courses-page.tsx:164`
- `packages/ui/src/components/ui/select.tsx`

## 진단 기록

- 브라우저 `warn`/`error`: 0건
- 페이지 실행 오류: 0건
- 서버 5xx: 0건
- 예상한 401: 로그인 전 보호 API 호출 1건
- 의도적으로 검증한 404: 없는 코스·레슨 요청
- AI 코칭 실패 시 `/ai-feedback`: `OPTIONS 204`만 관찰되고 `POST`는 관찰되지 않음

## 자동 검증

| 명령                                                            | 결과                     |
| --------------------------------------------------------------- | ------------------------ |
| `bun run test:e2e -- e2e/writing-app.spec.ts --grep "학습자가"` | 통과. 1개 테스트, 33.1초 |
| `bun run check:document-drift`                                  | 통과                     |
| 대상 문서 `oxfmt --check`                                       | 통과                     |
| `git diff --check`                                              | 통과                     |

## 미검증 항목

- Google OAuth provider 왕복: 프로젝트 지침에 따라 테스트 전용 인증으로 대체했다.
- AI provider 응답 품질·점수·재시도 한도: `BUG-LRN-001`이 실제 `POST /ai-feedback` 전에 흐름을 차단해 검증하지 못했다.
- `BUG-LRN-006`의 실제 스크린 리더 발화: 브라우저 접근성 트리에서 문제를 확인했으나 NVDA·VoiceOver 실기 검증은 하지 않았다.
