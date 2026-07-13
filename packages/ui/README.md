# `@workspace/ui`

`packages/ui`는 앱 공통 UI primitive, 아이콘, 스타일 entrypoint만 제공하는
도메인 비의존 패키지다. 라우팅, 인증, 앱 layout provider, 데이터 조회 같은
런타임 조립 책임은 각 앱에 둔다.

## 공개 entrypoint

현재 public export는 실제 파일이 있는 아래 경계만 유지한다.

| entrypoint                               | 책임                              |
| ---------------------------------------- | --------------------------------- |
| `@workspace/ui/styles`                   | 공통 token과 style Implementation |
| `@workspace/ui/lib/utils`                | `cn` helper                       |
| `@workspace/ui/components/icons`         | 앱에서 반복 사용하는 공통 아이콘  |
| `@workspace/ui/components/ui/{컴포넌트}` | shadcn/Base UI 기반 primitive     |

## 스타일 구조

전역 스타일 entrypoint는 `@workspace/ui/styles`를 사용한다. 내부 구현은 `src/styles/tokens/` 아래에서 reference, semantic, typography, spacing, radius, elevation, motion, z-index, component token으로 나눈다. Tailwind import, plugin, source scan, PostCSS 설정은 이 패키지가 아니라 각 앱 Adapter가 소유한다.

새 공용 컴포넌트는 legacy 색상 이름보다 `bg-*`, `fg-*`, `action-*`, `success-*`, `danger-*`, `info-*` semantic token을 먼저 사용한다. `cream`, `surface`, `charcoal`, `primary`, `destructive`는 앱 이관이 끝날 때까지 유지하는 compatibility alias다.

## 현재 primitive

각 primitive는 `components/ui/<name>`의 좁은 subpath에서 노출한다. 큰 composite pattern은 실제 사용 사례와 test가 생길 때 별도 subpath로 추가한다.

## 사용 예시

앱 전역 CSS는 Tailwind 실행 설정과 공통 스타일을 함께 명시한다.

```css
@import "tailwindcss" source(none);
@import "tw-animate-css";
@import "@workspace/ui/styles";

@plugin "@tailwindcss/typography";
@custom-variant dark (&:is(.dark *));
@source "<앱 소스 glob>";
@source "<packages/ui/src glob>";
```

화면 구현에서는 필요한 primitive와 아이콘을 명시적인 entrypoint에서 가져온다.

```tsx
import { BookOpenIcon } from "@workspace/ui/components/icons"
import { Button } from "@workspace/ui/components/ui/button"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
```

## import 규칙

앱과 도메인 패키지는 전역 규칙에 따라 absolute import를 사용한다. `packages/ui`
내부 Implementation은 `#ui/*` private alias만 사용하고 자기 공개 Interface나 상대
경로를 역참조하지 않는다.
