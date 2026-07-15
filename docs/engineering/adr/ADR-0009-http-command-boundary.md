# ADR-0009: HTTP 요청과 애플리케이션 명령 경계

## 상태

채택됨

## 날짜

2026-07-15

## 맥락

일부 core use case와 repository port가 `packages/contracts`의 HTTP `*Request` 타입을 직접 사용한다. 이 구조에서는 query string, pagination wire 값 또는 외부 JSON 형식의 변경이 비즈니스 작업 경계까지 전파된다. 반대로 브랜드 ID, 상태 값과 안정적인 조회 projection까지 모두 복제하면 같은 의미의 타입과 변환 코드만 늘어난다.

HTTP 형식 검증과 비즈니스 상태 전이의 책임을 분리하면서도, 변경 이유가 같은 안정적인 타입은 계속 공유할 기준이 필요하다.

## 결정

- 브랜드 ID, 상태 값과 안정적인 조회 projection은 여러 경계가 공유할 수 있는 계약으로 유지한다.
- `*Request`, query string, pagination wire 값과 HTTP 전용 schema는 transport 계약으로 분류한다.
- 권한, 상태 전이, 시간과 저장 원자성을 다루는 변경 작업은 core application 계층에 별도 command를 정의한다.
- HTTP route는 contract schema로 wire input을 검증한 뒤 application command를 명시적으로 구성한다.
- transport 형식 검증은 contract가, 상태·권한·전이 검증은 core가 소유한다.
- repository port는 HTTP request 대신 application command 또는 의미가 분명한 persistence input을 받는다.
- 필드 구성이 같다는 이유만으로 안정적인 조회 DTO를 복제하지 않는다.
- application 오류와 command는 Hono, HTTP status, `Request`, `Response`, header와 query string을 포함하지 않는다.

## 결과

- 외부 JSON과 OpenAPI 계약을 유지한 채 transport와 비즈니스 명령을 독립적으로 변경할 수 있다.
- route에 검증된 request를 command로 바꾸는 작은 mapper 책임이 생긴다.
- command와 HTTP request의 필드가 당장은 같아도 서로 다른 변경 수명을 코드에서 명시한다.
- 조회 projection은 별도 변경 이유가 확인되기 전까지 현재 공유 계약을 유지한다.
