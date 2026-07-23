# P17 영구 문서 반영과 보관

## 판정 기준

P17은 현재 코드 권위 소스와 영구 문서의 의미를 최종 대조한 뒤 이 작업 단위 전체를 archive로 이동한다. 현재 구조·목록·값은 manifest, route registry, schema와 실행 설정이 소유하며 이 보고서는 특정 실행의 증거만 보존한다.

- 기준 commit: `75cf8b563d26b123b19cfae291878170d8540a1f`
- 시작 시각·host: `2026-07-23 14:50 KST`, macOS 26.5.2 arm64, Bun 1.3.10, Node.js 24.16.0
- 1차 검증 구간: `2026-07-23 14:50–14:59 KST`
- 독립 리뷰·수정 재검증 구간: `2026-07-23 15:00–15:15 KST`
- 범위: 영구 문서 대조, 작업 기록 보관과 저장소 품질 검증
- 제외: production 배포·migration·rollback·restore와 외부 provider·host 검증
- artifact: 이 문서, `apps/api/dist`, `apps/web/.next`, `apps/admin/.next`, `apps/storybook/dist`; 사용자 흐름·image·복구 검증은 [P16 기록](./p16-validation.md)의 artifact와 실행 증거를 보존한다.

## 영구 문서 대조

`docs/_index.md`, `docs/authority-map.md`와 엔지니어링 인덱스를 순서대로 읽고 package manifest·import graph, module route registry, 통합 schema·migration·seed, root task·workspace test 설정을 직접 대조했다.

| 범위                | 판정                                                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| package·composition | module-owned 수직 슬라이스, API composition, 좁은 public subpath와 graph 검사 원칙이 현재 source와 일치한다.                                       |
| API·인증·보안       | module HTTP interface와 canonical contract, auth credential/session과 identity profile/role 분리, capability별 rate-limit owner가 일치한다.        |
| 데이터·운영         | module schema, cross-module reference, 통합 migration·seed, backup·restore와 code rollback 분리 원칙이 일치한다.                                   |
| frontend·test·관측  | HTTP-only frontend, 계층별 test·architecture fixture, request·security·provider·event 관찰 경계가 일치한다.                                        |
| ADR                 | ADR-0020이 module-owned 최종 결정을 소유하고, ADR-0015의 app-local platform 위치와 ADR-0018의 전환기 persistence 위치를 현재 대체 관계로 명시한다. |

확인 과정에서 frontend·code-style 문서의 app-owned 제품 repository 표현과 ADR-0015의 현재 상태 충돌을 수정했다. exact export와 검증 task 목록은 manifest·실행 스크립트의 권위를 중복하지 않도록 원칙과 탐색 경로로 축소했다. 성능·확장성 효과처럼 운영 측정이 없는 내용은 검증 사실로 새로 주장하지 않는다.

## 작업 기록 생명주기

영구 결론을 위 권위 문서와 ADR에 반영한 뒤 작업 디렉터리 전체를 같은 이름의 `docs/archive` 경로로 이동했다. 진행 중 작업 인덱스에서는 항목을 제거하고 archive 인덱스에는 실행 계획과 P16·P17 최종 검증 기록을 연결했다. 복사본은 남기지 않았으며 이동 전후 내부 링크와 document drift를 각각 확인한다.

## 검증

archive 이동 전후와 현재 source에서 다음 결과를 확인했다.

| 검증                                                                | 결과                                                                                      |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 이동 전·후 `bun run check:document-drift`                           | 두 번 모두 통과, stale 내부 링크와 work 복사본 0개                                        |
| `bun run format:check`, `bun run lint`                              | 1,396개 파일 format과 전체 정적·architecture·interface·문서 정책 검사 통과                |
| `bun run typecheck`                                                 | 27/27 task 통과                                                                           |
| `bunx turbo test --force`                                           | cache 0, 22/22 unit·integration·HTTP·UI test task 통과                                    |
| CI 공개 origin을 명시한 `bunx turbo build --force`                  | cache 0, API·web·admin·Storybook 4/4 build 통과                                           |
| compiled CSS와 landing·admin chart·resource route bundle guard      | 세 앱 CSS sentinel과 다섯 route 판정 통과                                                 |
| `bun run audit:production`, `bun run audit:full`, `bun pm ls --all` | 두 audit 범위와 설치 dependency tree 검사 통과                                            |
| archive·index·process 확인                                          | archive 파일 25개, work 복사본 0개, task 관련 listener·process 0개                        |
| staged diff audit                                                   | 문서 39개 경로만 포함: 기존 기록 24개 이동, P17 기록 1개 추가, 영구 문서·인덱스 14개 수정 |
| `bun lefthook run pre-commit`                                       | staged format, workspace inventory, document drift와 package interface 검사 통과          |

환경값 없이 실행한 첫 `bun run build`는 web의 필수 production origin 누락을 명시적으로 거부했고 admin build를 중단했다. 저장소 CI가 소유하는 공개 origin 예시를 주입한 cache 없는 재실행은 4/4로 통과했다. 이는 설정 누락 fail-fast가 동작한다는 로컬 증거이며 실제 production origin이나 배포 성공을 뜻하지 않는다.

P17 기준 commit은 P16의 reviewer 수정과 최종 검증을 포함한다. 이 기준 commit 이후 P17 staged diff는 영구 문서, 인덱스와 동일 작업 단위의 archive 이동만 포함하며 source·manifest·lockfile·workflow·deployment 설정과 생성물은 변경하지 않았다. 따라서 P16에서 같은 source에 대해 완료한 Playwright, Storybook interaction, deployment image, migration·backup·restore smoke를 P17에서 반복하지 않고 그 검증 기록을 보존했다. P17의 cache 없는 test·build가 현재 source의 회귀 부재를 다시 확인한다.

작업 계획에서 추적하던 전환용 alias·forwarding·allowlist·이중 경로는 P15에서 제거됐다. repository 공통 보안 정책이 소유하는 `sharp` advisory의 기한부 위험 수용 1건은 구조 전환용 임시 예외가 아니며, 취약점 해소로 간주하지 않는다. 이 항목의 owner·만료일·완화와 제거 조건은 실행 정책이 계속 소유한다.

## 독립 리뷰

독립 reviewer `/root/p17_review`는 기준 commit 대비 staged diff와 실제 manifest·source import, module HTTP interface, API composition, schema·migration·seed, root task를 대조했다. 첫 리뷰에서 HTTP platform·module·API 책임 표현, dependency graph 권위 분리, Next.js major 중복과 검증 기록의 artifact·경로·route 수·commit 범위 오류를 발견했다.

지적을 모두 수정한 staged diff `83c1da5f883b3e6b05a65f53d00e6edbbaa8a7cbc817b9be292110289255ddb9`에서 reviewer는 문서 39개만 변경됐고 영구 결론, ADR 대체 관계, archive 생명주기, production 미실행 경계와 별도 보안 위험 수용이 코드·설정 및 기록과 일치함을 재확인했다. 남은 finding 없이 최종 판정은 `승인: 커밋 가능`이다.
