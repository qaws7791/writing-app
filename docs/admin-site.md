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
