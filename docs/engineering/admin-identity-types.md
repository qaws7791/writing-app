# 어드민 식별자 타입 계약

## 작업 상태

`CONS-01B` 구현을 완료했다.

## 대상 식별자

- `AdminId`: 인증된 관리자 계정 식별자
- `ConversationId`: 관리자 AI 채팅 대화 식별자
- `UserId`: 관리자가 조회·상태 변경·삭제하는 학습자 계정 식별자

세 식별자는 wire format에서 문자열을 유지하되 transport 입력에서 검증한 뒤 서로 다른 브랜드 타입으로 전달한다.

## Interface와 Adapter

- `packages/contracts/src/brand.ts`가 workspace의 `Brand` 타입을 단일 소유한다.
- `packages/contracts/src/admin/admin-ids.ts`가 세 식별자 타입과 parser를 단일 소유한다.
- 식별자는 1~200자이며 영문 대소문자, 숫자, `.`, `_`, `:`, `-`만 허용한다. 첫 문자는 영문 또는 숫자여야 한다.
- 관리자 인증 Adapter, HTTP path/body Adapter, DB 조회 Adapter가 외부 문자열을 parser로 검증한다.
- core의 관리자 actor, use case 입력, repository Interface에는 브랜드 타입만 전달한다.
- admin 앱은 `lib/api/admin-identity.ts`를 wire Adapter로 사용하고 화면 Module은 contracts DTO를 직접 import하지 않는다.

## 호환성

브랜드는 TypeScript의 compile-time 정보이므로 HTTP path, JSON request/response, DB column의 문자열 wire format은 변경하지 않는다. 기존 ID 값도 위 형식 규칙을 만족하면 변환 없이 유지된다.

## 검증

- contracts parser 테스트가 유효 ID, 빈 값, 공백, 금지 문자, 한글, 최대 길이 초과를 검증한다.
- compile-time negative fixture가 `AdminId`, `ConversationId`, `UserId`의 교차 전달을 거부한다.
- core repository/use case 계약 테스트가 브랜드 입력과 DTO 결과를 검증한다.
- admin HTTP Adapter 계약과 admin-api route 테스트가 기존 문자열 wire format을 유지하는지 검증한다.
