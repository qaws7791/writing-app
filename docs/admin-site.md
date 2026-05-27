# 어드민 사이트

## 2026-05-27 설계 시작

- 어드민 사이트는 학습자 플랫폼과 분리된 운영 도구로 설계한다.
- 1차 목표는 관리자 로그인, 대시보드 레이아웃, 콘텐츠 계층 조회, 사용자 목록 조회다.
- 콘텐츠 생성, 수정, 삭제와 사용자 관리 기능은 2차 목표로 미룬다.
- 플랫폼과 어드민은 프론트엔드 Next.js, 백엔드 Hono 구조를 동일하게 가져간다.
- 어드민 프론트엔드와 백엔드는 별도 런타임으로 두며, 구동되지 않아도 플랫폼의 모든 기능은 정상 동작해야 한다.

## 2026-05-27 설계 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-27-admin-site-design.md`에 작성했다.
- 권장 구조는 `apps/admin` Next.js 앱과 `apps/admin-api` Hono API 서버를 별도로 두고 같은 DB를 공유하는 방식이다.
- 관리자 인증은 Better Auth 기반 ID/password를 사용하되, 플랫폼 인증과 테이블, 쿠키, origin 설정을 분리한다.
- 최초 관리자 계정은 DB 시드 명령으로 생성한다.
- 어드민 API는 별도 서버 자체를 boundary로 보고 `/admin` prefix 없이 `GET /courses?include=chapters,lessons`, `GET /users` 같은 RESTful 리소스 경로를 사용한다.
- 어드민 UI는 shadcn `sidebar-07` 블록 구조를 참고한 왼쪽 사이드바 대시보드 레이아웃을 사용한다.

## 2026-05-27 구현 계획 완료

- 구현 계획은 `docs/superpowers/plans/2026-05-27-admin-site.md`에 작성했다.
- 계획은 공유 DB와 core 계약, `apps/admin-api`, `apps/admin`, 문서와 전체 검증 순서로 나뉜다.
- 각 task는 실패 테스트 작성, 실패 확인, 최소 구현, 검증, 커밋 단위로 진행한다.

## 2026-05-27 구현 시작

- `apps/admin`과 `apps/admin-api`를 추가해 어드민을 플랫폼과 별도 런타임으로 구현한다.
- 구현 순서는 `docs/superpowers/plans/2026-05-27-admin-site.md`의 작업 1부터 작업 10까지 따른다.
- 1차 구현 범위는 관리자 로그인, 보호된 사이드바 레이아웃, 콘텐츠 계층 조회, 사용자 기본 목록 조회다.

## 2026-05-28 작업 2 시작

- 관리자 인증은 플랫폼 사용자 인증과 분리된 DB 테이블을 사용한다.
- `packages/db`에 `admin_user`, `admin_session`, `admin_account`, `admin_verification` 스키마와 마이그레이션을 추가한다.

## 2026-05-28 작업 2 완료

- 관리자 인증 Drizzle 스키마와 `0002-admin-auth.sql` 마이그레이션을 추가했다.
- 콘텐츠 마이그레이션 실행 시 관리자 인증 테이블도 함께 생성되도록 연결했다.
- `packages/db` 클라이언트 테스트에서 관리자 인증 테이블 생성과 `admin_user` insert를 검증한다.

## 2026-05-28 작업 3 시작

- `packages/core`에 어드민 콘텐츠 계층 조회와 사용자 목록 조회 계약을 추가한다.
- 어드민 API가 구현될 때 사용할 DTO, 오류 DTO, repository port, service를 먼저 고정한다.

## 2026-05-28 작업 3 완료

- 어드민 콘텐츠 트리와 사용자 목록 DTO 스키마를 추가했다.
- 어드민 조회 repository port와 service를 추가하고 repository 응답 검증 실패를 DB 사용 불가 결과로 처리한다.
- `packages/core` public export와 `@workspace/core/admin` subpath export에 어드민 모듈을 연결했다.
- 코드 품질 리뷰 반영으로 repository 예외, 사용자 이메일, 사용자 일시 DTO 검증 실패가 모두 `database-unavailable` 결과로 변환되는지 테스트를 보강했다.

## 2026-05-28 작업 4 시작

- `packages/db`에 어드민 콘텐츠 계층 조회와 플랫폼 사용자 목록 조회 repository 구현을 추가한다.
- 구현 전 실패 테스트로 `AdminRepository` 계약과 DB row 매핑을 검증한다.

