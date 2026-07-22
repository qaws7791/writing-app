# HTTP 계약 원칙

## 목적

이 문서는 HTTP API의 호환성, 인증, 오류 처리와 변경 절차를 정의한다. 현재 path·method·request·response schema는 route registry, `packages/shared/contracts`, 실행 중인 OpenAPI가 소유한다.

## 권위 소스

- 학습자 HTTP 표면: 학습자 route registry와 runtime OpenAPI
- 관리자 HTTP 표면: 관리자 route registry와 runtime OpenAPI
- wire schema: `packages/shared/contracts`
- transport 오류 변환과 인증 middleware: API runtime source

문서의 endpoint 목록으로 현재 API를 판정하지 않는다.

## 계약 원칙

- request는 HTTP 경계에서 schema로 검증하고, handler는 검증된 값만 application 경계로 전달한다.
- response는 전송 직전에 공개 schema로 검증한다.
- application 결과와 HTTP status·body·header 변환 책임은 route가 소유한다.
- 인증·인가 실패, 검증 실패, domain rejection, provider 실패와 예상하지 못한 내부 오류는 구분 가능한 안정된 공개 오류 계약을 가진다.
- 민감 입력, 내부 stack, provider 원문과 persistence 세부 사항을 오류 응답에 노출하지 않는다.
- 예상하지 못한 내부 오류는 원인을 숨기고 응답과 구조화 로그에 같은 request ID를 남긴다.
- HTTP contract 변경은 consumer와 server를 같은 변경에서 갱신하며, 호환되지 않는 변경은 명시적인 migration 경로를 제공한다.

## 인증과 브라우저 경계

- 인증 방식과 권한 정책은 제품·보안 문서가 소유하고, 현재 endpoint와 middleware 배치는 코드가 소유한다.
- 쿠키가 포함되는 브라우저 요청은 origin 검증과 CORS를 모두 통과해야 한다.
- browser public 설정에는 secret이나 내부 network topology를 포함하지 않는다.
- 관리자와 학습자 보안 영역은 권한과 credential 수명주기를 독립적으로 유지한다.

## OpenAPI와 계약 검증

- OpenAPI는 실제 등록 route에서 runtime에 생성한다. 정적 사본과 generated client를 저장소에 추적하지 않는다.
- route와 contract test는 request·response schema, 인증·인가, 오류 변환과 호환성 규칙을 검증한다.
- API 소비자는 공개 contracts와 좁은 app adapter를 사용하고 transport 구현 세부 사항을 도메인이나 화면에 누출하지 않는다.

## 계약 변경 절차

1. 제품 요구와 호환성 영향을 먼저 확인한다.
2. contract schema, route, consumer adapter와 테스트를 함께 변경한다.
3. runtime OpenAPI와 실제 smoke로 등록 결과를 확인한다.
4. breaking change, 새 인증 경계, 데이터 migration 또는 외부 consumer 영향이 있으면 ADR와 배포 계획을 추가한다.
