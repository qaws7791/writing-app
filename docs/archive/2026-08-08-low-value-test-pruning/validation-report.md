# 저가치 테스트 제거 검증 보고서

## 기준

- 기준 commit은 `5c738f2e7f06e18918656b857799e34327256453`이다.
- 실행 환경은 Windows PowerShell, Bun 1.3.14, Node.js 24.19.0이다.
- 실행 시각은 2026-08-08 KST이다.

## 결과

- Vitest 대상은 194개 파일에서 189개 파일로 줄었다.
- Vitest 사례는 1,190개에서 1,070개로 줄었다.
- 테스트 source는 1,688줄을 제거하고 132줄을 추가했다.
- 테스트 source 순감소량은 1,556줄이다.
- 삭제한 테스트 파일은 5개다.
- Storybook story export 166개는 모두 유지했다.
- 자동 Storybook 검증 대상은 `ci-test` 태그가 있는 story 57개로 제한했다.

호출 전달, wrapper 재검증, re-export, 고정 markup, 동등 분기 반복, 구현 호출 순서 검증을 제거하거나 하나의 관찰 가능한 시나리오로 통합했다. AbortSignal identity 검증은 실제 취소 결과 검증으로 교체했다. 보안, 권한, 상태 전이, transaction, 복구, 데이터 무결성, wire 계약, 접근성 계약 테스트는 유지했다.

## 검증

| 명령                                             | 결과                                                  |
| ------------------------------------------------ | ----------------------------------------------------- |
| `bun run ci:static`                              | 통과                                                  |
| `bun run test`                                   | 189개 파일 통과, 1,069개 통과, 1개 skip               |
| `bun run ci:tests`                               | workspace 1,070개 통과, repository 정책 검사 1개 실패 |
| `bun --filter @workspace/storybook test:stories` | 57개 통과                                             |
| `bun --filter @workspace/storybook build`        | 통과                                                  |
| `bun run check:route-bundles`                    | 통과                                                  |
| `bun run build`                                  | Next.js standalone symlink 생성 단계에서 실패         |

`ci:tests`는 `GHSA-f88m-g3jw-g9cj` 예외가 2026-08-06에 만료된 사실을 차단했다. 이 보안 검사는 유효한 실패이므로 유지했다.

`bun run build`는 web과 admin의 compile, typecheck, static page 생성을 완료했다. Windows 환경이 Next.js standalone `next` symlink 생성을 `EPERM`으로 거부했다. Storybook은 독립 build로 검증했다.

전체 Vitest 실행에서 기존 admin logout retry 사례가 한 번 시간 초과했다. 같은 파일의 3개 사례는 단독 실행에서 통과했다. 두 번째 전체 실행과 `ci:tests` workspace 실행은 모두 통과했다.
