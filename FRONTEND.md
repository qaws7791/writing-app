# 프론트엔드 개발 가이드

이 문서는 `apps/web`, `apps/admin`, `packages/ui`를 개발할 때 따르는 프론트엔드 원칙을 정리한다. 모든 문서와 사용자 노출 텍스트는 한국어를 기본으로 하며, 기술 고유명사와 코드 식별자는 원문을 유지한다.

## 기본 원칙

- 기능 기준으로 파일을 모은다. 기술 종류별 전역 `components`, `hooks`, `utils` 묶음보다 `features/course-catalog`, `features/lesson-session`처럼 변경 이유가 같은 코드를 가까이 둔다.
- 앱은 조립자 역할을 한다. 비즈니스 규칙은 가능한 한 `packages/core` 또는 feature 내부 순수 함수에 둔다.
- 외부 API 응답은 canonical runtime schema로 먼저 검증한다. 화면 모델과 의미가 같으면 canonical 타입을 직접 사용하고, 실제 UI 모델 차이가 있을 때만 mapper를 둔다.
- 클라이언트 컴포넌트는 상호작용 상태가 필요할 때만 사용한다. 서버 컴포넌트에서 충분한 조회는 서버에서 처리한다.
- 공유 UI는 `packages/ui`에 둔다. `components/ui`는 shadcn 프리미티브, `components/<domain>`은 순수 도메인 프레젠테이션이다. API 호출, 세션, 채점, 라우팅은 각 앱 feature에서 조합한다.
- 학습자 공개 모델과 답안 payload는 `@workspace/contracts/learning`을 직접 사용한다. `apps/web/src/features/lesson-session`은 입력 중 상태, 세션 event와 `LessonStepRenderer` 조립만 소유하며 채점 정책은 소유하지 않는다.

## 2026-06-15 HTTP 클라이언트 응답 계약 검증 시작

- 학습자 웹과 어드민 웹의 HTTP 클라이언트는 성공 응답 JSON을 타입 캐스팅만 하지 않고 endpoint별 런타임 스키마로 검증한다.
- 성공 응답이 계약과 다르면 network 오류가 아니라 contract 오류로 분리한다.
- 실패 응답은 서버의 canonical `SCREAMING_SNAKE_CASE` code와 한국어 message를 그대로 사용한다.

## 2026-06-15 HTTP 클라이언트 응답 계약 검증 완료

- 어드민 HTTP 클라이언트는 core/admin DTO 스키마로 모든 성공 응답을 검증한다.
- 학습자 HTTP 클라이언트는 콘텐츠, 프로필, 진행, 레슨 상태 전이와 AI 코칭 성공 응답을 런타임 스키마로 검증한다.
- JSON 파싱 실패와 스키마 불일치는 `CONTRACT_ERROR`로 반환하고, fetch 실패만 `NETWORK_ERROR`로 반환한다.

## 2026-06-17 HTTP 네트워크 오류 값 처리

- 학습자 웹과 어드민 웹의 HTTP adapter는 `fetch` 예외를 `null`로 병합하지 않고 `@workspace/http-client`의 명시적 result로 처리한다.
- `network-error`는 사용자 메시지와 별개로 원인, method, query가 제거된 URL, 실패 분류를 보존한다.
- 화면은 네트워크 오류 원인을 직접 노출하지 않는다. 로깅, 리포팅, 재시도 정책만 구조화된 `network` 값을 사용한다.

## 현재 앱 라우트

아래 라우트는 현재 `apps/web/src/app`과 `apps/admin/src/app`에 구현된 화면 계약이다.

### 학습자 웹

- `/`: 랜딩 페이지.
- `/login`: 로그인 페이지.
- `/app`: 인증이 필요한 학습 홈.
- `/app/courses`: 코스 목록과 카테고리.
- `/app/courses/[id]`: 코스 상세와 커리큘럼.
- `/app/lesson?lesson_id=...`: 시작 화면을 포함한 step 기반 레슨 진행 화면.
- `/app/profile`: 사용자 정보, 가입일, 완료 레슨, 연속 학습일, 라이트/다크/시스템 테마 전환.

