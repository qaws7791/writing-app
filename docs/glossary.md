# 용어집

## 제품 용어

- 학습자: 코스를 듣고 레슨을 진행하는 사용자.
- 관리자: 어드민에서 커리큘럼과 사용자를 관리하는 owner 역할의 사용자.
- owner: 현재 지원하는 유일한 관리자 역할.
- 콘텐츠: 코스, 유닛, 레슨과 학습 스텝으로 이루어진 학습 자료.
- 커리큘럼 버전: 학습자가 시작한 콘텐츠 구성을 일관되게 유지하기 위한 버전 단위.
- 학습 진행: 학습자의 현재 위치, 답안, 완료 상태와 활동 기록.
- 학습 날짜 경계: 학습 활동일과 일일 한도를 판정하는 플랫폼 논리 날짜의 기준 시간대.
- 쓰기: 학습자가 레슨과 독립된 과제를 골라 글을 작성하고 AI 점검을 받는 최상위 제품 영역.
- 쓰기 과제: 관리자가 초안 저장하고 발행하는 글쓰기 과제. 코스 계층에 속하지 않는다.
- 발행본: 학습자가 글을 시작할 때 고정되는 과제 스냅샷.
- 글: 학습자가 소유하는 일반 텍스트 본문. 시작 시점 발행본에 고정된다. 학습자에게 작성 중·완료 상태를 두지 않는다.
- 도메인: 쓰기 과제를 묶는 제품 enum 10개.
- 유형: 관리자가 과제에 붙이는 이름.
- AI 점검: 고정 발행본과 본문을 외부 AI에 전달해 잘된 점, 과제 미충족, 고칠 일을 받는 단계. 글마다 최근 성공 결과 1건을 둔다. 고칠 일의 1차 표면은 본문 인용 구절의 형광펜이다.

## 절차 용어

- 공개 계약: runtime 내부 구현과 분리되어 consumer가 의존할 수 있는 HTTP·schema·package interface.
- API: 사용자 화면과 backend 기능 사이의 공개 HTTP interface. 현재 endpoint와 transport 구성은 코드가 소유한다.
- migration: schema 또는 persisted 데이터를 안전하게 전환하는 순서 보존 변경.
- rollback: 실패한 변경의 영향을 줄이기 위해 code, 설정 또는 데이터를 안전한 상태로 복구하는 절차.
- 검증 보고서: 기준 commit, 환경, 명령, 결과와 artifact를 고정한 과거 실행 증거.
- 관리자 MCP: 승인된 AI 에이전트가 읽기 전용 조회, 제한적 자동 변경과 owner 승인 변경을 호출하는 MCP 도구 경계.
- MCP credential: 기존 owner `AdminId`, scope, 만료와 폐기 lifecycle에 연결된 개인·장치별 static bearer 인증 수단.
- MCP credential ID: raw token 없이 request, 승인, 실행 영수증과 감사를 같은 credential provenance로 연결하는 opaque 식별자.
- MCP credential lifecycle event: credential 발급 또는 폐기 action과 관리 actor를 append-only로 보존하는 영속 기록.
- MCP 합성 client: 별도 static bearer credential로 staging 관리자 MCP의 read-only Tool 호출을 검증하는 자동 client.
- Codex MCP client: 환경 변수에서 static bearer token을 읽고 관리자 MCP에 직접 연결하는 Codex host.
- MCP 변경 승인: owner 관리자가 특정 MCP credential, 도구, 입력 digest와 대상 상태에 묶인 3단계 변경 요청을 허용하거나 거절하는 기록.
- MCP 실행 식별자: 자동 또는 승인 실행과 감사 이벤트를 연결하는 opaque 식별자.
- MCP 콘텐츠 실행 영수증: MCP 콘텐츠 변경과 같은 transaction에서 저장하며 같은 요청의 결과를 재생하는 기록.

## 도메인 언어 정본

각 개념의 값과 규칙은 아래 코드가 소유한다. 문서는 값을 복제하지 않고 위치만 가리킨다.

| 개념                 | 정본 위치                                                                                                                               | 금지                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 학습 날짜 경계       | [`kernel/src/day-boundary.ts`](../packages/shared/kernel/src/day-boundary.ts)                                                           | 시간대·offset 리터럴 재선언             |
| 식별자 브랜드        | [`types/src/ids.ts`](../packages/shared/types/src/ids.ts)                                                                               | 모듈 내 브랜드 재선언                   |
| 식별자 스키마 팩토리 | [`contracts/src/identifier.ts`](../packages/shared/contracts/src/identifier.ts)                                                         | ID 스키마 팩토리 중복 정의              |
| 실패 표현            | [`kernel/src/failure.ts`](../packages/shared/kernel/src/failure.ts)                                                                     | 계층별 실패 타입 재선언                 |
| Result               | [`kernel/src/result.ts`](../packages/shared/kernel/src/result.ts)                                                                       | 성공 flag 형태의 결과 shape             |
| 학습자 화면 모델     | [`apps/web/src/features/lesson-session/model/lesson-view-model.ts`](../apps/web/src/features/lesson-session/model/lesson-view-model.ts) | `Dto as Lesson` 등 전송 DTO 도메인 별칭 |
| wire 스키마          | [`contracts/src`](../packages/shared/contracts/src)                                                                                     | 앱에서 요청·응답 스키마 재선언          |
