# UI 패턴

이 문서는 재사용 UI 패턴의 단일 진실 원천이다. 화면별 세부 명세는 `docs/design/screens`에 두고, 여러 화면에 반복되는 구조와 상태 표현은 이 문서에 둔다.

## 학습자 패턴

### 앱 Shell

- 학습 홈, 코스, 쓰기 홈과 프로필은 `AppShell`을 사용한다.
- 데스크톱은 상단 nav, 모바일은 하단 nav를 사용한다.
- 필요한 본문은 `animate-drift-in`으로 가볍게 진입한다. 주요 고정 요소에는 transform 애니메이션을 적용하지 않는다.

### 코스 카드

- 목적지가 있는 코스 카드는 `Link`로 구현한다.
- 이미지는 `resolveCourseImage(course)`를 사용한다.
- 코스 목록 카드는 모든 뷰포트에서 세로형으로 유지한다.
- 카드 설명은 두 줄까지 표시하고 제목과 레슨 수는 유지한다.

### 카테고리 섹션과 탭

- 코스 목록은 카테고리별 섹션으로 코스를 묶는다. 학습자 코스 목록에는 카테고리 pill 필터를 두지 않는다.
- 학습 홈의 `진행중` / `완료` 전환은 pill 언어를 쓰며, 공유 `Tabs` `default` variant로 구현한다. `TabsList` surface 트랙 안에서 활성 pill이 슬라이드 전환된다.
- URL 복원이 필요한 상태가 있으면 query로 승격한다.

### 진행률

- 코스 진행률은 공용 `Progress`로 표시한다.
- 수치가 필요한 곳은 `completed/total`처럼 명확한 분수를 같이 제공한다.
- progress track은 공용 `Progress`의 `secondary` 색을 유지한다. 호출자는 track 색을 덮어쓰지 않는다.
- 레슨 진행률은 `role="progressbar"`와 `aria-valuenow`, `aria-valuemin`, `aria-valuemax`를 제공한다.

### 레슨 몰입 화면

- 레슨 route는 글로벌 nav를 숨긴다.
- 시작 화면, 진행 화면, 완료 화면을 명확히 분리한다.
- 시작 화면은 카테고리, 제목, 설명, 활동 수, 시작 CTA를 보여준다. 예상 시간은 진입 판단이 이미 끝난 화면이므로 표시하지 않는다. 표시 지점은 학습 홈과 코스 상세다.
- 진행 화면은 상단 진행 헤더, 중앙 step renderer, 하단 CTA를 갖는다.
- 클릭·터치 가능한 선택 타일과 칩은 작은 그림자로 조작 가능함을 드러낸다.
- 완료 화면은 fullscreen overlay이며 완료 메시지, 핵심 요약, 다음 행동을 같은 `max-w-2xl` 열에 보여준다.

### 목적 과제 쓰기

- 글 작성과 점검은 글로벌 navigation을 숨긴다.
- 작성 세션은 과제 브리프, 본문, 저장 상태, 점검 결과, `점검하기`와 `마치기`를 같은 화면에 제공한다.
- 작성 세션 chrome은 구분선으로 칸을 나누지 않는다. 본문만 editorial 종이 표면이고, 브리프와 점검은 간격과 농도로 후퇴한다.
- 브리프는 읽고 접으며 필요할 때만 다시 연다.
- 저장 실패와 version 충돌에서도 로컬 입력을 유지한다.
- 삭제는 쓰기 홈의 `AlertDialog`에서 확인한다.

### 정답과 오답 피드백

- 콘텐츠 영역은 항목별 `correct`·`incorrect`·`missed` 상태를 `success`·`destructive` 톤온톤으로 표시한다.
- 확인 전 선택은 `info` 톤온톤으로 표시한다. 확인 전에 `success`를 쓰지 않는다.
- `CATEGORIZE` 바구니 헤더와 `MATCH` 짝은 `series-*`와 점·라벨로 정체를 구분한다. 정체 색은 평가 색과 겹치지 않는다.
- 평가 문구와 해설은 하단 `LessonFeedback` 오버레이가 담당한다. 정답은 `success`, 오답은 `warning` 톤온톤을 사용한다.
- 오버레이 배경은 레슨 shell 전체 너비다. 문구와 CTA는 헤더·본문과 같은 `max-w-2xl` 열과 같은 수평 패딩을 쓴다.
- 오버레이 CTA는 확인하기 버튼과 같은 하단 슬롯·같은 높이를 유지한다. 정답은 `계속하기` 하나, 오답은 `다시 시도` 아이콘 버튼과 `계속하기`를 둔다.
- 오답 `계속하기`는 `acceptIncorrect: true` 재제출로 다음 스텝으로 전진한다. 오답 `다시 시도`는 피드백을 닫고 같은 스텝을 다시 풀게 한다.

### 빈 상태

- 학습 홈의 빈 상태는 코스 선택으로 이어지는 단일 CTA를 제공한다.
- 빈 상태는 문제를 설명하기보다 다음 시작점을 제안한다.

### 테마 전환

- 프로필의 테마 전환은 3분할 segmented control이다.
- 옵션은 라이트, 다크, 시스템이다.
- 활성 상태는 `aria-pressed="true"`와 `data-pressed`로 검증하며, 색상은 `accent`와 `foreground` token을 사용한다.

## 어드민 패턴

### 화면 구조

- 모든 보호된 어드민 화면은 `AdminShell` 안에서 렌더링한다.
- 본문 상단에는 앱 전용 `AdminPageHeader`를 둔다.
- 조회 실패는 헤더 아래 `Alert role="alert"`로 표시한다.

### 목록 화면

- 필터는 native `GET` form 안에서 `Field`, `Input`, `Select`와 `Button`으로 조합한다.
- 목록은 `Card` 안의 공유 `Table`로 표시한다.
- 페이지네이션 메타는 섹션 heading 설명에 표시한다.
- 복원 가능한 검색·정렬·페이지 상태는 native GET form과 `Link`로 URL query에 보존하고 서버 조회에 사용한다.

### 지표 대시보드

- 주요 지표는 화면 폭에 따라 1·2·3열로 확장되는 metric card grid를 기본으로 한다.
- 분석의 제한된 핵심 추이는 Recharts 기반 구현을 사용할 수 있다.
- 매우 단순한 보조 막대는 CSS 또는 SVG로 표현할 수 있다.
- 분석 차트는 하나의 지연 로딩 client boundary와 공통 shell·tooltip token을 사용한다.
- 차트만으로 의미를 전달하지 않고 기간 합계, 라벨, 공통 데이터 표와 보조 설명을 함께 제공한다.
- 숫자는 `toLocaleString("ko-KR")`를 사용한다.

### 상태 pill

- 콘텐츠와 사용자 상태는 app-local `StatusBadge`가 Luma `Badge` variant로 표시한다.
- enum 값은 외부 계약이므로 `active`, `archived`, `suspended`, `deleted` 같은 영어 식별자를 유지할 수 있다.

### 위험 작업

- 보관과 삭제 요청은 확인 dialog를 거친다.
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
