# 테스트 스위트 감사 후속 과제

## 배경

[2026-07-30 테스트 스위트 전수 감사](../../archive/2026-07-30-test-suite-audit/)의 케이스 수준 권고는 모두 코드에 반영했다. 이 문서는 반영 과정에서 **결정 대기**이거나 **범위 밖으로 미룬** 항목만 추적한다. 감사 문서 자체는 역사 기록이므로 현재 사실 판정에 쓰지 않는다.

## 결정이 필요한 항목

| 항목                      | 충돌·미결                                                                                                                                                                          | 영향                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Storybook 앱 화면 replica | [`design/storybook.md`](../../design/storybook.md)는 제품 화면 조합을 Pattern·Recipe로 허용하고 [`engineering/testing.md`](../../engineering/testing.md)는 앱 전용 화면을 금지한다 | lesson story 10개와 `admin-patterns`·`course-management` 존폐 |
| PR gate의 Storybook 포함  | interaction·a11y 검사가 main push에서만 차단한다. PR에 넣으려면 browser 설치 단계가 필요하다                                                                                       | 공유 UI primitive 회귀가 main에서 처음 드러날 수 있다         |
| coverage 수집 여부        | `@vitest/coverage-v8`이 lock에만 있고 어떤 manifest도 선언하지 않는다                                                                                                              | 선언해 일회성 측정 수단으로 두거나 lock에서 제거해야 한다     |
| 관리자 성공 응답 strict화 | 관리자 200 응답 대부분이 `additionalProperties`를 선언하지 않아 계약 회귀를 잡지 못한다                                                                                            | 프로덕션 OpenAPI schema 변경이 필요하다                       |

## 미룬 구조 작업

- **러너 통합.** 14개 패키지가 각자 프로세스를 띄워 실제 테스트 시간보다 기동 비용이 크다(`@workspace/http-client`는 0.21s 테스트에 4.03s). root 단일 실행으로 합치고 `bun test ./scripts`를 workspace project로 흡수하는 안이 감사에 있다.
- **vitest config 중복.** web·admin·shared/ui가 React 단일 인스턴스 고정을 서로 다른 방식으로 구현한다. 공용 factory로 합치는 작업은 미적용이다.
- **learning 테스트 배치.** `packages/modules/learning/src/test/**` 12파일만 source 병렬 트리를 유지한다. 나머지 4개 모듈은 colocate다.
- **console 실패 gate 범위.** `apps/admin`만 console.error·warn을 실패로 올린다. web·shared/ui·api로 넓히려면 harness를 공유 위치로 올려야 한다.
- **E2E 지원 코드 위치.** E2E 전용 스크립트 4개가 `apps/api/src/scripts/`에 있어 `#e2e/*`에 닿지 못하고 topology 상수와 seeded credential이 3곳에 중복된다.
- **정적 검사 이전 잔여.** workspace 간 `test-fixtures`·`test-support` import 금지 dependency-cruiser 규칙, 모듈 `./test-fixtures` entry의 `includeEntryExports`, 인증 runtime의 test 전용 route 금지 lint, `e2e/**/*.spec.ts`의 `@playwright/test` 직접 import 금지 lint가 남았다. `transport-neutral-entrypoints.test.ts`는 대체 규칙을 만들지 못해 그대로 유지한다.

## 남은 검증 공백

- 배포 smoke·E2E로 옮긴 항목: production origin 기준 `robots`·`sitemap` 출력, CSP 응답 header, 관리자 색인 차단, lease 기반 강제 종료.
- 모듈 경계로 막힌 항목: content HTTP에 인가(403) 경로가 없어 권한 없는 actor 회귀를 만들 수 없다. `MatchAnswer` 중복 label은 접근 가능한 이름이 없어 UI 계층에서 구분할 수 없다.
- 중복 상수: `apps/api/src/privacy/deletion-marker-reapplication.ts`가 identity의 삭제 보존 기간을 다시 정의한다.
