# 관리자 MCP 조회 도구 1단계 구현 보고서

## 문서 상태

- 상태: 로컬 구현·검증 완료, 승인된 staging smoke 대기
- 기준 커밋: `f7fb789f01e5515cf33f4dc5f7849b9f5d125004`
- 검증 시각: 2026-08-10 10:15–10:18 KST
- 검증 환경: Windows, Bun 1.3.14, Node.js 24.19.0

## 구현 결과

- `apps/api`에 조회 전용 관리자 MCP 경계를 추가했다.
- MCP SDK는 `@modelcontextprotocol/server` 2.0.0을 사용한다.
- 실제 client 통합 검증은 `@modelcontextprotocol/client` 2.0.0을 사용한다.
- OAuth metadata와 RFC 7662 introspection을 사용해 bearer token을 검증한다.
- 검증 항목은 issuer, resource audience, subject, client ID, 만료 시각과 `admin:mcp:read` scope이다.
- 서버 설정은 OAuth subject 하나를 기존 `AdminId` 하나에 연결한다.
- MCP 경계는 조회 전용 tool 7개만 공개한다.
- MCP 경계는 기존 `content`와 `operations` application을 직접 호출한다.
- 감사 이벤트 응답은 `clientIp`를 제외한다.
- 로그는 token, tool 입력과 tool 출력을 제외한다.
- production은 설정 검증 단계에서 활성화를 거부한다.

구현 artifact는 [`apps/api/src/mcp/admin`](../../../apps/api/src/mcp/admin)에 있다.

영구 결정은 [`ADR-0030`](../../engineering/adr/ADR-0030-admin-mcp-oauth-resource-server.md)과 관련 권위 문서에 반영했다.

## 응답 크기 측정

기본 시드 14개 코스를 실제 application과 presenter로 변환했다.

가장 큰 `admin_get_course_editor` 응답은 103,695바이트였다.

응답 제한은 UTF-8 JSON 262,144바이트이다.

측정된 최대 응답의 여유는 158,449바이트이다.

통합 테스트는 제한을 초과한 응답이 `RESPONSE_TOO_LARGE`로 실패하는지 검증한다.

## dependency 검토

- server와 client의 exact version, MIT license와 공식 저장소를 확인했다.
- lifecycle script, native binary와 설치 시 download가 없음을 확인했다.
- production과 전체 dependency advisory 검사를 통과했다.
- Bun frozen install을 통과했다.
- beta 상태인 Hono adapter는 추가하지 않았다.

## 검증 결과

| 명령                                                           | 결과                                        |
| -------------------------------------------------------------- | ------------------------------------------- |
| `bun install --frozen-lockfile`                                | 통과                                        |
| `bun run audit:production`                                     | 통과                                        |
| `bun run audit:full`                                           | 통과                                        |
| `bun --filter @workspace/api typecheck`                        | 통과                                        |
| `bun --filter @workspace/api test`                             | 22개 통과                                   |
| `bun --filter @workspace/api build`                            | 통과                                        |
| 변경된 계약·content·operations·observability package typecheck | 통과                                        |
| `git diff --check`                                             | 통과                                        |
| `bun run ci:static`                                            | 기존 repository 장애로 실패                 |
| `bun run ci:tests`                                             | 기존 `scripts` test 부재로 실패             |
| `bun run build`                                                | 기존 web production origin 설정 부재로 실패 |
| `bun run check:route-bundles`                                  | 기존 `/` bundle 예산 초과로 실패            |

`ci:static` 실행에서는 architecture, format, dependency sync, lint, workflow와 release 검사가 통과했다.

`ci:static` 실행은 누락된 `scripts/oxlint/workspace-rules.node-test.mjs`, 기존 Knip 결과와 기존 `trusted-client-ip.ts` typecheck 오류 때문에 종료 코드 1을 반환했다.

`ci:tests` 실행에서는 workspace Vitest가 통과했다.

`ci:tests` 실행은 `bun test ./scripts`에 test 파일이 없어서 종료 코드 1을 반환했다.

`build` 실행에서는 API build가 통과했다.

root build는 `/_not-found` 설정 수집 중 production web origin이 없어서 종료 코드 1을 반환했다.

route bundle 검사는 `/`의 초기 gzip 113,757바이트가 75,000바이트 예산을 초과해서 실패했다.

## 남은 외부 gate

승인된 OAuth provider 설정과 실제 client 등록 정보가 아직 없다.

외부 모델의 개인정보 처리 조건에 대한 소유자 승인도 아직 없다.

따라서 승인된 staging에서 OAuth 연결과 tool 7개 호출을 검증하지 않았다.

production endpoint는 이 gate가 끝날 때까지 비활성 상태로 유지한다.

작업 디렉터리는 staging smoke가 끝날 때까지 `docs/work`에 유지한다.
