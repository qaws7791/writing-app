# WA-23 학습자 웹 링크 의미론 분석

- 작업 시작: 2026-06-17
- 작업 완료: 2026-06-17
- 대상 이슈: WA-23 `시맨틱 태그 및 접근성을 무시한 암묵적 라우팅`
- 조사 범위: `apps/web/src/features/home/home-page.tsx`, `apps/web/src/components/layout/global-nav.tsx`, 학습자 코스 화면, 어드민 sidebar, `FRONTEND.md`

## 이슈 요약

WA-23은 학습자 웹에서 내부 페이지 이동을 `<Link href="...">`가 아니라 `<div onClick>` 또는 `<button onClick={() => router.push(...)}`로 구현해 링크 의미론과 접근성을 해친다고 지적한다.

## 코드 조사

학습자 웹에서 navigation 목적의 `router.push` 사용이 여러 곳에서 확인됐다.

- `apps/web/src/components/layout/global-nav.tsx`
  - 브랜드 홈 이동
  - 데스크톱 nav 항목
  - 모바일 하단 nav 항목
  - 프로필 메뉴 이동
- `apps/web/src/features/home/home-page.tsx`
  - 빈 상태 코스 둘러보기 card
  - 이어서 학습 코스 card
  - 다음 레슨 button
- `apps/web/src/features/courses/courses-page.tsx`
  - 코스 card 전체 클릭
- `apps/web/src/features/courses/course-detail-page.tsx`
  - 돌아가기
  - 학습 시작/이어서 학습하기
- `apps/web/src/features/courses/course-curriculum.tsx`
  - 레슨 이동

반면 어드민 sidebar는 `next/link`를 사용해 주요 메뉴를 `<Link href={item.href}>`로 렌더링한다. 이는 같은 monorepo 안에 이미 더 나은 navigation 패턴이 있음을 보여준다.

`FRONTEND.md`의 접근성 항목은 버튼, dialog, form control, 오류/상태 안내는 다루지만, 내부 라우팅 요소를 링크로 표현해야 한다는 규칙은 아직 없다.

## 판단

이슈는 타당하다.

내부 페이지 이동은 사용자 관점에서 링크다. 이를 버튼이나 클릭 가능한 div로 만들면 브라우저의 링크 기본 기능, 새 탭 열기, 링크 주소 복사, screen reader role 인식, keyboard shortcut 기대가 깨진다. 특히 코스 card나 다음 레슨처럼 사용자가 목적지를 가진 리소스로 이동하는 요소는 명령 버튼이 아니라 링크가 더 정확하다.

다만 모든 `router.push`가 잘못된 것은 아니다. 로그인 성공 후 이동, form 제출 완료 후 이동, 레슨 완료 후 다음 상태 전이, modal 닫기와 함께 수행되는 명령형 이동은 imperative navigation이 자연스러울 수 있다. 따라서 개선은 무조건 치환이 아니라 “보이는 내부 탐색 요소는 Link, 이벤트 결과로 발생하는 전이는 router”라는 기준을 세워야 한다.

## 개선 방안

### 방안 1. 내부 탐색 UI를 `<Link>` 기반 컴포넌트로 표준화한다

학습자 앱에 다음 공통 컴포넌트를 둔다.

- `AppLink`
- `NavLink`
- `CourseCardLink`
- `LessonLink`

이 컴포넌트들은 내부적으로 `next/link`를 사용하고, 기존 `btn-squish`, active state, card layout class를 보존한다. 장점은 card형 UI를 링크로 바꾸면서도 디자인을 유지할 수 있고, 새 화면이 같은 컴포넌트를 재사용하게 된다.

### 방안 2. GlobalNav와 MobileNav를 링크 의미론으로 재작성한다

`global-nav.tsx`의 브랜드, 데스크톱 메뉴, 모바일 하단 메뉴는 모두 정적 내부 route다. 이들은 `button + router.push` 대신 `Link`를 사용한다. active state는 현재처럼 `usePathname()`으로 계산하고, 현재 페이지 항목에는 `aria-current="page"`를 부여한다.

