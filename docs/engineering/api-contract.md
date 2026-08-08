# HTTP 계약 원칙

## 목적

이 문서는 HTTP API의 호환성, 인증, 오류 처리와 변경 절차를 정의한다. 현재 path·method·request·response schema는 module HTTP interface의 직접 Hono 등록, `packages/shared/contracts`, 실행 중인 OpenAPI가 소유한다.

## 권위 소스

- capability endpoint의 method·path·handler·contract 연결과 auth option: module HTTP interface
- wire schema: `packages/shared/contracts`
- 공통 Hono app·error·request security와 middleware primitive: `packages/infra/http-platform`
- session resolver 주입, module route 등록, foundation route와 OpenAPI 생성: 단일 API composition root

문서의 endpoint 목록으로 현재 API를 판정하지 않는다.

## 계약 원칙

- request는 HTTP 경계에서 schema로 검증하고, handler는 검증된 값만 application 경계로 전달한다.
- response는 전송 직전에 공개 schema로 검증한다. 관리자 성공 응답 schema는 선언하지 않은 필드를 거부해 내부 필드가 새는 회귀를 생성 문서와 테스트가 함께 드러낸다. 단 두 schema를 `allOf`로 합치는 응답은 양쪽을 모두 닫으면 만족 불가능한 문서가 되므로 최상위 객체만 닫는다.
- application 결과와 HTTP status·body·header 변환 책임은 route가 소유한다.
- 인증·인가 실패, 검증 실패, domain rejection, provider 실패와 예상하지 못한 내부 오류는 구분 가능한 안정된 공개 오류 계약을 가진다.
- 민감 입력, 내부 stack, provider 원문과 persistence 세부 사항을 오류 응답에 노출하지 않는다.
- 재시도 가능한 임시 제한에 만료 시각을 알 수 있을 때만 정확한 `Retry-After`를 제공한다. 영구 attempt 상한처럼 시간만 기다려서는 해소되지 않는 제한에는 오해를 만드는 값을 넣지 않는다.
- 예상하지 못한 내부 오류는 원인을 숨기고 응답과 구조화 로그에 같은 request ID를 남긴다.
- HTTP contract 변경은 consumer와 server를 같은 변경에서 갱신하며, 호환되지 않는 변경은 명시적인 migration 경로를 제공한다.

## 서버 내부 오류 변환

공개 wire 오류(`packages/shared/contracts`의 `api-error`)는 바꾸지 않는다. 서버 내부만 아래 3층으로 축약한다.

1. **domain / application 실패** — `packages/shared/kernel`의 `Failure`와 모듈 실패 union. 예외에서 만든 실패는 `cause`를 담는다.
2. **`AppError`** — HTTP interface mapper가 status·code·header를 결정한다. 이름만 바꾸는 중간 shape는 두지 않는다.
3. **wire 응답** — 공개 schema로 직렬화한다.

규칙:

- 계층 간 변환은 정보를 추가할 때만 허용한다.
- 실패 variant 누락은 `assertExhaustiveHttpResult`와 `.typecheck.ts`가 컴파일 시 차단한다.
- 재시도 가능 여부는 전송 계층이 추측하지 않는다. wire의 `Retry-After`는 위 계약 원칙을 따른다.

## 인증과 브라우저 경계

- 인증 방식과 권한 정책은 제품·보안 문서가 소유하고, 현재 endpoint와 middleware 배치는 코드가 소유한다.
- 브라우저 API 요청은 현재 앱 origin의 상대 경로를 사용한다. 쿠키가 포함되는 상태 변경 요청은 API의 trusted origin 검증을 통과해야 한다.
- browser public 설정에는 secret이나 내부 network topology를 포함하지 않는다.
- 관리자와 학습자 보안 영역은 권한과 credential 수명주기를 독립적으로 유지한다.

## OpenAPI와 계약 검증

