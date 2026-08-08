# Storybook에서 Astro로 이전한 결과

## 결과

`apps/ui`에 기존 카탈로그의 39개 모듈, 154개 실행 예제, 2개 설명 문서와 9개 상호작용 계약을 이전했다. 기존 35개 자동 검증 모듈은 실제 Astro 정적 build에서 렌더와 axe 검사를 수행한다.

Astro 문서는 115개 컴포넌트와 522개 registry 예제를 유지한다. 격리 preview는 system·light·dark theme, full·reduced motion과 5개 지정 viewport를 제공한다.

`apps/storybook`의 63개 source·config 파일, 생성 산출물, workspace manifest와 전용 root·CI 참조를 제거했다.

## 검증

| 명령                                                  | 결과                                                                                                                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bun --filter @workspace/ui-registry docs:validate`   | 통과. 115개 컴포넌트, 522개 registry 예제, 154개 이전 예제와 2개 문서를 확인했다.                                                                                                        |
| `bun --filter @workspace/ui-registry source:validate` | 통과. registry와 `@workspace/ui`의 UI·block·hook·utils 동기화를 확인했다.                                                                                                                |
| `bun run test:ui-docs`                                | 통과. 렌더·axe 35개, 상호작용 9개와 preview control 1개를 포함해 45개가 통과했다.                                                                                                        |
| `bun run ci:static`                                   | 통과. format, lint, Knip, architecture, dependency와 25개 workspace typecheck를 확인했다.                                                                                                |
| `bun run ci:tests`                                    | workspace 192개 파일의 1,084개 test가 통과했다. repository test 1개는 기존 보안 예외 만료를 차단했다.                                                                                    |
| `bun run build`                                       | 두 Next.js 앱의 compile·typecheck·정적 page 생성을 확인했다. Windows가 admin standalone `next` symlink를 `EPERM`으로 거부했다. Astro package build는 `test:ui-docs`에서 별도로 통과했다. |
| `bun run check:route-bundles`                         | 통과. 5개 관리 route가 예산 이내였다.                                                                                                                                                    |

## 기존 환경 장애

`ci:tests`의 repository 검사는 `GHSA-f88m-g3jw-g9cj` 예외가 2026-08-06에 만료된 사실을 차단했다. 이 만료는 작업 전 기준선과 기존 archive에도 기록되어 있다. 보안 검사를 우회하지 않았다.

Windows는 `apps/admin/.next/standalone`에 `next` symlink를 만들 권한을 허용하지 않았다. 두 Next.js 앱은 이 단계 전에 compile, TypeScript와 정적 page 생성을 완료했다.
