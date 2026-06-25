# UI 패턴

이 문서는 재사용 UI 패턴의 단일 진실 원천이다. 화면별 세부 명세는 `docs/design/screens`에 두고, 여러 화면에 반복되는 구조와 상태 표현은 이 문서에 둔다.

## 학습자 패턴

### 앱 Shell

- `/app`, `/app/courses`, `/app/courses/[id]`, `/app/profile`은 `AppShell`을 사용한다.
- 데스크톱은 상단 nav, 모바일은 하단 nav를 사용한다.
- 본문은 `an-fi`로 가볍게 진입하되, 주요 고정 요소에는 transform 애니메이션을 적용하지 않는다.

### 코스 카드

- 목적지가 있는 코스 카드는 `Link`로 구현한다.
- 이미지는 `createCourseImageUrl(visualKey)`를 사용한다.
- 모바일에서는 작은 썸네일과 텍스트를 가로로 압축할 수 있고, 데스크톱에서는 세로 카드로 확장한다.
- 카드 설명은 모바일에서 숨겨도 되지만 제목과 레슨 수는 유지한다.

### 카테고리 탭

- 코스 목록의 카테고리 선택은 가로 스크롤 pill 버튼으로 표현한다.
- 활성 상태는 `Button` 기본 variant, 비활성은 `secondary` variant를 쓴다.
- URL 복원이 필요한 상태가 되면 query로 승격한다.

### 진행률

- 코스 진행률은 공용 `Progress`로 표시한다.
- 수치가 필요한 곳은 `completed/total`처럼 명확한 분수를 같이 제공한다.
- 레슨 진행률은 `role="progressbar"`와 `aria-valuenow`, `aria-valuemin`, `aria-valuemax`를 제공한다.

### 레슨 몰입 화면

- 레슨 route는 글로벌 nav를 숨긴다.
- 시작 화면, 진행 화면, 완료 화면을 명확히 분리한다.
- 시작 화면은 카테고리, 제목, 설명, 예상 시간, 스텝 수, 시작 CTA를 보여준다.
- 진행 화면은 상단 진행 헤더, 중앙 step renderer, 하단 CTA를 갖는다.
- 완료 화면은 fullscreen overlay이며 완료 메시지, 핵심 요약, 코스 진행률, 다음 행동을 보여준다.

### 정답과 오답 피드백

- 정답은 `success-*`, 오답은 `danger-*` semantic token을 사용한다.
- 피드백 footer는 `StickyActionBar`와 `Callout`으로 표시하고, 다음 행동은 `계속하기`로 유지한다.

### 빈 상태

- 학습 홈의 빈 상태는 코스 선택으로 이어지는 단일 CTA를 제공한다.
- 빈 상태는 문제를 설명하기보다 다음 시작점을 제안한다.

### 테마 전환

- 프로필의 테마 전환은 3분할 segmented control이다.
- 옵션은 라이트, 다크, 시스템이다.
- 활성 상태는 `aria-pressed="true"`와 `data-pressed`로 검증하며, 색상은 `action-selected-*` token을 사용한다.

## 어드민 패턴

### 화면 구조

- 모든 보호된 어드민 화면은 `AdminShell` 안에서 렌더링한다.
- 본문 상단에는 `PageHeader`를 직접 둔다.
- 조회 실패는 헤더 아래 `Alert role="alert"`로 표시한다.

### 목록 화면

- 필터는 `FilterToolbar`에 모은다.
- 목록은 `Surface variant="panel"` 안의 `DataTable`로 표시한다.
- 페이지네이션 메타는 섹션 heading 설명에 표시한다.
- 검색/필터가 실제 URL과 동기화되지 않는 경우, 후속 작업에서 form submit 또는 query 반영 정책을 명시한 뒤 구현한다.

### 지표 대시보드

- 주요 지표는 4열 metric card grid를 기본으로 한다.
- 어드민 대시보드와 분석의 추이, 분포, 운영 흐름 차트는 Recharts 기반 구현을 사용할 수 있다.
- 매우 단순한 보조 막대는 CSS 또는 SVG로 표현할 수 있다.
- 차트만으로 의미를 전달하지 않고 수치, 라벨, 표, 보조 설명을 함께 제공한다.
- 숫자는 `toLocaleString("ko-KR")`를 사용한다.

### 상태 pill

- 콘텐츠와 사용자 상태는 app-local `StatusBadge`가 Kwep 어드민 기준의 중립 `Badge`로 표시한다.
- enum 값은 외부 계약이므로 `active`, `archived`, `suspended`, `deleted` 같은 영어 식별자를 유지할 수 있다.

### 위험 작업

- 보관, 삭제 요청, 콘텐츠 초기화는 확인 dialog를 거친다.
- confirm 버튼은 `Button variant="destructive"`를 사용한다.
- 성공 또는 실패 결과는 `Alert role="status"`에 한국어로 표시한다.

### 오류와 상태

- 오류 블록은 `role="alert"`를 사용한다.
- 저장/처리 완료 메시지는 `role="status"`를 사용한다.
- 네트워크 원인이나 내부 예외는 사용자에게 직접 노출하지 않는다.

## 공통 패턴

### 내부 탐색

- 내부 페이지 이동은 `next/link`의 `Link`를 사용한다.
- 현재 페이지 링크는 가능한 `aria-current="page"`를 제공한다.
- `router.push`와 `router.replace`는 로그인 완료, 저장 완료, 모달 종료 뒤 이동처럼 비동기 결과에 따른 전이에 사용한다.

### Form

- label과 control을 가까이 둔다.
- placeholder만으로 의미를 전달하지 않는다.
- invalid 상태는 `aria-invalid`와 시각 상태를 함께 쓴다.
- 저장 실패는 화면 상태로 노출한다.

### 이미지

- 코스 이미지는 `visualKey`를 통해 결정한다.
- `picsum.photos/seed/{id}` 같은 외부 placeholder URL은 정식 코스 이미지 패턴으로 사용하지 않는다.
- 이미지 alt는 코스 제목이나 화면 의미를 설명하는 한국어를 사용한다.
- 장식 이미지는 `aria-hidden` 또는 빈 alt를 사용한다.

### 문구

- 버튼은 사용자가 하는 행동을 말한다. 예: `학습 시작하기`, `코스 둘러보기`, `삭제 처리`.
- 상태 메시지는 완료된 결과를 말한다. 예: `코스를 보관했습니다.`
- 오류는 사용자가 다음에 할 수 있는 행동이 보이도록 한국어로 쓴다.