### 어드민 웹

- `/`: 운영 대시보드.
- `/login`: 관리자 로그인 페이지.
- `/courses`: 코스 목록.
- `/courses/[id]`: 현재 공개 커리큘럼을 직접 편집하는 코스/레슨/스텝 편집기.
- `/users`: 사용자 목록.
- `/users/[id]`: 사용자 상세, 상태 변경, 삭제 요청 처리.
- `/analytics`: 가입, 완료, 연속 학습일, 레슨별 완료율과 이탈률 분석.
- `/chat`: 관리자 AI 에이전트 대화.

관리자 코스 썸네일 route는 계약의 `visualKey` 허용 목록만 처리한다. 정상 파일은 프로세스 수명 동안 읽기 Promise를 재사용하고 장기 immutable cache header를 반환하며, 허용되지 않은 이름·경로 탐색·배포 누락 파일은 모두 404로 응답한다.

학습자 공개 랜딩은 Open Graph·Twitter 기본 metadata와 manifest를 제공하고 sitemap에는 인증 없이 접근 가능한 route만 포함한다. 코스 상세의 metadata와 본문은 React request cache로 같은 조회를 공유하며, 조회할 수 없는 코스에는 canonical을 만들지 않는다. 관리자 앱은 root metadata와 `robots.txt` 양쪽에서 전체 색인을 차단한다.

- `/resources`: 최대 1,000개의 전체 자료 트리, 검색, 새 폴더·문서, Markdown 가져오기와 선택 안내.
- 자료 트리의 공개 Interface는 `ResourceTree` 하나이며, 상태 전이와 명령 순서는 controller/reducer, drag/drop 판단은 순수 policy, 명령 dialog와 row 렌더링은 각 view module에 둔다.
- `/resources/[documentId]`: breadcrumb, 제목, 저장 상태와 Lexical GFM 편집기.
- `/resources/trash`: 직접 휴지통으로 이동한 최상위 항목과 전체 하위 트리 읽기·복원.
- `/settings`: 공지, 약관, 개인정보처리방침, 콘텐츠 초기화.

## 데이터 접근 경계

`apps/web`의 공통 HTTP transport는 `src/shared/http`에 있고, 서버 요청 factory는 `src/server/http`가 소유한다. 각 브라우저 화면은 자기 `features/*/api`의 좁은 포트를 사용하고, Server Component는 `features/*/server/dal`을 직접 호출한다. 정적 OpenAPI JSON과 generated TypeScript 타입은 사용하지 않는다. HTTP 응답은 `@workspace/contracts/learning`의 canonical runtime schema로 검증하며 course·progress·lesson·profile은 identity 변환 없이 화면에 전달한다. 코스 목록의 검색·분류·정렬은 Zod로 파싱한 URL 조건을 API query로 전달하고 `/course-categories` 결과를 별도로 사용한다.

`apps/admin`의 공통 HTTP result와 transport는 `src/shared/http`, 요청별 인증 transport factory는 `src/server/http`가 소유한다. Server Component는 자기 `features/*/server`의 좁은 DAL을 호출하고, 브라우저 재조회가 필요한 코스 편집기와 자료실만 자기 `features/*/api` adapter를 사용한다. 각 DAL과 adapter는 `@workspace/contracts/admin`의 canonical schema로 응답을 검증한다. 중앙 `AdminApi`와 조회용 Server Action은 사용하지 않는다.

관리자 공개 런타임 설정은 `src/shared/config/admin-runtime-config.ts`에서 Zod로 검증한 뒤 Server Component가 직렬화 가능한 값만 Client Component에 전달한다. 클라이언트에는 URL 브랜드와 순수 조립 함수가 있는 `admin-api-url.ts`만 포함해 Zod parser가 초기 번들에 들어가지 않게 한다.

