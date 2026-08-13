# 데이터 모델 원칙

## 목적

이 문서는 데이터 의미, 불변식과 변경 원칙을 정의한다. 학습자·관리자 credential과 session schema는 auth infra가 소유한다. 관리자 MCP credential schema는 API MCP 경계가 소유한다. 제품 데이터는 각 module이 소유한다. SQLite primitive는 DB infra가 소유한다. 통합 schema·migration·seed 실행은 API composition이 소유한다.

## 모델 원칙

- 제품 문서의 콘텐츠 계층과 사용자·학습 상태 의미를 persistence 표현보다 먼저 유지한다.
- 식별자는 다른 도메인과 혼동되지 않도록 타입과 관계에서 의미를 드러낸다.
- 인증 데이터, 콘텐츠 원본, 학습 진행과 감사 기록은 서로 다른 접근·보존 정책을 적용한다.
- 읽기 projection은 원본 데이터의 권위를 대체하지 않으며, 손상되거나 불완전한 persisted 값은 부분 성공으로 숨기지 않는다.
- 상태 전이는 허용된 이전 상태와 actor를 명시하고, 경쟁 요청에서도 중복 효과가 생기지 않게 한다.

## Identity 데이터 경계

- 학습자 profile과 `active | suspended | deleted` 상태는 identity module의 schema와 repository가 소유한다.
- credential·session table은 auth infra가 소유하며 identity schema에 포함하지 않는다. identity profile은 인증 계정을 FK로 참조하고 credential의 물리 삭제에는 함께 삭제된다.
- 상태 전이는 `active → suspended | deleted`, `suspended → active | deleted`만 허용한다. `deleted`는 종단 상태이며 정리 전까지 관리자 조회만 허용하고 상태 변경·재삭제와 보호 API 접근을 거부한다.
- 삭제 command는 private object storage에 user ID와 요청 시각만 가진 marker 한 개를 먼저 기록한다. 기록 실패에는 profile이나 session을 변경하지 않는다. 기록 성공 뒤 profile을 비식별화하고 삭제 시각을 기록한 다음 해당 학습자의 모든 session을 즉시 폐기한다. 삭제 시각부터 5일 동안 사용자 소유 데이터는 보존한다.
- 삭제 시각이 5일 이상 지난 사용자는 명시적 정리 command가 학습 초안·답변·진행·활동, 인증 verification과 인증 사용자를 하나의 SQLite transaction에서 순서대로 삭제한다. 인증 verification은 이메일 식별자 또는 사용자 ID 연결로 삭제한다. 인증 사용자의 account·session·profile은 cascade로 함께 삭제하고 콘텐츠 revision은 보존한다.
- backup 복원에서는 정확한 snapshot 시각 이후의 private marker를 사용자별 가장 이른 요청으로 축약해 삭제 상태와 session 폐기를 다시 적용하고, 이미 5일 경계를 지난 사용자는 같은 물리 삭제 경계로 정리한다. 반복 실행은 이미 적용·이미 삭제 상태로 수렴한다.
- profile과 사용자 상태 변경은 version을 비교해 경쟁 변경을 명시적인 conflict로 반환한다.
- 관리자 권한은 별도 제품 role 없이 유효한 관리자 session으로 판정하며, 관리자 계정은 seed CLI로만 만든다.

## Content 데이터 경계

