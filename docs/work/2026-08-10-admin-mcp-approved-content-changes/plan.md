# 관리자 MCP 승인 기반 콘텐츠 변경 2단계 구현 계획

## 문서 상태

- 상태: 2A 로컬 구현·검증 완료, 외부 staging 결정 대기
- 기준 날짜: 2026-08-10
- 기준 커밋: `f7fb789f01e5515cf33f4dc5f7849b9f5d125004`
- 선행 작업: [관리자 MCP 조회 도구 1단계](../2026-08-10-admin-mcp-read-tools/report.md)
- 목표 환경: 로컬, test와 승인된 staging

이 계획은 2단계를 승인 기반 콘텐츠 변경으로 정의한다.

제품 정책은 owner가 요청별로 승인한 코스 초안 생성, 보관과 보관 해제를 허용한다.

외부 처리와 보존 결정이 완료되기 전에는 변경 기능을 staging에서 활성화하지 않는다.

## 구현 진행 상태

| 항목                                | 상태                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------- |
| 2A 계약·승인 상태·실행 영수증       | 완료                                                                   |
| owner 승인 API와 deep-link 화면     | 완료                                                                   |
| modern `input_required` coordinator | 완료                                                                   |
| scope·legacy 차단·기본 비활성화     | 완료                                                                   |
| MCP 감사 provenance                 | 완료                                                                   |
| 로컬 typecheck·핵심 회귀 테스트     | 완료                                                                   |
| root 품질 gate                      | 실행 완료. 기존 저장소 실패는 완료 보고서에 기록했다.                  |
| 외부 처리·보존 정책 승인            | 미완료. staging 변경 기능 활성화를 차단한다.                           |
| 승인된 staging OAuth·2A smoke       | 미완료. 외부 authorization server와 MCP client 입력이 필요하다.        |
| 2B draft 저장·2C 발행               | 미구현. snapshot·복구·별도 rollout 결정 전에는 도구를 등록하지 않는다. |

## 목표

승인된 AI 에이전트가 기존 content application의 변경 작업을 요청할 수 있게 한다.

owner 관리자는 신뢰된 어드민 화면에서 변경 내용과 영향을 확인한다.

관리자 MCP는 owner 관리자의 서버 측 승인이 완료된 요청만 한 번 실행한다.

기존 관리자 HTTP API와 어드민 편집 흐름은 유지한다.

1단계 조회 tool 7개는 기존 계약을 유지한다.

## 구현 전 결정 gate

아래 항목 중 하나라도 미완료이면 staging에서 변경 tool을 등록하지 않는다.

| 결정        | 완료 조건                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------- |
| 제품 범위   | `admin-operations.md`와 `product-scope.md`가 승인 기반 AI 콘텐츠 변경을 허용한다.           |
| 1단계 검증  | 승인된 staging에서 OAuth 연결과 조회 tool 7개 smoke가 통과한다.                             |
| 외부 처리   | MCP client와 모델의 처리 지역, 보존, 삭제, 학습 사용과 재위탁 조건을 owner가 승인한다.      |
| client 기능 | 대상 MCP client가 2026-07-28 protocol의 `input_required`와 URL mode elicitation을 지원한다. |
| OAuth 권한  | authorization server가 2A draft와 lifecycle scope를 분리해 발급한다.                        |
| 승인 화면   | owner session, trusted Origin과 CSRF 방어를 적용한 변경 검토 화면이 승인된다.               |
| 멱등성      | 재시도와 실행 중 process 종료에서 중복 변경이 발생하지 않는 설계가 확정된다.                |
| 보존        | 2A 승인 metadata·실행 영수증과 2B 복구 snapshot의 보존·삭제 기간이 승인된다.                |

## 기준 문서

