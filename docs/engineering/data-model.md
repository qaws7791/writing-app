# 데이터 모델 원칙

## 목적

이 문서는 데이터 의미, 불변식과 변경 원칙을 정의한다. credential·session schema는 auth infra, 제품 데이터는 각 module, SQLite connection과 통합 실행 지점은 DB infra와 API composition이 소유한다. 아직 전환되지 않은 제품 schema는 DB infra에 남아 있다.

## 모델 원칙

- 제품 문서의 콘텐츠 계층과 사용자·학습 상태 의미를 persistence 표현보다 먼저 유지한다.
- 식별자는 다른 도메인과 혼동되지 않도록 타입과 관계에서 의미를 드러낸다.
- 인증 데이터, 콘텐츠 원본, 학습 진행, 운영 설정, 감사 기록은 서로 다른 접근·보존 정책을 적용한다.
- 읽기 projection은 원본 데이터의 권위를 대체하지 않으며, 손상되거나 불완전한 persisted 값은 부분 성공으로 숨기지 않는다.
- 상태 전이는 허용된 이전 상태와 actor를 명시하고, 경쟁 요청에서도 중복 효과가 생기지 않게 한다.

## Identity 데이터 경계

- 학습자 profile과 `active | suspended | deleted` 상태, 관리자 `owner | operator` role은 identity module의 schema와 repository가 소유한다.
- credential·session table은 auth infra가 소유하며 identity schema에 포함하지 않는다. identity는 인증 계정 식별자를 관계 값으로 사용하되 cross-module FK를 만들지 않는다.
- 삭제 전이는 profile을 비식별화하고 학습 기록을 보존한다. `deleted` 상태에서는 profile 변경과 보호 API 접근을 거부하지만, owner의 `active | suspended` 상태 변경은 삭제 시각을 비우고 계정을 운영 상태로 되돌린다. 비식별화된 표시 이름은 자동 복원할 근거 데이터가 없으므로 이후 profile 변경 전까지 유지한다.
- profile과 role 변경은 version을 비교해 경쟁 변경을 명시적인 conflict로 반환한다.
- 기존 관리자 credential의 legacy role 값은 API migration 조립 지점이 neutral record로 읽고 identity migration이 새 제품 role row로 한 번 backfill한다. 기존 cross-module FK가 있는 profile table은 데이터를 보존해 identity-owned table로 재구성한다. 이후 role과 profile schema의 권위 소스는 identity module이다.

## Content 데이터 경계

- content module은 course, curriculum version, unit, lesson과 step schema·repository·seed를 소유한다. course마다 mutable draft 하나만 허용하고 published revision과 그 계층은 trigger로 변경을 거부한다.
- 발행 transaction은 기존 draft를 published로 전환하고 다음 draft를 만든 뒤 course의 최신 published reference를 함께 갱신한다. domain event는 commit 뒤 발행하므로 event 전달 실패가 이미 확정된 콘텐츠를 되돌리지 않는다.
- 보관은 course 상태만 바꾸어 신규 학습 조회에서 숨기고 기존 published revision과 학습자의 version 고정을 물리적으로 삭제하지 않는다. seed와 reset도 기존 published revision과 학습 진행을 보존하고 draft만 교체한다.
- 현재 Drizzle schema와 idempotent trigger 설치는 content module이 소유한다. 이미 적용됐을 수 있는 baseline SQL은 migration 이력으로 보존하며, 물리 cross-module FK 제거와 통합 migration 계보 이동은 P11의 append-only migration에서 수행한다.
- 기존 curriculum 이관의 step 정규화 정책은 content domain이 소유하고 API 조립 지점이 DB migration primitive에 주입한다. 정책이 없으면 legacy 이관은 데이터 변경 전에 실패한다.

## 변경 원칙

1. 제품 불변식과 사용자 영향부터 정의한다.
2. schema·migration·seed·adapter·contract·테스트를 하나의 호환성 단위로 변경한다.
3. 기존 데이터와 이전 application version이 공존할 수 있는 기간을 판단한다.
4. destructive 변경은 backup, restore와 rollback 한계를 먼저 검토한다.
5. 현재 table과 관계는 schema source에서, 과거 변경 이유는 ADR와 archive에서 확인한다.

## Seed와 보존

- seed는 개발·검증을 재현 가능하게 만들되 사용자의 학습 기록을 암묵적으로 삭제하지 않는다.
- 운영 데이터의 보존·삭제·익명화 정책은 제품·보안 요구와 함께 명시한다.
- 특정 seed 결과나 현재 row 수는 문서에 기록하지 않는다.
