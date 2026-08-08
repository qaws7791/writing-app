# 용어집

## 제품 용어

- 학습자: 코스를 듣고 레슨을 진행하는 사용자.
- 관리자: 어드민에서 커리큘럼과 사용자를 관리하는 owner 역할의 사용자.
- owner: 현재 지원하는 유일한 관리자 역할.
- 콘텐츠: 코스, 유닛, 레슨과 학습 스텝으로 이루어진 학습 자료.
- 커리큘럼 버전: 학습자가 시작한 콘텐츠 구성을 일관되게 유지하기 위한 버전 단위.
- 학습 진행: 학습자의 현재 위치, 답안, 완료 상태와 활동 기록.
- 학습 날짜 경계: 학습 활동일과 일일 한도를 판정하는 플랫폼 논리 날짜의 기준 시간대.
- 쓰기: 학습자가 레슨과 독립된 글을 작성하고 자기 점검하는 최상위 제품 영역.
- 글: 학습자가 소유하는 제목과 일반 텍스트 본문.
- 쓰기 방식: `자유롭게 쓰기`, `설명하기`, `주장하기` 중 글을 시작할 때 선택하는 방향.
- 자기 점검: 쓰기 방식에 맞는 세 질문으로 글을 다시 읽는 단계.
- 점검 완료 글: 자기 점검을 마친 글. 본문을 수정하면 다시 작성 중 상태가 된다.

## 절차 용어

- 공개 계약: runtime 내부 구현과 분리되어 consumer가 의존할 수 있는 HTTP·schema·package interface.
- API: 사용자 화면과 backend 기능 사이의 공개 HTTP interface. 현재 endpoint와 transport 구성은 코드가 소유한다.
- migration: schema 또는 persisted 데이터를 안전하게 전환하는 순서 보존 변경.
- rollback: 실패한 변경의 영향을 줄이기 위해 code, 설정 또는 데이터를 안전한 상태로 복구하는 절차.
- 검증 보고서: 기준 commit, 환경, 명령, 결과와 artifact를 고정한 과거 실행 증거.

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
