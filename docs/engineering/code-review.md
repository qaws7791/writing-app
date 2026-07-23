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

- 제품 concrete adapter는 module infrastructure가 소유하고, 앱 조립 경계만 module 공개 factory·port와 `packages/infra/*` runtime 구현을 함께 아는가?
- infra package가 app·module을 import하지 않고 provider SDK를 소유 package 밖으로 노출하지 않는가?
- 관리자 use case가 기능별 파일과 repository port에 의존하고 불필요하게 전체 `AdminRepository` 또는 mega service를 요구하지 않는가?
- 관리자 DTO schema가 `content`, `identity`, `operations`, `resource-library`의 소유 context에 있고 가장 좁은 `@workspace/contracts/<context>/<contract>` entrypoint로 소비되는가?
- 어드민 코스 편집기 root에는 shell entrypoint만 두고 `workspace`, `preview`, `step-forms` 디렉토리 책임이 섞이지 않는가?
- 어드민 코스 편집기 step form 의존 방향이 `step-form-registry -> step-forms barrel -> forms -> shared`로 유지되는가?
- 학습 step answer 검증은 learning domain policy에 있고 application service가 step type별 validator를 다시 구현하지 않는가?
- AI feedback service가 attempt 계산, provider 호출, persistence 저장 세부사항을 직접 구현하지 않고 coordinator와 domain policy에 위임하는가?
- 프론트엔드가 module infrastructure, DB나 Drizzle에 직접 의존하지 않는가?
- domain과 production application이 runtime adapter나 infrastructure 구현을 import하거나 Worker·network·환경 변수를 직접 사용하지 않는가?
- 새 import가 runtime cycle을 만들거나 manifest에 없는 dependency, frontend의 server·DB 의존을 추가하지 않는가?
- HTTP 변경 route가 검증된 `*Request`를 application command로 명시적으로 변환하고 repository port까지 request 타입을 전달하지 않는가?
- API composition root가 DB 생성·공유·종료를 소유하고 module application 결과에 DB client가 노출되지 않는가?
- 학습자 HTTP 경계가 `@workspace/contracts/learning/learner-api` 등 endpoint 소유 contract의 strict schema와 추론 타입을 직접 사용하고 generated OpenAPI 타입이나 `writing-app-api-contract`를 다시 만들지 않는가?
- 학습자 성공 응답이 전송 직전에 runtime parse되고 계약 실패 로그에서 본문·답안·Zod message가 제외되는가?
- 매칭 스텝 presentation 상호작용 모델은 `apps/web` feature 내부에 있고 `packages/shared/contracts`나 module public API로 새어 나가지 않는가?
- Learning domain이 content 타입을 필요로 할 때 content module facade가 아니라 `@workspace/contracts/content/course` 또는 구체적인 독립 경계를 import하는가?
- 레거시 실험 디렉터리의 구현 파일을 제품 런타임에서 import하지 않는가?

## 인증과 권한 체크

- 새 route가 인증 필요 여부를 명시했는가?
- 관리자 변경성 route가 owner guard를 사용하는가?
- unknown role 처리 경로가 안전한가?
- 학습자 suspended/deleted 상태가 보호 API에서 차단되는가?
- 쿠키 이름, origin, 비밀값을 학습자/관리자 간 혼용하지 않는가?

## 데이터 체크

- schema, migration SQL, Drizzle schema가 일치하는가?
- 기본 seed가 기존 aggregate·인증·profile·권한과 진행/답변을 갱신하거나 삭제하지 않고, reset은 명시적 승인 경계로 분리됐는가?
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

- wire 응답은 schema로 검증되는가? 검증된 DTO와 화면 의미가 같으면 identity mapper 없이 canonical 타입을 사용하고, 실제 표시 의미가 다를 때만 명시적 projection을 두는가?
- HTTP 성공·실패 shape와 생성자는 `@workspace/http-client`를 직접 사용하고 앱 local result는 오류 type specialization 외의 runtime wrapper를 만들지 않는가?
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
