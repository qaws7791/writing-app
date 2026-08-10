# 관리자 MCP 조회 도구 1단계 구현 계획

## 문서 상태

- 상태: 로컬 구현·검증 완료, 승인된 staging smoke 대기
- 기준 날짜: 2026-08-10
- 기준 커밋: `f7fb789f01e5515cf33f4dc5f7849b9f5d125004`
- 목표 환경: 로컬, test와 승인된 staging

이 문서는 소유자 관리자가 승인한 AI 에이전트가 조회 전용 관리자 기능을 MCP로 사용할 수 있게 하는 1단계 구현 순서와 완료 기준을 정의한다.

## 목표

`apps/api`에 원격 Streamable HTTP 관리자 MCP 경계를 추가한다.

관리자 MCP 경계는 기존 `content`와 `operations` application을 호출한다.

기존 관리자 HTTP API와 어드민 화면의 동작은 변경하지 않는다.

관리자 MCP 경계는 검증된 소유자 관리자와 OAuth client를 식별한 요청만 처리한다.

## 기준 문서

- 제품 범위는 [`admin-operations.md`](../../product/admin-operations.md)를 따른다.
- 시스템 경계는 [`system-overview.md`](../../engineering/system-overview.md)를 따른다.
- API 계약은 [`api-contract.md`](../../engineering/api-contract.md)를 따른다.
- 인증 정책은 [`auth-permissions.md`](../../engineering/auth-permissions.md)를 따른다.
- 새 transport의 actor 규칙은 [`admin-transport-security.md`](../../engineering/admin-transport-security.md)를 따른다.
- 로그와 감사 범위는 [`observability.md`](../../engineering/observability.md)를 따른다.
- 외부 데이터 처리는 [`privacy.md`](../../engineering/privacy.md)를 따른다.
- 현재 content 조회 경계는 [`admin-course-routes.ts`](../../../packages/modules/content/src/interface/http/admin-course-routes.ts)와 [`admin-curriculum-routes.ts`](../../../packages/modules/content/src/interface/http/admin-curriculum-routes.ts)에서 확인한다.
- 현재 operations 조회 경계는 [`reporting-routes.ts`](../../../packages/modules/operations/src/interface/http/reporting-routes.ts)와 [`audit-routes.ts`](../../../packages/modules/operations/src/interface/http/audit-routes.ts)에서 확인한다.
- MCP SDK 계약은 [TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/)의 공식 문서를 기준으로 한다.

## 범위

### 포함 범위

- 기존 API runtime 안의 관리자 MCP 어댑터
- OAuth resource server 방식의 bearer token 검증 경계
- 소유자 관리자 ID와 OAuth client ID의 서버 측 구성
- 조회 전용 MCP tool 7개
- Zod 입력·출력 schema와 `structuredContent`
- request ID, 관리자 ID와 OAuth client ID를 연결하는 구조화 로그
- 실제 MCP client를 사용하는 인증·계약·통합 검증
- MCP package와 lockfile 변경에 대한 공급망 검토

### 제외 범위

- 코스 생성·저장·발행·보관·복원
- 사용자 목록·상세·상태 변경·삭제
- 콘텐츠 asset 업로드
- MCP prompts, resources와 tasks
- OAuth authorization server 구현
- 관리자 역할 또는 권한 등급 추가
- 어드민 UI 변경
- production endpoint 활성화
- 데이터베이스 schema와 migration 변경

## tool 계약

tool 이름은 정적 영문 식별자를 사용한다.

tool 설명은 조회 대상, 입력 경계와 반환 범위를 명시한다.

모든 tool은 `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`를 선언한다.

| tool                            | 입력 계약                         | 출력 계약                                 |
| ------------------------------- | --------------------------------- | ----------------------------------------- |
| `admin_list_courses`            | 검색·분류·상태·bounded pagination | 코스 목록과 pagination                    |
| `admin_get_course_editor`       | 검증된 `courseId`                 | 코스 편집 문서                            |
| `admin_get_dashboard`           | 없음                              | 기준일이 포함된 관리자 대시보드           |
| `admin_get_analytics`           | bounded 기간                      | 관리자 분석 요약                          |
| `admin_list_lesson_analytics`   | 검색·정렬·bounded pagination      | 레슨별 분석 목록과 pagination             |
| `admin_get_ai_feedback_quality` | 검증된 반개구간 날짜 범위         | 원문이 없는 AI 코칭 품질 집계             |
| `admin_list_audit_events`       | 분류·기간·bounded pagination      | IP를 제외한 감사 이벤트 목록과 pagination |

