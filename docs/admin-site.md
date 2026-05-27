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
- 최초 관리자 계정은 DB seed 명령으로 생성한다.
- 어드민 API는 별도 서버 자체를 boundary로 보고 `/admin` prefix 없이 `GET /courses?include=chapters,lessons`, `GET /users` 같은 RESTful 리소스 경로를 사용한다.
- 어드민 UI는 shadcn `sidebar-07` 블록 구조를 참고한 왼쪽 사이드바 대시보드 레이아웃을 사용한다.

## 2026-05-27 구현 계획 완료

- 구현 계획은 `docs/superpowers/plans/2026-05-27-admin-site.md`에 작성했다.
- 계획은 공유 DB와 core 계약, `apps/admin-api`, `apps/admin`, 문서와 전체 검증 순서로 나뉜다.
- 각 task는 실패 테스트 작성, 실패 확인, 최소 구현, 검증, 커밋 단위로 진행한다.

## 2026-05-27 구현 시작

- `apps/admin`과 `apps/admin-api`를 추가해 어드민을 플랫폼과 별도 런타임으로 구현한다.
- 구현 순서는 `docs/superpowers/plans/2026-05-27-admin-site.md`의 Task 1부터 Task 10까지 따른다.
- 1차 구현 범위는 관리자 로그인, 보호된 사이드바 레이아웃, 콘텐츠 계층 조회, 사용자 기본 목록 조회다.

## 2026-05-28 Task 2 시작

- 관리자 인증은 플랫폼 사용자 인증과 분리된 DB 테이블을 사용한다.
- `packages/db`에 `admin_user`, `admin_session`, `admin_account`, `admin_verification` 스키마와 마이그레이션을 추가한다.

## 2026-05-28 Task 2 완료

- 관리자 인증 Drizzle 스키마와 `0002-admin-auth.sql` 마이그레이션을 추가했다.
- 콘텐츠 마이그레이션 실행 시 관리자 인증 테이블도 함께 생성되도록 연결했다.
- `packages/db` 클라이언트 테스트에서 관리자 인증 테이블 생성과 `admin_user` insert를 검증한다.
