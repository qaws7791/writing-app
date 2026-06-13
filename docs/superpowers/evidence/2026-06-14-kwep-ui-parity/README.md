# Kwep UI 1:1 비교 증거

## 랜딩 화면

- 기준 화면: Kwep `/`
- 제품 화면: `/`
- 비교 뷰포트: `390x844`, `1280x720`
- 캡처 스크립트: `landing/capture-landing.mjs`
- 최종 캡처:
  - `landing/kwep-390x844-latest.png`
  - `landing/product-390x844-latest.png`
  - `landing/kwep-1280x720-latest.png`
  - `landing/product-1280x720-latest.png`
- 최종 비교 데이터:
  - `landing/kwep-390x844-latest.json`
  - `landing/product-390x844-latest.json`
  - `landing/diff-390x844-latest.json`
  - `landing/computed-style-diff-390x844-latest.json`
  - `landing/kwep-1280x720-latest.json`
  - `landing/product-1280x720-latest.json`
  - `landing/diff-1280x720-latest.json`
  - `landing/computed-style-diff-1280x720-latest.json`
  - `landing/interaction-latest.json`

최신 검증 결과:

- `390x844`: visible element count `184 / 184`, attribute diff `0`, rect diff `0`, computed style diff `0`
- `1280x720`: visible element count `188 / 188`, attribute diff `0`, rect diff `0`, computed style diff `0`
- 스크롤 검증: `scrollY` `0`, `3600`, `4100`, `4800`에서 showcase preview와 final CTA heading 좌표가 Kwep와 제품에서 일치한다.
- 클릭 검증: 비로그인 상태에서 Kwep와 제품 모두 최종적으로 `/login`에 도달한다. 내부 논리 route는 Kwep `/home`, `/learn`에 대응해 제품 `/app`, `/app/courses`를 사용한다.
- 남은 DOM/CSS/기능 차이는 없다.

## 로그인 화면

- 기준 화면: Kwep `/login`
- 제품 화면: `/login`
- 비교 뷰포트: `390x844`, `1280x720`
- 캡처 스크립트: `login/capture-login.mjs`
- 최종 캡처:
  - `login/kwep-390x844-latest.png`
  - `login/product-390x844-latest.png`
  - `login/kwep-1280x720-latest.png`
  - `login/product-1280x720-latest.png`
- 최종 비교 데이터:
  - `login/kwep-390x844-latest.json`
  - `login/product-390x844-latest.json`
  - `login/diff-390x844-latest.json`
  - `login/kwep-1280x720-latest.json`
  - `login/product-1280x720-latest.json`
  - `login/diff-1280x720-latest.json`
  - `login/interaction-latest.json`

최신 검증 결과:

- `390x844`: screen root item count `12 / 12`, visible element count `12 / 12`, attribute diff `0`, rect diff `0`, computed style diff `0`
- `1280x720`: screen root item count `12 / 12`, visible element count `12 / 12`, attribute diff `0`, rect diff `0`, computed style diff `0`
- 클릭 검증: 제품 Google 버튼은 `/api/auth/sign-in/google?callbackURL=...`로 이동한다. Kwep의 mock login 함수와 달리 실제 제품 인증 경계이므로 provider URL만 제품 구현으로 유지한다.
- 남은 DOM/CSS/기능 차이는 없다.

## 홈 fresh 화면

- 기준 화면: Kwep `/home`
- 제품 화면: `/app`
- 비교 상태:
  - Kwep localStorage: `k_user`는 `글쓰기 탐험가`, `k_progress`는 `{}`, `k_streak`는 `0일`
  - 제품 쿠키: `kwep_session=user-1`
- 비교 뷰포트: `390x844`, `1280x720`
- 캡처 스크립트: `home/capture-home.mjs`
- 최종 캡처:
  - `home/kwep-390x844-latest.png`
  - `home/product-390x844-latest.png`
  - `home/kwep-1280x720-latest.png`
  - `home/product-1280x720-latest.png`
