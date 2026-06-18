# 프론트엔드 개발 가이드

이 문서는 `apps/web`, `apps/admin`, `packages/ui`를 개발할 때 따르는 프론트엔드 원칙을 정리한다. 모든 문서와 사용자 노출 텍스트는 한국어를 기본으로 하며, 기술 고유명사와 코드 식별자는 원문을 유지한다.

## 기본 원칙

- 기능 기준으로 파일을 모은다. 기술 종류별 `components`, `hooks`, `utils` 묶음보다 `features/courses`, `features/lessons`처럼 변경 이유가 같은 코드를 가까이 둔다.
- 앱은 조립자 역할을 한다. 비즈니스 규칙은 가능한 한 `packages/core` 또는 feature 내부 순수 함수에 둔다.
- 외부 API 응답은 화면에 바로 넘기지 않는다. API mapper 또는 runtime schema parse로 내부 모델에 맞춘다.
- 클라이언트 컴포넌트는 상호작용 상태가 필요할 때만 사용한다. 서버 컴포넌트에서 충분한 조회는 서버에서 처리한다.
- 공유 UI는 `packages/ui`에 둔다. 앱 전용 조합, 데이터 조회, 라우팅 정책은 각 앱에 둔다.

## 2026-06-15 HTTP 클라이언트 응답 계약 검증 시작

- 학습자 웹과 어드민 웹의 HTTP 클라이언트는 성공 응답 JSON을 타입 캐스팅만 하지 않고 endpoint별 런타임 스키마로 검증한다.
- 성공 응답이 계약과 다르면 network 오류가 아니라 contract 오류로 분리한다.
- 실패 응답의 서버 오류 코드 변환 계약은 기존 상태를 유지한다.

## 2026-06-15 HTTP 클라이언트 응답 계약 검증 완료

- 어드민 HTTP 클라이언트는 core/admin DTO 스키마로 모든 성공 응답을 검증한다.
- 학습자 HTTP 클라이언트는 콘텐츠, 프로필, 진행, 저장, 완료, AI 코칭 성공 응답을 런타임 스키마로 검증한다.
- JSON 파싱 실패와 스키마 불일치는 `contract-error`로 반환하고, fetch 실패만 `network-error`로 반환한다.

## 2026-06-17 HTTP 네트워크 오류 값 처리

- 학습자 웹과 어드민 웹의 HTTP adapter는 `fetch` 예외를 `null`로 병합하지 않고 `@workspace/http-client`의 명시적 result로 처리한다.
- `network-error`는 사용자 메시지와 별개로 원인, method, query가 제거된 URL, 실패 분류를 보존한다.
- 화면은 네트워크 오류 원인을 직접 노출하지 않는다. 로깅, 리포팅, 재시도 정책만 구조화된 `network` 값을 사용한다.

## 현재 앱 라우트

아래 라우트는 Kwep 피벗의 목표 라우트다. 현재 reset 단계에서는 `apps/web/src`, `apps/admin/src`, `packages/ui/src`의 기존 구현을 제거했고, 후속 Task에서 같은 monorepo 골격 위에 새 화면을 작성한다.

### 학습자 웹

- `/`: 랜딩 페이지.
- `/login`: 로그인 페이지.
- `/app`: 인증이 필요한 학습 홈.
- `/app/courses`: 코스 목록과 카테고리.
- `/app/courses/[id]`: 코스 상세와 커리큘럼.
- `/app/lesson?lesson_id=...`: 시작 화면을 포함한 step 기반 레슨 진행 화면.
- `/app/profile`: 사용자 정보, 가입일, 완료 레슨, 연속 학습일, 라이트/다크/시스템 테마 전환.

### 어드민 웹

- `/`: `/courses`로 redirect한다.
- `/login`: 관리자 로그인 페이지.
- `/dashboard` 또는 `/`: 운영 대시보드.
- `/courses`: 코스 목록.
- `/courses/[id]`: 현재 공개 커리큘럼을 직접 편집하는 코스/레슨/스텝 편집기.
- `/users`: 사용자 목록.
- `/users/[id]`: 사용자 상세, 상태 변경, 삭제 요청 처리.
- `/analytics`: 가입, 완료, 연속 학습일, 레슨별 완료율과 이탈률 분석.
- `/settings`: 공지, 약관, 개인정보처리방침, 콘텐츠 초기화.

