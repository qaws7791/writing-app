# 테스트 스위트 감사 후속 과제 검증 보고서

## 기준

- 기준 commit: `e2f9863522e8ce989aa3cf51ede92ed453b4e818`
- 실행 시각: 2026-07-31 (KST)
- 환경: Windows 11, Node.js v24.15.0, bun 1.3.10, Turborepo 2.10.4, Vitest 4.1.10, Playwright Chromium

## 결과

| 명령                             | 결과                                      |
| -------------------------------- | ----------------------------------------- |
| `bun run build`                  | 6/6 task 성공                             |
| `bun run typecheck`              | 25/25 task 성공                           |
| `bun run test`                   | 195 파일 · 1167 통과 · 1 skip             |
| `bun test ./scripts`             | 3 파일 · 26 통과                          |
| `bun run test:oxlint-rules`      | 커스텀 룰 4종 valid 8 · invalid 7 통과    |
| `bun run format:check`           | 1409 파일 형식 일치                       |
| `bun run lint`                   | 위반 없음                                 |
| `bun run check:architecture`     | 위반 없음 (1471 module · 3423 dependency) |
| `bun run check:knip`             | 미사용 항목 없음                          |
| `bun run check:dependencies`     | 버전 불일치 없음                          |
| `bun run check:workflow-scripts` | workflow의 `bun run` 참조 13개 모두 존재  |
| `bun run test:storybook`         | 41 파일 · 165 통과                        |
| `bun run test:e2e:pr`            | pr-chromium 7/7 통과                      |
| `bun lefthook run pre-commit`    | format·lint 통과                          |

## 실행하지 못한 검증

- `bun run check:deployment-ansible`, `bun run check:deployment-approval`, `bun run test:deployment-bootstrap`은 Linux 제어 노드를 요구한다. 이 환경은 Windows이고 WSL2가 `HCS_E_HYPERV_NOT_INSTALLED`로 기동하지 않아 실행하지 못했다. `deploy.yaml`의 승인 task tag 배치는 YAML 파싱으로, `check-deployment-approval.ts`의 로드와 win32 거부 경로는 직접 실행으로만 확인했다.
- `verify.yaml`의 공개 색인 정책·CSP header 검증은 `writing_app_verify_public_routes`가 켜진 실제 배포에서만 실행된다. 격리 bootstrap fixture는 이 변수를 끄므로 CI에서도 실행되지 않는다. CSP 단정은 Ansible `uri` 모듈이 응답 header를 snake_case 키로 돌려주는 동작에 의존한다.
- `bun run test:e2e:release`, `bun run test:performance:lighthouse`, `bun run test:deployment-images`, k6 staging은 main·release gate 소관이라 실행하지 않았다.

## 반영 과정에서 드러난 실제 결함

- `packages/shared/ui`의 order-answer hydration 테스트가 `IS_REACT_ACT_ENVIRONMENT` 없이 `act`를 호출해 경고만 남기고 있었다.
- `apps/api`의 seed-admin 테스트에서 Better Auth가 console로 로그를 남기고 있었다.
- identity 관리자 사용자 목록 fake가 상세 응답 객체를 목록 항목으로 재사용해 `progressPercent`·`totalLessons`를 계약 밖으로 흘리고 있었다. 프로덕션 경로에는 누출이 없었다.
- 모듈 entry export 검사를 켜자 소비자가 없는 export 39건이 드러났다. 재export 중복, 파일 안에서만 쓰이는 port 타입, 소비자가 사라진 fixture 표면이었다.
