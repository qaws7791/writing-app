# SCR-001 학습자 랜딩

## 라우트

- `apps/web`: `/`

## 목적

공개 방문자에게 글결의 학습 방식과 가치 제안을 보여주고 학습 시작 또는 코스 탐색으로 연결한다.

## 주요 사용자

- 처음 방문한 학습자
- 로그인하지 않은 재방문자

## 정보 구조

- 고정 상단 nav
- hero
- 주제 marquee
- 특징 섹션
- 시작 방법
- 지표
- 화면 미리보기
- 최종 CTA
- footer

## UI 기준

- 배경은 `cream`, 본문은 `charcoal`을 사용한다.
- hero H1은 큰 display type을 사용한다.
- 주요 CTA는 `bg-charcoal text-cream`, 보조 CTA는 `bg-surface`를 사용한다.
- 랜딩 장식 pebble과 marquee는 정보 전달을 방해하지 않아야 한다.
- 제품명은 `글결.`을 기준으로 한다. 현재 일부 코드의 `Kernel` 문구는 후속 정리 대상이다.

## 상태

- nav는 스크롤 시 반투명 cream 배경과 blur를 적용한다.
- CTA는 `/app` 또는 `/app/courses`로 이동한다.

## 접근성

- nav와 CTA는 native `button` 또는 `Link`로 구현한다.
- marquee는 장식이므로 `aria-hidden`을 유지한다.
- 미리보기 이미지는 한국어 alt를 제공한다.