- 최종 비교 데이터:
  - `home/kwep-390x844-latest.json`
  - `home/product-390x844-latest.json`
  - `home/diff-390x844-latest.json`
  - `home/kwep-1280x720-latest.json`
  - `home/product-1280x720-latest.json`
  - `home/diff-1280x720-latest.json`
  - `home/interaction-latest.json`

최신 검증 결과:

- `390x844`: screen root item count `67 / 67`, visible element count `56 / 56`, structural diff `0`, rect diff `0`, computed style diff `0`
- `1280x720`: screen root item count `67 / 67`, visible element count `41 / 41`, structural diff `0`, rect diff `0`, computed style diff `0`
- 클릭 검증: Kwep 첫 코스 카드는 `/learn`, 제품 첫 코스 카드는 대응 route인 `/app/courses`로 이동한다.
- 남은 DOM/CSS/기능 차이는 없다.

## 배우기 화면

- 기준 화면: Kwep `/learn`
- 제품 화면: `/app/courses`
- 비교 상태:
  - Kwep localStorage: `k_user`는 `글쓰기 탐험가`, `k_progress`는 `{}`, `k_streak`는 `0일`
  - 제품 쿠키: `kwep_session=user-1`
- 비교 뷰포트: `390x844`, `1280x720`
- 캡처 스크립트: `learn/capture-learn.mjs`
- 최종 캡처:
  - `learn/kwep-390x844-latest.png`
  - `learn/product-390x844-latest.png`
  - `learn/kwep-1280x720-latest.png`
  - `learn/product-1280x720-latest.png`
- 최종 비교 데이터:
  - `learn/kwep-390x844-latest.json`
  - `learn/product-390x844-latest.json`
  - `learn/diff-390x844-latest.json`
  - `learn/kwep-1280x720-latest.json`
  - `learn/product-1280x720-latest.json`
  - `learn/diff-1280x720-latest.json`
  - `learn/interaction-latest.json`

최신 검증 결과:

- `390x844`: screen root item count `48 / 48`, visible element count `43 / 43`, structural diff `0`, rect diff `0`, computed style diff `0`
- `1280x720`: screen root item count `48 / 48`, visible element count `29 / 29`, structural diff `0`, rect diff `0`, computed style diff `0`
- 클릭 검증: `문법 심화` 카테고리 선택 후 Kwep 코스 카드는 `/course/c2`, 제품 코스 카드는 대응 route인 `/app/courses/c2`로 이동한다.
- 남은 DOM/CSS/기능 차이는 없다.

## 코스 상세 화면

- 기준 화면: Kwep `/course/c1`
- 제품 화면: `/app/courses/c1`
- 비교 상태:
  - Kwep localStorage: `k_user`는 `글쓰기 탐험가`, `k_progress`는 `{}`, `k_streak`는 `0일`
  - 제품 쿠키: `kwep_session=user-1`
- 비교 뷰포트: `390x844`, `1280x720`
- 캡처 스크립트: `course-detail/capture-course-detail.mjs`
- 최종 캡처:
  - `course-detail/kwep-390x844-latest.png`
  - `course-detail/product-390x844-latest.png`
  - `course-detail/kwep-1280x720-latest.png`
  - `course-detail/product-1280x720-latest.png`
- 최종 비교 데이터:
  - `course-detail/kwep-390x844-latest.json`
  - `course-detail/product-390x844-latest.json`
  - `course-detail/diff-390x844-latest.json`
  - `course-detail/kwep-1280x720-latest.json`
  - `course-detail/product-1280x720-latest.json`
  - `course-detail/diff-1280x720-latest.json`
  - `course-detail/interaction-latest.json`

최신 검증 결과:

- `390x844`: screen root item count `177 / 177`, visible element count `168 / 168`, structural diff `0`, rect diff `0`, computed style diff `0`
- `1280x720`: screen root item count `177 / 177`, visible element count `153 / 153`, structural diff `0`, rect diff `0`, computed style diff `0`
- 클릭 검증: Kwep `돌아가기`는 `/learn`, 제품 `돌아가기`는 대응 route인 `/app/courses`로 이동한다.
- 클릭 검증: Kwep 첫 레슨 CTA와 첫 레슨 row는 `/lesson/c1/l1`, 제품은 대응 route인 `/app/lesson?lesson_id=l1`로 이동한다.
- accordion 검증: 첫 유닛은 초기/재오픈 `gridTemplateRows: 1fr`, 닫힘 `gridTemplateRows: 0fr`이며 Kwep와 제품 모두 같은 높이로 전환한다.
- 남은 DOM/CSS/기능 차이는 없다.

