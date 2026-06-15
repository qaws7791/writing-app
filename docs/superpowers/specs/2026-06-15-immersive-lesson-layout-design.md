# 몰입형 레슨 레이아웃 설계

## 목표

`/app/lesson` 화면을 레슨 전용 몰입형 레이아웃으로 분리한다. 글로벌 네비게이션은 레슨 라우트에서 렌더링하지 않고, 시작 화면과 학습 스텝 화면 모두 상단 헤더와 하단 CTA를 스크롤되지 않는 영역으로 유지한다.

## 범위

- 제품 URL은 `/app/lesson?lesson_id=...`를 유지한다.
- 색상은 현재 제품 테마를 유지한다.
- 시작 화면도 동일한 레슨 셸을 사용한다.
- 중앙 콘텐츠 영역만 `overflow-y-auto`로 스크롤한다.
- 완료 화면은 기존 완료 경험을 유지하되 레슨 route의 글로벌 네비게이션 제거 영향을 받는다.

## 구조

Next.js route group을 사용해 일반 학습자 앱 route와 레슨 route를 같은 URL 체계 안에서 다른 layout으로 분리한다. 일반 `/app`, `/app/courses`, `/app/profile`은 `AppShell`을 계속 사용하고, `/app/lesson`은 root layout 바로 아래에서 렌더링해 글로벌 네비게이션 DOM을 만들지 않는다.

`LessonExperience`는 작은 내부 `LessonShell`을 사용한다. 셸은 `h-dvh overflow-hidden flex flex-col` 구조를 갖고, `header`와 `footer`는 `shrink-0`, `main`은 `min-h-0 flex-1 overflow-y-auto`로 둔다. 이 구조는 fixed positioning보다 스크롤 기준이 명확하고, CTA가 content scroll에 끌려가지 않는다.

## 검증

- 컴포넌트 테스트는 시작 화면과 시작 후 스텝 화면이 같은 셸 구조를 쓰는지 확인한다.
- 테스트는 진행률 헤더, 중앙 스크롤 영역, 하단 CTA 영역의 class를 검증한다.
- 빌드 또는 타입체크로 route group 이동 후 `/app/lesson` 경로가 유지되는지 확인한다.
