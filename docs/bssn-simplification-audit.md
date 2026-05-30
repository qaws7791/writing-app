# BSSN 시스템 단순화 조사

## 조사 기록

- 시작: 2026-05-31
- 완료: 2026-05-31
- 수정: 2026-05-31, 제거 우선순위에서 어드민 코스 편집기, 레슨 스텝 타입 축소, Storybook/UI 축소를 제외하고 Google 단일 로그인 계획으로 변경했다.
- 작업 시작: 2026-05-31, 1순위 후보인 코스 썸네일 업로드, RustFS, S3, Docker Compose 제거를 시작했다.
- 작업 완료: 2026-05-31, 코스 썸네일 필드와 업로드 경로, RustFS/S3 의존성, Docker Compose 로컬 스토리지 구성을 제거했다. 로컬 개발과 배포는 별도 스토리지 서비스 없이 앱, SQLite, 필수 인증/AI 환경 변수만 기준으로 한다.
- 작업 시작: 2026-05-31, 2순위 후보인 커리큘럼 버전, 마이그레이션, 학습자 업그레이드 UX의 완전 제거를 시작했다. 어드민 코스 편집기는 유지하되 draft/publish 버전 모델이 아니라 현재 커리큘럼 직접 편집 모델로 단순화한다.
- 작업 완료: 2026-05-31, 커리큘럼 버전/마이그레이션/업그레이드 스키마, API, 서비스, 웹 공지 UX를 제거했다. 코스 구조는 `course_chapters`, `course_lessons`, `lesson_steps`의 현재 커리큘럼 하나로 관리하고, 어드민 편집기는 `GET/PUT /courses/:courseId/editor`에서 전체 스냅샷을 직접 저장한다.
- 작업 시작: 2026-05-31, 3순위 후보인 웹 runtime fake 모드와 중복 정적 카탈로그의 제품 실행 경로 제거를 시작했다. 테스트용 fake 어댑터는 유지하고, 웹 앱 서버/브라우저 factory는 실제 HTTP API를 기본 경로로 고정한다.
- 작업 완료: 2026-05-31, `WEB_API_MODE`, `NEXT_PUBLIC_API_MODE`, `api-mode.ts`, 웹 `dev:fake` 스크립트, 코스/레슨 라우트의 fake 전용 정적 fallback을 제거했다. 제품 실행 경로는 HTTP API 하나로 고정하고, fake 어댑터는 직접 import하는 테스트 격리 용도로만 남겼다.
- 작업 시작: 2026-05-31, 4순위 후보인 별도 docs 앱과 Fumadocs API 문서 사이트 제거를 시작했다. 공개 문서 앱은 제거하고, OpenAPI 정적 JSON은 `docs/openapi` 산출물로 유지한다.
- 작업 완료: 2026-05-31, `apps/docs` Fumadocs 앱과 docs 실행 스크립트를 제거했다. OpenAPI 정적 계약 파일은 `docs/openapi/writing-app-api.json`에 생성하고, 웹 타입 생성도 이 경로를 기준으로 한다.
- 작업 검증: 2026-05-31, docs 앱 제거 후 `ARCHITECTURE.md`, OpenAPI 문서, 개발 도구 문서에 남은 최신 구조 표현을 `docs/openapi`와 Markdown 문서 기준으로 정리했다.
- 작업 시작: 2026-05-31, 5순위 후보인 이메일/비밀번호 로그인 제거와 Google 로그인 단일화를 시작했다. 관리자 인증은 별도 ID/password 영역으로 유지하고, 학습자 플랫폼 인증만 Google OAuth 단일 진입점으로 좁힌다.
- 작업 완료: 2026-05-31, 학습자 Better Auth 런타임의 email/password 옵션, 웹 이메일 인증 helper, 이메일/비밀번호 로그인 폼, 회원가입 페이지를 제거했다. 학습자 인증 진입점은 `/login`의 Google OAuth 버튼 하나로 고정한다.
- 작업 시작: 2026-05-31, 6순위 후보인 프로필, 공개 코스 검색, 레거시 웹 리다이렉트, 장식성 진행 요소 제거를 시작했다. 홈과 코스 탐색, 현재 진행 저장, 레슨 완료만 학습자 기본 흐름으로 남긴다.
- 작업 완료: 2026-05-31, 학습자 프로필 페이지/API 포트, 공개 코스 검색 API/포트, 레거시 웹 리다이렉트 route, 레슨 생명/XP/색종이/공유/완료 통계 필드를 제거했다. OpenAPI 정적 계약과 웹 생성 타입도 최신 API 경계로 갱신했다.
- 기준 철학: Best Simple System for Now
- 조사 범위: `/prototype`, `node_modules`, 빌드 산출물은 제외하고 현재 모노레포의 앱, 패키지, 문서, 런타임 의존성, 환경 변수, DB 스키마, API 경계를 확인했다.