## 2026-05-28 작업 4 완료

- `createDrizzleAdminRepository`를 추가해 콘텐츠 코스, 챕터, 레슨 계층과 플랫폼 사용자 목록을 조회한다.
- `@workspace/db` root export에서 어드민 repository를 사용할 수 있게 연결했다.
- `packages/db` typecheck가 `@workspace/core/admin` subpath를 해석하도록 admin path mapping을 추가했다.
- 수동 fixture 기반 테스트로 코스, 챕터, 레슨의 정확한 row mapping과 정렬 순서, 사용자 createdAt 오름차순 정렬을 검증한다.

## 2026-05-28 작업 5 시작

- `apps/admin-api` Hono 앱 뼈대와 관리자 인증 runtime을 추가한다.
- 플랫폼 API 패턴을 따르되 Better Auth 테이블, 쿠키 prefix, CORS origin은 어드민 전용 설정으로 분리한다.

## 2026-05-28 작업 5 완료

- `apps/admin-api` workspace 패키지와 TypeScript, ESLint, Vitest 설정을 추가했다.
- 어드민 전용 환경 변수 파서, DB 디렉터리 생성 helper, Hono 앱, health/auth 라우트, 서버 entrypoint를 추가했다.
- Better Auth runtime은 관리자 인증 테이블과 `writing-app-admin` 쿠키 prefix를 사용하도록 분리했다.
- `vitest.workspace.ts`에 어드민 API 테스트 프로젝트를 연결했다.

## 2026-05-28 작업 6 시작

- `apps/admin-api`에 관리자 인증으로 보호되는 콘텐츠 계층 조회와 사용자 목록 조회 REST route를 추가한다.
- OpenAPI JSON route를 함께 등록해 어드민 API 조회 surface를 문서화한다.

## 2026-05-28 작업 6 완료

- `GET /courses?include=chapters,lessons`와 `GET /users`를 관리자 세션 필수 route로 등록했다.
- `GET /courses`의 누락되거나 다른 include query는 `invalid-request` 400 응답으로 처리한다.
- `GET /openapi.json`에서 어드민 API OpenAPI 3.1 문서를 반환하도록 등록했다.

## 2026-05-28 작업 7 시작

- 최초 관리자 계정을 생성하는 어드민 API 시드 명령을 추가한다.
- 동일 이메일 시드 실행은 중복 생성 없이 기존 계정 존재 결과를 반환하도록 검증한다.

## 2026-05-28 작업 7 완료

- `apps/admin-api`에 최초 관리자 계정 시드 스크립트와 테스트를 추가했다.
- 시드는 Better Auth 공개 password hash API로 credential account를 만들고, 같은 이메일이 있으면 중복 생성하지 않는다.
- `seed:admin` 명령으로 마이그레이션 실행 후 시드 결과를 JSON으로 출력하도록 연결했다.

## 2026-05-28 작업 7 리뷰 반영

- Better Auth 로그인 조회와 맞도록 시드 이메일을 소문자로 정규화한다.
- `apps/admin-api` 테스트는 기존 Vitest 설정을 유지하고, 시드 단위 테스트는 SQLite runtime에 직접 묶이지 않도록 분리한다.

## 2026-05-28 작업 8 시작

- `apps/admin` Next.js 앱 뼈대와 어드민 API 클라이언트를 추가한다.
- 기존 `apps/web` 설정과 Next 16 문서의 async `cookies()` 사용 방식을 확인한 뒤 같은 패턴으로 구성한다.
- API 클라이언트는 실패 테스트를 먼저 작성해 요청 URL, credential 전달, 오류 결과 매핑을 고정한다.

## 2026-05-28 작업 8 완료

- `apps/admin` workspace 패키지와 Next.js, ESLint, PostCSS, shadcn, Vitest 설정을 추가했다.
- 어드민 앱 root layout은 한국어 metadata, `Noto_Sans_KR`, `ThemeProvider`, `Toaster`를 기존 web 앱 패턴과 맞춰 구성했다.
- fetch 기반 어드민 API 클라이언트와 서버 쿠키 전달 helper를 추가하고, 콘텐츠 트리와 사용자 목록 요청, non-ok 오류 결과 매핑을 테스트로 검증했다.

## 2026-05-28 작업 8 리뷰 반영

