# 테스트 스위트 감사 후속 과제

## 배경

[2026-07-30 테스트 스위트 전수 감사](../2026-07-30-test-suite-audit/)의 케이스 수준 권고는 감사 직후 모두 반영했다. 이 문서는 그때 **결정 대기**이거나 **범위 밖으로 미룬** 16개 항목의 결정과 반영 결과를 기록한다. 감사 문서와 이 문서는 모두 역사 기록이므로 현재 사실 판정에 쓰지 않는다.

## 결정과 반영

| 항목                         | 결정                                                     | 반영                                                                                                                         |
| ---------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Storybook 앱 화면 replica    | 제품 화면 조합은 예외가 아니라 정본 배치다               | [`engineering/testing.md`](../../engineering/testing.md), [`design/storybook.md`](../../design/storybook.md)                 |
| PR gate의 Storybook 포함     | 현행 유지, 지연 사실과 대안을 문서에 남긴다              | `engineering/testing.md`에 이미 있던 문장 유지                                                                               |
| coverage 수집 여부           | 수집하지 않는다                                          | `engineering/testing.md`. lockfile 항목은 bun이 `vitest` optional peer를 해석한 결과이고 저장소 선언이 아니다                |
| 관리자 성공 응답 strict화    | 전면 적용                                                | 관리자 200 응답 schema를 모두 닫고 생성 문서 전수 검사로 gate. 한계는 [`api-contract.md`](../../engineering/api-contract.md) |
| 관리자 단일 역할             | 이미 정본화되어 있어 변경 없음                           | `engineering/auth-permissions.md` 확인만 수행                                                                                |
| 러너 통합                    | root 단일 Vitest process로 합친다                        | 강제 turbo 48.4s → 단일 process 39.4s. 패키지 `test` script는 `--project` 부분 실행용으로 유지                               |
| vitest config 중복           | 공용 factory로 합친다                                    | `@workspace/vitest-config` 신설(`./react`, `./console-failure-harness`)                                                      |
| console 실패 gate 범위       | web·shared/ui·api로 넓힌다                               | 결함 2건 발견. 서드파티 로그는 allowlist 대신 runtime에 로그 목적지를 주입해 끊는다                                          |
| learning 테스트 배치         | source 옆 colocate로 통일                                | 12파일 이동, `src/test/fixtures`만 남김                                                                                      |
| E2E 지원 코드 위치           | `apps/api/src/test-support/`로 옮기고 중복 상수를 단일화 | `@workspace/env`의 `./e2e-runtime`이 origin·seeded credential·필수 env 해석을 소유                                           |
| 정적 검사 이전 잔여          | 4건 모두 구현                                            | spec의 `@playwright/test` value import 금지, test-support 소비 경계, 모듈 entry export 검사, 인증 runtime 환경 읽기 금지     |
| Ansible 배포 gate            | `deploy.yaml` `--check` 실행을 `ansible-static`에 추가   | 승인 task에 tag를 달고 `check:deployment-approval`이 통과 1건·차단 6건을 확인                                                |
| 배포 후 smoke                | 추가                                                     | 배포 origin이 반영된 robots·sitemap과 공개 페이지 강제 CSP header를 `verify.yaml`이 검증                                     |
| operations reporting fixture | 소유 모듈 fixture로 전면 대체                            | `reporting-metrics-seed.ts` 삭제, content·learning·ai-feedback fixture 확장                                                  |
| MatchAnswer 중복 텍스트      | 콘텐츠 계약에서 거부                                     | 시드 60개 MATCH 스텝 영향 없음. 채점 계층의 중복 텍스트 케이스는 표현 불가가 되어 제거                                       |
| 삭제 보존 기간 중복 상수     | identity가 기본값을 소유하고 env가 두 소비자에 주입      | `LEARNER_DELETION_RETENTION_DAYS`. [`runtime-configuration.md`](../../engineering/runtime-configuration.md)                  |

## 남은 공백

- content 인가(403) 경로 부재와 content seed의 인라인 학습자 시드는 모듈 경계·순환 때문에 여전히 만들 수 없다. `engineering/testing.md`가 현재 사실로 소유한다.
- 관리자 편집기 응답의 step 객체는 두 schema를 `allOf`로 합치는 인코딩 때문에 최상위만 닫힌다. `engineering/api-contract.md`가 규칙과 한계를 소유한다.
- Ansible 승인 gate와 배포 색인·CSP 검증은 Linux 제어 노드에서만 실행할 수 있어 이 작업에서는 실행 확인을 하지 못했다. 첫 `ansible-static` 실행과 staging 배포가 검증 지점이다.