## 현재를 위한 핵심 일

현재 서비스의 핵심 일은 학습자가 로그인해 코스를 고르고, 글쓰기 레슨을 수행하고, 진행 상태를 저장하고, 작성 답변에 대한 피드백을 받은 뒤 나중에 이어서 학습하는 것이다.

## 현재의 비목표

- 코스 썸네일을 운영자가 직접 업로드하는 것
- 공개 스토리지, S3 호환 서비스, CDN을 운영하는 것
- 커리큘럼 마이그레이션과 학습자 업그레이드 UX를 지금부터 완성하는 것
- 공개 API 문서 사이트를 별도 앱으로 배포하는 것
- 장식성 진행 요소를 학습 성취와 같은 수준으로 저장하거나 운영하는 것

## 관측된 복잡도

- 앱은 `apps/web`, `apps/api`, `apps/admin`, `apps/admin-api`, `apps/storybook` 5개다.
- 주요 TypeScript 코드량은 `apps/web` 약 11,719줄, `apps/admin` 약 7,688줄, `packages/db` 약 7,050줄, `packages/core` 약 5,290줄, `packages/ui` 약 4,583줄, `apps/admin-api` 약 3,415줄, `apps/api` 약 2,907줄이다.
- DB schema에는 26개 테이블이 있다. 이 중 커리큘럼 버전/마이그레이션 계열만 8개 테이블이고, 관리자 인증 계열은 4개 테이블이다.
- Hono route handler는 학습자 API 18개, 관리자 API 23개다.
- `packages/ui`의 UI 컴포넌트 46개 중 Storybook을 제외한 실제 앱에서 쓰는 것은 21개이고, 25개는 현재 앱 런타임에서 쓰지 않는다.
- 실제 DB seed의 레슨 스텝 타입은 `INTRO`, `SHORT_WRITE`, `AI_FEEDBACK`, `SUMMARY`, `COMPLETE` 5개뿐이다. 반면 웹 fake 데이터, core DTO, 관리자 에디터는 20개 스텝 타입을 모두 유지한다.

## 제거 우선순위 요약

| 우선순위 | 후보                                                       | 판단                                                                                                                                |
| -------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1        | 코스 썸네일 업로드, RustFS, S3, Docker Compose             | 학습 핵심 영향이 낮고 운영 복잡도 감소가 매우 크다. 즉시 제거 1순위다.                                                              |
| 2        | 커리큘럼 버전, 마이그레이션, 학습자 업그레이드 UX          | 미래의 콘텐츠 변경 안전장치다. 초기 서비스에는 과하다. 활성 사용자 진행 보존 요구가 작다면 제거 효과가 매우 크다.                   |
| 3        | 웹 runtime fake 모드와 중복 정적 카탈로그                  | 서버/브라우저 모드 불일치가 생기며 실제 인증과 데이터를 가린다. 테스트 fake만 남기는 축소가 적합하다.                               |
| 4        | 별도 docs 앱/Fumadocs API 문서 사이트                      | 공개 API 제품이 아니라면 Markdown 문서와 `/openapi.json`만으로 충분하다.                                                            |
| 5        | 이메일/비밀번호 로그인 제거와 Google 로그인 단일화         | 로그인 선택지를 하나로 줄이고 로컬 비밀번호 처리 표면을 없앤다. Google OAuth 설정은 남지만 인증 정책과 제품 진입 경로가 단일해진다. |
| 6        | 프로필, 검색, 레거시 리다이렉트, 장식성 XP/생명/색종이     | 완료했다. 홈과 코스 탐색, 현재 진행 저장, 완료 후 다음 행동만 남긴다.                                                               |
| 7        | 학습자 API와 웹 앱, 관리자 API와 관리자 앱의 프로세스 통합 | 효과는 크지만 변경 범위도 크다. 위 후보를 먼저 줄인 뒤 결정한다.                                                                    |

