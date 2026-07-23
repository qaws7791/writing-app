# 데이터 모델 원칙

## 목적

이 문서는 데이터 의미, 불변식과 변경 원칙을 정의한다. credential·session schema는 auth infra, 제품 데이터는 각 module, SQLite primitive는 DB infra, 통합 schema·migration·seed 실행은 API composition이 소유한다.

## 모델 원칙

- 제품 문서의 콘텐츠 계층과 사용자·학습 상태 의미를 persistence 표현보다 먼저 유지한다.
- 식별자는 다른 도메인과 혼동되지 않도록 타입과 관계에서 의미를 드러낸다.
- 인증 데이터, 콘텐츠 원본, 학습 진행, 운영 설정, 감사 기록은 서로 다른 접근·보존 정책을 적용한다.
- 읽기 projection은 원본 데이터의 권위를 대체하지 않으며, 손상되거나 불완전한 persisted 값은 부분 성공으로 숨기지 않는다.
- 상태 전이는 허용된 이전 상태와 actor를 명시하고, 경쟁 요청에서도 중복 효과가 생기지 않게 한다.

## Identity 데이터 경계

- 학습자 profile과 `active | suspended | deleted` 상태, 관리자 `owner | operator` role은 identity module의 schema와 repository가 소유한다.
- credential·session table은 auth infra가 소유하며 identity schema에 포함하지 않는다. identity profile은 인증 계정을 FK로 참조하고 credential의 물리 삭제에는 함께 삭제된다.
- 삭제 전이는 profile을 비식별화하고 학습 기록을 보존한다. `deleted` 상태에서는 profile 변경과 보호 API 접근을 거부하지만, owner의 `active | suspended` 상태 변경은 삭제 시각을 비우고 계정을 운영 상태로 되돌린다. 비식별화된 표시 이름은 자동 복원할 근거 데이터가 없으므로 이후 profile 변경 전까지 유지한다.
- profile과 role 변경은 version을 비교해 경쟁 변경을 명시적인 conflict로 반환한다.
- 기존 관리자 credential의 legacy role 값은 API 통합 migration이 identity-owned 제품 role row로 한 번 backfill한 뒤 credential column을 제거한다. 기존 cross-module FK가 있는 profile table은 데이터를 보존해 identity-owned table로 재구성한다. 이후 role과 profile schema의 권위 소스는 identity module이다.

## Content 데이터 경계

- content module은 course, curriculum version, unit, lesson과 step schema·repository·seed를 소유한다. course마다 mutable draft 하나만 허용하고 published revision과 그 계층은 trigger로 변경을 거부한다.
- 발행 transaction은 기존 draft를 published로 전환하고 다음 draft를 만든 뒤 course의 최신 published reference를 함께 갱신한다.
- 보관은 course 상태만 바꾸어 신규 학습 조회에서 숨기고 기존 published revision과 학습자의 version 고정을 물리적으로 삭제하지 않는다. 기본 seed는 기존 course aggregate 전체를 보존하고 누락된 seed aggregate만 삽입한다. 명시적 content reset만 기존 published revision과 학습 진행을 보존하면서 draft를 교체하고 seed 밖 course를 보관한다.
- 현재 Drizzle schema와 trigger 정의는 content module이 소유한다. 이미 적용됐을 수 있는 SQL은 변경하지 않고 API의 append-only migration이 물리 관계를 갱신한다.
- 기존 curriculum 이관의 step 정규화 정책은 content domain이 소유하고 API migration 조립 지점이 legacy 이관에 주입한다. 정책이 없으면 legacy 이관은 데이터 변경 전에 실패한다.

## AI feedback 데이터 경계

- ai-feedback module은 learner·course·curriculum version·lesson·step의 branded ID, idempotency key, attempt 번호·상태·lease와 coaching 결과를 저장한다. 참조 무결성은 `RESTRICT` FK가 보장하고 runtime repository는 다른 module table을 조회하지 않는다.
- 완료된 attempt만 사용자·curriculum version·lesson·step 범위의 한도를 차감한다. provider 실패와 만료는 완료 quota를 차감하지 않고, 동일 idempotency key의 성공 결과는 provider 재호출 없이 재생한다.
- attempt 예약과 terminal 저장은 짧은 개별 transaction이며 provider I/O 중에는 transaction을 열지 않는다. AI 결과 저장 뒤 learning 진행 전이가 실패하면 저장 결과를 권위 상태로 유지하고 같은 key 재시도에서 learning 전이만 다시 수행한다.
- module schema는 최종 구조를, API migration 계보는 FK 복원을 포함한 적용 순서와 데이터 복사를 소유한다.

## Learning 데이터 경계

- learning module은 코스·레슨 진행, 단계 답안과 학습 활동일 schema·repository를 소유한다. 사용자와 immutable published content reference는 `RESTRICT` FK로 고정한다.
- 코스 진행을 부모로 하는 레슨 진행·답안은 `CASCADE`를 유지한다. content와 identity의 현재 상태는 공개 query port에서 확인하며 learning persistence가 상대 schema를 join하지 않는다.
- 단계 완료는 답안 저장, 진행 전이, 레슨·코스 완료와 활동 집계를 하나의 learning transaction에서 적용한다.

## Resource Library 데이터 경계

- resource-library module은 폴더·문서 node, Markdown 본문과 version, FTS 색인, 문서 종속 이미지 metadata를 소유한다. 생성자·수정자 ID는 기록 보존을 위해 관리자 credential을 `RESTRICT` FK로 참조하며 persistence join은 만들지 않는다.
- 같은 부모의 활성 이름 고유성, 최대 깊이·항목 수, 문서 말단 구조와 휴지통 하위 트리 상태는 module transaction과 내부 FK·index·trigger가 함께 지킨다. 문서 제목·본문·검색 색인·수정자·version 증가는 하나의 transaction에서 확정한다.
- 이미지 metadata는 실제 MIME, byte 크기, 필수 대체 텍스트와 결정적 object key를 저장한다. 영구 삭제는 metadata를 `delete-pending`으로 먼저 전이한 뒤 object 삭제 성공 시 하위 트리와 metadata를 완료 삭제하며, 실패 상태는 reconciliation 대상으로 남긴다.

## 변경 원칙

1. 제품 불변식과 사용자 영향부터 정의한다.
2. schema·migration·seed·adapter·contract·테스트를 하나의 호환성 단위로 변경한다.
3. 기존 데이터와 이전 application version이 공존할 수 있는 기간을 판단한다.
4. destructive 변경은 backup, restore와 rollback 한계를 먼저 검토한다.
5. 현재 table과 관계는 schema source에서, 과거 변경 이유는 ADR와 archive에서 확인한다.

## Seed와 보존

- seed는 개발·검증을 재현 가능하게 만들되 기존 application state를 갱신하거나 사용자의 학습 기록을 암묵적으로 삭제하지 않는다. content는 course aggregate 단위로만 누락 fixture를 삽입한다.
- seed는 auth·content·identity provider를 API에서 명시적으로 조립한다. 관리자 user·credential·owner identity의 부분 상태는 자동 승격하거나 수리하지 않고 실패한다.
- password 변경과 전체 삭제는 기본 seed와 분리된 reset 명령, 명시적 승인과 destructive guard를 거쳐야 한다.
- 운영 데이터의 보존·삭제·익명화 정책은 제품·보안 요구와 함께 명시한다.
- 특정 seed 결과나 현재 row 수는 문서에 기록하지 않는다.