- learner와 admin OpenAPI 3.1 문서는 실제 runtime과 같은 route 등록 함수를 사용해 서버 실행 없이 각각 생성한다. 생성 JSON과 Orval TypeScript는 재생성 가능한 `.generated` 산출물이므로 저장소에 추적하지 않는다.
- Scalar 문서 route는 개발·테스트에서 제공하고 staging은 명시적으로 활성화한다. production은 검증된 runtime 설정으로 별도 활성화하지 않으면 OpenAPI JSON과 UI를 모두 등록하지 않는다.
- `@workspace/http-client`는 두 문서를 입력으로 생성한 admin·learner client와 cookie, base URL, 취소 신호, canonical 오류만 처리하는 얇은 fetch mutator를 소유한다.
- route와 contract test는 request·response schema, 인증·인가, 오류 변환과 호환성 규칙을 검증한다.
- API 소비자는 generated client를 endpoint 경계로 사용하고 수동 URL, 앱별 response parser와 feature HTTP Port를 복제하지 않는다. base URL·cookie·canonical 오류 처리만 공통 mutator 경계에 남긴다.
- process liveness와 DB readiness는 서로 다른 운영 계약이다. readiness 실패 응답은 learner domain 오류 정규화 대상이 아니며 learner·admin 표면은 같은 DB probe를 공유한다.
- 쓰기 저장은 expected version을 요구한다. 충돌 응답은 서버 글을 변경하지 않으며 client가 로컬 입력과 최신 서버 글을 구분해 복구할 수 있는 안정된 오류 code를 제공한다.

## 운영 Reporting 계약

- 관리자 대시보드는 보고 기준일, 최근 7일 활성 구간과 핵심 지표를 반환한다. 비율은 분자·분모와 `available | empty | immature` 상태를 함께 반환해 데이터 없음과 성과 0을 구분하며, 비율의 분자·분모와 값이 같은 지표는 따로 반환하지 않는다. 현재 필드 목록은 [대시보드 계약](../../packages/shared/contracts/src/operations/admin-dashboard.ts)이 소유한다.
- 분석은 요청한 논리 날짜 범위의 일별 가입·첫 시작·완료·D7 재방문, 개선 후보 레슨과 AI 실패율 상위 레슨을 반환한다. 미성숙 D7 값은 `0`이 아니라 `null`이다.
- 레슨별 분석의 검색·정렬·페이지 이동은 서버 query로 실행한다. 기간, 검색 문자열, page, page size와 정렬 값은 공개 contract의 bounded schema로 검증한다.
- AI 품질 분석은 반개구간 `[from, to)`의 aggregate만 반환한다. 성공·실패·latency·token·retry를 집계하되 답안, prompt와 피드백 원문은 wire 응답에 포함하지 않는다.
- 모든 운영 reporting 응답은 관리자 session을 요구하고 private cache 정책을 사용한다.
- 쓰기 성공 지표는 원문 없는 쓰기 event projection으로 계산하며 제목과 본문을 조회하거나 반환하지 않는다.

콘텐츠 asset 업로드는 multipart 경계에서 필수 필드와 파일 크기를 먼저 검증하고 application 경계에서 signature, decode, MIME 일치를 다시 검증한다. 처리한 object를 S3 호환 storage에 저장한 뒤에만 `active` row를 등록하며, 등록 실패에는 object 보상 삭제를 시도한다. 따라서 storage·처리 실패가 `active` row를 남겨서는 안 된다.

## 계약 변경 절차

1. 제품 요구와 호환성 영향을 먼저 확인한다.
2. contract schema, route, consumer adapter와 테스트를 함께 변경한다.
3. OpenAPI schema 검증, Orval 생성, generated client typecheck와 실제 smoke로 등록 결과를 확인한다.
4. breaking change, 새 인증 경계, 데이터 migration 또는 외부 consumer 영향이 있으면 ADR와 배포 계획을 추가한다.
