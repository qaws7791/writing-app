# 검증 게이트 복구 계획

## 문서 상태

- 작성일: 2026-07-29
- 보관일: 2026-07-29
- 상태: 완료
- 기준 commit: `b7f4f704d28680cb3b6fbb27b96fd3e9d17daf10`
- 검증 결과: [validation-report.md](./validation-report.md)

## 목표

코스 검색 제거 구현은 바꾸지 않고, 해당 작업의 브라우저 검증을 막은 공통 기반 결함만 복구한다.

## 확인된 원인

- 공유 UI와 Storybook이 서로 다른 `@base-ui/react` 설치를 해석해 Storybook에서 React hook 오류가 발생한다.
- 인증 E2E의 비밀번호 locator가 input과 비밀번호 표시 button을 함께 선택한다.
- 앱의 request nonce가 Base UI CSP context에 전달되지 않아 Tabs hydration 전 inline script가 strict CSP에 차단된다.

## 구현 범위

1. root catalog에 lockfile 기준 Base UI exact version을 등록하고 공유 UI와 Storybook이 `catalog:`로 직접 선언한다.
2. 공유 UI에 Base UI `CSPProvider`를 감싼 `UiCspProvider` 공개 subpath를 추가하고 web·admin root UI subtree에 request nonce를 전달한다.
3. 인증 E2E의 비밀번호 input locator에 exact accessible-name 일치를 적용한다.
4. Tabs SSR 결과의 inline script가 provider nonce를 받는 보안 회귀 테스트를 추가한다.
5. 전체 audit에서 추가로 발견된 HIGH 취약점은 직접 소유 dependency의 수정 버전 또는 검증된 최소 override로 제거한다.

검색 제거 코드, 제품 API, URL, DB schema, Tabs의 hydration 전 indicator 렌더링과 CSP 정책 완화는 범위에서 제외한다.

## 검증

- 일반 설치와 frozen 설치 뒤 공유 UI·Storybook의 Base UI 해석 경로와 version을 확인한다.
- 공유 UI test, Storybook test·build, PR E2E와 Chromium·WebKit release E2E를 실행한다.
- dependency, architecture, Knip, audit, 정적 검사, 전체 test·build와 pre-commit gate를 실행한다.
- 결과에는 기준 commit, 실행 시각·환경, 명령과 artifact 위치를 기록한다.

## 완료 조건

- 공유 UI와 Storybook이 동일한 Base UI 1.6.0을 결정적으로 해석한다.
- web·admin의 Base UI inline script가 request nonce를 받는다.
- 인증 E2E에서 비밀번호 input이 단일 요소로 선택되고 브라우저 console 오류가 없다.
- 전체 필수 검증이 통과하면 이 작업과 코스 검색 제거 작업을 각각 같은 이름의 `docs/archive` 디렉터리로 이동한다.

모든 완료 조건을 충족했다. 구현 과정에서 발견한 Orval의 `js-yaml` 취약점은 수정 버전으로 갱신했고, 최신 LHCI가 아직 안전한 `tmp` 범위를 선언하지 않아 root override로 0.2.7을 고정했다. 이는 새 정책이 아니라 기존 audit 기준을 만족시키기 위한 의존성 복구다.