기존 `@workspace/contracts` schema를 입력과 출력의 정본으로 재사용한다.

MCP 전용 출력 차이는 `@workspace/contracts`의 명시적인 MCP schema로 선언한다.

`admin_list_audit_events`는 `clientIp`를 반환하지 않는다.

`admin_get_course_editor`의 직렬화 크기는 구현 전에 실제 fixture로 측정한다.

측정 결과를 기준으로 응답 크기 상한과 초과 오류를 계약에 고정한다.

## 구조 결정

1. 관리자 MCP는 기존 관리자 HTTP API를 대체하지 않는다.
2. 관리자 MCP는 `apps/api`의 별도 경로에 추가한다.
3. 제안 경로는 `/mcp/admin`이다.
4. MCP handler는 요청마다 새 `McpServer`를 만든다.
5. MCP handler는 `ApiContainer`가 제공하는 application만 호출한다.
6. MCP handler는 module 내부 source와 DB를 직접 import하지 않는다.
7. MCP handler는 기존 관리자 HTTP endpoint를 내부 HTTP로 다시 호출하지 않는다.
8. 공통 DTO 변환은 해당 module의 기존 공개 subpath 안에서 순수 presenter로 재사용한다.
9. 제품 module에 다섯 번째 공개 subpath를 추가하지 않는다.
10. 인증 설정이 없으면 관리자 MCP 경로를 등록하지 않는다.
11. production은 별도 승인 전까지 관리자 MCP 경로를 등록하지 않는다.

## 선행 결정 gate

다음 입력이 확정되지 않으면 외부 연결 경로 구현을 시작하지 않는다.

| 결정                       | 완료 조건                                                                  |
| -------------------------- | -------------------------------------------------------------------------- |
| OAuth authorization server | issuer, metadata 또는 JWKS·introspection endpoint와 운영 owner가 확정된다. |
| MCP resource 식별자        | HTTPS resource URL과 전용 audience가 확정된다.                             |
| 관리자 subject 연결        | 검증된 subject를 기존 `AdminId`로 연결하는 서버 소유 규칙이 확정된다.      |
| 접근 scope                 | 조회 전용 scope와 token 만료 정책이 확정된다.                              |
| MCP host                   | 허용 host, OAuth client 등록 방식과 지원 protocol era가 확인된다.          |
| 모델 데이터 경계           | provider, 처리 지역, 보존·학습 사용 조건과 승인 주체가 기록된다.           |
| 감사 이벤트 출력           | opaque actor·target ID와 request ID의 모델 전달이 승인된다.                |

이메일 문자열은 다른 계정을 관리자에게 연결할 수 있으므로 암묵적 관리자 연결에 사용하지 않는다.

tool 입력의 관리자 ID는 요청 주체를 위조할 수 있으므로 actor 구성에 사용하지 않는다.

MCP access token passthrough는 audience 검증과 감사를 우회할 수 있으므로 기존 관리자 HTTP API에 token을 전달하지 않는다.

## 실행 단계

### 0. 제품·보안 결정 고정

1. `admin-operations.md`에 소유자 관리자가 승인한 조회 전용 AI 에이전트 범위를 추가한다.
2. 외부 MCP host와 모델의 개인정보 처리 범위를 `privacy.md`에 추가한다.
3. 관리자 MCP transport, OAuth 경계와 배포 위치를 ADR로 기록한다.
4. `admin-transport-security.md`에 bearer token과 OAuth client 식별 규칙을 추가한다.
5. `observability.md`에 OAuth client ID의 허용 필드와 금지 필드를 추가한다.
6. 새 공통 용어를 `glossary.md`에 등록한다.

완료 기준은 선행 결정 gate의 각 owner와 값이 권위 문서 또는 ADR에 기록된 상태이다.

### 1. SDK dependency 검토

1. `@modelcontextprotocol/server`와 `@modelcontextprotocol/hono`의 정확한 package identity를 확인한다.
2. 실제 MCP client 통합 검증에 필요한 `@modelcontextprotocol/client`를 확인한다.
3. 선택한 stable v2의 source tag, npm artifact, publisher, license와 security policy를 교차 확인한다.
4. Bun, Hono, Zod, ESM과 TypeScript 설정의 호환성을 확인한다.
5. lifecycle script, native binary, download와 transitive dependency를 검사한다.
6. 정확한 버전을 `apps/api/package.json`에 선언한다.
7. `bun.lock`은 Bun 명령으로만 갱신한다.
8. 예상하지 않은 package, script 또는 lockfile 변경이 있으면 설치를 중단한다.

