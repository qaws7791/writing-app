# ADR-0035: `@workspace/ui` 단일 소스와 내부 UI 문서

## 상태

채택됨

## 날짜

2026-08-12

## 맥락

ADR-0029는 `apps/ui`를 Astro 문서와 외부 shadcn registry의 단일 앱으로 두었다. registry source(`apps/ui/registry`)와 `packages/shared/ui`를 동기화하고 `public/r` JSON을 배포했다. writing-app은 외부 소비자에게 컴포넌트를 배포하지 않으며, 제품 앱은 이미 workspace 패키지 `@workspace/ui`만 소비한다. 이중 소스와 registry packaging은 유지 비용만 남긴다.

## 결정

- UI·block·hook·utils의 단일 소스는 `packages/shared/ui`(`@workspace/ui`)다.
- `apps/ui`는 내부 Astro 문서·미리보기·Playwright만 소유한다. 패키지명은 `@workspace/ui-docs`다.
- 외부 shadcn registry packaging, `apps/ui/registry`, `public/r`, `registry:build`·`registry:validate`·`source:validate`를 제거한다.
- 문서 예제와 소스 뷰어는 `@workspace/ui`를 직접 참조한다.

이 결정은 ADR-0029의 외부 registry packaging과 registry↔package 이중 소스 결정을 대체한다. ADR-0029의 Astro 문서·Playwright 검증 결정은 유지한다.

## 고려한 대안

### 대안 1. registry packaging만 제거하고 `apps/ui/registry` 유지

배포 산출물만 없애고 문서 소스는 registry 트리를 유지한다. 이중 소스와 sync validator가 남는다.

### 대안 2. `apps/ui` 문서 앱 자체 제거

검증 카탈로그와 접근성 browser contract가 사라진다. ADR-0029의 문서·검증 가치가 없어진다.

## 결과

- 개발자는 `bun run dev:ui`에서 `@workspace/ui` 기반 설명과 예제만 확인한다.
- 컴포넌트 변경은 `packages/shared/ui`에서 한 번만 한다.
- main 품질 gate의 `bun run test:ui-docs`는 유지한다.

## 관련 문서

- `docs/design/ui-documentation.md`
- `docs/design/components.md`
- `docs/engineering/testing.md`
- `apps/ui/package.json`
- `packages/shared/ui/package.json`