- 제품 범위는 [`admin-operations.md`](../../product/admin-operations.md)와 [`product-scope.md`](../../product/product-scope.md)를 따른다.
- 콘텐츠 불변식은 [`content-model.md`](../../product/content-model.md)를 따른다.
- 보안 기준은 [`security.md`](../../engineering/security.md)를 따른다.
- 인증 정책은 [`auth-permissions.md`](../../engineering/auth-permissions.md)를 따른다.
- transport 기준은 [`admin-transport-security.md`](../../engineering/admin-transport-security.md)를 따른다.
- 데이터 경계는 [`data-model.md`](../../engineering/data-model.md)를 따른다.
- API와 MCP 오류 계약은 [`api-contract.md`](../../engineering/api-contract.md)를 따른다.
- 외부 처리 기준은 [`privacy.md`](../../engineering/privacy.md)를 따른다.
- 감사와 로그 기준은 [`observability.md`](../../engineering/observability.md)를 따른다.
- 기존 MCP 구조는 [`ADR-0030`](../../engineering/adr/ADR-0030-admin-mcp-oauth-resource-server.md)을 따른다.
- modern MCP 왕복은 [SDK v2의 2026-07-28 지원 문서](https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28)를 따른다.
- URL 승인은 [MCP elicitation 명세](https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation)를 따른다.
- scope 분리는 [MCP authorization 지침](https://modelcontextprotocol.io/docs/tutorials/security/authorization)을 따른다.

tool annotation은 실행 보안이 아니라 client 표시용 hint로만 사용한다.

## 범위

### 포함 범위

- 기존 관리자 MCP runtime 안의 content 변경 adapter
- owner 변경 검토·승인 화면
- 승인 요청의 영속 상태와 만료 정리
- 변경별 OAuth scope 검사
- server가 강제하는 owner 승인
- 멱등성 key와 실행 영수증
- 낙관적 version 검사
- MCP 변경 provenance를 포함한 영속 감사
- 실제 MCP client와 owner session을 사용하는 통합 검증
- 승인된 staging의 단계별 smoke

### 제외 범위

- 사용자 목록, 사용자 상세, 사용자 상태 변경과 사용자 삭제
- 콘텐츠 asset 업로드
- server 내부 모델 호출
- 관리자 AI 채팅
- MCP prompts, resources와 tasks
- client가 자체 표시한 확인만 신뢰하는 승인
- 2025 era client의 변경 실행
- production 활성화

외부 에이전트가 콘텐츠 문안을 제안하는 행위는 현재 제품 비범위와 충돌한다.

owner가 해당 범위 변경을 승인하지 않으면 draft 저장 tool을 2단계에서 제거한다.

## 변경 tool 후보

모든 입력은 `idempotencyKey`를 요구한다.

`idempotencyKey`는 16자 이상 128자 이하의 안전한 ASCII 식별자만 허용한다.

모든 tool은 `readOnlyHint: false`와 `openWorldHint: false`를 선언한다.

`idempotentHint: true`는 원자적 replay 검증이 통과한 뒤에만 선언한다.

| tool                         | 입력                                                    | 결과                  | `destructiveHint` |
| ---------------------------- | ------------------------------------------------------- | --------------------- | ----------------- |
| `admin_create_course_draft`  | `idempotencyKey`                                        | 생성된 코스 편집 문서 | `false`           |
| `admin_save_course_draft`    | `idempotencyKey`, `expectedEditVersion`, 전체 편집 문서 | 저장된 코스 편집 문서 | `true`            |
| `admin_publish_course_draft` | `idempotencyKey`, `courseId`, `expectedEditVersion`     | 발행 revision         | `true`            |
| `admin_archive_course`       | `idempotencyKey`, `courseId`                            | 보관 결과             | `true`            |
| `admin_restore_course`       | `idempotencyKey`, `courseId`                            | 보관 해제 결과        | `false`           |

범용 patch tool은 영향 범위를 정적으로 설명할 수 없으므로 추가하지 않는다.

draft 저장은 기존 전체 문서 schema와 `expectedEditVersion`을 재사용한다.

draft 저장 입력은 UTF-8 JSON 256 KiB를 넘으면 application 호출 전에 거부한다.

MCP 전체 request 상한은 JSON-RPC envelope를 포함해 320 KiB를 넘지 않게 고정한다.

실제 fixture 측정이 320 KiB를 초과하면 문서 분할 계약을 먼저 결정한다.

## 권한 모델

기존 `admin:mcp:read` scope는 모든 변경 tool의 선행 scope로 유지한다.

| 기능                  | 추가 scope                             |
| --------------------- | -------------------------------------- |
| 코스 생성             | `admin:mcp:draft`                      |
| draft 저장과 발행     | 2A에서 scope와 도구를 등록하지 않는다. |
| 코스 보관과 보관 해제 | `admin:mcp:lifecycle`                  |

각 tool handler는 필요한 추가 scope를 application 호출 전에 검증한다.

MCP client가 자체 보고한 이름과 version은 권한 판정에 사용하지 않는다.

scope 부족은 승인 요청과 감사 row를 만들기 전에 `403`으로 거부한다.

## 승인 계약

1. tool handler는 입력 schema와 크기를 검증한다.
2. tool handler는 현재 content 상태와 version을 읽는다.
3. tool handler는 canonical 입력 digest와 변경 요약을 만든다.
4. server는 `pending` 승인 요청을 저장한다.
5. server는 URL mode elicitation을 포함한 `input_required` 결과를 반환한다.
6. MCP client는 owner에게 승인 URL을 표시한다.
7. owner는 어드민 session으로 변경 전후와 영향을 확인한다.
8. owner는 trusted Origin의 승인 또는 거절 요청을 보낸다.
9. MCP client는 원래 tool call을 같은 입력으로 재시도한다.
10. tool handler는 승인 binding과 상태를 다시 검증한다.
11. tool handler는 승인된 요청을 원자적으로 `executing`으로 선점한다.
12. tool handler는 현재 content 상태와 version을 다시 읽는다.
13. tool handler는 영속 감사를 시작한다.
14. tool handler는 content application을 한 번 호출한다.
15. tool handler는 감사와 실행 영수증을 종결한다.
16. 같은 key와 digest의 재시도는 저장된 결과를 replay한다.

승인 URL은 추측하기 어려운 승인 요청 ID만 포함한다.

승인 URL은 token, cookie, content payload와 사전 인증 정보를 포함하지 않는다.

승인 화면은 유효한 owner session이 없으면 로그인 이후 같은 요청으로 복귀한다.

승인 요청은 owner `AdminId`, 검증된 OAuth client ID, resource, tool 이름, target, input digest와 request ID에 묶는다.

MCP client의 elicitation `accept` 응답만으로는 승인을 완료하지 않는다.

`requestState`는 신뢰하지 않고 server가 서명한 값만 수락한다.

승인 요청의 제안 기본 만료 시간은 생성 후 10분이다.

만료 시간은 제품·보안 승인 전에는 코드 상수로 확정하지 않는다.

승인 이후 현재 상태나 version이 바뀌면 변경을 실행하지 않고 `CONFLICT`를 반환한다.

## 상태와 데이터 소유권

`operations` module은 승인 요청 lifecycle과 영속 감사를 소유한다.

승인 요청 payload는 tool별 discriminated schema로 저장한다.

승인 저장소는 임의 `Record<string, unknown>` payload를 받지 않는다.

`content` module은 콘텐츠 변경과 멱등 실행 영수증을 소유한다.

콘텐츠 변경과 실행 영수증은 같은 SQLite transaction에서 확정한다.

`apps/api` composition은 operations 승인 결과와 content application을 연결한다.

MCP adapter는 module persistence와 관리자 HTTP endpoint를 직접 호출하지 않는다.

승인 요청 상태는 `pending | approved | rejected | expired | executing | succeeded | failed`로 제한한다.

같은 승인 요청을 두 process가 실행하면 한 process만 `executing` 선점에 성공해야 한다.

같은 key와 다른 digest는 `IDEMPOTENCY_CONFLICT`로 거부한다.

draft 저장은 실행 전 편집 문서 snapshot을 복구용으로 보관한다.

복구 snapshot의 제안 보존 기간은 실행 후 24시간이다.

복구 기간과 owner 복구 절차가 승인되지 않으면 draft 저장 tool을 등록하지 않는다.

만료·거절·종결된 제안 payload는 승인된 보존 기간 안에 maintenance가 삭제한다.

영속 감사는 payload 대신 action, actor, OAuth client ID, 승인 요청 ID, target, digest와 outcome만 보존한다.

## 실행 단계

### 0. 제품·보안 결정 고정

1. 제품 문서에 AI 에이전트 변경 범위와 owner 책임을 추가한다.
2. 개인정보 문서에 승인 payload와 snapshot의 목적·보존·삭제를 추가한다.
3. 권한 문서에 변경 scope matrix를 추가한다.
4. 관찰 문서에 MCP 변경 provenance와 감사 action을 추가한다.
5. 기존 ADR을 대체하지 않는 2단계 ADR을 추가한다.

### 1. protocol과 client 호환성 spike

1. SDK v2의 `inputRequired.elicitUrl`과 sealed `requestState` 계약을 확인한다.
2. 대상 MCP client가 modern protocol과 URL mode를 지원하는지 실제 연결로 확인한다.
3. 승인, 거절, 취소, timeout과 client capability 부재를 검증한다.
4. 2025 era 연결에서는 조회만 허용하고 변경 call을 안정된 오류로 거부한다.

### 2. 계약과 persistence 추가

1. 변경 tool 입력·출력 schema를 `@workspace/contracts`에 추가한다.
2. 승인 요청 state와 전이 규칙을 operations domain에 추가한다.
3. 멱등 실행 영수증을 content domain에 추가한다.
4. approval과 receipt table을 append-only migration으로 추가한다. snapshot table은 2B에서 추가한다.
5. canonical JSON과 digest 규칙을 test fixture로 고정한다.
6. payload 만료 정리를 기존 maintenance lifecycle에 연결한다.

### 3. owner 승인 화면 추가

1. owner session으로 보호된 승인 상세 조회를 추가한다.
2. 화면은 tool, target, diff, version, OAuth client ID와 만료 시각을 표시한다.
3. 화면은 승인과 거절을 별도 행동으로 제공한다.
4. 승인 mutation은 trusted Origin과 CSRF 방어를 적용한다.
5. 만료·종결·이미 선점된 요청은 다시 승인할 수 없게 한다.
6. 승인 화면은 token과 MCP request 원문을 표시하지 않는다.

### 4. MCP 변경 coordinator 구현

1. runtime metadata에 변경 scope를 선언한다.
2. 각 tool에 scope, schema, annotation과 정적 설명을 등록한다.
3. handler에 승인 계약의 두 단계 실행을 연결한다.
4. handler는 auth context에서 actor와 OAuth client ID를 읽는다.
5. handler는 operations 승인 application과 content application만 호출한다.
6. handler는 안정된 공개 오류 code와 request ID만 반환한다.
7. handler는 tool 입력, 출력과 승인 payload를 로그에 남기지 않는다.

### 5. 단계별 활성화

1. 별도 변경 feature flag를 기본 `false`로 추가한다.
2. 2A에서 코스 생성, 보관과 보관 해제만 활성화한다.
3. 2A staging 검증 이후 draft 저장을 2B로 활성화한다.
4. draft snapshot 복구 훈련 이후 발행을 2C로 활성화한다.
5. 각 단계는 독립적으로 비활성화할 수 있어야 한다.

### 6. 감사와 관찰 연결

1. 2A에 `course.create` 감사 action을 추가한다. `course.draft.save`는 2B에서 추가한다.
2. 기존 publish, archive와 restore action을 재사용한다.
3. DB audit에 OAuth client ID와 승인 요청 ID를 추가한다.
4. 감사 `started` 저장 실패는 content application 호출을 차단한다.
5. 감사 종결 실패는 성공 응답을 차단한다.
6. replay는 content 변경 감사 row를 중복 생성하지 않는다.

### 7. 검증과 staging rollout

1. 실제 `@modelcontextprotocol/client`로 modern 왕복을 검증한다.
2. read scope만 가진 token의 모든 변경 call이 `403`인지 검증한다.
3. scope별 허용·거부 matrix를 검증한다.
4. 위조 accept, 변조 `requestState`와 다른 OAuth client replay를 검증한다.
5. 승인 만료, owner 거절과 owner 취소를 검증한다.
6. 동일 key replay와 다른 payload conflict를 검증한다.
7. 승인과 실행 경쟁에서 한 번만 변경되는지 검증한다.
8. stale edit version과 승인 후 상태 변경을 검증한다.
9. 감사 실패가 fail-closed로 동작하는지 검증한다.
10. legacy client의 조회 호환성과 변경 거부를 검증한다.
11. log와 오류에 token, payload, diff와 내부 stack이 없는지 검증한다.
12. request와 response 크기 상한을 검증한다.
13. staging fixture에서 2A, 2B와 2C를 순서대로 smoke한다.
14. 변경 scope 회수 뒤 모든 변경 call이 거부되는지 확인한다.

구현 직후 frozen install과 dependency audit를 다시 실행한다.

구현 완료 전 root 정적 검사, test, build와 route bundle 검사를 실행한다.

## 위험과 완화

| 위험                                         | 결과                                             | 필요한 조치                                                   |
| -------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| 악성 client가 승인을 위조한다.               | owner 확인 없이 콘텐츠가 변경될 수 있다.         | server의 영속 승인 상태가 없으면 실행을 거부한다.             |
| 같은 call이 재시도된다.                      | 코스 중복 생성이나 중복 발행이 발생할 수 있다.   | content transaction에 멱등 실행 영수증을 함께 저장한다.       |
| 승인 대기 중 draft가 바뀐다.                 | 검토한 내용과 다른 상태에 변경이 적용될 수 있다. | digest와 expected version을 실행 직전에 다시 검증한다.        |
| 승인 URL이 노출된다.                         | 제3자가 승인 화면 접근을 시도할 수 있다.         | URL에서 인증 정보를 제거하고 owner session을 별도로 검증한다. |
| AI가 콘텐츠의 지시문을 따른다.               | 의도하지 않은 draft가 제안될 수 있다.            | 전체 diff를 표시하고 server 승인 없이는 저장하지 않는다.      |
| draft 저장이 정상 내용을 제거한다.           | 편집 중 콘텐츠를 잃을 수 있다.                   | 변경 전 snapshot과 24시간 owner 복구 절차를 제공한다.         |
| 큰 편집 문서가 반복 전송된다.                | API memory와 CPU가 고갈될 수 있다.               | 인증 이후에도 body 크기와 rate limit을 적용한다.              |
| 감사 저장소가 실패한다.                      | 변경 provenance를 잃을 수 있다.                  | 감사 시작 실패에는 변경을 실행하지 않는다.                    |
| legacy client가 승인 흐름을 지원하지 않는다. | 확인 없는 fallback 실행이 발생할 수 있다.        | legacy 연결의 변경 tool 실행을 금지한다.                      |

## rollback

1. 변경 feature flag를 `false`로 바꾼다.
2. authorization server에서 변경 scope를 회수한다.
3. 1단계 조회 tool 7개는 유지한다.
4. `pending`과 `approved` 요청을 만료 처리한다.
5. `executing` 요청은 실행 영수증과 content 상태를 대조한다.
6. draft 오류는 보존된 snapshot으로 owner가 복구한다.
7. append-only migration은 되돌리지 않고 비활성 table로 유지한다.

발행된 immutable revision은 자동 rollback하지 않는다.

발행 오류는 owner가 기존 관리자 편집·발행 흐름으로 새 revision을 만들어 복구한다.

## 전체 완료 기준

- 구현 전 결정 gate가 모두 완료됐다.
- 1단계 staging smoke가 통과했다.
- 승인된 변경 tool만 공개된다.
- 모든 변경은 server가 검증한 owner 승인과 OAuth client provenance를 가진다.
- 승인 없는 요청, 위조 승인과 stale 요청은 application 호출 전에 거부된다.
- 동일 key 재시도는 content를 한 번만 변경한다.
- 변경 전 snapshot으로 draft 복구 훈련을 완료했다.
- 영속 감사와 실행 영수증이 request ID로 연결된다.
- 사용자 관리와 asset upload tool은 노출되지 않는다.
- 2025 era client는 변경을 실행할 수 없다.
- token, payload, diff와 내부 오류는 로그에 남지 않는다.
- dependency, 정적 검사, test, build와 route bundle 결과를 기록했다.
- 승인된 staging에서 2A, 2B와 2C smoke가 통과했다.
- production 변경 tool은 비활성 상태다.
- 영구 결론을 제품·엔지니어링 권위 문서와 ADR에 반영했다.
- 완료 보고서를 추가한 뒤 작업 단위를 archive로 이동했다.
