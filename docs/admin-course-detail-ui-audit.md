# 어드민 코스 상세 페이지 UI 감사

## 2026-05-29 조사 결과

대상 화면은 `apps/admin/src/features/courses/admin-course-detail-page.tsx`와 `apps/admin/src/features/courses/course-editor/*`에 구현된 코스 상세 에디터다. 실제 로컬 화면 `http://localhost:3001/courses/sentence-structure`와 코드 구현을 함께 확인했다.

## 확인된 추가 문제

- 화면 제목이 `Course Studio`로 남아 있어 어드민의 한국어 운영 도구 톤과 맞지 않는다.
- 코스 제목 입력값이 상단 설명에 즉시 반영되어, 저장 전 작업 상태와 페이지 안내 문구가 섞인다.
- 상단 버전 메뉴의 `draft`, `published` 상태 값이 원문으로 노출된다.
- 왼쪽 커리큘럼 영역은 `Curriculum`, `lessons`, `active`를 그대로 표시한다.
- 오른쪽 작업대는 내부 식별자인 `sentence-structure-v2 · lesson` 또는 `view=step` 값을 그대로 보여준다.
- 레슨 작업대는 `active · minor-edit`처럼 도메인 정책용 내부 상태를 사용자 라벨로 노출한다.
- 스텝 타입 `INTRO`, `SHORT_WRITE`, `AI_FEEDBACK`, `SUMMARY`, `COMPLETE`가 목록, 미리보기, 스텝 편집 화면에 그대로 노출된다.
- `XP` 단위가 한국어 라벨과 섞여 표시된다.
- `Preview`, `working copy` 같은 영문 개발 용어가 미리보기 화면에 노출된다.
- `레슨 설정` 버튼을 눌러도 설정 화면이 렌더링되지 않고, URL만 `view=settings`로 바뀐 뒤 기존 레슨 작업대가 계속 보인다.
- `스텝 추가` 버튼은 클릭해도 모달, 메뉴, 상태 변경이 없어 실제 기능이 없다.
- 챕터 추가, 챕터 이름 수정, 챕터 상태 변경, 챕터 아카이브, 챕터 순서 변경 UI가 없다.
- 레슨 추가와 레슨 아카이브 UI가 없다.
- 스텝 삭제, 스텝 아카이브, 스텝 순서 변경 UI가 없다.
- published 버전을 열어도 입력 필드는 편집 가능하지만 저장만 비활성화된다. 사용자는 수정 가능한 것처럼 보이는 값을 저장할 수 없다.
- 발행, draft 폐기, published 복원은 확인 모달이나 되돌리기 흐름 없이 즉시 실행된다.
- 저장하지 않은 변경이 있는 상태에서 버전 변경, 레슨 이동, 페이지 이탈을 막는 확인 흐름이 없다.
- 모바일 폭에서는 왼쪽 패널이 화면 전체를 차지하고 오른쪽 작업대 폭이 0이 되어 레슨 상세와 스텝 편집에 접근할 수 없다.
- 현재 레슨이 아닌 전체 스크롤 컨테이너가 두 개로 나뉘어, 긴 커리큘럼과 작업대 사이의 현재 위치 관계를 파악하기 어렵다.
- 레슨 행마다 같은 `레슨 순서 변경` 접근성 이름을 사용해 스크린 리더와 자동화에서 어느 레슨의 핸들인지 구분하기 어렵다.
- 스텝 폼은 실제 content schema와 맞지 않는 키를 읽는 경우가 많아 기존 값이 빈 값으로 보인다. 예를 들어 INTRO는 seed data의 `bullets`를 표시하지 않고 `objectives`를 찾는다.
- number 입력 변경값은 문자열로 저장되어 `estimatedMinutes`, `minChars` 같은 숫자 필드 타입이 저장 후 변형될 수 있다.
- 배열 필드는 줄바꿈 문자열로 편집되지만 저장 시 배열로 되돌리지 않아 content 구조가 깨질 수 있다.
- 스텝 간 참조 필드인 `sourceStepId`는 선택 목록이 아니라 자유 입력에 가깝게 처리되어 잘못된 참조를 만들 수 있다.
- 코스 썸네일은 배경 이미지 div로 렌더링되어 로딩 실패, 이미지 교체, 파일 선택, 대체 텍스트 상태를 명확하게 다루기 어렵다.
- 코스/레슨 입력에는 `name`, `autocomplete`, 타입 같은 폼 메타데이터가 부족하다.
- 저장 버튼 라벨이 단순히 `저장`이라 어느 변경사항을 저장하는지 명확하지 않다.
- 상태 메시지는 화면 상단의 일반 문단으로만 표시되어 성공, 오류, 충돌, 진행 중 상태의 시각적 구분과 접근성 알림이 약하다.

## 근거 파일

- `apps/admin/src/features/courses/admin-course-detail-page.tsx`
- `apps/admin/src/features/courses/course-editor/course-editor-shell.tsx`
- `apps/admin/src/features/courses/course-editor/course-summary-panel.tsx`
- `apps/admin/src/features/courses/course-editor/curriculum-map.tsx`
- `apps/admin/src/features/courses/course-editor/lesson-workspace.tsx`
- `apps/admin/src/features/courses/course-editor/step-workspace.tsx`
- `apps/admin/src/features/courses/course-editor/step-forms/*`