프로필 dropdown 안의 프로필 이동도 `Link`로 바꾸고, 메뉴 닫힘은 `onClick={() => setMenu(false)}` 정도의 UI side effect만 담당하게 한다. 로그아웃이 실제 sign-out 명령이라면 버튼으로 유지하되, 단순 `/login` 이동이라면 별도 logout action 또는 Link 정책을 명확히 해야 한다.

### 방안 3. 코스와 레슨 리소스 이동을 Link 기반 카드/행으로 바꾼다

홈의 코스 card, 코스 목록 card, 커리큘럼 레슨 row, 다음 레슨 CTA는 실제 목적지가 있는 내부 리소스 이동이다. 이를 `Link href={`/app/courses/${course.id}`}` 또는 `Link href={`/app/lesson?lesson_id=${lesson.id}`}`로 바꾼다.

card 내부에 또 다른 button을 중첩하지 않도록 카드 전체를 하나의 Link로 만들거나, card 내부의 별도 command는 링크 밖으로 분리한다. 장점은 HTML 구조가 유효해지고 screen reader가 목적지를 링크로 인식한다.

### 방안 4. imperative router 사용 예외 기준을 문서화한다

`FRONTEND.md`에 다음 기준을 추가한다.

- 내부 페이지로 이동하는 보이는 UI는 기본적으로 `Link`를 사용한다.
- form 제출, 인증 완료, 비동기 저장 완료, modal close 후 이동처럼 이벤트 결과로 발생하는 전이는 `router.push` 또는 `router.replace`를 허용한다.
- 외부 URL 이동은 `<a>` 또는 명시적 external link wrapper를 사용한다.
- 클릭 가능한 `div`는 navigation 목적으로 사용하지 않는다.

이 규칙은 “버튼처럼 생겼다”가 아니라 “사용자 의도가 명령인지 목적지 이동인지”로 판단하게 한다.

### 방안 5. 접근성 회귀 테스트와 lint 규칙을 추가한다

테스트와 lint성 검사를 통해 다음을 고정한다.

- nav 안의 항목은 role `link`로 조회된다.
- 현재 페이지 link에는 `aria-current="page"`가 있다.
- card navigation은 `getByRole("link", { name: ... })`로 찾을 수 있다.
- `div`에 `onClick`과 `cursor-pointer`를 동시에 두는 패턴을 금지한다.
- `router.push` 사용처는 명령형 전이 허용 목록에만 남긴다.

장점은 새 화면에서 같은 접근성 회귀가 반복되는 것을 막는다.

## 권장 진행 순서

1. `FRONTEND.md`에 내부 탐색 UI는 Link를 사용한다는 기준과 router 예외를 먼저 기록한다.
2. `GlobalNav`와 `MobileNav`를 `Link`로 교체하고 `aria-current` 테스트를 추가한다.
3. 홈의 코스 card, 빈 상태 card, 다음 레슨 CTA를 Link 기반 컴포넌트로 바꾼다.
4. 코스 목록, 코스 상세, 커리큘럼의 리소스 이동을 Link로 바꾼다.
5. 남은 `router.push`를 검토해 명령형 전이만 남기고 회귀 테스트를 추가한다.

## 검증 계획

- `bun --filter @workspace/web test -- global-nav home-page courses-page course-detail-page course-curriculum`
- `bun --filter @workspace/web lint`
- `bun lefthook run pre-commit`

## 완료 기록

- WA-23 본문을 읽고 학습자 웹의 navigation 요소, 어드민 sidebar의 Link 사용 사례, frontend 접근성 문서를 조사했다.
- 이슈는 타당하다고 판단했다.
- 개선 방향은 단순 치환이 아니라 Link 기반 navigation 컴포넌트, router 예외 기준, 접근성 회귀 테스트까지 포함해 정리했다.
- `FRONTEND.md`에 내부 탐색 UI는 `Link`를 사용하고 명령형 `router`는 이벤트 결과 전이에 한정한다는 기준을 추가했다.
- 학습자 전역 내비게이션, 홈, 코스 목록, 코스 상세, 커리큘럼의 내부 리소스 이동을 `Link` 기반으로 바꿨다.
- 현재 페이지 내비게이션은 `aria-current="page"`로 드러나게 했고, 잠긴 레슨은 링크를 만들지 않도록 분리했다.
- 회귀 테스트는 `router.push` 호출 대신 `role="link"`와 `href` 계약을 검증하도록 변경했다.
