# SCR-104 코스 편집

## 구현 탐색

현재 route는 [관리자 앱 route source](../../../apps/admin/src/app)에서 확인한다.

## 목적

관리자가 현재 코스 editor 문서를 열어 코스 정보, 커리큘럼, 레슨, 스텝을 편집하고 학습자 표시를 확인한다.

## 주요 사용자

- 소유자 관리자

## 정보 구조

- `PageHeader`
- 코스 정보 편집 패널
- 커리큘럼 맵
- 레슨 미리보기 작업대
- 스텝 미리보기 작업대
- 학습자 미리보기 카드
- 오류 banner

## UI 기준

- 화면 제목은 현재 코스 제목이다.
- reducer 기반 draft는 `clean`, `dirty`, `saving`, `publishing`, `saved`, `validation-error`, `conflict`, `server-error` 상태를 구분한다.
- 코스 정보는 제목, 설명, 카테고리 form control을 제공한다.
- 커리큘럼은 유닛과 레슨 계층을 보여 주고 추가·제목 변경·삭제를 지원한다. 배열 변경 뒤 `sortOrder`는 1부터 다시 계산한다.
- 레슨 작업대는 제목, 예상 시간, 설명, 요약을 보여준다.
- 스텝 작업대는 step registry와 타입별 form renderer를 사용해 content JSON을 보여준다.
- 학습자 미리보기는 `Card`로 현재 첫 레슨의 시작 화면 핵심 정보를 보여준다.
- 패널 구조는 `Surface variant="panel"`, `SectionHeader`, `Field`, `Card` 조합을 사용한다.

## 상태

- 코스 조회 성공
- 코스 조회 실패
- 레슨 없음
- 스텝 없음
- 저장 중과 저장 완료
- 입력 검증 오류
- revision 충돌
- 서버 오류
- 미저장 변경

## 저장과 충돌

- `PUT /courses/{courseId}/editor`에 branded ID와 구조화된 10종 step union을 포함한 전체 문서를 저장한다.
- 저장은 현재 `editVersion`의 `If-Match`를 보내고 성공 시 증가한 `editVersion`을 반영한다. `revision`은 저장으로 증가하지 않는다.
- 저장되지 않은 변경이 없을 때 `초안 발행`을 실행할 수 있다. 발행 성공 뒤 서버가 복제한 다음 `revision` draft를 다시 읽는다.
- 브라우저 새로고침·창 닫기와 목록 또는 편집 탭 이동 전에 미저장 경고를 제공한다.
- 충돌 시 자동 병합하지 않는다. 사용자는 최신 서버 문서로 교체하거나, 로컬 초안에 최신 `curriculumVersionId`, `editVersion`, `revision`을 적용해 다시 검토한 뒤 명시적으로 재저장한다.

## 접근성

- 모든 편집 control은 한국어 label을 가진다.
- 오류는 `role="alert"`로 표시한다.
- preview 텍스트는 학습자에게 보이는 실제 콘텐츠와 동일한 한국어를 사용한다.
