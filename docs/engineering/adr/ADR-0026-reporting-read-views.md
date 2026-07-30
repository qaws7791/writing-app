# ADR-0026: 운영 리포팅 읽기 뷰 채택

## 상태

채택됨

## 날짜

2026-07-30

## 맥락

`operations` reporting SQL이 타 모듈 테이블명을 문자열 리터럴로 참조했다. import 기반 depcruise 규칙은 이 결합을 막지 못해, 타 모듈 컬럼 변경이 typecheck를 통과하고 런타임에 실패할 수 있었다. ADR-0024는 operations의 읽기 전용 cross-module SQL을 예외로 허용했으나, 결합 검출 시점을 앞당길 계약이 없었다.

## 결정

- 각 모듈이 `infrastructure/persistence/reporting-view.ts`로 리포팅용 읽기 뷰를 선언하고 `./migration-schema`에 포함한다.
- API append-only migration이 뷰를 생성한다. 원본 컬럼이 사라지면 배포 전 migration에서 실패한다.
- operations reporting은 뷰 이름만 포함한 정적 SQL과 reporting 전용 projection을 소유한다. 다른 모듈의 repository·application·migration-schema 구현을 import하지 않는다.
- 날짜 경계(시간대 offset)는 뷰에 넣지 않는다. 뷰는 원본 epoch 컬럼만 노출하고 offset은 operations SQL 파라미터로 주입한다. 시간대 정본은 `packages/shared/kernel`의 day-boundary에 남긴다.

## 대안과 트레이드오프

- **이벤트 기반 읽기 모델(CQRS)**: operations가 타 모듈 테이블을 전혀 모르게 되지만, 이벤트 계약·발행 트랜잭션·순서 보장·재구축·지연 일관성이 추가된다. 제품 지표는 실시간 정합성을 전제하며, 가역성이 낮다.
- **현행 인라인 SQL 유지**: 공수 0이지만 스키마 드리프트가 런타임까지 미뤄진다.

이벤트 기반 대안은 다음이 관측되면 재검토한다: 대시보드 질의가 사용자 요청 경로 p95를 악화시킬 때, 또는 모듈을 별도 프로세스로 분리해야 할 때.

## 영향

뷰 계약과 migration 소유권은 [`data-model.md`](../data-model.md), import 예외는 [`package-interface-and-import-rules.md`](../package-interface-and-import-rules.md)가 서술한다. ADR-0024의 “operations 읽기 전용 SQL 예외”는 뷰 계약 아래에서 유지된다.
