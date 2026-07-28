# 검증 게이트 복구 결과

보관일: 2026-07-29

## 기준

- 기준 commit: `b7f4f704d28680cb3b6fbb27b96fd3e9d17daf10`
- 최종 검증 시각: 2026-07-29 07:43 KST
- 환경: Windows, Bun 1.3.10, Node.js 24.15.0

## 구현 결과

- root catalog, 공유 UI와 Storybook이 `@base-ui/react` 1.6.0을 직접 사용하도록 정합화했다. 일반 설치와 frozen 설치 뒤 두 workspace의 `import.meta.resolve`가 같은 Bun 설치 경로를 반환했다.
- `UiCspProvider`를 공개하고 web·admin root UI subtree에 request nonce를 전달했다. Tabs SSR 회귀 테스트는 hydration 전 inline script의 nonce를 확인한다.
- 비밀번호 locator를 exact accessible-name으로 제한했다. 검증 중 발견한 최신 UI 전환과 WebKit prefetch 중단 경쟁도 제품 의미를 바꾸지 않는 관찰 지점과 새 탭 접근으로 동기화했다.
- Orval을 8.23.0으로 올려 `js-yaml` 4.3.0을 사용하고, 최신 LHCI가 여전히 구버전 범위를 선언하는 `tmp`는 root override로 0.2.7에 고정했다.

## 필수 검증

| 명령                                                    | 결과                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| `bun install`, `bun install --frozen-lockfile`          | 통과                                                          |
| `bun run generate`                                      | 통과, 추적 대상 생성 diff 없음                                |
| `bun run audit:full`                                    | 통과, 취약점 없음                                             |
| `bun run ci:static`                                     | 통과: format, lint, typecheck, dependency, architecture, Knip |
| `bun run ci:tests`                                      | 통과                                                          |
| `bun run test:storybook`                                | 35 files, 152 tests 통과                                      |
| 검증용 HTTPS content asset URL을 주입한 `bun run build` | 6/6 tasks 통과                                                |
| `bun run test:e2e:pr`                                   | Chromium 5/5 통과                                             |
| `bun run test:e2e:release`                              | Chromium 9/9, WebKit 9/9 통과                                 |
| `bun lefthook run pre-commit`                           | 통과                                                          |

Playwright 성공 실행은 별도 실패 artifact를 남기지 않았다. 중간 실패의 screenshot·trace는 `output/playwright/test-results/`에서 원인 분석에 사용했으며, 최종 실행이 같은 위치를 성공 결과로 정리했다. console warning/error와 pageerror allowlist는 추가하지 않았다.

## 추가 확인과 한계

- `bun run test:performance:lighthouse`는 Lighthouse 수집 뒤 Windows의 Chrome 임시 profile 정리에서 `EPERM`으로 실패했다. Linux CI 전용 성능 검증의 제품 결과나 이번 필수 gate 실패는 아니며, `tmp` API 실패도 아니었다.
- 기존 설치 트리의 LHCI 내부 `tmp` symlink는 Bun의 일반·frozen 설치만으로 재링크되지 않았지만, manifest·lockfile·`bun why tmp`와 audit는 0.2.7로 일치한다. 계획에 따라 `node_modules` 수동 삭제나 강제 설치는 하지 않았다. 깨끗한 CI 설치는 lockfile을 기준으로 재현된다.
- Storybook build의 기존 module directive와 chunk size 경고는 남아 있다. 빌드는 성공했고 브라우저 console 검증과는 별개다.
