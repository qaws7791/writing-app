# Luma Registry Governance

Public API, design token, registry 구조, dependency, release, deprecation 또는 breaking change를 다룰 때 `DESIGN.md`와 `design/COMPONENTS.md`에 더해 이 문서를 읽는다. 이 문서는 제품 미감이 아니라 시스템을 일관되게 배포하고 변경하는 방법을 정의한다.

## 1. System Architecture

Registry는 다음 계층을 구분한다.

1. **Foundations** — color, typography, space, radius, motion, z-index와 density token
2. **Primitives** — button, input, selection과 overlay처럼 semantic과 접근성 동작의 최소 단위
3. **Composites** — 여러 primitive가 결합된 search, date picker와 command menu
4. **Patterns** — empty state, filter bar, settings row와 data toolbar처럼 반복되는 문제 해결 방식
5. **Blocks** — 시작부터 완료·실패·복구까지 실제 flow를 보여주는 page 수준 조합

- 기능이 같은데 외형만 다른 component를 새 item으로 늘리지 않는다.
- 한 번만 쓰이는 요구는 local composition이나 block에서 먼저 검증한다.
- 새 primitive나 pattern은 최소 두 개의 실제 사용 사례와 적용 가능한 전체 state를 통과한 뒤 core로 승격한다.
- 추상화 수준이 다르면 이름, item type과 documentation에서 그 차이를 드러낸다.

## 2. Token Source of Truth

- Token은 code와 design tool이 공유할 수 있는 직렬화 가능한 원본을 source of truth로 관리한다.
- Generated CSS, theme payload와 documentation table은 원본 token의 산출물이며 독립적으로 다른 값을 유지하지 않는다.
- Component 내부에서 raw hex, 임의 spacing, 개별 duration, ad-hoc z-index와 고정 shadow를 반복하지 않는다.
- 필수 범주는 color와 semantic state, typography, spacing과 density, radius와 surface, border와 elevation, motion, z-index와 scrim, focus와 selection, container adaptation이다.
- Token 이름 변경, 의미 변경과 삭제는 시각 수정이 아니라 public contract 변경으로 취급한다.
- 광학 보정이나 외부 제약 때문에 예외 값이 필요하면 scope와 이유를 가까운 code 또는 documentation에 남긴다.

## 3. Primitive Base

Luma의 `registry:base`는 Base UI 기반을 명시한다. 소비자 프로젝트의 암묵적 shadcn 기본값에 의존하지 않는다.

- Base UI, Radix 또는 React Aria 지원은 실제 implementation과 test가 있을 때만 선언한다.
- 여러 base를 지원한다면 공통 API뿐 아니라 focus, portal, dismissal, form, keyboard, animation과 state selector 차이를 각각 검증한다.
- 한 base에서만 제공되는 behavior를 모든 base의 공통 계약처럼 문서화하지 않는다.
- Base 변경은 component별 behavior difference, migration note와 manual verification 목록을 남기며 점진적으로 수행한다.
- 기존 프로젝트가 동작한다면 단순히 새 default를 따르기 위해 primitive base를 일괄 교체하지 않는다.

## 4. Registry Structure

- Root `registry.json`은 registry metadata와 `include` 구성을 소유한다.
- Included registry는 foundations, UI, hooks, components와 blocks처럼 유지보수 경계에 따라 나눈다.
- 모든 include path는 명시적인 `registry.json`을 가리키며 전체 resolved registry에서 item name은 유일해야 한다.
- Item과 file에는 목적에 맞는 `registry:base`, `registry:ui`, `registry:component`, `registry:block`, `registry:hook`, `registry:lib`, `registry:style`, `registry:theme`, `registry:page` 또는 `registry:file` type을 사용한다.
- Consumer의 `components.json`을 존중해야 하는 target에는 `@ui/`, `@components/`, `@lib/`, `@hooks/` placeholder를 사용한다.
- `registry:page`와 `registry:file`처럼 명시적 위치가 필요한 file에는 안전하고 재현 가능한 target을 지정한다.
- 외부 GitHub registry dependency의 재현성이 필요하면 tag 또는 full commit SHA를 사용한다.
- Built output인 `public/r`은 source registry에서 생성한다. 생성 산출물을 별도의 source of truth로 운영하지 않는다.

