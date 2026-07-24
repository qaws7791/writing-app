# ADR-0024: 확정 모듈러 모놀리스 경계

## 상태

채택됨

## 날짜

2026-07-24

## 맥락

첫 출시는 단일 API process와 SQLite를 유지하지만 제품 책임은 독립적으로 변경할 수 있어야 한다. 기존 여섯 모듈 구조에는 폐기된 자료실이 포함됐고, 모든 cross-module FK와 join을 금지한 규칙은 같은 SQLite 안의 참조 무결성과 운영 보고 쿼리를 불필요하게 우회하게 했다. 반대로 경계를 없애면 command가 다른 모듈의 저장 구현에 결합해 변경 영향과 장애 범위가 커진다.

## 결정

- 비즈니스 모듈은 `content`, `learning`, `identity`, `ai-feedback`, `operations` 다섯 개다.
- 각 모듈은 `domain`, `application`, `infrastructure`, `interface` 계층을 유지하며 의존성은 바깥 계층에서 안쪽 계층으로 향한다.
- application이 요구하는 repository, 외부 provider, 다른 모듈 capability, clock과 ID generator는 Port로 표현할 수 있다. application service, mapper, presenter, 순수 함수와 React feature에는 테스트 fake만을 위해 Port를 만들지 않는다.
- 같은 SQLite의 필수 참조 무결성을 위한 cross-module FK를 허용한다. FK는 table 쓰기 권한을 부여하지 않는다.
- `operations`의 읽기 전용 reporting SQL만 여러 모듈 table을 join할 수 있다. 다른 모듈의 application command는 상대 table·repository를 직접 읽거나 쓰지 않고 공개 capability를 사용한다.
- 예상 가능한 제품 실패만 `Result`로 표현한다. DB driver 오류, 프로그래밍 오류와 손상된 내부 데이터는 throw해 중앙 오류 처리와 관측 경계에서 처리한다.

## 대안과 트레이드오프

- 모든 cross-module FK·join 금지: 추후 DB 분리에 유리하지만 현재 단일 SQLite에서 무결성을 application 검증에 맡기고 reporting 호출 수를 늘린다.
- 공유 repository 계층: 단기 구현량은 줄지만 table 소유권과 command 경계를 흐려 장기 유지보수와 보안 검토 비용을 높인다.
- 독립 서비스 분리: 배포 격리는 강하지만 분산 실패, 네트워크와 운영 비용이 현재 제품 규모에 비해 크다.

선택한 방식은 데이터 무결성과 보고 성능을 단순하게 유지하면서 command 경계를 보존한다. 독립 서비스 전환 비용이 낮아질 것이라는 주장은 현재 검증된 사실이 아니라 추론이며, 실제 분리 요구가 생기면 FK·reporting query를 별도 migration 대상으로 재평가한다.

## 영향

dependency-cruiser는 계층 역행, frontend의 module·DB 접근과 command 경계의 타 모듈 persistence import를 차단한다. operations reporting의 읽기 전용 SQL은 명시적 예외로 관리한다. 이 결정은 ADR-0020의 여섯 모듈 목록과 cross-module FK·join 전면 금지를 대체하며, 삭제된 기능을 다룬 과거 ADR은 역사 기록으로만 남는다.
