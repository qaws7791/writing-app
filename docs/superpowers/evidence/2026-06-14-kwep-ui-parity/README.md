# Kwep UI 1:1 비교 증거

## 랜딩 화면

- 기준 화면: Kwep `/`
- 제품 화면: `/`
- 비교 뷰포트: `390x844`, `1280x720`
- 캡처 스크립트: `landing/capture-landing.mjs`
- 최종 캡처:
  - `landing/kwep-390x844.png`
  - `landing/product-390x844.png`
  - `landing/kwep-390x844-full.png`
  - `landing/product-390x844-full.png`
  - `landing/kwep-1280x720.png`
  - `landing/product-1280x720.png`
  - `landing/kwep-1280x720-full.png`
  - `landing/product-1280x720-full.png`
- 최종 인벤토리:
  - `landing/kwep-390x844-inventory.json`
  - `landing/product-390x844-inventory.json`
  - `landing/kwep-1280x720-inventory.json`
  - `landing/product-1280x720-inventory.json`

Kwep 런타임의 `next-themes` 초기화 스크립트 래퍼 1개를 제외하면, 랜딩 첫 화면의 핵심 HTML 요소, class, computed style, 좌표가 제품과 일치한다.
움직이는 원형 배경과 marquee는 캡처 시점에 따라 프레임 차이가 생길 수 있으므로, 정적 구조와 애니메이션 정의를 함께 확인한다.

## 로그인 화면

- 기준 화면: Kwep `/login`
- 제품 화면: `/login`
- 비교 뷰포트: `390x844`, `1280x720`
- 캡처 스크립트: `login/capture-login.mjs`
- 최종 캡처:
  - `login/kwep-390x844.png`
  - `login/product-390x844.png`
  - `login/kwep-1280x720.png`
  - `login/product-1280x720.png`
- 최종 인벤토리:
  - `login/kwep-390x844-inventory.json`
  - `login/product-390x844-inventory.json`
  - `login/kwep-1280x720-inventory.json`
  - `login/product-1280x720-inventory.json`

Kwep 런타임의 `next-themes` 초기화 스크립트 래퍼 1개를 제외하면, 로그인 화면의 실제 요소 13개는 390x844와 1280x720 모두 tag, text, class, rect, computed style diff가 0이다.
