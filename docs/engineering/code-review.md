# 코드 리뷰

이 문서는 PR과 코드 리뷰에서 반드시 확인해야 할 항목을 설명하는 단일 진실 원천이다.

## 리뷰 우선순위

1. 사용자 영향과 correctness
2. 인증, 권한, 데이터 보존
3. 런타임 경계와 의존성 방향
4. 테스트와 관측성
5. 이름, 구조, 유지보수성
6. 포맷과 사소한 스타일

## 공통 체크리스트

- 변경 의도가 코드에서 분명한가?
- 변경 범위가 요청과 관련된 파일로 제한되어 있는가?
- 새 abstraction이 실제 반복 지식의 단일 출처인가?
- 기존 사용자 변경이나 unrelated refactor를 섞지 않았는가?
- 오류 경로가 정상 경로만큼 명시적인가?
- 문서가 최신 코드와 일치하는가?

## 경계 체크

- `apps/api -> packages/core -> packages/db` 방향을 지키는가?
- `packages/db`가 `packages/core`를 import하지 않는가?
- 관리자 use case가 기능별 파일과 repository port에 의존하고 불필요하게 전체 `AdminRepository` 또는 mega service를 요구하지 않는가?
- 프론트엔드가 DB나 core infrastructure에 직접 의존하지 않는가?
- generated OpenAPI 타입은 `writing-app-api-contract.ts`에 격리되고, feature mapper는 transport contract 타입만 참조하는가?
- `Kwep/` 구현 파일을 제품 런타임에서 import하지 않는가?

## 인증과 권한 체크

- 새 route가 인증 필요 여부를 명시했는가?
- 관리자 변경성 route가 owner guard를 사용하는가?
- unknown role 처리 경로가 안전한가?
- 학습자 suspended/deleted 상태가 보호 API에서 차단되는가?
- 쿠키 이름, origin, 비밀값을 학습자/관리자 간 혼용하지 않는가?

## 데이터 체크

- schema, migration SQL, Drizzle schema가 일치하는가?
- seed가 기존 진행/답변을 삭제하지 않는가?
- 콘텐츠 삭제 대신 `archived` 정책을 지키는가?
- JSON 컬럼은 schema/parser로 검증되는가?
- 날짜와 시간대 정책이 명시적인가?

## API 체크

- request/response schema가 route 가까이에 있는가?
- 오류 응답 status와 code가 계약과 맞는가?
- JSON parse 오류와 validation 오류가 구분되는가?
- OpenAPI 생성 결과가 변경되면 정적 계약도 갱신했는가?
- CORS와 credentials 정책이 앱 origin과 일치하는가?

## 프론트엔드 체크

- 화면은 API DTO를 직접 소비하지 않고 mapper를 통과하는가?
- 내부 탐색 UI는 link semantics를 지키는가?
- Client Component가 필요한 곳에만 사용되는가?
- 오류는 `role="alert"`, 상태 안내는 `role="status"`를 사용하는가?
- 화면 텍스트와 접근성 텍스트가 한국어인가?

## 테스트 체크

- 변경된 정책을 고정하는 테스트가 있는가?
- route는 인증 실패, 권한 실패, 성공 경로를 포함하는가?
- repository 변경은 DB mapping 테스트가 있는가?
- UI 변경은 사용자 관점 query를 사용하는가?
- 테스트 우회를 위해 제품 코드 조건문을 추가하지 않았는가?

## 운영 체크

- 새 환경 변수가 `.env.example`, `turbo.globalEnv`, 문서에 반영되었는가?
- 로그에 민감 데이터가 남지 않는가?
- 장애 시 request id로 추적 가능한가?
- migration/rollback 영향이 설명되었는가?

## 리뷰 코멘트 작성 기준

- 버그와 위험을 먼저 쓴다.
- 파일과 라인을 구체적으로 짚는다.
- 취향성 formatting 지적은 자동 도구에 맡긴다.
- “왜 위험한지”와 “어떤 계약을 깨는지”를 함께 설명한다.
- 차단 이슈와 후속 개선을 구분한다.
