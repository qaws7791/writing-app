# SCR-007 프로필

## 라우트

- `apps/web`: `/app/profile`

## 목적

학습자가 계정 정보와 학습 요약을 확인하고 테마 또는 로그아웃을 관리한다.

## 주요 사용자

- 로그인한 학습자

## 정보 구조

- 프로필 avatar
- 이름
- 가입일
- 완료한 레슨
- 연속 학습일
- 화면 테마 segmented control
- 로그아웃 버튼

## UI 기준

- avatar는 `bg-accent`, `rounded-[3rem]`, `size-32`를 사용한다. 이미지가 없으면 `✍️` fallback을 쓴다.
- 이름은 `text-[1.75rem] font-black`이다.
- 학습 요약은 2열 `StatGrid`와 `StatCard layout="profile"` 타일이다. 카드는 `bg-surface`, `p-8`, 중앙 정렬, border 없음.
- 테마 전환은 라이트, 다크, 시스템 3분할 control이며 활성 옵션은 `bg-accent text-charcoal`이다.
- 로그아웃은 `Button variant="destructive" size="extra"`를 사용한다.

## 상태

- 프로필 조회 성공
- 프로필 조회 실패
- 테마 선택
- 로그아웃 진행

## 접근성

- 테마 버튼은 `aria-pressed`를 제공한다.
- 로그아웃 버튼은 native `button`이다.
- 날짜는 `YYYY.MM.DD` 형식으로 표시한다.
