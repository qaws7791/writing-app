# 사실별 권위 지도

## 목적

이 문서는 프로젝트 사실의 값을 다시 선언하지 않고, 각 사실을 최종적으로 소유하는 소스를 연결한다. 사람이 작성한 문서는 의도·정책·절차를 소유하며, 코드와 설정이 소유하는 현재 값·구조·목록을 복제하지 않는다.

## 권위 원칙

- 하나의 사실에는 하나의 권위 소유자만 둔다.
- 실행 가능한 코드와 설정이 자연스럽게 소유하는 사실은 별도 문서나 생성 문서에 복제하지 않는다.
- 제품 정책처럼 코드만으로 의도를 판정할 수 없는 사실은 제품 문서가 소유한다.
- 제품 요구사항, 설계, 아키텍처, 보안, 운영·개발 정책은 Git 문서가 소유한다.
- `docs/research`는 콘텐츠 판단의 출처와 추론 경로를 보존하지만 현재 제품 정책, 카탈로그나 콘텐츠 값의 권위 소스가 아니다.
- ADR은 결정의 이유를, `docs/work`는 진행 중 작업을, `docs/archive`는 과거 증거를 기록한다. 셋 모두 현재 topology의 권위 소유자가 아니다.
- 문서는 권위 소스를 찾는 경로와 그 변경의 의도를 설명할 수 있지만, 같은 값을 다시 선언하지 않는다.

## 사실별 소유자

| 사실 영역                                 | 권위 소유자                                                                                                       | 문서가 소유하는 내용           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 제품 문제와 목표                          | `docs/product/problem-definition.md`, `docs/product/product-vision.md`                                            | 제품 의도와 우선순위           |
| 사용자 가치와 인수 기준                   | `docs/product/user-stories/`                                                                                      | 사용자 관점의 수용 기준        |
| 구현할 제품 규칙                          | `docs/product/requirements/`                                                                                      | 제품 정책과 예외               |
| 콘텐츠 계층과 불변식                      | `docs/product/content-model.md`                                                                                   | 도메인 의미와 불변식           |
| 학습 상태 책임과 레슨 전이 정책           | `docs/product/learner-journey.md`                                                                                 | 서버·클라이언트 책임과 동기화  |
| 현재 코스 draft·published 콘텐츠          | curriculum repository가 관리하는 persisted data                                                                   | 콘텐츠 의미와 발행 정책        |
| 관리자 운영 정책                          | `docs/product/admin-operations.md`                                                                                | owner 관리자의 권한·책임 정책  |
| 개인정보와 AI 데이터 사용 목적            | `docs/engineering/privacy.md`                                                                                     | 사용·최소화·보존 원칙          |
| 화면 목적과 정보 구조                     | `docs/design/screens/`, `docs/design/ia-spec.md`                                                                  | 화면 목적, 흐름, 접근성 기준   |
| UI 문서 경로·예제·브라우저 계약           | `apps/ui`의 route, catalog, inventory와 Playwright 설정                                                           | 작성·검증 정책                 |
| workspace 집합·패키지 이름·script         | 루트와 각 workspace의 `package.json`                                                                              | 없음                           |
| package 공개 표면·private alias           | 각 package manifest의 `exports`·`imports`                                                                         | 공개 경계 원칙                 |
| 선언 dependency·실제 import edge          | 각 workspace manifest의 dependency 필드와 production·test source import                                           | 의존 방향 원칙                 |
| dependency graph 허용 정책·위반 판정      | `dependency-cruiser.config.mjs`, architecture 검사                                                                | 정책과 예외 기준               |
| 로컬 URL·port·환경 변수 기본값            | 환경 parser, `.env.example`, `packages/config/env/src/local-runtime-defaults.ts`                                  | 설정 분류와 변경 원칙          |
| API path·method·wire schema               | module HTTP interface의 직접 Hono 등록, `apps/api` composition root, runtime OpenAPI, `packages/shared/contracts` | 호환성·오류·인증 정책          |
| 인증·권한의 현재 middleware 배치          | module HTTP interface와 API composition의 인증·인가 경계                                                          | 권한 정책과 보안 원칙          |
| 데이터 schema·migration                   | module schema·migration, `packages/infra/auth`, `apps/api/src/db`, `apps/api/drizzle`                             | 데이터 불변식과 migration 절차 |
| production service·image·network topology | `deploy/compose/compose.yaml`, Caddy 설정, release workflow                                                       | 배포 승인·복구·안전 절차       |
| 테스트 명령·실행 대상                     | workspace test 설정과 루트 task                                                                                   | 테스트 전략과 품질 기준        |
| 검증 실행 결과                            | commit, 실행 명령, 환경, artifact가 고정된 archive 보고서                                                         | 과거 증거                      |
| 되돌리기 어려운 기술 결정의 이유          | `docs/engineering/adr/`                                                                                           | 결정의 이유와 대안             |