- content module은 course, curriculum version, unit, lesson과 step schema·repository·seed를 소유한다. course마다 mutable draft 하나만 허용하고 published revision과 그 계층은 trigger로 변경을 거부한다.
- content module은 콘텐츠 asset schema도 소유한다. 각 asset은 course와 curriculum version의 복합 관계에 속하고 용도, 검증된 MIME·크기, 예측할 수 없는 object key, 대체 텍스트, `active | orphaned` 상태와 생성·수정·고아화 시각을 저장한다. 코스 표지는 curriculum version의 제한 FK로, 읽기 삽화는 `READING` step의 asset ID로 참조한다. 저장 transaction은 같은 course의 현재 draft 또는 published version 소유인지와 용도를 검증하고, 현재 draft에서 해제·복원된 asset 상태를 낙관적 edit version과 함께 변경한다. published version의 asset row는 application과 database trigger에서 생성·변경·삭제를 거부한다. 응답 URL은 영속화하지 않고 object key와 현재 runtime storage origin으로 해석한다.
- 일일 정리는 `orphaned_at`이 7일 경계에 도달한 draft asset만 bounded batch로 조회한다. 이 경계에 도달한 asset은 다시 draft에 연결할 수 없어 cleanup 조회와 저장의 경쟁이 active object 삭제로 이어지지 않는다. dry-run은 object와 row를 바꾸지 않는다. actual은 storage object를 먼저 멱등 삭제하고 같은 cutoff·상태 조건으로 metadata를 삭제한다. storage 실패에는 row를 orphan 상태로 보존해 재시도하고, storage 성공 뒤 DB 실패에는 다음 실행이 이미 없는 object 삭제를 반복한 후 row 정리를 재시도한다. 두 저장소가 transaction을 공유하지 않는 한 가능한 짧은 불일치이며 active·published asset은 대상이 아니다.
- 발행 transaction은 기존 draft를 published로 전환하고 다음 draft를 만든 뒤 course의 최신 published reference를 함께 갱신한다.
- 보관은 course 상태만 바꾸어 신규 학습 조회에서 숨기고 기존 published revision과 학습자의 version 고정을 물리적으로 삭제하지 않는다. 기본 seed는 기존 course aggregate 전체를 보존하고 누락된 seed aggregate만 삽입한다.
- 자동 MCP 콘텐츠 변경은 실행 ID, owner 관리자 ID, MCP credential ID, 도구, 멱등 키와 입력 digest에 묶인 영수증을 콘텐츠 변경과 같은 transaction에 저장한다.
- 승인된 MCP 콘텐츠 변경은 승인 ID와 실행 ID에 묶인 영수증을 콘텐츠 변경과 같은 transaction에 저장한다.
- 같은 binding의 재시도는 저장된 영수증을 재생한다. 다른 binding은 충돌로 거부한다.
- 현재 Drizzle schema와 trigger 정의는 content module이 소유한다. API의 현재 baseline과 이후 append-only migration은 이 최종 구조를 SQLite에 적용한다.

## Learning 데이터 경계

- learning module은 코스·레슨 진행, 단계 답안·초안과 학습 활동일 schema·repository를 소유한다. 사용자와 immutable published content reference는 `RESTRICT` FK로 고정한다.
- 코스 진행을 부모로 하는 레슨 진행·답안·초안은 `CASCADE`를 유지한다. 단계 초안은 step revision 삭제에도 함께 제거한다. content와 identity의 현재 상태는 공개 query port에서 확인하며 learning persistence가 상대 schema를 join하지 않는다.
- 단계 초안은 사용자·코스·curriculum version·레슨·스텝별 한 건, 음수가 아닌 version과 64 KiB 이하의 UTF-8 JSON으로 제한한다.
- 단계 완료는 답안 저장, 해당 초안 삭제, 진행 전이, 레슨·코스 완료와 활동 집계를 하나의 learning transaction에서 적용한다.

## Writing 데이터 경계

- writing module은 쓰기 과제 초안·발행본, 학습자 글, 점검, 고지 확인, 원문 없는 쓰기 event schema·repository를 소유한다.
- 과제는 초안 필드, 음수가 아닌 `editVersion`, 최신 발행 참조를 가진다. 발행본은 제목, 도메인, 유형, 난이도, 상황, 독자, 최소·목표 글자 수, 필수 요소를 불변 스냅샷으로 가진다.
- 글은 학습자, 시작 시점 발행본, 일반 텍스트 본문, `drafting | complete` 상태, 음수가 아닌 version과 생성·수정·완료 시각을 가진다.
- 저장은 학습자와 글 ID를 함께 확인하고 expected version이 현재 version과 같을 때만 version을 증가시킨다.
- 본문이 바뀌면 상태를 `drafting`으로 바꾸고 현재 본문에 묶인 점검을 무효로 본다.
- 유효한 점검은 글 ID와 본문 version에 묶인다. 하루 성공 한도는 성공한 점검 시각의 `Asia/Seoul` 논리 날짜로 센다.
- 쓰기 event는 글 생성, 점검 성공, 점검 뒤 본문 수정, 글 완료, 글 삭제만 저장한다. event는 본문과 점검 원문을 저장하지 않는다.
- 학습자 삭제 정리는 글, 점검, 고지 확인, 쓰기 event를 auth 사용자 삭제보다 먼저 같은 transaction에서 제거한다. 과제와 발행본은 남긴다.

## 관리자 MCP credential 데이터 경계

관리자 MCP credential row는 raw bearer token 대신 SHA-256 digest, owner 관리자 ID, scope, 생성·만료·폐기 시각을 저장한다. 발급과 폐기는 credential 변경과 같은 transaction에서 append-only lifecycle event를 기록한다. 현재 필드와 불변식은 [관리자 MCP token schema](../../apps/api/src/mcp/admin/admin-mcp-access-token-schema.ts)와 [token store](../../apps/api/src/mcp/admin/admin-mcp-access-token-store.ts)가 소유한다.

## 관리자 MCP 승인 데이터 경계