- `ADMIN_API_BASE_URL`을 Turbo 전역 환경 변수에 추가해 어드민 앱 lint 경고를 제거한다.
- 어드민 API 클라이언트는 네트워크 실패와 잘못된 JSON 응답을 명시적 오류 결과로 반환한다.
- 새 어드민 앱에 TypeScript 빌드 산출물 ignore 설정을 추가한다.

## 2026-05-28 작업 9 시작

- 관리자 로그인 페이지와 same-origin 인증 프록시를 추가한다.
- 보호된 어드민 영역은 세션 확인 후 왼쪽 사이드바 shell로 렌더링한다.
- 루트 경로는 콘텐츠 운영의 기본 진입점인 `/courses`로 연결한다.

## 2026-05-28 작업 9 완료

- 관리자 로그인 next path 검증, 이메일 로그인 클라이언트, same-origin 인증 프록시를 추가했다.
- `/api/auth/[...path]` route handler가 어드민 API 인증 route로 GET/POST 요청을 전달하도록 연결했다.
- 로그인 페이지, 보호 layout, 왼쪽 사이드바 기반 `AdminShell`, 루트 `/courses` redirect를 추가했다.
- 로그인 성공/실패와 인증 navigation/proxy/client 동작을 테스트로 검증했다.

## 2026-05-28 작업 9 리뷰 반영

- 사이드바 메뉴는 1차 범위인 콘텐츠와 사용자 조회로 제한한다.
- 동작 없는 관리자 footer 버튼을 제거한다.
- 로그인 요청 중 중복 제출을 막는 guard를 추가한다.

## 2026-05-28 작업 10 시작

- 콘텐츠와 사용자 조회 화면을 추가한다.
- 코스, 챕터, 레슨 계층과 사용자 기본 정보를 읽기 전용으로 표시한다.

## 2026-05-28 작업 10 완료

- `/courses`에서 코스, 챕터, 레슨 계층을 읽기 전용 카드와 접기 UI로 표시한다.
- `/users`에서 사용자 이름, 이메일, 이메일 인증 상태, 가입일을 표로 표시한다.
- 두 조회 화면 모두 조회 결과가 없을 때 접근 가능한 빈 상태를 렌더링한다.

## 2026-05-28 작업 10 리뷰 반영

- 콘텐츠 조회 화면은 코스에 챕터가 없거나 챕터에 레슨이 없을 때도 중첩 빈 상태 문구를 표시한다.
- 중첩 빈 상태 테스트를 추가해 빈 카드나 빈 레슨 목록이 렌더링되지 않도록 검증한다.

## 2026-05-28 작업 11 시작

- 어드민 앱과 어드민 API가 추가된 현재 구조를 `ARCHITECTURE.md`, `BACKEND.md`, `FRONTEND.md`에 반영한다.
- 전체 테스트, 타입체크, 린트, pre-commit, 로컬 실행, 플랫폼 독립성 검증으로 1차 구현을 마무리한다.

## 2026-05-28 구현 완료

- `apps/admin`과 `apps/admin-api`를 추가했다.
- 관리자 Better Auth 테이블은 `admin_*`로 분리했다.
- 최초 관리자 계정은 `bun --filter @workspace/admin-api seed:admin`으로 생성한다.
- 어드민 화면은 shadcn Sidebar 기반 왼쪽 사이드바 레이아웃을 사용한다.
- 콘텐츠 계층 조회와 사용자 기본 정보 조회를 읽기 전용으로 제공한다.
- 전체 검증은 admin, admin-api, platform API, platform web 테스트와 pre-commit으로 확인한다.

## 2026-05-28 작업 11 검증 보정

- `packages/db` root export가 어드민 repository를 노출하면서 플랫폼 API 타입체크도 `@workspace/core/admin` subpath를 해석해야 한다.
- `apps/api` TypeScript path mapping에 core admin 도메인을 추가해 플랫폼 API 타입체크가 workspace source export를 일관되게 해석하도록 보정한다.
- `bun dev:admin` 실행 시 Turbo strict env가 어드민 API 인증 환경 변수를 전달하도록 `turbo.json` 전역 환경 변수 목록을 보강한다.
- `apps/api` lint는 기존 `BUN_EXECUTABLE`, `HOME` Turbo env 경고 2개를 출력하지만 종료 코드 `0`으로 통과한다.

## 2026-05-28 통합 리뷰 반영

- `BACKEND.md`의 최초 관리자 시드 환경 변수 표에서 실제 구현에 없는 `ADMIN_SEED_EMAIL_VERIFIED` 항목을 제거한다.
- 구현 계획 문서의 영어 라벨을 한국어로 정리해 문서 작성 규칙을 맞춘다.