## 비권위 연구 지식

`docs/research`는 자료별 접근 범위, 요약, 종합 원리, 역량 분석과 `콘텐츠 ID → 주장 ID → 출처 ID` 연결을 보존한다. 이 연결은 콘텐츠 판단을 검토하고 한계를 추적하기 위한 근거이며 현재 제품 동작이나 제품 정책을 정하지 않는다.

연구 결론이 제품 규칙이 되면 `docs/product`의 관련 권위 문서에 반영한다. 현재 draft·published 콘텐츠는 curriculum repository의 persisted data가 소유하며, 이번 시드 재구축에서 작성하는 코스·유닛·레슨·스텝 값의 단일 작성 원천은 [`content-seed-data.json`](../packages/modules/content/src/infrastructure/persistence/content-seed-data.json)이다. 연구 문서에는 그 값을 복제하지 않고 ID와 적용 근거만 연결한다.

## 현재 코드 사실 탐색

현재 값을 확인할 때는 문서의 서술을 신뢰하지 말고 다음 권위 소스를 직접 읽는다.

1. workspace, package, script, tool 버전, 선언 dependency와 공개·private subpath는 루트와 각 workspace의 `package.json`을 확인한다. 실제 import edge는 production·test source를 확인하고 dependency-cruiser로 전체 graph를 탐색하며, 자동 차단 범위는 dependency-cruiser 설정과 architecture 검사를 확인한다.
2. 로컬 runtime 기본값과 환경 변수는 `packages/config/env`, 각 앱의 parser와 `.env.example`을 확인한다.
3. API path·method·schema는 module HTTP interface의 `register*Routes`, `apps/api` composition root, `packages/shared/contracts`, 실행 중인 OpenAPI를 확인한다.
4. 배포 service, image, port, network와 proxy는 `deploy/compose/`, Caddy 설정과 release workflow를 확인한다.
5. credential·session schema는 `packages/infra/auth`, 제품 schema는 각 module, SQLite primitive는 `packages/infra/db`, 통합 schema·migration·seed 실행 지점은 `apps/api/src/db`와 `apps/api/drizzle`을 확인한다. 테스트 실행 대상은 root task와 workspace test 설정을 확인한다.

제거된 구조를 설명해야 하는 과거 기록에서는 `legacy`를 명시하며 현재형으로 서술하지 않는다.

## 충돌 처리

1. 이 지도에서 해당 사실의 권위 소유자를 찾는다.
2. 권위 소스의 현재 값을 확인한다.
3. 충돌한 현재 문서를 같은 변경에서 수정한다.
4. 권위 소스 자체가 서로 충돌하면 문서를 임의로 맞추지 않고 먼저 소유권 또는 구현 결정을 요청한다.
5. 반복되는 결정적 충돌만 정적 검사로 승격하고, 자연어 의미 감사는 명시적으로 요청된 프로젝트 지식 감사 workflow로 수행한다.
