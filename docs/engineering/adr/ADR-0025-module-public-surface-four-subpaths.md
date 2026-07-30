# ADR-0025: 모듈 공개 표면 4개 subpath 고정

## 상태

채택됨

## 날짜

2026-07-30

## 맥락

다섯 제품 모듈이 5~12개 subpath를 서로 다른 관례로 공개했다. `infrastructure/` concrete 구현·repository·seed·maintenance가 공개 계약이 되어 내부 교체가 계약 변경이 됐고, `./schema` 전역 공개는 app이 타 모듈 테이블을 직접 지우는 경로를 막지 못했다. 공개 표면을 문서만으로 좁히면 신규 모듈마다 관례 판단 비용이 남는다.

## 결정

- 제품 모듈은 `./module`, `./http`, `./ports`, `./migration-schema`만 공개한다.
- `./module`은 조립 팩토리와 DB tooling이 쓰는 seed·purge 진입점을 재수출할 수 있다. seed·purge만 위해 모듈 전체 조립을 강제하지 않는다.
- `./migration-schema` 소비자는 API의 단일 schema tooling, FK를 선언하는 다른 module persistence schema, 격리 E2E seed fixture로 제한한다. depcruise `migration-schema-is-app-database-only`가 강제한다.
- 모듈 `exports`에 wildcard를 쓰지 않는다. `dependency-cruiser`가 manifest에서 경계 패턴을 파생하므로 wildcard는 검사를 무력화한다.
- `@workspace/ui`처럼 순수 표현 계층만 wildcard를 허용한다.

## 대안과 트레이드오프

- 현행 유지 + 문서화: 공수는 적지만 F-06 유형의 타 모듈 테이블 쓰기가 규율에만 의존한다. 이미 위반 0인 상태로 존재했던 경로다.
- exports를 더 줄여 seed·purge를 별도 조립 경로로만 노출: seed 한 번에 모듈 전체 조립이 필요해진다.

선택한 방식은 내부 교체를 공개 계약에서 분리하면서 tooling 진입점은 유지한다. exports 자체는 되돌릴 수 있으나, 좁힌 표면에 맞춰 조립·테스트 주입 방식을 옮긴 뒤에는 되돌림 비용이 생긴다.

## 영향

모듈 exports 합계는 약 20개(모듈당 4개)로 고정된다. 조립·fake 주입은 `module.ts` 파라미터로 옮긴다. 상세 관례는 [`package-interface-and-import-rules.md`](../package-interface-and-import-rules.md)가 소유한다.
