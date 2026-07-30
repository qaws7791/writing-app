# ADR-0027: 학습자 데이터 삭제의 모듈 포트 소유

## 상태

채택됨

## 날짜

2026-07-30

## 맥락

학습자 삭제 시 app 계층이 여러 모듈 schema를 import해 타 모듈 테이블을 직접 DELETE했다. 삭제 소유자가 없어 새 모듈이 학습자 데이터를 저장해도 조립이 조용히 누락될 수 있었고, `./schema` 공개가 이 경로를 허용했다.

## 결정

- 학습자 데이터를 저장하는 모듈이 자기 테이블만 지우는 `LearnerDataPurgePort`를 구현한다.
- 포트 타입은 `packages/infra/db`에 둔다. 삭제는 단일 SQLite transaction에서 원자적으로 실행해야 하므로 포트가 transaction을 인자로 받는다. kernel은 DB에 의존할 수 없다.
- 각 모듈은 `./module`에서 무상태 purge 포트를 공개한다. purge 경로가 모듈 전체 조립을 요구하지 않는다.
- 조립 지점(`apps/api` privacy)이 FK 의존 순서를 고정한 배열로 포트를 순회한다. auth 사용자 row 삭제도 같은 배열·transaction에 포함한다.
- 모듈 `./migration-schema`를 app의 purge·privacy 경로가 import하지 못하게 depcruise가 차단한다.

## 대안과 트레이드오프

- **kernel에 비동기 포트 + 모듈별 transaction**: 모듈 경계는 깨끗하지만 부분 삭제가 생긴다.
- **app이 계속 직접 삭제**: 구현은 단순하지만 소유권과 정적 차단이 없다.
- **이벤트·아웃박스 기반 삭제**: 분산 실패와 재시도 복잡도가 현재 단일 SQLite 규모에 비해 크다.

## 영향

삭제 행 집합·보존 정책은 [`privacy.md`](../privacy.md)가 소유한다. 새 모듈이 학습자 데이터를 저장하면 purge 포트 미등록이 조립·타입 단계에서 드러나야 한다.