서로 의존하지 않는 서버 조회는 같은 렌더 주기에서 먼저 시작한 뒤 함께 기다린다. 관리자 AI 채팅은 목록과 선택 대화를 병렬로 조회한다. 학습자 코스 목록은 course page와 category를 병렬 조회한다. 레슨 진입은 레슨과 프로필만 병렬 조회하고, 초기 step은 레슨 응답의 `learning`에서 읽는다. 별도 `/progress` join이나 course detail 조회를 시작하지 않는다. 각 요청의 기존 오류·redirect 의미는 병렬화 전과 동일하게 유지한다.

## 인증과 redirect

학습자 앱의 보호 라우트는 `apps/web/src/server/auth/server-session-token.ts`로 현재 세션을 확인하고, 각 데이터 접근 직전에 인증 실패를 `/login`으로 보낸다. 로그인 `next` 값은 `src/features/authentication/model/auth-navigation.ts`의 허용 규칙을 통과해야 한다. `app`의 page와 layout은 URL·redirect·DAL 호출·화면 조립만 담당한다.

학습자 로그인은 `NEXT_PUBLIC_API_BASE_URL`의 Hono API `/api/auth/*` endpoint를 직접 호출한다. 브라우저 요청은 `credentials: "include"`를 사용하고, API는 `CORS_ORIGIN`과 Better Auth `trustedOrigins`로 학습자 웹 origin을 허용한다.

어드민 앱의 보호 라우트는 `apps/admin/src/app/(admin)/layout.tsx`에서 `GET /session` 결과를 확인한다. 인증·인가 실패만 어드민 로그인 경로로 redirect한다.

두 앱은 root `loading.tsx`, `error.tsx`, `global-error.tsx`와 보호 route group skeleton을 제공한다. error boundary의 다시 시도는 Next `reset()`을 호출한다. 어드민은 세션 응답의 `unauthorized | forbidden`만 로그인으로 보내고 network·contract·5xx 오류는 로그인 상태를 유지한 서비스 오류 UI로 표시한다. 로그아웃 요청 실패는 화면 alert와 같은 버튼의 재시도로 처리하며 unhandled rejection을 만들지 않는다. 어드민은 알 수 없는 경로에 전용 not-found 화면을 제공한다.

관리자 로그인은 ID/password만 지원하고 `NEXT_PUBLIC_ADMIN_API_BASE_URL`의 Hono API `/api/auth/sign-in/email` endpoint를 직접 호출한다. 브라우저 요청은 `credentials: "include"`를 사용하고, 어드민 API는 `ADMIN_CORS_ORIGIN`과 Better Auth `trustedOrigins`로 어드민 웹 origin을 허용한다. 로그인 `next` 경로 검증은 `src/features/authentication/model/admin-auth-navigation.ts`가 단일 출처이며, 로그인 성공 후 이동은 `next/navigation`의 router를 사용한다. 어드민 앱 source에서 `window.location.*` 직접 이동은 금지한다.

## UI와 접근성

레슨의 선택형 답안은 키보드와 보조 기술이 선택 상태를 식별할 수 있도록 네이티브 `button`과 `aria-pressed`를 사용한다. 관리자 분석 표는 검색 입력의 명시적 이름, 행·열 머리글, 정렬 상태, 페이지 이동 버튼 이름을 제공한다.

- 버튼, dialog, dropdown, form control은 `packages/ui` 컴포넌트를 우선 사용한다.
- 내부 페이지로 이동하는 보이는 UI는 `next/link`의 `Link`를 사용한다. 카드, 메뉴, 탭처럼 버튼 모양이어도 목적지가 있는 탐색이면 링크로 표현한다.
- `router.push`와 `router.replace`는 로그인 완료, 저장 완료, 모달 종료 후 이동처럼 사용자의 명령 또는 비동기 결과에 따른 화면 전이에만 사용한다.
- 탐색 목적으로 클릭 가능한 `div`를 만들지 않는다. 현재 페이지를 가리키는 내부 탐색 링크는 가능한 `aria-current="page"`를 사용한다.
- destructive 동작은 즉시 실행하지 않고 `AlertDialog` 같은 화면 계층 확인 UI를 거친다.
- 성공/오류 상태는 문자열 포함 여부로 판단하지 않는다. `{ kind; message }` 같은 명시적 타입을 사용한다.
- 오류 안내는 가능한 `role="alert"`를 사용하고, 일반 상태 안내는 `role="status"`를 사용한다.
- 화면 텍스트와 `aria-label`은 한국어로 작성한다.
- `/app/profile`의 3분할 segmented control로 라이트, 다크, 시스템 테마 전환을 지원한다.

