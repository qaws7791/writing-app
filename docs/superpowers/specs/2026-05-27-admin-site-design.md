# 어드민 사이트 설계

## 배경

현재 플랫폼은 학습자용 `apps/web` Next.js 앱과 `apps/api` Hono API 서버를 중심으로 구성되어 있다. 운영자는 콘텐츠 구조와 사용자 계정 상태를 확인해야 하지만, 초기 범위에서 콘텐츠 생성, 수정, 삭제 같은 관리 기능은 제외한다.

이번 설계의 목적은 플랫폼과 어드민을 런타임에서 분리하면서도 같은 모노레포와 데이터베이스를 활용하는 읽기 전용 어드민 MVP를 정의하는 것이다. 어드민 프론트엔드와 어드민 백엔드가 구동되지 않아도 학습자 플랫폼의 모든 기능은 정상 동작해야 한다.

## 목표

- `apps/admin` Next.js 앱을 별도로 둔다.
- `apps/admin-api` Hono API 서버를 별도로 둔다.
- 플랫폼과 어드민은 모두 프론트엔드 Next.js, 백엔드 Hono 구조를 따른다.
- 같은 SQLite 데이터베이스를 사용하되 관리자 인증 테이블은 플랫폼 인증 테이블과 분리한다.
- 관리자 로그인, 어드민 대시보드 레이아웃, 콘텐츠 계층 조회, 사용자 목록 조회를 제공한다.
- 어드민 앱과 어드민 API가 꺼져 있어도 `apps/web`과 `apps/api`는 런타임 의존 없이 동작한다.

## 제외 범위

- 콘텐츠 생성, 수정, 삭제, 공개 상태 변경
- 사용자 정지, 권한 변경, 계정 삭제
- 관리자 초대, 관리자 생성 UI, 관리자 권한 세분화
- 2FA, SSO, IP allowlist, VPN 같은 강화 보안
- 별도 데이터베이스 또는 read replica 구성
- 운영 지표 대시보드와 AI 사용량 분석

## 접근 대안

### 대안 A: 별도 앱, 별도 API, 공유 DB

`apps/admin`과 `apps/admin-api`를 추가하고, 어드민 API가 같은 DB를 읽는다. 관리자 인증 테이블은 플랫폼 인증 테이블과 분리한다.

장점은 플랫폼과 어드민의 런타임 경계가 명확하고, 플랫폼 장애 전파와 어드민 장애 전파를 줄일 수 있다는 점이다. 프론트엔드와 백엔드 기술 구조도 플랫폼과 일관된다. 단점은 앱과 API 서버가 하나씩 늘어나 로컬 실행, 환경 변수, 배포 설정이 추가된다는 점이다.

### 대안 B: 별도 앱, 기존 플랫폼 API 확장

`apps/admin`은 별도로 만들고, `apps/api`에 어드민 전용 route를 추가한다.

장점은 구현량이 적고 기존 API 조립 구조를 재사용할 수 있다는 점이다. 단점은 플랫폼 API가 어드민 책임을 알게 되어 경계가 흐려지고, 장기적으로 관리자 기능이 커질수록 플랫폼 API의 책임이 넓어진다는 점이다.

### 대안 C: 별도 앱, 별도 API, 별도 DB

어드민 런타임과 데이터 저장소까지 완전히 분리한다.

장점은 보안과 운영 격리가 강하다는 점이다. 단점은 현재 읽기 전용 MVP에는 과하고, 콘텐츠와 사용자 데이터를 동기화하는 별도 경로가 필요해진다는 점이다.

## 권장안

대안 A를 채택한다. 현재 목표는 읽기 전용 어드민 MVP이므로 별도 DB까지 분리하는 것은 과하지만, 어드민 API를 플랫폼 API 안에 넣으면 이후 관리 기능이 들어올 때 경계가 흐려질 가능성이 크다.

따라서 어드민은 별도 Next.js 앱과 별도 Hono API 서버로 시작한다. DB는 공유하되 관리자 인증 테이블, 쿠키, 환경 변수, API origin은 플랫폼과 분리한다. 플랫폼 앱과 플랫폼 API는 어드민 앱/API를 import하거나 호출하지 않는다.

## 런타임 구조

```text
apps/web        -> apps/api       -> packages/db -> SQLite
apps/admin      -> apps/admin-api -> packages/db -> SQLite
apps/docs       -> OpenAPI 문서와 프로젝트 문서
```