## 2026-05-28 운영 환경 설정 정리

- `apps/admin`에 `ADMIN_API_BASE_URL` 예시 환경 파일을 추가한다.
- `apps/admin-api/.env.example`에 운영에서 반드시 교체해야 하는 관리자 인증 비밀값과 최초 관리자 시드 변수를 명시한다.
- `docs/operations-environment.md`에 학습자 플랫폼과 어드민의 dev/prod 환경 변수, 비밀값 분리 원칙, 배포 체크리스트를 정리한다.

## 2026-05-28 공유 SQLite 경로 정리 시작

- 플랫폼 API와 어드민 API가 같은 로컬 SQLite 파일을 보도록 기본 개발 경로를 저장소 루트 `data/api.sqlite`로 통일한다.
- 앱별 `data` 디렉터리에 DB가 따로 생성되지 않도록 환경 변수 예시와 DB 시드 기본 경로를 함께 보정한다.

## 2026-05-28 공유 SQLite 경로 정리 완료

- `apps/api/.env.example`과 `apps/admin-api/.env.example`의 `DATABASE_URL`을 앱 패키지 기준 `file:../../data/api.sqlite`로 맞췄다.
- `packages/db`의 콘텐츠 시드 기본 경로와 Drizzle 기본 DB 경로도 저장소 루트 `data/api.sqlite`를 가리키도록 보정했다.
- 로컬 검증용 SQLite는 루트 `data/api.sqlite`로 합치고 앱별 `data` 디렉터리는 백업 후 제거한다.

## 2026-05-28 개발용 어드민 부트스트랩 시작

- SQLite 파일이 없는 상태에서 `bun run dev:admin`만 실행해도 로컬 어드민에 로그인할 수 있어야 한다.
- 개발 실행 전에 루트 `data/api.sqlite`에 콘텐츠 시드와 개발용 관리자 계정을 보장하도록 스크립트를 보정한다.

## 2026-05-28 개발용 어드민 부트스트랩 완료

- 루트 `dev:admin` 스크립트가 먼저 `dev:admin:setup`을 실행하도록 변경했다.
- `dev:admin:setup`은 콘텐츠 시드와 `admin@example.com / password-1234` 개발용 관리자 계정을 루트 `data/api.sqlite`에 생성한다.
- 같은 이메일이 이미 있으면 관리자 시드는 중복 생성하지 않는다.

## 2026-05-28 개발용 관리자 비밀번호 동기화 시작

- `ADMIN_SEED_PASSWORD`를 지정해 `bun run dev:admin`을 실행하면 해당 비밀번호로 로그인할 수 있어야 한다.
- 기존 관리자 계정이 있더라도 개발 setup에서는 seed 비밀번호를 현재 환경 변수 값으로 맞춘다.

## 2026-05-28 개발용 관리자 비밀번호 동기화 완료

- `dev:admin`과 `dev:admin:setup`은 외부에서 전달된 `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `DATABASE_URL`, 관리자 인증 환경 변수를 우선 사용한다.
- `dev:admin:setup`은 `ADMIN_SEED_RESET_PASSWORD=true`로 seed를 실행해 기존 개발 관리자 credential 비밀번호를 현재 `ADMIN_SEED_PASSWORD` 값으로 갱신한다.
- 운영용 `seed:admin`은 `ADMIN_SEED_RESET_PASSWORD=true`를 명시하지 않으면 기존 관리자 비밀번호를 바꾸지 않는다.

## 2026-05-28 Windows Bun SQLite 디렉터리 보장 수정 시작

- Windows Bun 환경에서 이미 존재하는 상대 상위 디렉터리에 `mkdirSync(..., { recursive: true })`를 다시 호출하면 `EEXIST`가 발생할 수 있다.
- API와 어드민 API의 SQLite 부모 디렉터리 보장 로직이 기존 디렉터리를 정상 상태로 처리하도록 보정한다.

## 2026-05-28 Windows Bun SQLite 디렉터리 보장 수정 완료

- `ensureDatabaseDirectory`가 SQLite 부모 경로를 절대 경로로 정규화한 뒤 기존 디렉터리 여부를 먼저 확인하도록 변경했다.
- 기존 DB 파일이 있는 상대 상위 디렉터리 경로에서도 API와 어드민 API 환경 테스트가 실패하지 않도록 회귀 테스트를 추가했다.