`@modelcontextprotocol/node`, Express adapter, Fastify adapter와 legacy server package는 추가하지 않는다.

OAuth authorization server가 JWT를 발급하면 검증용 JOSE dependency를 별도로 평가한다.

OAuth authorization server가 RFC 7662를 제공하면 표준 `fetch` 기반 introspection adapter를 평가한다.

직접 만든 암호화·서명 검증은 권한 검증 오류를 만들 수 있으므로 사용하지 않는다.

완료 기준은 선택 버전, 검증 근거, 미해결 위험과 rollback 조건이 작업 기록에 남은 상태이다.

### 2. MCP 계약과 presenter 추가

1. MCP tool 입력 schema는 기존 bounded query와 branded ID schema를 조합한다.
2. MCP tool 출력 schema는 선언하지 않은 필드를 거부한다.
3. 기존 HTTP DTO 변환과 겹치는 순수 변환은 소유 module에서 한 번만 구현한다.
4. 감사 이벤트 MCP 출력에서 `clientIp`를 제거한다.
5. 성공 결과는 같은 schema로 `structuredContent`와 최소 text 요약을 만든다.
6. 예상된 domain 실패는 안정된 공개 오류 code와 request ID를 포함한 `isError: true` 결과로 변환한다.
7. 내부 stack, persistence 세부 정보와 provider 원문을 결과에서 제거한다.

완료 기준은 7개 tool의 입력·출력과 오류가 정적 schema로 확정된 상태이다.

### 3. 인증된 MCP transport 조립

1. 검증된 runtime 설정만 받는 access-token verifier port를 만든다.
2. verifier는 signature 또는 introspection 결과, issuer, audience, expiry와 조회 scope를 검증한다.
3. verifier는 검증된 subject를 기존 `AdminId`로 연결한다.
4. MCP bearer gate는 application 호출 전에 실패를 반환한다.
5. `AuthInfo`의 관리자 ID와 OAuth client ID를 요청 context에 전달한다.
6. protected resource metadata를 resource URL에 맞게 제공한다.
7. Hono adapter의 Host·Origin 보호를 승인된 host 목록에 맞게 설정한다.
8. 평문 token 탈취를 막기 위해 localhost 외 환경은 HTTPS가 아니면 시작을 거부한다.
9. 인증된 응답에 private no-store를 적용한다.
10. MCP handler의 `close`를 API 종료 lifecycle에 연결한다.

누락·만료·잘못된 audience token은 `401`로 거부한다.

조회 scope가 없는 유효한 token은 `403`으로 거부한다.

완료 기준은 비인증 요청이 module application에 도달하지 않는 상태이다.

### 4. 조회 tool 등록

1. 7개 tool을 고정된 이름과 설명으로 등록한다.
2. `tools/list`는 7개 tool만 반환한다.
3. tool handler는 인증 context에서 actor를 읽는다.
4. course tool은 `content.application`을 호출한다.
5. reporting tool은 `operations.reporting`을 호출한다.
6. audit tool은 `operations.auditTrail`을 호출한다.
7. pagination과 날짜 범위의 기존 상한을 유지한다.
8. course editor 결과가 확정 상한을 넘으면 안정된 초과 오류를 반환한다.
9. 저장된 콘텐츠 문자열을 tool 지시문이나 동적 설명으로 사용하지 않는다.

완료 기준은 모든 tool이 DB에 직접 접근하지 않고 기존 HTTP endpoint를 재호출하지 않으며 같은 application 결과를 반환하는 상태이다.

### 5. 관찰·보안 경계 연결

1. MCP HTTP 요청에 기존 request ID를 연결한다.
2. 성공과 실패 로그에 route template, 관리자 ID, OAuth client ID, 결과와 지연을 기록한다.
3. 인증 실패는 기존 `security.audit` 경계에 기록한다.
4. credential과 운영 데이터 노출을 막기 위해 token, Authorization header, tool 입력과 tool 출력을 로그에 기록하지 않는다.
5. client 사칭을 막기 위해 MCP client가 보낸 자체 client 정보를 인증된 OAuth client ID로 사용하지 않는다.
6. 1단계는 기존 영속 감사 action 집합을 확장하지 않는다.
7. 영속 감사 확대는 별도 제품·보존 결정으로 남긴다.

