# 엔지니어링 문서 인덱스

## 목적

이 문서는 엔지니어링 문서의 진입점이다. 시스템 구조, 기술 선택, 런타임 설정, API와 데이터 계약, 인증과 보안, 테스트와 운영 기준을 찾기 위해 사용한다.

## 탐색 순서

1. 시스템의 큰 구조는 `system-overview.md`에서 확인한다.
2. 기술 선택과 실행 환경은 `tech-stack.md`, `runtime-configuration.md`에서 확인한다.
3. 구현 계약은 `api-contract.md`, `data-model.md`, `schema-conventions.md`, `contracts/`에서 확인한다.
4. 운영 품질은 `testing.md`, `observability.md`, `security.md`, `migration.md`, `database-backup-restore.md`, `rollback.md`에서 확인한다.
5. 변경 결정을 남길 때는 `adr/`를 사용한다.

## 디렉토리 지도

| 경로                          | 목적                                                                      |
| ----------------------------- | ------------------------------------------------------------------------- |
| `docs/engineering/`           | 엔지니어링 기준, 시스템 구조, 구현 계약, 운영 절차를 관리한다.            |
| `docs/engineering/adr/`       | 되돌리기 어렵거나 구조에 영향을 주는 기술 결정을 ADR 형식으로 기록한다.   |
| `docs/engineering/contracts/` | 코드와 외부 소비자가 함께 참조하는 기계 판독 가능한 계약 파일을 보관한다. |

## 파일 지도