- operations module은 owner 승인 요청과 `pending | approved | rejected | expired | executing | succeeded | failed` 상태 전이를 소유한다.
- 승인 요청은 owner 관리자 ID, MCP credential ID, 도구, idempotency key, 입력 digest와 request ID를 저장한다.
- 코스 승인 대상은 코스 ID, 제목, 상태와 편집 버전만 저장한다.
- 사용자 승인 대상은 opaque 사용자 ID, 현재 상태와 목표 상태만 저장한다.
- 승인 요청은 임의 JSON payload, raw bearer token, 이메일과 이름을 저장하지 않는다.
- 승인, 실행 선점과 종결은 허용된 이전 상태를 조건으로 갱신한다. 실행 lease 안의 중복 요청은 콘텐츠 application을 호출하지 않는다.

## Audit 데이터 경계

- operations module은 관리자 개인정보 조회와 고위험 변경의 `audit_events` schema·repository를 소유한다. 일반 request log나 인증·인가 실패 security log를 이 table에 복제하지 않는다.
- audit row는 허용된 category·action, owner actor ID, learner 또는 course target ID, outcome, request ID, 신뢰 경계가 확인한 client IP, 생성·보존 시각을 저장한다. MCP 변경은 실행 ID, nullable 승인 ID, 입력 digest와 검증된 MCP credential ID도 저장한다. 임의 JSON payload와 이메일·이름·답안·prompt column은 두지 않는다.
- 사용자 상세 조회와 콘텐츠 발행·보관은 1년, 사용자 정지·활성화·삭제는 3년을 보존한다. 보존 기한과 action·category·target 조합은 application과 database check가 함께 고정한다.
- 감사 대상 요청은 mutation 또는 개인정보 조회 전에 `started` row를 먼저 저장한다. 사전 저장 실패에는 작업을 실행하지 않고, 작업 결과를 `succeeded | failed`로 종결하지 못하면 성공 응답을 반환하지 않으며 `started` 흔적을 조사 대상으로 보존한다.
- 관리자 credential과 audit row 사이에는 FK를 두지 않는다. 계정 lifecycle과 무관하게 actor ID를 보존하며, 최근 조회와 `retention_until` batch purge는 서로 다른 index를 사용한다.

## 운영 Reporting 데이터 경계

- operations module의 reporting repository는 각 module이 공개한 리포팅 읽기 뷰만 join·aggregate한다. 뷰는 소유 module의 `infrastructure/persistence/reporting-view.ts`가 이름과 컬럼을 선언하고 API의 append-only migration이 생성하므로, 원본 컬럼이 사라지면 배포 전 migration에서 실패한다. 원본 schema와 제품 불변식의 소유권은 각 module에 그대로 남으며 reporting projection은 원본을 변경하지 않는다.
- 쓰기 지표는 writing module의 원문 없는 event reporting view만 사용한다.
- API composition은 writer와 분리한 SQLite read-only connection을 주입하고 repository는 `query_only`를 확인한다. 보고 조회가 쓰기 transaction이나 다른 module command repository로 우회해서는 안 된다.
- 집계 SQL은 필요한 projection과 aggregate만 반환한다. 전체 table row를 application memory로 읽어 join하지 않는다.
- 삭제 상태 학습자는 모든 운영 지표에서 제외한다. 첫 레슨 시작, `Asia/Seoul` 날짜 경계, D7 성숙 cohort와 완료·이탈의 제품 의미는 `docs/product/metrics.md`가 소유한다.

## 변경 원칙

1. 제품 불변식과 사용자 영향부터 정의한다.
2. schema·migration·seed·adapter·contract·테스트를 하나의 호환성 단위로 변경한다.
3. 기존 데이터와 이전 application version이 공존할 수 있는 기간을 판단한다.
4. destructive 변경은 backup, restore와 rollback 한계를 먼저 검토한다.
5. 현재 table과 관계는 schema source에서, 과거 변경 이유는 ADR와 archive에서 확인한다.

## Seed와 보존

- seed는 개발·검증을 재현 가능하게 만들되 기존 application state를 갱신하거나 사용자의 학습 기록을 암묵적으로 삭제하지 않는다. content는 course aggregate 단위로만 누락 fixture를 삽입한다.
- seed는 auth·content·identity provider를 API에서 명시적으로 조립한다. 관리자 user·credential의 부분 상태는 자동 승격하거나 수리하지 않고 실패한다.
- password 변경과 전체 삭제는 기본 seed와 분리된 reset 명령, 명시적 승인과 destructive guard를 거쳐야 한다.
- 운영 데이터의 보존·삭제·익명화 정책은 제품·보안 요구와 함께 명시한다.
- 특정 seed 결과나 현재 row 수는 문서에 기록하지 않는다.