## 학습자 경험

- 공개 랜딩은 제품명, 가치 제안, 코스 미리보기, 학습 방식, 로그인 CTA를 제공한다.
- 공개 랜딩 구현은 `features/landing/ui/landing-page.tsx`가 최상위 조립만 맡고, section component, 정적 콘텐츠, motion hook, SVG/preview primitive를 같은 feature의 `ui`에 분리한다.
- 공개 랜딩의 정적 section은 Server Component로 렌더링하고 nav scroll, pointer glow, preview parallax, count-up만 client island로 둔다. pointer·scroll 값은 React 상위 state가 아니라 ref와 DOM transform으로 rAF당 한 번 갱신하며 listener는 passive/cleanup 규칙을 따른다. `prefers-reduced-motion: reduce`에서는 marquee·pebble·pointer·parallax·count-up animation을 비활성화한다.
- 홈은 진행 중인 코스, 다음 레슨, 전체 학습 맥락, 현재 연속 학습일을 보여주며 진행 중·완료 목록의 `nextCursor`로 다음 페이지를 추가 로딩한다.
- 홈 코스 카드는 breakpoint별 복제 마크업을 만들지 않고 하나의 링크·이미지 DOM을 반응형 CSS로 배치한다. 첫 코스 이미지만 우선 로드하며 `sizes`는 모바일 전체 폭과 데스크톱 176px 폭을 함께 명시한다.
- 코스 상세는 유닛별 커리큘럼과 레슨의 완료, 진행 가능, 잠금 상태를 보여준다.
- 레슨은 시작 화면을 먼저 보여주고 사용자가 시작한 뒤 첫 스텝으로 진입한다.
- 답변 가능 스텝은 stable item ID 기반 제출을 `completeStep`으로 보내며, 서버의 `retry | advanced | lesson_completed` 결과를 세션 event로 소비한다.
- 글쓰기 초안은 메모리 캐시와 브라우저 영구 저장을 구분한다. 영구 저장 결과는 `saved`, `unavailable`, `quota-exceeded`로 전달하며 실제 `localStorage` 쓰기가 성공한 경우에만 저장 완료를 표시한다. 브라우저 저장 실패는 답안의 서버 제출을 막지 않는다.
- 채점, 진도율, 다음 레슨과 완료 여부는 서버 결과를 표시하며 프론트엔드가 다시 계산하지 않는다.
- 매칭 스텝의 로컬 선택 전이와 stable ID 제출 변환은 web feature가 소유하고, 정답 pair와 verdict는 제출 후 서버 evaluation만 사용한다.
- AI 코칭 스텝은 `target`이 가리키는 같은 레슨의 앞선 WRITE 초안을 작성 내용으로 보여주고, 요청에는 레슨 ID와 AI 코칭 스텝 ID만 전달한다. 서버 저장 답변 없음, 콘텐츠 target 오류, 네트워크 실패, AI 제공자 실패는 서로 다른 한국어 오류로 표시한다.
- AI 코칭 성공 결과는 총평, 잘된 점, 개선점, 다음 시도, 남은 재시도 횟수를 보여준다.

## 어드민 경험

