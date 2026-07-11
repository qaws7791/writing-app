# ADR-0006: request nonce 기반 strict CSP

## 상태

채택됨

## 날짜

2026-07-12

## 맥락

두 Next.js 앱의 production `script-src`가 항상 `'unsafe-inline'`을 허용했다. request nonce는 Next framework script에 자동 적용할 수 있지만 모든 페이지를 동적 렌더링으로 전환해 랜딩의 정적 생성, CDN cache와 부분 사전 렌더링을 잃는다. build-time SRI는 정적 생성을 유지하지만 production 브라우저 측정에서 Next inline RSC bootstrap 20건을 차단해 단독으로 strict CSP를 충족하지 못했다.

## 결정

- production은 Proxy가 요청마다 UUID nonce를 만들고 Next가 framework·RSC script에 같은 nonce를 자동 적용한다. `script-src`는 self, nonce, `strict-dynamic`만 허용하고 `script-src-attr 'none'`을 강제한다.
- root layout은 `connection()`으로 동적 렌더링을 명시한다. 보안상 잘못 동작하는 정적 SRI 경로보다 정상 strict CSP를 우선한다.
- 개발 환경만 React 디버깅을 위해 script의 `'unsafe-inline'`과 `'unsafe-eval'`을 허용한다.
- React와 차트가 사용하는 style attribute는 조사 결과 현재 넓게 존재하므로 `style-src 'unsafe-inline'`은 유지한다. script 허용과 별도로 추적한다.
- `/api/csp-report`는 64KiB 이하 위반 보고서의 허용 필드만 구조화 로그로 기록한다.
- `CSP_REPORT_ONLY=true` 빌드는 같은 정책을 `Content-Security-Policy-Report-Only`로 제공한다. route별 위반이 0건임을 확인한 뒤 기본 enforcement 빌드로 승격한다.

## 결과와 trade-off

- inline script injection은 실행되지 않고 attribute event handler도 거부된다.
- 모든 HTML은 요청별 렌더링되므로 정적 HTML CDN cache를 사용하지 않는다. RSC 경계와 client bundle 분할은 유지한다.
- Next upgrade마다 production build와 브라우저 CSP 검증을 반복한다. SRI가 inline RSC bootstrap hash까지 안정적으로 제공하는 시점에 정적 경로 복귀를 재검토한다.

## rollout과 rollback

1. staging을 `CSP_REPORT_ONLY=true`로 배포하고 `csp_violation` 로그를 directive·route·브라우저별로 분류한다.
2. framework script, font, image와 API 연결 위반을 해결하고 주요 route Playwright 검증을 통과시킨다.
3. `CSP_REPORT_ONLY=false`로 enforcement를 배포한다.
4. 회귀가 발생하면 코드 되돌림 없이 `CSP_REPORT_ONLY=true`로 다시 배포하고 위반 로그로 원인을 확인한다. `'unsafe-inline'`을 production에 다시 추가하지 않는다.
