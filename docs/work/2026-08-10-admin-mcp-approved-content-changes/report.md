# 관리자 MCP 승인 기반 콘텐츠 변경 2A 완료 보고서

## 결과

2A 로컬 구현과 검증을 완료했다.

modern MCP 연결은 `admin_create_course_draft`, `admin_archive_course`, `admin_restore_course`를 제공한다.

서버는 owner 승인, OAuth scope, 서명된 `requestState`, 입력 digest와 현재 콘텐츠 상태를 실행 전에 검증한다.

콘텐츠 변경과 실행 영수증은 같은 transaction에서 한 번만 확정된다.

어드민은 승인 deep-link 화면과 MCP 감사 provenance를 제공한다.

변경 기능의 기본값은 비활성화 상태다.

production 환경은 관리자 MCP 전체를 계속 거부한다.

2B draft 저장과 2C 발행 도구는 등록하지 않았다.

## 검증 결과

검증 환경은 Windows, Bun 1.3.14와 Node.js 24.19.0이다.

| 명령                                  | 결과                                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `bun install --frozen-lockfile`       | 통과                                                                                      |
| `bun run audit:full`                  | 통과                                                                                      |
| 대상 패키지 typecheck                 | 통과                                                                                      |
| `bun run check:architecture`          | 통과                                                                                      |
| `bun --filter @workspace/admin build` | 통과. `/mcp-approvals/[approvalId]` 경로를 생성했다.                                      |
| `bun run ci:tests`                    | workspace 테스트 34개 통과. `scripts/` 테스트 파일 부재로 root 명령은 실패했다.           |
| `bun run ci:static`                   | 포맷, 린트, 의존성, 아키텍처 검사는 통과했다. 기존 정적 검사 장애로 root 명령은 실패했다. |
| `bun run build`                       | API 빌드는 통과했다. 웹 앱의 production origin 설정 부재로 root 명령은 실패했다.          |
| `bun run check:route-bundles`         | 기존 `/` 초기 JS gzip 예산 초과 `113747 > 75000`으로 실패했다.                            |

`ci:static`의 기존 장애는 누락된 `scripts/oxlint/workspace-rules.node-test.mjs`, `@workspace/http-platform`의 `node:net` 타입 오류와 기존 Knip 부채다.

## 남은 gate

외부 처리와 보존 기간을 owner가 승인하기 전에는 staging 변경 기능을 활성화할 수 없다.

authorization server와 대상 MCP client가 준비된 후 staging OAuth와 2A smoke를 실행해야 한다.

두 gate가 남았으므로 작업 단위는 `docs/work`에 유지한다.