## 5. Public API Governance

- Public API는 visual implementation보다 사용자 의도와 behavior를 표현한다.
- `tone="danger"`, `emphasis="primary"`처럼 의미 있는 variant를 우선하고 임의의 `shadow="xl"`, `radius="27"`, raw color prop으로 system을 우회하지 않는다.
- Boolean prop을 늘리기보다 composable slot, 명확한 state와 기존 platform semantic을 사용한다.
- `data-slot`, `data-state`, `data-variant`, `data-size`는 styling hook이자 public contract이므로 일관되게 관리한다.
- Controlled와 uncontrolled mode, event 순서, reset, form submission, focus management, portal, scroll lock, typeahead와 direction-key behavior를 적용 범위에 맞게 문서화한다.
- External class override가 접근성, required layout와 behavior를 깨뜨리지 않게 한다.

다음 변경은 외형 변경보다 큰 breaking change일 수 있다.

- Export 또는 component anatomy와 slot 제거·변경
- Keyboard, focus, dismissal와 form behavior 변경
- HTML semantic, ARIA relationship와 state model 변경
- Token 이름 또는 의미 변경
- Install target, dependency와 primitive base 변경

## 6. Versioning & Lifecycle

- Semantic versioning, changelog와 migration note를 제공한다.
- Breaking change에는 영향받는 item, 변경 전후 API, 자동·수동 migration 절차와 확인 목록을 포함한다.
- Deprecation은 replacement와 종료 시점을 알리고 가능한 기간 동안 warning과 호환 경로를 제공한다.
- 새 pattern은 실제 사용 사례와 stress fixture에서 검증한 뒤 `local → block/pattern → core` 순으로 승격한다.
- 사용되지 않거나 중복된 API는 영구 유지하지 않는다. usage와 migration cost를 확인한 뒤 deprecate한다.
- 중요한 system change에는 owner, reviewer, 결정 근거와 rollback 조건을 기록한다.

## 7. Validation & Release

Source registry는 publish 전에 다음을 통과해야 한다.

- Formatting, lint, TypeScript check와 production build
- `shadcn registry validate`를 통한 schema, duplicate name, include와 local file path 검사
- Static registry output 재생성과 source item의 일치 확인
- Documentation과 preview가 배포 item의 실제 API를 사용하는지 확인
- 선언한 primitive base에서 keyboard, focus, form과 overlay behavior 검증
- Light/dark, density, long content, loading, error와 accessibility matrix 검증
- Dependency와 install target의 재현성 확인

Release 기록에는 수행한 검증, 제외한 환경, known limitation과 migration 필요 여부를 남긴다. CI가 통과했다는 사실만으로 manual interaction과 accessibility 검증을 대체하지 않는다.

## 8. Release Checklist

- Item type, file type와 target이 설치 의도와 일치하는가.
- Dependency와 registry dependency가 재현 가능한가.
- Base item과 token 변경이 모든 consumer item에 미치는 영향을 검토했는가.
- Public API, semantic, keyboard와 state 변경을 분류했는가.
- Changelog, migration과 deprecation 정보가 필요한가.
- Preview가 empty, typical, stress와 recovery state를 실제 API로 보여주는가.
- Build output이 source registry에서 다시 생성 가능한가.
- 변경을 되돌릴 조건과 방법이 있는가.

## Upstream References

Schema와 CLI behavior는 version-sensitive하므로 관련 변경 전에 공식 문서를 다시 확인한다.

- [registry.json schema](https://ui.shadcn.com/docs/registry/registry-json)
- [registry-item.json schema](https://ui.shadcn.com/docs/registry/registry-item-json)
- [Registry Include and Validate](https://ui.shadcn.com/docs/changelog/2026-05-registry-include)
- [Base UI as the Default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default)
- [shadcn changelog](https://ui.shadcn.com/docs/changelog)
