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