이번 제거 우선순위에서는 어드민 코스 편집기 제거, 레슨 스텝 타입 축소, Storybook과 미사용 UI 컴포넌트 제거를 제외한다. 이 셋은 복잡도는 있지만 현재 제품 운영, 콘텐츠 설계, UI 검증 흐름과 직접 연결될 수 있으므로 별도 제품 판단 없이 제거하지 않는다.

## 상세 검토

아래 번호는 조사 항목 구분이며 제거 우선순위 번호와 일치하지 않는다.

### 1. 코스 썸네일 업로드와 스토리지 제거

현재 썸네일 때문에 생긴 요소는 `docker-compose.yml`, `.env.docker.example`, `scripts/init-public-assets-bucket.sh`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `ADMIN_ASSET_*` 환경 변수 6개, `POST /course-thumbnails/uploads`, 관리자 앱의 파일 선택 즉시 업로드, 공개 URL 저장, 로컬 RustFS 실행 절차다.

추천 단순화는 코스에서 `thumbnail`/`thumbnailPath` 필드를 제거하고, 코스 카드와 상세 화면을 제목, 설명, 진행률, 카테고리 색상 또는 간단한 아이콘 기반 UI로 바꾸는 것이다. 이 경우 로컬 개발은 Docker 없이 `bun install`, `.env`, SQLite seed, `bun run dev:app`만으로 가능해진다. 배포도 스토리지 서비스 없이 앱과 SQLite 백업만 신경 쓰면 된다.

학습 영향은 낮다. 코스 선택에는 제목, 설명, 레슨 수가 충분하고 썸네일은 학습 성취나 피드백 품질에 영향을 주지 않는다.

### 2. 커리큘럼 버전/마이그레이션 제거

2026-05-31 B안으로 제거를 완료했다. 더 이상 `curriculum_versions`, `curriculum_version_chapters`, `curriculum_version_lessons`, `curriculum_version_steps`, `curriculum_version_migrations`, `lesson_migration_mappings`, `curriculum_migration_applications`, `curriculum_upgrade_dismissals`를 운영하지 않는다. 학습 진행도 `curriculum_version_id`에 묶이지 않고, 웹 코스 상세도 업그레이드 공지를 조회하지 않는다.

현재 정책은 “현재 공개 커리큘럼 하나”만 두는 것이다. 콘텐츠 변경은 seed 또는 어드민 현재 커리큘럼 편집기로 처리하고, 초기에는 lesson id를 유지하는 변경만 허용한다. 이미 완료한 레슨 보존이 필요해질 때만 버전 모델을 다시 도입한다.

조건은 명확하다. 이미 실제 사용자가 많고 콘텐츠 구조 변경이 잦다면 제거하면 안 된다. 하지만 현재 BSSN 관점에서는 미래 변경 비용을 미리 모두 지불하고 있다.

### 3. 어드민 코스 편집기 제거 계획 제외

`apps/admin`과 `apps/admin-api`는 처음에는 관리자 로그인, 콘텐츠 계층 조회, 사용자 목록 조회가 1차 목표였으나 현재는 코스 상세 편집기, draft 생성/복원/저장/발행/폐기, 스텝 20종 전용 폼, drag and drop, 썸네일 업로드까지 포함한다.

이번 제거 우선순위에서는 어드민 코스 편집기를 제외한다. 운영자가 콘텐츠를 직접 수정해야 하는 요구가 있으면 CMS 제거는 되돌리기 어려운 제품 결정이 된다. 따라서 썸네일, 커리큘럼 마이그레이션, fake runtime처럼 운영 복잡도만 크게 늘리는 요소를 먼저 제거한 뒤 다시 판단한다.

다만 다른 제거 작업과 겹치는 기능은 함께 정리한다. 예를 들어 썸네일 업로드 UI와 커리큘럼 마이그레이션 UI는 각각 해당 제거 작업의 일부로 사라질 수 있다.

### 4. 웹 runtime fake 모드 제거

2026-05-31 제거를 완료했다. 더 이상 `WEB_API_MODE`와 `NEXT_PUBLIC_API_MODE`로 서버 컴포넌트와 브라우저 mutation 데이터 소스를 고르지 않는다. 웹 앱의 서버/브라우저 API factory는 모두 HTTP 어댑터만 생성한다.

제품 실행 경로에서 fake 사용자, 브라우저 메모리 진행 상태, fake AI 피드백, 로컬 코스/레슨 카탈로그 fallback을 제거했다. 테스트에서는 `createFakeWritingAppApi()`를 직접 import해 외부 API 없이 포트 계약을 검증할 수 있다.