| 파일                                                      | 목적                                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `_index.md`                                               | 엔지니어링 문서 전체의 진입점과 탐색 지도를 제공한다.                                              |
| `system-overview.md`                                      | 시스템 목적, C4 모델, 서비스 경계, 라우트, API 런타임, 저장소, 배포 개요를 설명한다.               |
| `workspace-inventory.md`                                  | 앱, 패키지, 스크립트 루트의 현재 인벤토리와 자동 검증 기준을 정의한다.                             |
| `workspace-dependency-policy.md`                          | 공통 dependency catalog와 디자인·lint baseline ratchet 정책을 정의한다.                            |
| `repository-architecture-tooling.md`                      | source inventory, TypeScript module graph와 architecture 정책 matcher를 정의한다.                  |
| `codex-skill-invocation-policy.md`                        | Codex 워크플로 스킬의 명시 호출 전용 정책과 검증 기준을 정의한다.                                  |
| `tech-stack.md`                                           | 런타임, 패키지 관리, 프론트엔드, 백엔드, 데이터, 테스트 도구, 의존성 기준을 정의한다.              |
| `runtime-configuration.md`                                | 로컬 포트, 환경 변수 파서, 앱별 설정, Turbo 환경 변수, `.env.example` 정책을 정의한다.             |
| `api-contract.md`                                         | 학습자 API와 어드민 API의 공통 원칙, 인증 표면, 오류 응답, OpenAPI 생성 기준을 정의한다.           |
| `auth-permissions.md`                                     | 인증 경계, 학습자 권한, 관리자 역할, API별 권한 기준, 권한 변경 절차를 정의한다.                   |
| `data-model.md`                                           | 데이터 모델 원칙, ERD, 인증과 콘텐츠와 학습 테이블, 상태 머신, seed 정책을 정의한다.               |
| `schema-conventions.md`                                   | 데이터베이스 스키마 명명, Better Auth 테이블, 직접 관리 테이블, 새 스키마 체크리스트를 정의한다.   |
| `security.md`                                             | 인증, 인가, CORS, 민감 데이터, 오류 응답, AI provider, 데이터 보존 보안 기준을 정의한다.           |
| `admin-auth-security-operations.md`                       | 관리자 계정 감사, 세션 폐기와 안전한 owner provisioning 운영 절차를 정의한다.                      |
| `admin-mfa-step-up.md`                                    | 폐기된 owner 관리자 TOTP MFA와 step-up 인증의 역사 기록이다.                                       |
| `admin-mfa-removal-plan.md`                               | 어드민 MFA·step-up 제거, DB 정리와 역할 기반 인가 유지 계획을 정의한다.                            |
| `admin-transport-security.md`                             | 관리자 transport의 actor 구성, 이중 인가 경계와 오류 변환 기준을 정의한다.                         |
| `testing.md`                                              | 테스트 원칙, 도구, 프로젝트, 계층, 주요 명령, 커버리지, 테스트 데이터 기준을 정의한다.             |
| `admin-browser-test-report-2026-07-14.md`                 | 2026-07-14 어드민 로컬 개발 환경의 브라우저 기능 검증 결과를 기록한다.                             |
| `learner-browser-test-report-2026-07-14.md`               | 2026-07-14 학습자 플랫폼 로컬 개발 환경의 브라우저 기능 검증 결과를 기록한다.                      |
| `lesson-runtime.md`                                       | 학습자·관리자 공통 레슨 runtime과 관리자 스텝 편집 계약을 정의한다.                                |
| `observability.md`                                        | 요청 로그, 런타임 로깅, 로그 정책, 메트릭과 알림과 대시보드 후보를 정의한다.                       |
| `migration.md`                                            | 마이그레이션 모델, 명령, 기본 절차, seed 마이그레이션, 운영 원칙, 롤백 조건을 정의한다.            |
| `database-backup-restore.md`                              | SQLite snapshot 백업, 독립 복구 검증, 운영 복구 훈련과 결과 기록 기준을 정의한다.                  |
| `rollback.md`                                             | 코드, DB, seed, 인증 장애의 롤백 판단 기준과 사후 기록 기준을 정의한다.                            |
| `code-style.md`                                           | 파일과 import, 포맷, lint, TypeScript, React와 Next.js, API와 DB 경계, 금지 패턴을 정의한다.       |
| `package-interface-and-import-rules.md`                   | 패키지 공개 subpath Interface와 private alias import 규칙 및 자동 검증 기준을 정의한다.            |
| `code-review.md`                                          | 리뷰 우선순위, 공통 체크리스트, 경계와 인증과 데이터와 API와 프론트엔드 검토 기준을 정의한다.      |
| `git-workflow.md`                                         | 브랜치, 커밋 메시지, 커밋 전 확인, Git hook, PR, 리뷰, 머지 정책을 정의한다.                       |
| `resource-library-implementation-plan.md`                 | 완료된 자료실 구현 단계와 당시 검증 근거를 보존하는 역사 문서다. 현재 계약은 동기화 설계를 따른다. |
| `resource-library-sync-design.md`                         | 자료실의 지속 연결, 문서 구독과 HTTP transaction 기반 공동 편집 목표 설계를 기록한다.              |
| `resource-library-load-testing.md`                        | 자료실 file-backed 동시성·20-client 예약 부하 suite와 실패 기준을 정의한다.                        |
| `adr/ADR-0001-example.md`                                 | ADR 작성 형식과 결정 기록의 예시를 제공한다.                                                       |
| `adr/ADR-0002-ui-design-system-contract.md`               | 공유 UI 디자인 시스템의 공용화 범위, 밀도, naming 계약을 기록한다.                                 |
| `adr/ADR-0003-lesson-ui-orchestration-boundary.md`        | 레슨 순수 UI와 앱 오케스트레이션 경계를 기록한다.                                                  |
| `adr/ADR-0004-resource-library-collaboration-boundary.md` | 부분 대체됨. Markdown 원본과 트리 명령 책임은 유지하고 본문 transport 결정은 ADR-0005가 대체한다.  |
| `adr/ADR-0005-resource-library-http-transaction-sync.md`  | 채택됨. 자료실 HTTP transaction 동기화와 작업 공간 WebSocket 역할의 현재 결정을 기록한다.          |
| `adr/ADR-0006-strict-content-security-policy.md`          | request nonce 기반 strict CSP와 report-only rollout 결정을 기록한다.                               |
| `adr/ADR-0007-admin-mfa-step-up.md`                       | owner 관리자 TOTP MFA, 복구 코드와 최근 재인증 경계 결정을 기록한다.                               |
| `adr/ADR-0008-admin-password-only-auth.md`                | 채택됨. 관리자 비밀번호 전용 인증과 역할 기반 인가 유지 결정을 기록한다.                           |
| `contracts/writing-app-api-openapi.json`                  | Writing App API의 OpenAPI 계약을 기계 판독 가능한 형식으로 제공한다.                               |

## 관리 기준

구현 경계나 운영 절차가 바뀌면 관련 엔지니어링 문서를 함께 갱신한다. 되돌리기 어렵거나 여러 패키지의 책임을 바꾸는 결정은 ADR로 남긴다.
