# 엔지니어링 문서 인덱스

## 목적

이 문서는 설계 원칙, 구현 경계, 운영 절차와 품질 기준의 진입점이다. 현재 package, runtime, route, 환경 변수, schema, deployment topology는 [사실별 권위 지도](../authority-map.md)의 코드 권위 소스에서 확인한다.

## 탐색 순서

1. 시스템 경계와 책임 원칙은 `system-overview.md`에서 확인한다.
2. 기술 선택 기준과 설정 변경 원칙은 `tech-stack.md`, `runtime-configuration.md`에서 확인한다.
3. API·데이터·권한의 호환성과 변경 규칙은 `api-contract.md`, `data-model.md`, `schema-conventions.md`, `auth-permissions.md`에서 확인한다.
4. 테스트, 배포, 관측, 보안, migration, backup과 rollback 절차는 각 운영 문서에서 확인한다.
5. 되돌리기 어려운 기술 결정은 `adr/`에서, 한시적 계획은 `docs/work/`에서 확인한다.

## 파일 지도

| 파일                                    | 목적                                                     |
| --------------------------------------- | -------------------------------------------------------- |
| `system-overview.md`                    | 시스템 책임 경계와 의존성 원칙을 정의한다.               |
| `workspace-dependency-policy.md`        | 의존성 추가·갱신의 정책을 정의한다.                      |
| `package-interface-and-import-rules.md` | package 공개 표면과 import 경계를 정의한다.              |
| `repository-architecture-tooling.md`    | architecture 검증 도구의 책임과 사용 원칙을 정의한다.    |
| `frontend-development.md`               | 프론트엔드 구현 경계와 성능 원칙을 정의한다.             |
| `lesson-runtime.md`                     | 레슨 전이, draft, 채점과 편집기의 구현 경계를 정의한다.  |
| `tech-stack.md`                         | 기술 선택과 교체 판단 기준을 정의한다.                   |
| `runtime-configuration.md`              | 설정 소유권·변경·보안 원칙을 정의한다.                   |
| `deployment.md`                         | 배포 승인, 실행, 복구 절차를 정의한다.                   |
| `release-runbook.md`                    | 새 VPS의 첫 staging·production 출시 순서를 정의한다.     |
| `api-contract.md`                       | HTTP 호환성, 인증, 오류와 계약 변경 원칙을 정의한다.     |
| `auth-permissions.md`                   | 인증·인가 정책과 권한 변경 절차를 정의한다.              |
| `security.md`                           | 신뢰 경계와 보안 변경 원칙을 정의한다.                   |
| `privacy.md`                            | 개인정보와 AI 데이터의 사용·최소화·보존 원칙을 정의한다. |
| `data-model.md`                         | 데이터 불변식과 모델 변경 원칙을 정의한다.               |
| `schema-conventions.md`                 | module·auth schema의 명명과 참조 원칙을 정의한다.        |
| `testing.md`                            | 테스트 전략과 품질 기준을 정의한다.                      |
| `observability.md`                      | 관찰 가능성, 경보와 기록 기준을 정의한다.                |
| `migration.md`                          | migration 실행과 호환성 판단 기준을 정의한다.            |
| `database-backup-restore.md`            | 백업·독립 복구 검증 절차를 정의한다.                     |
| `rollback.md`                           | 장애 시 코드·데이터 롤백 판단 기준을 정의한다.           |
| `adr/`                                  | 되돌리기 어려운 기술 결정의 이유와 대안을 기록한다.      |

## 관리 기준

구현 경계나 운영 절차가 바뀌면 관련 원칙 문서를 함께 갱신한다. 현재 코드 사실은 문서에 복제하지 않고 권위 소스에 직접 연결한다. 되돌리기 어렵거나 여러 경계를 바꾸는 결정은 ADR로 남긴다.
