# 사실별 권위 지도

## 목적

이 문서는 프로젝트 사실의 값을 다시 선언하지 않고, 각 사실을 최종적으로 소유하는 소스와 사람이 읽는 설명 문서를 연결한다. 설명 문서와 권위 소스가 충돌하면 권위 소스를 먼저 확인하고 같은 변경에서 설명 문서를 바로잡는다.

## 권위 원칙

- 하나의 사실에는 하나의 권위 소유자만 둔다.
- 실행 가능한 코드와 설정이 자연스럽게 소유하는 사실은 별도 문서나 중앙 manifest에 복제하지 않는다.
- 제품 정책처럼 코드만으로 의도를 판정할 수 없는 사실은 제품 문서가 소유한다.
- ADR은 결정의 이유를, `docs/work`는 진행 중 작업을, `docs/archive`는 과거 증거를 기록한다. 셋 모두 현재 topology의 권위 소유자가 아니다.
- 설명 문서는 권위 소스를 사람이 이해하기 쉽게 투영하되, 같은 값을 여러 문서가 독립적으로 소유한다고 선언하지 않는다.

## 사실별 소유자

| 사실 영역                         | 권위 소유자                                                            | 설명과 탐색 문서                                                        |
| --------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 제품 문제와 목표                  | `docs/product/problem-definition.md`, `docs/product/product-vision.md` | `docs/product/_index.md`                                                |
| 사용자 가치와 인수 기준           | `docs/product/user-stories/`                                           | `docs/product/user-stories/_index.md`                                   |
| 구현할 제품 규칙                  | `docs/product/requirements/`                                           | `docs/product/requirements/_index.md`                                   |
| 콘텐츠 계층과 불변식              | `docs/product/content-model.md`                                        | `docs/engineering/data-model.md`                                        |
| 관리자 운영 정책                  | `docs/product/admin-operations.md`                                     | `docs/engineering/auth-permissions.md`                                  |
| 화면 목적과 정보 구조             | `docs/design/screens/`, `docs/design/ia-spec.md`                       | `docs/design/_index.md`                                                 |
| workspace 집합과 패키지 이름      | 루트와 각 workspace의 `package.json`                                   | `docs/engineering/workspace-inventory.md`                               |
| 로컬 URL과 port 기본값            | `packages/env/src/local-runtime-defaults.ts`                           | `README.md`, `docs/engineering/runtime-configuration.md`                |
| 환경 변수 계약                    | 각 앱의 환경 parser와 `.env.example`                                   | `docs/engineering/runtime-configuration.md`                             |
| API path, method와 wire schema    | `apps/api` route registry와 `packages/contracts`                       | `docs/engineering/api-contract.md`                                      |
| 인증과 권한 구현 경계             | API 인증·인가 middleware와 contract                                    | `docs/engineering/auth-permissions.md`, `docs/engineering/security.md`  |
| 데이터 schema와 migration         | `packages/db` schema와 migration                                       | `docs/engineering/data-model.md`, `docs/engineering/migration.md`       |
| production service topology       | `deploy/compose/compose.yaml`, Caddy 설정                              | `docs/engineering/system-overview.md`, `docs/engineering/deployment.md` |
| production application image 집합 | image release metadata와 workflow matrix                               | `README.md`, `docs/engineering/deployment.md`                           |
| 테스트 실행 계약                  | workspace test 설정과 루트 task                                        | `docs/engineering/testing.md`                                           |
| 되돌리기 어려운 기술 결정의 이유  | `docs/engineering/adr/`                                                | `docs/engineering/_index.md`                                            |

## API 용어 계약

- 실행 앱, service와 image 이름은 모두 `api`를 사용한다.
- public API는 하나이며 학습자 경로와 `/api/admin/*` 관리자 경로를 같은 `apps/api` runtime이 제공한다.
- 관리자라는 말은 사용자·권한·경로의 논리적 범위를 나타낼 때만 사용하고 별도 API runtime, service 또는 image를 뜻하지 않는다.
- 제거된 구조를 설명해야 하는 과거 기록에서는 `legacy`를 명시하며 현재형으로 서술하지 않는다.

## 충돌 처리

1. 이 지도에서 해당 사실의 권위 소유자를 찾는다.
2. 권위 소스의 현재 값을 확인한다.
3. 충돌한 현재 문서를 같은 변경에서 수정한다.
4. 권위 소스 자체가 서로 충돌하면 문서를 임의로 맞추지 않고 먼저 소유권 또는 구현 결정을 요청한다.
5. 반복되는 결정적 충돌만 정적 검사로 승격하고, 자연어 의미 감사는 명시적으로 요청된 프로젝트 지식 감사 workflow로 수행한다.