### 5. 레슨 스텝 타입 축소 계획 제외

현재 제품/웹 fake 데이터는 20개 스텝 타입을 표현하지만 실제 DB seed는 5개 타입만 만든다. 따라서 지금 서비스의 기본 학습 흐름은 `INTRO`, `SHORT_WRITE`, `AI_FEEDBACK`, `SUMMARY`, `COMPLETE`로 이미 충분히 동작한다.

이번 제거 우선순위에서는 레슨 스텝 타입 축소를 제외한다. 현재 seed 사용량만으로 콘텐츠 설계 의도를 확정하면 학습 활동 다양성을 제품 판단 없이 줄일 수 있다. 따라서 스텝 타입은 유지하되, 새 타입을 추가할 때는 실제 콘텐츠 사용 계획과 웹/어드민 구현 비용을 함께 기록한다.

관측된 복잡도는 유지한다. `CONCEPT`, `READING_PASSAGE`, `EXAMPLE_REVEAL`, `COMPARE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `WORD_SELECT`, `REORDER`, `MATCH`, `CLASSIFY`, `LONG_WRITE`, `REVISION`, `CHECKLIST`, `REFLECTION`, `TRANSCRIBE`는 아직 seed에서 쓰지 않지만, 이번 계획의 제거 대상은 아니다.

### 6. 장식성 진행 요소 제거

2026-05-31 제거를 완료했다. 더 이상 `lives`, `xpAvailable`, `xpEarned`, `showStreak`, `correctRate`, `shareableQuote`, `celebrationStyle: "confetti"`와 완료 통계를 제품 DTO, seed, 웹 UI에서 사용하지 않는다.

레슨 화면은 나가기 버튼, 진행률, 현재 스텝 콘텐츠, 다음 행동을 중심으로 동작한다. 완료 화면도 완료 메시지와 홈/계속하기 행동만 제공한다.

### 7. 이메일 로그인 제거와 Google 로그인 단일화

2026-05-31 제거를 완료했다. 학습자 인증은 Google 로그인을 단일 인증 경로로 두고, 이메일/비밀번호 가입, 로그인 폼, 로컬 비밀번호 정책, 비밀번호 복구 정책을 운영하지 않는다.

이 선택은 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, OAuth callback URL 같은 Google 설정을 운영 의존성으로 남긴다. 대신 사용자가 선택해야 하는 로그인 방식이 하나가 되고, 서비스가 직접 비밀번호 UX와 보안 정책을 운영하지 않아도 된다.

관리자 인증은 별도 어드민 Better Auth ID/password 경로로 유지한다. 학습자 실제 이메일 credential 사용자가 생긴 뒤 같은 변경을 한다면 Google 계정 연결 또는 계정 전환 절차가 먼저 필요하다.

### 8. 검색 제거 또는 지연

2026-05-31 제거를 완료했다. 공개 `GET /courses/search`, core 콘텐츠 검색 포트, DB 검색 구현, 웹 API 검색 포트, 전역 검색 버튼을 제거했다.

현재 코스 탐색은 카테고리와 코스 목록을 기준으로 한다. 코스 수가 실제로 늘어나 검색이 필요해질 때 새 요구사항으로 다시 도입한다.

### 9. 프로필 페이지 축소

2026-05-31 제거를 완료했다. `/app/profile`, `GET /profile`, 학습자 프로필 DTO, 웹 `getProfile` 포트, 전역 프로필 진입점을 제거했다.

학습 현황은 홈의 진행 목록과 코스 상세 진행률로 확인한다. 계정 설정이 필요해질 때 프로필이 아니라 좁은 계정 메뉴로 다시 설계한다.

### 10. 별도 docs 앱 제거

2026-05-31 제거를 완료했다. 더 이상 `apps/docs` Fumadocs 앱, Orama 검색, OG 이미지, API 문서 MDX 생성 경로를 유지하지 않는다. 공개 API 제품이 아니라면 현재 팀에는 저장소의 Markdown 문서와 API의 `/openapi.json`만으로 충분하다.

OpenAPI 정적 계약 파일은 `docs/openapi/writing-app-api.json`에 생성한다. 웹의 `api:generate`도 이 파일을 읽어 생성 타입을 갱신한다.

### 11. Storybook 제거와 UI 컴포넌트 축소 계획 제외

`apps/storybook`은 40개 이상의 story와 Storybook 의존성을 유지한다. 동시에 `packages/ui`에는 실제 앱에서 쓰지 않는 UI 컴포넌트가 25개 있다.

이번 제거 우선순위에서는 Storybook과 미사용 UI 컴포넌트 제거를 제외한다. 이 영역은 제품 런타임보다 UI 검증과 디자인 시스템 유지 흐름에 가깝다. 당장 제거하면 코드량은 줄지만 화면 변경을 검증하는 비용이 늘 수 있다.

현재 앱 런타임에서 쓰지 않는 컴포넌트는 `alert`, `alert-dialog`, `breadcrumb`, `button-group`, `chip`, `combobox`, `command`, `drawer`, `input-group`, `item`, `kbd`, `label`, `pagination`, `progress`, `radio-group`, `scroll-area`, `sheet`, `skeleton`, `slider`, `spinner`, `switch`, `tabs`, `toggle`, `toggle-button`, `tooltip`이다. 이 목록은 향후 UI 패키지 정리 판단을 위한 관측값으로만 유지한다.

### 12. OpenAPI/Fumadocs 파이프라인 축소

프론트와 백엔드가 같은 모노레포이고 공개 외부 API가 아니라면 OpenAPI 문서 앱, 생성 타입, `openapi-fetch`, `hono-openapi`, `zod-openapi`까지 모두 유지하는 비용이 크다.

추천은 두 단계다.

1. 앱을 계속 분리한다면 OpenAPI는 타입 생성과 회귀 검증용으로 유지하고 docs 앱만 제거한다.
2. 학습자 API를 웹 앱으로 통합한다면 OpenAPI 생성 타입과 HTTP 어댑터도 제거하고 서버 함수/route handler 경계로 단순화한다.

### 13. 학습자 API와 웹 앱 통합

현재는 `apps/web`과 `apps/api`가 별도 프로세스다. 이 때문에 CORS, same-origin auth proxy, 서버/브라우저 API base URL, systemd 프로세스 2개가 필요하다.

추천은 즉시 실행보다 2차 단순화 후보로 둔다. 먼저 썸네일, 커리큘럼 버전, 이메일/비밀번호 인증 경로를 제거한 뒤에도 프로세스 분리가 여전히 부담이면 `apps/web` 안의 route handler 또는 server action으로 API를 합친다. 합치면 배포는 Next 앱 하나와 SQLite 하나로 줄어든다.

### 14. 관리자 API와 관리자 앱 통합

관리자를 유지한다면 `apps/admin-api`를 별도 Hono 서버로 둘 필요가 있는지 다시 판단한다. 관리자 앱의 Next route handler가 DB를 직접 호출하면 관리자 CORS, 관리자 auth proxy, 관리자 API base URL, 관리자 API 포트가 사라진다.

이 후보는 어드민을 유지하기로 결정한 경우에만 의미가 있다. 어드민 코스 편집기 제거는 이번 계획에서 제외했으므로, 관리자 영역을 줄인다면 우선 별도 관리자 API 프로세스를 합치는 방향만 검토한다.

### 15. `packages/env`, `packages/logger` 축소

`packages/env`와 `packages/logger`는 작지만 별도 패키지와 workspace 의존성을 만든다. API 앱이 하나로 줄거나 관리자 API가 제거되면 앱 내부 helper로 되돌리는 편이 더 단순하다.

지금 당장 제거 1순위는 아니다. 현재 두 API 런타임이 모두 사용하기 때문에 공유 패키지로서 이유가 있다. 런타임 수를 줄인 뒤 판단한다.

### 16. `packages/core` 경계 재검토

`packages/core`는 DTO, 브랜드 ID, repository port, service를 담고 있고 `packages/db`, `apps/api`, `apps/admin-api`, `apps/admin`이 공유한다. 현재 구조에서는 분리 이유가 있지만, 어드민과 별도 API가 줄어들면 도메인 계약이 과한 간접 계층이 될 수 있다.

추천은 큰 제거 작업 뒤에 재검토하는 것이다. 먼저 실제 경계가 줄어든 다음, core를 `apps/api` 또는 `packages/db` 주변으로 흡수할지 결정한다.

### 17. AI 피드백 제거 또는 유지 결정

AI 피드백은 OpenAI API key, 모델 정책, 비용, 장애 처리, 재시도 제한, `feedback_attempts` 테이블을 요구한다. 운영 복잡도는 크다.

하지만 글쓰기 학습 서비스의 차별 가치가 “작성 답변에 대한 즉시 피드백”이라면 핵심 기능이다. 따라서 기본 추천은 유지다. 단순화가 더 중요하고 초기 검증이 콘텐츠/자기 점검 중심이라면 `AI_FEEDBACK`을 참조 답안과 체크리스트로 대체해 OpenAI 의존성을 제거할 수 있다.

### 18. 답변 저장 범위 축소

현재 `lesson_answers`는 글쓰기/퇴고/체크리스트/회고 답변 저장에 열려 있고, AI 피드백은 저장된 답변 또는 명시 입력을 사용한다. 제품 문서는 작성 답변을 별도 저널로 저장하지 않는다고 정리했다.

추천은 답변 저장을 AI 피드백 source step에 필요한 글쓰기 답변으로만 제한하는 것이다. 회고, 체크리스트, 임시 저장 같은 확장 속성은 실제 콘텐츠가 필요로 하기 전까지 제거한다.

### 19. 레거시 경로 리다이렉트 제거

2026-05-31 제거를 완료했다. `/home`, `/courses`, `/courses/[id]`, `/lesson`을 `/app/...`으로 넘기던 얇은 route 파일을 제거했다.

학습자 앱의 제품 경로는 `/app`, `/app/courses`, `/app/courses/[id]`, `/app/lesson`만 기준으로 한다.

### 20. 운영 부트스트랩 축소

현재 README는 학습자/어드민/docs/storybook/RustFS까지 모두 준비하는 흐름을 설명한다. BSSN 기준의 목표 로컬 실행은 다음 정도가 되어야 한다.

```bash
bun install
cp apps/api/.env.example apps/api/.env
# apps/api/.env에 GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 설정한다.
bun --filter @workspace/db db:seed
bun run dev:app
```

썸네일, docs 앱, fake runtime, 이메일/비밀번호 인증 경로를 제거하면 로컬 온보딩과 배포 체크리스트가 줄어든다.

## 권장 실행 순서

1. 완료: 코스 썸네일과 RustFS/S3/Docker 의존성을 제거한다.
2. 완료: 커리큘럼 버전/마이그레이션/업그레이드 UX를 제거하고 단일 현재 커리큘럼으로 되돌린다.
3. 완료: 웹 runtime fake 모드를 제거하고 테스트 주입 fake만 남긴다.
4. 완료: docs 앱을 제거하고 Markdown 문서와 `/openapi.json`, `docs/openapi/writing-app-api.json`만 남긴다.
5. 완료: 이메일/비밀번호 로그인 경로를 제거하고 Google 로그인 단일 방식으로 통합한다.
6. 완료: 프로필, 검색, 레거시 리다이렉트, 장식성 진행 요소를 제거한다.
7. 남은 구조를 보고 학습자 API와 웹 앱 통합, 관리자 API 통합, core/env/logger 패키지 흡수를 결정한다.

어드민 코스 편집기, 레슨 스텝 타입 축소, Storybook과 미사용 UI 컴포넌트 제거는 이번 실행 순서에 넣지 않는다.

## 유지 권장 항목

- SQLite 자체는 현재 서비스 규모에 맞는 단순한 영속성 선택이다.
- Google 단일 로그인은 서버 저장 진행을 유지하면서 로컬 비밀번호 정책을 제거하는 기본 인증 경로다.
- AI 피드백은 제품 핵심 가치로 볼 수 있으므로 제거 전 제품 판단이 필요하다.
- 테스트와 타입체크는 축소 작업 중 회귀를 막는 안전장치이므로 제거 대상이 아니다.
- `/docs`의 한국어 결정 기록은 축소 작업의 이유를 남기기 위해 유지한다.

## 결론

현재 가장 명확한 BSSN 단순화 1~6순위는 완료됐다. 제품 실행 경로는 썸네일 스토리지, 커리큘럼 버전/마이그레이션, runtime fake 모드, docs 앱, 이메일/비밀번호 학습자 인증, 프로필, 코스 검색, 레거시 리다이렉트, 장식성 진행 요소 없이 동작한다.

이번 계획은 어드민 코스 편집기, 레슨 스텝 타입, Storybook/UI 축소를 제외하고도 충분히 큰 단순화 효과를 냈다. 남은 핵심 결정은 학습자 API와 웹 앱 통합, 관리자 API 통합, core/env/logger 패키지 흡수 여부다.
