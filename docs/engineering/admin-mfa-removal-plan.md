# 어드민 MFA 제거 구현 계획

## 상태

- 기준일: 2026-07-14
- 상태: 구현 완료

## 목표와 범위

- 어드민의 TOTP MFA 등록, 로그인 2차 인증, 복구 코드, step-up 인증을 제거한다.
- owner와 operator 역할 및 기존 역할 기반 권한은 유지한다.
- owner 변경 작업은 유효한 owner 비밀번호 세션만으로 수행한다.
- 비밀번호 변경 후 모든 관리자 세션을 폐기하는 기존 동작은 유지한다.

## 구현 순서

1. 배포 전 관리자 DB를 백업하고, 현재 관리자 세션의 유지·폐기 정책을 확정한다. MFA 복구 코드와 TOTP secret은 제거 대상이며 복구하지 않는다.
2. DB 기준 schema와 migration에서 `admin_user.two_factor_enabled`, `admin_two_factor`, `admin_mfa_recovery_code`를 제거한다. 기존 SQLite DB는 `ALTER TABLE ... DROP COLUMN`과 MFA table 삭제로 정리하며, 관리자 user·account·session row는 보존한다.
3. `apps/admin-api`에서 Better Auth `twoFactor` plugin, MFA recovery service, `/mfa/*` route, MFA 전용 route option과 의존성 주입을 제거한다. 세션 resolver는 관리자 id·이름·이메일·role과 만료 시각만 반환한다.
4. `packages/core`의 `AdminActor`에서 `authenticationAssurance`를 제거하고, owner 변경 인가 결과를 `allowed` 또는 `forbidden`으로 단순화한다. API middleware와 오류 변환에서도 MFA/step-up 오류를 제거한다.
5. `packages/contracts`의 어드민 session DTO에서 `mfa` 필드를 제거하고, `apps/admin`의 session adapter·보호 layout·API 오류 매핑을 같은 계약으로 갱신한다.
6. `apps/admin`의 `/mfa` route, MFA 화면, 로그인 TOTP·복구 모드와 MFA client 요청 함수를 삭제한다. 로그인 성공은 안전한 `next` 경로 또는 대시보드로 바로 이동하며, 사이드바의 보안 메뉴도 제거한다.
7. 단위·route·계약·브라우저 테스트를 MFA 없는 로그인과 역할 기반 인가로 대체한다. 기존 TOTP, 복구 코드, step-up 만료 전용 테스트는 삭제한다.
8. OpenAPI 정적 계약과 인증·보안·운영 문서를 갱신한다. ADR-0007은 역사 기록으로 남기되 후속 ADR에서 폐기됨을 명시하고, 현재 문서에서는 MFA 요구사항을 제거한다.

## 영향 파일군

- 서버: `apps/admin-api/src/auth`, `middleware`, `routes`, `app.ts`, `main.ts`, `errors`
- 도메인: `packages/core/src/modules/admin/application/policies`
- 계약·DB: `packages/contracts/src/admin`, `packages/db/src/schema`, `packages/db/src/migrations`
- 웹: `apps/admin/src/app`, `features/auth`, `lib/auth`, `lib/api`, `lib/navigation`
- 검증·문서: 어드민 테스트, `e2e/writing-app.spec.ts`, OpenAPI 정적 JSON, `BACKEND.md`, `docs/engineering/*`, 관리자 인증 요구사항

## 완료 기준

- owner와 operator가 이메일·비밀번호 로그인만으로 각 권한 범위에 접근한다.
- owner는 MFA 등록 또는 재인증 없이 기존 변경 작업을 수행하고, operator는 계속 `403 forbidden`을 받는다.
- MFA 관련 HTTP endpoint, DTO 필드, UI route, DB table·column, 런타임 코드 참조가 남지 않는다. 단, 기존 DB를 정리하는 migration과 제거를 검증하는 음성 회귀 테스트의 참조는 유지한다.
- `bun run check:api-contract`, `bun run check:document-drift`, 관련 workspace test, `bun run typecheck`, `bun run lint`, `bun run build`, `bun run test:e2e`가 통과한다.

## 검증 결과

- `@workspace/db`, `@workspace/core`, `@workspace/admin-api`, `@workspace/admin`의 단위·route·계약 테스트가 통과했다.
- `bunx bun@1.3.10 run test:e2e`에서 UI 시각 계약, 학습자 테스트 로그인, MFA 없는 어드민 owner/operator 권한 시나리오 3건이 통과했다.
- `bunx bun@1.3.10 run check:api-contract`, `check:document-drift`, `typecheck`, `lint`, `format:check`가 통과했다.
- `@workspace/admin` production build가 통과했다. 전체 build는 변경 범위 밖인 `@workspace/web`가 필요한 production web origin 환경값 없이 실행되어 중단됐다.
