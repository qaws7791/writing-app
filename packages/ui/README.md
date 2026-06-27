# `@workspace/ui`

`packages/ui`는 앱 공통 UI primitive, 아이콘, 스타일 entrypoint만 제공하는
도메인 비의존 패키지다. 라우팅, 인증, 앱 layout provider, 데이터 조회 같은
런타임 조립 책임은 각 앱에 둔다.

## 공개 entrypoint

현재 public export는 실제 파일이 있는 아래 경계만 유지한다.

| entrypoint                               | 책임                                                 |
| ---------------------------------------- | ---------------------------------------------------- |
| `@workspace/ui`                          | 공통 primitive와 `cn` helper를 한 번에 가져오는 집합 |
| `@workspace/ui/styles`                   | 앱 전역 CSS import                                   |
| `@workspace/ui/globals.css`              | `styles`와 같은 전역 CSS 호환 entrypoint             |
| `@workspace/ui/postcss.config`           | Tailwind/PostCSS 설정 공유                           |
| `@workspace/ui/lib/utils`                | `cn` helper                                          |
| `@workspace/ui/utils`                    | `cn` helper의 stable utility entrypoint              |
| `@workspace/ui/components/icons`         | 앱에서 반복 사용하는 공통 아이콘                     |
| `@workspace/ui/components/ui/{컴포넌트}` | shadcn/Base UI 기반 primitive                        |

## 스타일 구조

전역 스타일 entrypoint는 `@workspace/ui/styles`와 `@workspace/ui/globals.css`를 유지한다. 내부 구현은 `src/styles/tokens/` 아래에서 reference, semantic, typography, spacing, radius, elevation, motion, z-index, component token으로 나눈다.

새 공용 컴포넌트는 legacy 색상 이름보다 `bg-*`, `fg-*`, `action-*`, `success-*`, `danger-*`, `info-*` semantic token을 먼저 사용한다. `cream`, `surface`, `charcoal`, `primary`, `destructive`는 앱 이관이 끝날 때까지 유지하는 compatibility alias다.

## 현재 primitive

root entrypoint는 `Button`, `Card`, `Input`, `Select`, `Textarea`, `Progress`, `Accordion`, `DropdownMenu`, `AlertDialog`, `SegmentedControl`, `ToggleGroup`, `Surface`, `Field`, `Badge`, `Alert`, `Callout`, `StickyActionBar`, `RichText`, `ChoiceCard`, `ChoiceCardGroup`, `Spinner`, `Separator`, `Avatar`, `PageHeader`, `SectionHeader`, `StatCard`, `StatGrid`, `FilterToolbar`, `DataTable`, `EmptyState`와 `cn`을 노출한다. 큰 composite pattern은 실제 사용 사례와 test가 생길 때 별도 subpath로 추가한다.

## 사용 예시

앱 전역 CSS는 앱의 root stylesheet에서 가져온다.

```css
@import "@workspace/ui/styles";
```

화면 구현에서는 필요한 primitive와 아이콘을 명시적인 entrypoint에서 가져온다.

```tsx
import { BookOpenIcon } from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
```

간단한 화면에서는 root entrypoint를 사용할 수 있다.

```tsx
import { Button, Card, cn } from "@workspace/ui"
```

## import 규칙

앱과 도메인 패키지는 전역 규칙에 따라 absolute import를 사용한다. 다만
`src/components/ui` 아래의 shadcn/Base UI primitive 구현 파일은 생성 코드 관례와
colocation을 유지하기 위해 `../../lib/utils`, `./button` 같은 로컬 상대 import를
허용한다. 이 예외는 primitive 내부 구현에만 적용하며, 패키지 바깥 경계나 앱 feature
코드는 absolute import를 유지한다.
