# Astro UI 문서 실행 명세

`apps/ui`는 디자인 시스템의 실행 가능한 문서를 제공한다. 이 문서는 예제 작성과 자동 검증 정책을 소유한다.

## 정보 구조

- `/docs/getting-started`는 문서 탐색의 시작점이다.
- `/docs/foundations/*`는 Color, Typography, Spacing과 Motion을 설명한다.
- `/docs/components/*`는 공유 UI의 props, 지침, 접근성과 실행 가능한 예제를 제공한다.
- `/docs/extensions/*`는 workspace 전용 ThemeSelector와 lesson 컴포넌트를 제공한다.
- `/docs/patterns/*`와 `/docs/recipes/*`는 제품 화면 조합을 제공한다.
- `/docs/blocks`는 화면 단위 block 카탈로그를 제공한다. 개별 block은 문서 사이드바와 모바일 문서 메뉴에 두지 않으며, 전역 「블록」 진입과 이 페이지에서만 확인한다.
- `/preview/*`는 문서 shell과 분리된 반응형 예제와 interaction contract를 제공한다.

## 소유 경계

- `apps/ui/src/lib/docs-catalog.ts`는 문서 사이드바 탐색과 검색 항목을 소유한다. 문서 탐색에는 개별 block을 넣지 않는다.
- `apps/ui/src/lib/block-docs.ts`와 `/docs/blocks`는 block 카탈로그를 소유한다.
- `apps/ui/src/lib/design-system-inventory.json`은 이관한 모듈, 예제와 검증 계약의 완전한 대응을 소유한다.
- `apps/ui/src/pages/docs`는 설명 문서를 소유한다.
- `apps/ui/src/pages/preview`는 격리 실행 경로를 소유한다.
- `apps/ui/tests/design-system.spec.ts`는 렌더, 접근성과 상호작용 검증을 소유한다.
- `packages/shared/ui`는 UI·block·hook·utils·token의 단일 소스다.
- `packages/shared/ui/src/styles`는 공통 runtime token과 style을 소유한다.
- `apps/ui/src/styles/global.css`는 `@workspace/ui/styles`를 소비하고 문서 전용 color·radius preset과 layout utility만 소유한다.
- `packages/shared/ui`에는 문서 route나 fixture를 두지 않는다.
- `apps/ui`는 `@workspace/ui`를 소비하는 내부 문서 앱이며 외부 배포용 registry packaging을 소유하지 않는다.

## 작성 계약

- public component를 추가하거나 상태, variant 또는 상호작용을 바꾸면 같은 변경에서 관련 문서 예제를 갱신한다.
- token을 바꾸면 같은 변경에서 관련 Foundation 문서와 격리 예제를 갱신한다.
- 예제는 workspace 공개 Interface를 사용한다.
- 각 컴포넌트 문서는 props, 사용 지침과 접근성 설명을 제공한다.
- 사용자 상호작용 계약은 키보드, 초점, ARIA와 상태 전이를 관찰 가능한 결과로 검증한다.
- 모든 격리 예제는 light, dark, system theme와 full, reduced motion을 확인할 수 있어야 한다.

## 검증

```bash
bun --filter @workspace/ui-docs docs:validate
bun --filter @workspace/ui-docs test:browser
bun --filter @workspace/ui-docs build
```

`docs:validate`는 카탈로그와 이관 인벤토리의 완전성을 검사한다. `test:browser`는 실제 Astro 정적 build에서 렌더, axe와 상호작용 계약을 검사한다.
