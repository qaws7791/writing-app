# ADR-0029: Astro UI 문서와 registry 통합

## 상태

대체됨 — ADR-0035가 외부 registry packaging과 registry↔package 이중 소스를 폐기한다. Astro 문서·Playwright 검증 결정은 유지한다.

## 날짜

2026-08-09

## 맥락

디자인 시스템 설명, 실행 예제와 browser 검증은 별도 Storybook 앱에 있었다. Luma 원본을 가져온 `apps/ui`는 Astro 문서와 shadcn registry를 이미 제공했다. 두 앱을 유지하면 카탈로그, 스타일 build, fixture와 검증 경로가 중복된다.

## 결정

- `apps/ui`를 디자인 시스템 문서와 shadcn registry의 단일 앱으로 사용한다.
- 기존 39개 모듈, 154개 예제, 35개 자동 검증 모듈, 9개 상호작용 계약과 2개 MDX 설명의 대응을 `design-system-inventory.json`에 보존한다.
- component, lesson extension, Foundation, Pattern, Recipe와 Quality 설명을 Astro route로 제공한다.
- 격리 preview는 지정 viewport, light·dark·system theme와 full·reduced motion을 제공한다.
- Playwright는 실제 Astro 정적 build에서 렌더, axe와 상호작용 계약을 검증한다.
- source validator는 registry source와 `packages/shared/ui` 공개 source의 동기화를 검증한다.
- `apps/storybook`, 전용 dependency, root script와 CI 참조를 제거한다.

이 결정은 ADR-0002의 실행 가능한 카탈로그와 검증 도구 결정을 대체한다. 이 결정은 ADR-0003의 lesson 시각 fixture 실행 위치를 대체한다.

## 고려한 대안

### 대안 1. 두 앱 유지

두 앱은 기존 실행 방식을 보존한다. 두 앱은 예제와 검증 계약의 drift를 계속 만든다.

### 대안 2. Astro 문서에는 링크만 제공

링크 방식은 이관량을 줄인다. 링크 방식은 별도 runtime과 중복 dependency를 제거하지 못한다.

## 결과

- 개발자는 `bun run dev:ui`에서 설명, 예제와 registry를 함께 확인한다.
- main 품질 gate는 `bun run test:ui-docs`로 UI browser contract를 검사한다.
- 새 public component와 token 변경은 Astro UI 문서와 browser contract를 함께 갱신한다.

## 관련 문서

- `docs/design/ui-documentation.md`
- `docs/engineering/testing.md`
- `apps/ui/package.json`