완료 기준은 로그만으로 요청과 인증된 주체를 연결할 수 있고 민감 원문이 남지 않는 상태이다.

### 6. 검증과 staging 확인

1. 실제 `@modelcontextprotocol/client`와 in-process HTTP handler로 integration test를 실행한다.
2. `tools/list`의 이름, schema와 annotation을 검증한다.
3. 누락·변조·만료·잘못된 issuer·audience·scope token을 각각 검증한다.
4. 7개 tool의 대표 성공 결과를 실제 module fixture로 검증한다.
5. 잘못된 query, 없는 코스와 reporting 장애의 공개 오류를 검증한다.
6. 사용자 tool과 mutation tool이 노출되지 않는지 검증한다.
7. 감사 결과에 `clientIp`가 없는지 검증한다.
8. tool 입력·출력과 token이 로그에 없는지 검증한다.
9. 대상 MCP host의 protocol era를 기록한다.
10. 지원하기로 한 protocol era마다 동일한 인증과 tool allowlist를 검증한다.
11. 승인된 staging에서 OAuth 연결과 7개 tool 호출을 smoke test한다.
12. 시작한 server와 test process를 모두 종료한다.

의존성 변경 직후 frozen install, dependency graph와 audit를 확인한다.

구현 완료 전 root의 필수 정적 검사, 테스트, build와 route bundle 검사를 실행한다.

완료 기준은 로컬 필수 gate와 승인된 staging smoke가 모두 성공한 상태이다.

## 위험과 완화

| 위험                                    | 결과                                            | 완화                                                                              |
| --------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| OAuth provider 또는 subject 연결 미확정 | 인증되지 않은 관리자 권한이 생길 수 있다.       | 외부 route 구현을 중단하고 verifier port와 test만 작성한다.                       |
| 외부 모델로 운영 데이터 전송            | 승인되지 않은 개인정보 처리가 발생할 수 있다.   | 승인된 host만 사용하고 감사 IP를 제거하며 production을 비활성화한다.              |
| 큰 코스 편집 문서                       | 모델 context와 응답 자원이 고갈될 수 있다.      | 실제 크기를 측정하고 서버 상한과 안정된 초과 오류를 둔다.                         |
| HTTP와 MCP presenter 중복               | 같은 사실이 서로 다른 형태로 변할 수 있다.      | 소유 module의 순수 presenter를 재사용한다.                                        |
| protocol era 불일치                     | host 연결 또는 후속 확인 흐름이 실패할 수 있다. | 대상 host의 협상 결과를 기록하고 지원 era를 integration test에 고정한다.          |
| 콘텐츠의 prompt 형태 문자열             | 모델이 데이터를 지시로 오인할 수 있다.          | 설명을 정적으로 유지하고 결과를 구조화하며 자동 mutation이 없는 1단계만 배포한다. |
| 신규 runtime dependency                 | 공급망과 배포 표면이 증가한다.                  | exact version, artifact, license, script, advisory와 transitive graph를 검토한다. |

## rollback

1. `/mcp/admin` 등록을 제거한다.
2. MCP composition과 contract consumer를 제거한다.
3. Bun 명령으로 MCP dependency를 제거한다.
4. runtime 설정과 배포 입력을 제거한다.
5. 기존 관리자 HTTP API smoke를 다시 실행한다.

1단계는 DB migration을 만들지 않는다.

rollback은 저장 데이터 복구를 요구하지 않는다.

## 전체 완료 기준

- 선행 결정 gate가 모두 완료되었다.
- 정확히 7개 조회 tool만 노출된다.
- 사용자 정보와 mutation tool은 노출되지 않는다.
- 모든 요청은 검증된 관리자 ID와 OAuth client ID를 가진다.
- 비인증과 권한 부족 요청은 application 호출 전에 거부된다.
- MCP 결과와 로그는 금지된 개인정보와 secret을 포함하지 않는다.
- 기존 관리자 HTTP API의 계약과 동작이 유지된다.
- dependency·정적 검사·테스트·build·route bundle gate가 통과한다.
- 승인된 staging host에서 연결과 7개 tool 호출이 성공한다.
- 관련 제품·엔지니어링 문서가 구현 결과를 반영한다.
- 완료 보고서를 같은 작업 디렉터리에 추가한 뒤 디렉터리를 `docs/archive`로 이동한다.