- `apps/web`: 학습자용 Next.js 앱, 기본 포트 `3000`
- `apps/api`: 학습자용 Hono API 서버, 기본 포트 `4000`
- `apps/admin`: 어드민 Next.js 앱, 기본 포트 `3001`
- `apps/admin-api`: 어드민 Hono API 서버, 기본 포트 `4001`
- `apps/docs`: 문서 앱, 기본 포트 `3002`

어드민 런타임은 플랫폼 런타임의 필수 조건이 아니다. `apps/admin`과 `apps/admin-api`가 시작되지 않아도 `apps/web`과 `apps/api`는 기존 기능을 제공해야 한다.

## 인증과 데이터 격리

어드민 인증은 Better Auth 기반 ID/password 방식으로 구성한다. 플랫폼 Better Auth와 같은 라이브러리를 사용하되 설정과 저장 테이블은 분리한다.

- `apps/admin-api`가 어드민 전용 Better Auth 인스턴스를 가진다.
- 관리자 계정은 플랫폼 `user` 테이블이 아니라 별도 관리자 테이블을 사용한다.
- 관리자 세션, 계정, 검증 테이블도 플랫폼 인증 테이블과 분리한다.
- 쿠키 이름, base URL, CORS origin, trusted origin은 어드민 전용으로 둔다.
- 최초 관리자 계정은 seed 명령으로 생성한다.
- seed는 이미 관리자 계정이 있으면 중복 생성하지 않는다.
- 비밀번호는 평문으로 저장하지 않고 Better Auth가 사용하는 해시 경로를 따른다.

초기 관리자 생성은 운영 로그인 방식이 아니라 부트스트랩 절차다. 1차 범위에서는 관리자 초대와 생성 UI를 제공하지 않는다.

## API 설계

어드민 API는 별도 서버 자체가 보안 boundary이므로 경로에 `/admin` prefix를 반복하지 않는다. 화면 이름보다 도메인 리소스 이름을 사용한다.

초기 API는 읽기 전용으로 제한한다.

```text
GET /health
GET /openapi.json

GET /api/auth/*
POST /api/auth/*

GET /courses?include=chapters,lessons
GET /users
```

`GET /courses?include=chapters,lessons`는 코스, 챕터, 레슨을 한 번에 계층형으로 반환한다. `include`는 1차에서 `chapters,lessons`만 지원한다. 이후 관리 기능이 들어오면 같은 리소스 위에 다음 API를 확장할 수 있다.

```text
POST /courses
PATCH /courses/:courseId
DELETE /courses/:courseId

POST /courses/:courseId/chapters
PATCH /chapters/:chapterId
DELETE /chapters/:chapterId

POST /chapters/:chapterId/lessons
PATCH /lessons/:lessonId
DELETE /lessons/:lessonId
```

사용자 목록은 1차에서 기본 계정 정보만 반환한다. 학습 요약, 완료 레슨 수, AI 피드백 사용량은 운영 지표 요구가 구체화된 뒤 추가한다.

## 어드민 화면

`apps/admin`은 운영 도구에 맞는 전통적인 대시보드 구조를 사용한다. 랜딩 페이지나 hero 구성을 두지 않는다.

초기 라우트는 다음과 같다.

```text
/login
/
/courses
/users
```

- `/login`: 관리자 ID/password 로그인 화면
- `/`: 로그인 후 기본 진입점. 1차에서는 `/courses`로 리다이렉트하거나 빈 대시보드 shell을 둔다.
- `/courses`: 코스, 챕터, 레슨 계층형 조회
- `/users`: 이름, 이메일, 가입일, 최근 로그인 중심 사용자 목록

`/courses`는 운영자가 전체 콘텐츠 구조를 빠르게 훑어볼 수 있게 한다. 코스 행을 펼치면 챕터가 보이고, 챕터를 펼치면 레슨 제목, 순서, 기본 메타데이터가 보이는 구조를 우선한다.

`/users`는 학습 요약 없이 기본 계정 정보만 보여준다. 목록 조회를 먼저 안정화하고, 학습 진행 요약과 피드백 이력은 2차 범위로 남긴다.

## 사이드바 레이아웃