## 데이터 접근 경계

`apps/web`는 `WritingAppApi` 포트만 사용한다. HTTP 구현은 `src/lib/api/http`에 있고, 테스트와 일부 로컬 흐름은 fake adapter로 같은 포트를 구현한다. OpenAPI 생성 타입은 `src/lib/api/generated`에 격리하고, feature 컴포넌트는 내부 mapper 결과만 사용한다.

`apps/admin`은 `AdminApi` 포트만 사용한다. 서버 컴포넌트는 `getServerAdminApi()`로 현재 요청 쿠키를 어드민 API에 전달한다. 관리자 로그인은 `ADMIN_API_BASE_URL`의 Hono API `/api/auth/*` endpoint를 직접 호출한다.

## 인증과 redirect

학습자 앱의 보호 라우트는 `apps/web/src/app/app/layout.tsx`에서 현재 사용자를 확인하고, 없으면 `/login`으로 보낸다. 로그인 `next` 값은 `src/lib/auth/auth-navigation.ts`의 허용 규칙을 통과해야 한다.

학습자 로그인은 `NEXT_PUBLIC_API_BASE_URL`의 Hono API `/api/auth/*` endpoint를 직접 호출한다. 브라우저 요청은 `credentials: "include"`를 사용하고, API는 `CORS_ORIGIN`과 Better Auth `trustedOrigins`로 학습자 웹 origin을 허용한다.

어드민 앱의 보호 라우트는 `apps/admin/src/app/(admin)/layout.tsx`에서 `GET /session` 결과를 확인한다. 실패하면 어드민 로그인 경로로 redirect한다.

관리자 로그인은 ID/password만 지원하고 `ADMIN_API_BASE_URL`의 Hono API `/api/auth/sign-in/email` endpoint를 직접 호출한다. 브라우저 요청은 `credentials: "include"`를 사용하고, 어드민 API는 `ADMIN_CORS_ORIGIN`과 Better Auth `trustedOrigins`로 어드민 웹 origin을 허용한다. 로그인 `next` 경로 검증은 `admin-auth-navigation.ts`가 단일 출처이며, 로그인 성공 후 이동은 `next/navigation`의 router를 사용한다. 어드민 앱 source에서 `window.location.*` 직접 이동은 금지한다.

## UI와 접근성

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
- 홈은 진행 중인 코스, 다음 레슨, 전체 학습 맥락, 현재 연속 학습일을 보여준다.
- 코스 상세는 유닛별 커리큘럼과 레슨의 완료, 진행 가능, 잠금 상태를 보여준다.
- 레슨은 시작 화면을 먼저 보여주고 사용자가 시작한 뒤 첫 스텝으로 진입한다.
- 답변 가능 스텝은 타입별 JSON으로 자동 저장하며, 저장 실패는 한국어 오류로 노출한다.
- 채점 가능한 스텝은 `isLessonStepCheckable` 타입 가드로 좁힌 뒤 채점하고, 잘못된 payload 타입은 오답으로 처리한다.
- 매칭 스텝의 표시 순서, 선택 전이, 정답 판정, 저장 payload 변환은 `packages/core`의 순수 정책을 단일 출처로 사용한다.
- AI 코칭 스텝은 총평, 잘된 점, 개선점, 다음 시도, 남은 재시도 횟수를 보여준다.

## 어드민 경험

- 어드민은 학습자 인증과 분리된 관리자 로그인을 사용한다.
- 콘텐츠 관리는 코스 검색, 카테고리 필터, 페이지 크기, 페이지 이동, 새 코스 생성, 코스 보관을 제공한다.
- 코스 편집은 유닛, 레슨 배치, 레슨 추가/보관, 순서 변경, 10개 Kwep 스텝 타입별 편집 폼을 제공한다.
- 사용자 관리는 검색, 상태 필터, 정렬, 페이지 이동, 정지/복구, 삭제 요청 처리를 제공한다.
- 분석 화면의 차트는 새 의존성 없이 SVG 또는 CSS 기반 컴포넌트로 우선 구현한다.

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