- 어드민은 학습자 인증과 분리된 관리자 로그인을 사용한다.
- 콘텐츠 관리는 코스 검색, 카테고리 필터, 페이지 크기, 페이지 이동, 새 코스 생성, 코스 보관을 제공한다.
- 코스 편집은 유닛, 레슨 배치, 레슨 추가/보관, 순서 변경, 표준 10개 스텝 타입별 편집 폼을 제공한다. AI 코칭 대상은 같은 레슨에서 앞선 WRITE 스텝만 선택할 수 있다.
- 코스 편집 저장은 draft의 `editVersion`을 `If-Match`로 전달한다. 저장과 발행을 분리하고 미저장 변경이 없을 때만 명시적 `초안 발행` 행동을 제공한다.
- stale 저장·발행은 자동 병합하지 않는다. 최신 draft로 교체하거나 로컬 변경을 최신 `curriculumVersionId`, `editVersion`, `revision`에 재기준화해 다시 검토한다.
- 사용자 관리는 검색, 상태 필터, 정렬, 페이지 이동, 정지/복구, 삭제 요청 처리를 제공한다.
- 분석 화면의 차트는 새 의존성 없이 SVG 또는 CSS 기반 컴포넌트로 우선 구현한다.
- 대시보드와 분석 화면의 Recharts 시각화는 viewport 200px 이내에서 동적으로 불러온다. 같은 데이터의 기간 합계와 semantic table을 먼저 렌더링해 JavaScript·차트 로딩 실패와 screen reader 환경에서도 핵심 값을 전달한다.
- 자료실은 reui 기반 Tree 프리미티브로 최대 3단계 폴더·문서 계층을 이름순으로 한 번에 조회하고 데스크톱 사이드바를 제공한다. 작은 화면에서는 데스크톱 브라우저 사용 안내를 표시한다.
- 자료실 트리 shell은 문서 편집기 모듈을 정적 import하지 않는다. Lexical 편집기 경계는 `/resources/[documentId]`에서만 동적으로 불러오며, 빈 자료실과 휴지통의 초기 chunk는 CI에서 편집기 런타임 부재와 275,000 bytes gzip 예산을 검증한다.
- 자료 본문은 Lexical에서 최종 문서 형태로 GFM을 편집하고 제목과 본문을 저장 버튼으로 함께 확정한다. 슬래시 메뉴, Markdown shortcut, 블록 이동, 선택 서식 도구와 R2 이미지 업로드를 제공한다.
- 문서를 열 때 받은 버전을 `If-Match`로 보내고 `412 Precondition Failed`이면 로컬 편집본을 유지한 채 최신 저장본을 함께 제시한다. 자동 병합하지 않으며 브라우저 포커스 복귀 때 전체 트리와 열린 문서를 HTTP로 재검증한다.

## 상태 관리

- URL에서 복원 가능한 선택 상태는 URL query 또는 route params로 둔다.
- 서버에서 조회한 데이터는 서버 컴포넌트에서 먼저 가져온다.
- 입력 중인 draft, dialog open 여부, drag 상태처럼 화면 상호작용에 묶인 값은 가까운 client component나 전용 hook에 둔다.
- 저장 실패처럼 사용자에게 알려야 하는 상태는 fire-and-forget으로 숨기지 않고 화면 상태로 노출한다.

## 테스트 기준

- feature 동작은 사용자가 보는 UI와 command 경계 위주로 검증한다.
- 외부 API는 포트 mock으로 대체한다.
- mapper와 URL 정책처럼 작은 순수 로직은 단위 테스트로 고정한다.
- overlay 계열 컴포넌트는 `apps/*/src/test`의 테스트 mock을 사용해 포털과 포커스 구현 세부사항에 테스트가 묶이지 않게 한다.

## 관련 문서

- `CONTEXT.md`: 제품과 런타임 경계.
- `ARCHITECTURE.md`: 모노레포 구조와 공개 경계.
- `DOMAIN.md`: 도메인 모델과 불변식.
- `BACKEND.md`: API, DB, 인증, 운영 경계.
- `docs/design`: 브랜드, foundation, component, pattern, asset, accessibility, IA, 화면 UX의 단일 진실 원천.
- `docs/design/text-localization-policy.md`: 텍스트 현지화 원칙.
