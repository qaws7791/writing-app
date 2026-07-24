# SCR-007 프로필

## 구현 탐색

현재 route는 [학습자 앱 route source](../../../apps/web/src/app)에서 확인한다.

## 목적

학습자가 계정 정보와 학습 요약을 확인하고 표시 이름, 테마 또는 로그아웃을 관리한다.

## 주요 사용자

- 로그인한 학습자

## 정보 구조

- 프로필 avatar
- 이름
- 표시 이름 입력과 저장 버튼
- 가입일
- 완료한 레슨
- 연속 학습일
- 화면 테마 segmented control
- 로그아웃 버튼

## UI 기준

- avatar는 `action-selected-*`, `rounded-[3rem]`, `size-32`를 사용한다. Google 이미지가 없거나 로드에 실패하면 `✍️` fallback을 쓴다.
- 이름은 `text-[1.75rem] font-black`이다.
- 표시 이름 편집기는 현재 이름을 초깃값으로 사용하고 저장 중 중복 제출을 막는다.
- 학습 요약은 2열 `StatGrid`와 `StatCard layout="profile"` 타일이다. 카드는 `bg-surface`, `p-8`, 중앙 정렬, border 없음.
- 테마 전환은 라이트, 다크, 시스템 3분할 control이며 활성 옵션은 `action-selected-*`를 사용한다.
- 로그아웃은 `Button variant="destructive" size="extra"`를 사용한다.

## 상태

- 프로필 조회 성공
- 프로필 조회 실패
- 표시 이름 저장 중
- 표시 이름 저장 성공
- 표시 이름 저장 실패
- 테마 선택
- 로그아웃 진행

## 접근성

- 표시 이름 입력은 연결된 label과 필수 입력 의미를 제공한다.
- 저장 결과는 성공 시 `status`, 실패 시 `alert`로 보조 기술에 전달한다.
- 테마 버튼은 `aria-pressed`를 제공한다.
- 로그아웃 버튼은 native `button`이다.
- 날짜는 `YYYY.MM.DD` 형식으로 표시한다.
