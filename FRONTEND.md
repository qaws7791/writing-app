# 프론트엔드 개발 가이드

이 문서는 `apps/web`, `apps/admin`, `packages/ui`를 개발할 때 따르는 프론트엔드 원칙을 정리한다. 모든 문서와 사용자 노출 텍스트는 한국어를 기본으로 하며, 기술 고유명사와 코드 식별자는 원문을 유지한다.

## 기본 원칙

- 기능 기준으로 파일을 모은다. 기술 종류별 `components`, `hooks`, `utils` 묶음보다 `features/courses`, `features/lessons`처럼 변경 이유가 같은 코드를 가까이 둔다.
- 앱은 조립자 역할을 한다. 비즈니스 규칙은 가능한 한 `packages/core` 또는 feature 내부 순수 함수에 둔다.
- 외부 API 응답은 화면에 바로 넘기지 않는다. API mapper 또는 runtime schema parse로 내부 모델에 맞춘다.
- 클라이언트 컴포넌트는 상호작용 상태가 필요할 때만 사용한다. 서버 컴포넌트에서 충분한 조회는 서버에서 처리한다.
- 공유 UI는 `packages/ui`에 둔다. 앱 전용 조합, 데이터 조회, 라우팅 정책은 각 앱에 둔다.

## 현재 앱 라우트

### 학습자 웹

- `/`: 랜딩 페이지.
- `/login`: 로그인 페이지.
- `/app`: 인증이 필요한 학습 홈.
- `/app/courses`: 코스 목록과 카테고리.
- `/app/courses/[id]`: 코스 상세와 커리큘럼.
- `/app/lesson?lesson_id=...`: step 기반 레슨 진행 화면.
- `/api/auth/*`: `apps/api` 인증 endpoint로 요청을 전달하는 프록시.

### 어드민 웹

- `/`: `/courses`로 redirect한다.
- `/login`: 관리자 로그인 페이지.
- `/courses`: 코스 목록.
- `/courses/[id]`: 현재 공개 커리큘럼을 직접 편집하는 코스 편집기.
- `/users`: 사용자 목록.
- `/api/auth/*`: `apps/admin-api` 인증 endpoint로 요청을 전달하는 프록시.

## 데이터 접근 경계

`apps/web`는 `WritingAppApi` 포트만 사용한다. HTTP 구현은 `src/lib/api/http`에 있고, 테스트와 일부 로컬 흐름은 fake adapter로 같은 포트를 구현한다. OpenAPI 생성 타입은 `src/lib/api/generated`에 격리하고, feature 컴포넌트는 내부 mapper 결과만 사용한다.

`apps/admin`은 `AdminApi` 포트만 사용한다. 서버 컴포넌트는 `getServerAdminApi()`로 현재 요청 쿠키를 어드민 API에 전달한다. 관리자 로그인은 same-origin `/api/auth/*` 프록시를 통해 처리한다.

## 인증과 redirect

학습자 앱의 보호 라우트는 `apps/web/src/app/app/layout.tsx`에서 현재 사용자를 확인하고, 없으면 `/login`으로 보낸다. 로그인 `next` 값은 `src/lib/auth/auth-navigation.ts`의 허용 규칙을 통과해야 한다.

어드민 앱의 보호 라우트는 `apps/admin/src/app/(admin)/layout.tsx`에서 `GET /session` 결과를 확인한다. 실패하면 어드민 로그인 경로로 redirect한다.

## UI와 접근성

- 버튼, dialog, dropdown, form control은 `packages/ui` 컴포넌트를 우선 사용한다.
- destructive 동작은 즉시 실행하지 않고 `AlertDialog` 같은 화면 계층 확인 UI를 거친다.
- 성공/오류 상태는 문자열 포함 여부로 판단하지 않는다. `{ kind; message }` 같은 명시적 타입을 사용한다.
- 오류 안내는 가능한 `role="alert"`를 사용하고, 일반 상태 안내는 `role="status"`를 사용한다.
- 화면 텍스트와 `aria-label`은 한국어로 작성한다.

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
- `docs/text-localization-policy.md`: 텍스트 현지화 원칙.