사이드바는 shadcn `sidebar-07` 블록의 구조를 참고한다. 이 블록은 `SidebarProvider`, `SidebarInset`, 축소 가능한 `Sidebar`, 접히는 주 메뉴, footer 사용자 메뉴를 제공한다.

구현은 원본 블록을 그대로 복사하지 않고, 현재 `packages/ui`의 shadcn 컴포넌트를 조합한다.

- `SidebarProvider` 안에 `AdminSidebar`와 `SidebarInset`을 배치한다.
- 사이드바는 `collapsible="icon"` 형태로 축소 가능하게 둔다.
- `TeamSwitcher` 영역은 팀 전환이 아니라 서비스 식별 영역으로 단순화한다.
- 주 메뉴는 콘텐츠와 사용자만 둔다.
- 샘플 프로젝트 메뉴, 업그레이드 메뉴, 결제 메뉴는 제거한다.
- footer의 사용자 메뉴는 로그인한 관리자 표시와 로그아웃 중심으로 둔다.
- 모바일에서는 사이드바가 drawer 형태로 열리게 한다.

참고 블록: https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/bases/base/blocks/sidebar-07

## 데이터 흐름

```text
apps/admin
  -> apps/admin-api
    -> packages/db
      -> SQLite
```

`apps/admin`은 플랫폼 API를 호출하지 않는다. 콘텐츠와 사용자 목록은 모두 `apps/admin-api`에서 조회한다. 이렇게 하면 어드민 서버 장애가 플랫폼 API로 전파되지 않고, 플랫폼 API 변경도 어드민 조회 화면에 직접 영향을 덜 준다.

`packages/db`는 공유 저장소 경계다. 플랫폼과 어드민은 같은 DB 패키지를 사용할 수 있지만 서로의 앱 또는 API 런타임을 import하지 않는다.

## 오류 처리

- 인증되지 않은 요청은 어드민 로그인 화면으로 이동한다.
- 권한이 없는 요청은 접근 불가 상태를 명시한다.
- 사용자 목록과 콘텐츠 목록 조회 실패는 화면 단위 오류 상태로 표시한다.
- 빈 콘텐츠 또는 빈 사용자 목록은 오류가 아니라 빈 상태로 표현한다.
- 어드민 API가 내려간 경우 `apps/admin`은 오류를 표시하지만 플랫폼 기능에는 영향을 주지 않는다.

## 테스트 전략

- `apps/admin-api`는 Hono route 테스트로 인증 필요 여부와 read-only API 응답 형태를 검증한다.
- Better Auth 설정은 플랫폼 인증 테이블과 어드민 인증 테이블이 섞이지 않는지 테스트한다.
- seed 명령은 최초 관리자 생성과 중복 실행 방지를 검증한다.
- `GET /courses?include=chapters,lessons`는 코스-챕터-레슨 계층 구조를 검증한다.
- `GET /users`는 기본 사용자 정보만 반환하는지 검증한다.
- `apps/admin`은 로그인 보호 라우팅, 사이드바 메뉴, 콘텐츠 목록, 사용자 목록 렌더링을 검증한다.
- 플랫폼 회귀 검증으로 `apps/admin`과 `apps/admin-api` 없이 `apps/web`과 `apps/api` 테스트가 통과하는지 확인한다.

## 검증 명령

구현 후 다음 범위를 검증한다.

```bash
bun --filter @workspace/admin-api test
bun --filter @workspace/admin-api typecheck
bun --filter @workspace/admin-api lint
bun --filter @workspace/admin test
bun --filter @workspace/admin typecheck
bun --filter @workspace/admin lint
bun --filter @workspace/web test
bun --filter @workspace/api test
bun lefthook run pre-commit
```

## 완료 기준

- 어드민 앱과 어드민 API가 별도 런타임으로 실행된다.
- 관리자 ID/password 로그인으로 보호된 어드민 화면에 진입할 수 있다.
- 최초 관리자 계정은 seed 명령으로 생성된다.
- 콘텐츠 화면은 코스, 챕터, 레슨 계층을 조회 전용으로 보여준다.
- 사용자 화면은 기본 계정 정보를 조회 전용으로 보여준다.
- 어드민 앱/API를 실행하지 않아도 플랫폼 웹/API의 기존 테스트와 주요 기능이 유지된다.
- 설계와 구현 결과가 `/docs` 문서에 반영된다.
