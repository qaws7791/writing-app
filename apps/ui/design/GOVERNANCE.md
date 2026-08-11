# Luma UI Governance

Public API, design token, dependency, release, deprecation 또는 breaking change를 다룰 때 `DESIGN.md`와 `design/COMPONENTS.md`에 더해 이 문서를 읽는다. 이 문서는 제품 미감이 아니라 시스템을 일관되게 변경하는 방법을 정의한다.

## 1. System Architecture

공유 UI는 다음 계층을 구분한다.

1. **Foundations** — color, typography, space, radius, motion, z-index와 density token
2. **Primitives** — button, input, selection과 overlay처럼 semantic과 접근성 동작의 최소 단위
3. **Composites** — 여러 primitive가 결합된 search, date picker와 command menu
4. **Patterns** — empty state, filter bar, settings row와 data toolbar처럼 반복되는 문제 해결 방식
5. **Blocks** — 시작부터 완료·실패·복구까지 실제 flow를 보여주는 page 수준 조합

- 기능이 같은데 외형만 다른 component를 새 item으로 늘리지 않는다.
- 한 번만 쓰이는 요구는 local composition이나 block에서 먼저 검증한다.
- 새 primitive나 pattern은 최소 두 개의 실제 사용 사례와 적용 가능한 전체 state를 통과한 뒤 core로 승격한다.
- 추상화 수준이 다르면 이름과 documentation에서 그 차이를 드러낸다.

## 2. Token Source of Truth

- `packages/shared/ui/src/styles/tokens`와 `packages/shared/ui/src/styles/globals.css`가 runtime token의 단일 원천이다.
- `apps/ui/src/styles/global.css`는 `@workspace/ui/styles`를 소비하고 문서 전용 preset만 소유한다.
- Documentation table은 패키지 token의 산출물이며 독립적으로 다른 값을 유지하지 않는다.
- Component 내부에서 raw hex, 임의 spacing, 개별 duration, ad-hoc z-index와 고정 shadow를 반복하지 않는다.
- 필수 범주는 color와 semantic state, typography, spacing과 density, radius와 surface, border와 elevation, motion, z-index와 scrim, focus와 selection, container adaptation이다.
- Token 이름 변경, 의미 변경과 삭제는 시각 수정이 아니라 public contract 변경으로 취급한다.
- 광학 보정이나 외부 제약 때문에 예외 값이 필요하면 scope와 이유를 가까운 code 또는 documentation에 남긴다.

## 3. Primitive Base

Luma primitive는 Base UI 기반을 명시한다.

- Base UI, Radix 또는 React Aria 지원은 실제 implementation과 test가 있을 때만 선언한다.
- 여러 base를 지원한다면 공통 API뿐 아니라 focus, portal, dismissal, form, keyboard, animation과 state selector 차이를 각각 검증한다.
- 한 base에서만 제공되는 behavior를 모든 base의 공통 계약처럼 문서화하지 않는다.
- Base 변경은 component별 behavior difference, migration note와 manual verification 목록을 남기며 점진적으로 수행한다.
- 기존 프로젝트가 동작한다면 단순히 새 default를 따르기 위해 primitive base를 일괄 교체하지 않는다.

## 4. Source Ownership

- UI·block·hook·utils의 단일 소스는 `packages/shared/ui`다.
- `apps/ui`는 `@workspace/ui`를 소비하는 내부 문서 앱이다.
- 외부 shadcn registry packaging과 이중 소스를 두지 않는다.

## 5. Public API Governance

- Public API는 visual implementation보다 사용자 의도와 behavior를 표현한다.
- `tone="danger"`, `emphasis="primary"`처럼 의미 있는 variant를 우선하고 임의의 `shadow="xl"`, `radius="27"`, raw color prop으로 system을 우회하지 않는다.
- Boolean prop을 늘리기보다 composable slot, 명확한 state와 기존 platform semantic을 사용한다.
- `data-slot`, `data-state`, `data-variant`, `data-size`는 styling hook이자 public contract이므로 일관되게 관리한다.
- Controlled와 uncontrolled mode, event 순서, reset, form submission, focus management, portal, scroll lock, typeahead와 direction-key behavior를 적용 범위에 맞게 문서화한다.
- External class override가 접근성, required layout와 behavior를 깨뜨리지 않게 한다.

다음 변경은 외형 변경보다 큰 breaking change일 수 있다.

- export 이름 변경 또는 제거
- required prop 추가
- default behavior 변경
- focus·keyboard·ARIA contract 변경
- token 이름 또는 의미 변경

## 6. Change Checklist

- Public API와 visual contract가 문서와 예제에 반영되었는가.
- 관련 Foundation·component·block 문서가 같은 변경에서 갱신되었는가.
- 접근성·키보드·상태 전이가 browser contract로 검증되었는가.
- 제품 앱이 깨지지 않도록 import 경로와 export가 유지되었는가.