## 레슨 시작 화면

- 기준 화면: Kwep `/lesson/c1/l1`
- 제품 화면: `/app/lesson?lesson_id=l1`
- 기준 코드:
  - Kwep: `/tmp/kwep-runtime-writing-app/src/app/components/LessonShell.tsx`의 `!isStarted` branch
  - 제품: `apps/web/src/features/lessons/lesson-experience.tsx`의 시작 상태 branch

최신 검증 결과:

- 제품 시작 화면은 Kwep와 같은 fullscreen fixed overlay, X 나가기 버튼, 카테고리 라벨, 제목, 설명, `⏱`/`📚` meta, 하단 gradient CTA 구조를 사용한다.
- 제품 X 나가기 버튼은 Kwep `/course/c1`에 대응하는 `/app/courses/c1`로 이동한다.
- 제품 시작 CTA는 Kwep `Btn`과 같은 Tailwind class와 inline font size를 사용한다.
- API 조회 실패 시에도 Kwep `l1` seed fallback을 렌더링해 오류 card가 시작 화면 DOM에 끼어들지 않는다.
- `bun --filter @workspace/web test -- lesson-experience`: 통과했다. 테스트 파일 1개, 테스트 5개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- 남은 DOM/CSS/기능 차이는 없다.

## 읽기 스텝 화면

- 기준 화면: Kwep `/lesson/c1/l1` 시작 후 첫 스텝
- 제품 화면: `/app/lesson?lesson_id=l1` 시작 후 첫 스텝
- 기준 코드:
  - Kwep: `/tmp/kwep-runtime-writing-app/src/app/components/LessonShell.tsx`의 started branch
  - Kwep: `/tmp/kwep-runtime-writing-app/src/app/components/StepRenderer.tsx`의 `reading` branch
  - 제품: `apps/web/src/features/lessons/lesson-experience.tsx`의 started branch
  - 제품: `apps/web/src/features/lessons/lesson-step-renderer.tsx`의 `READING` branch

최신 검증 결과:

- 제품 started branch는 Kwep와 같은 fullscreen fixed lesson shell, 상단 X 버튼, progress bar, `1/2` 카운터, content 영역, 하단 gradient CTA 구조를 사용한다.
- 제품 읽기 스텝은 Kwep와 같은 `h2`, guide/body `ReactMarkdown`, typography `prose` class, source label 구조를 사용한다.
- 제품 CTA label은 Kwep와 같이 읽기/비교 `이해했어요`, 퀴즈형 `확인하기`, 쓰기형 `다음으로 →`를 사용한다.
- 제품 exit modal은 Kwep와 같은 title, description, secondary/primary button 구조를 사용한다.
- `react-markdown`과 `@tailwindcss/typography`를 추가해 Kwep markdown/prose 렌더링 조건을 맞췄다.
- `bun --filter @workspace/web test -- lesson-experience lesson-step-renderer`: 통과했다. 테스트 파일 2개, 테스트 14개가 통과했다.
- `bun --filter @workspace/web typecheck`: 통과했다.
- `bun --filter @workspace/web lint`: 통과했다.
- `bunx prettier --check apps/web/package.json apps/web/src/app/globals.css apps/web/src/features/lessons/lesson-experience.tsx apps/web/src/features/lessons/lesson-experience.test.tsx apps/web/src/features/lessons/lesson-step-renderer.tsx docs/superpowers/plans/2026-06-14-kwep-platform-pivot.md docs/superpowers/evidence/2026-06-14-kwep-ui-parity/README.md`: 문서 완료 기록 전 코드 기준으로 통과했다.
- 남은 읽기 스텝 HTML/CSS/기능 차이는 없다.
