# 테스트·검증 코드 정돈 검증 보고서

## 기준

- 기준 commit: `126fc47b9acf9019d6ceaf4990800b5855d6f534`
- 실행 시각: 2026-07-26 07:14:56 +09:00
- 환경: Windows, Bun 1.3.10, Node.js 24.x

## 결과

- 제안서의 8개 우선순위를 모두 반영했다.
- 추적 파일 diff는 113개 파일, 추가 1,463줄, 삭제 9,425줄로 집계됐다.
- CI YAML과 검증 도구 자체 테스트, architecture fixture, 중복 Vitest config를 제거했다.
- 배포 정책 parser는 Zod schema로 교체하고 배포 검증 핵심 4개
  스크립트를 1,849줄에서 947줄로 줄였다. 제안서의 약 800줄에
  근접시키면서 실제 Compose, non-root, secret, route와 optimizer 계약은
  유지했다.
- setup·doctor를 공개 명령을 순서대로 호출하는 선형 스크립트로 단순화했다.
- Playwright `webServer`가 fixture·API·Next process 수명주기를 소유하며, E2E origin과 공통 helper를 한 곳으로 모았다.
- 정적 UI·중복 framework assertion을 추가로 505줄 제거하고 보안·데이터
  무결성·도메인 상태 전이 테스트는 유지했다.
- 관리자 콘텐츠 E2E는 전역 가변 fixture와 `serial` 실행을 제거했다. 각
  테스트가 고유 코스를 만들며 3개 worker 병렬 실행과 새 DB 단독 실행을
  모두 통과했다.

## 실행 증거

| 명령                                         | 결과                                      |
| -------------------------------------------- | ----------------------------------------- |
| `bun install --frozen-lockfile`              | lockfile 변경 없이 통과                   |
| `bun run ci:static`                          | 전체 정적 gate 통과                       |
| `bun run ci:tests`                           | repository 19개, workspace 20개 task 통과 |
| HTTPS asset 환경을 지정한 `bun run build`    | 6개 build task 통과                       |
| `bun run test:e2e:pr`                        | Chromium 핵심 흐름 5개 통과               |
| standalone 관리자 콘텐츠 E2E, `--workers=3`  | 병렬 3개 흐름 통과                        |
| 관리자 콘텐츠 E2E 각 테스트, 새 DB 단독 실행 | 각각 1개 흐름 통과                        |

## 환경 제한

- Docker Desktop daemon이 실행 중이지 않아 source image Compose smoke는 로컬에서 실행하지 못했다.
- Lighthouse는 서버 기동, 인증, Chrome 발견과 첫 측정까지 진행했으나 Windows의 Lighthouse 임시 profile 삭제가 `EPERM`으로 실패했다. 성능 예산의 최종 판정은 Linux main CI 결과가 필요하다.
