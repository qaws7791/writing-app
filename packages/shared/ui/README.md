# `@workspace/ui`

`packages/shared/ui`는 공유 UI, block source, hook, 앱 공통 아이콘과
스타일 entrypoint를 제공한다. 라우팅, 인증, 앱 layout provider, 데이터 조회 같은
런타임 조립 책임은 각 앱에 둔다. Block fixture는 제품 데이터로 사용하지 않는다.

## 공개 entrypoint

현재 public export는 실제 파일이 있는 아래 경계만 유지한다.

| entrypoint                                       | 책임                              |
| ------------------------------------------------ | --------------------------------- |
| `@workspace/ui/blocks/{block}`                   | 화면 조합 예제 block              |
| `@workspace/ui/styles`                           | 공통 token과 style Implementation |
| `@workspace/ui/pretendard-font`                  | 로컬 Pretendard font-face         |
| `@workspace/ui/hooks/{hook}`                     | 공유 hook                         |
| `@workspace/ui/lib/utils`                        | `cn` helper                       |
| `@workspace/ui/components/icons`                 | 앱에서 반복 사용하는 공통 아이콘  |
| `@workspace/ui/components/primitives/{컴포넌트}` | Base UI 기반 primitive            |
| `@workspace/ui/components/learning/{컴포넌트}`   | 학습 도메인 프레젠테이션          |

## 스타일 구조

전역 스타일 entrypoint는 `@workspace/ui/styles`를 사용한다. `src/styles/tokens/reference.css`, `semantic.css`, `motion.css`와 `src/styles/globals.css`가 공통 runtime 디자인 값의 단일 원천이다. Tailwind import, plugin, style scan, PostCSS 설정은 각 앱 Adapter가 소유한다.

`apps/ui`, `apps/admin`, `apps/web`은 이 entrypoint를 직접 소비한다. 앱은 공통 light·dark·contrast·motion 값을 다시 선언하지 않는다.

제품 앱과 Astro UI 문서 앱의 root는 `@workspace/ui/pretendard-font`를 한 번 import해 로컬 가변 동적 서브셋을 명시적으로 활성화한다.

새 공용 컴포넌트는 legacy 색상 이름보다 `bg-*`, `fg-*`, `action-*`, `success-*`, `danger-*`, `info-*` semantic token을 먼저 사용한다. `cream`, `surface`, `charcoal`, `primary`, `destructive`는 앱 이관이 끝날 때까지 유지하는 compatibility alias다.

## 범위

UI source는 `components/primitives/<name>`과 `components/learning/<name>`의 좁은
subpath에서 노출한다. block source는 `blocks/<name>`에서 노출한다. hook은
`hooks/<name>`에서 노출한다. `apps/ui`는 이 패키지를 소비하는 내부 문서 앱이다.

## 사용 예시

앱 전역 CSS는 Tailwind 실행 설정과 공통 스타일을 함께 명시한다.

```css
@import "tailwindcss" source(none);
@import "tw-animate-css";
@import "@workspace/ui/styles";

@plugin "@tailwindcss/typography";
@custom-variant dark (&:is(.dark *));
@source "<앱 소스 glob>";
@source "<packages/shared/ui/src glob>";
```

화면 구현에서는 필요한 primitive와 아이콘을 명시적인 entrypoint에서 가져온다.

```tsx
import { BookOpenIcon } from "@workspace/ui/components/icons"
import { MultipleChoiceAnswer } from "@workspace/ui/components/learning/multiple-choice-answer"
import { Button } from "@workspace/ui/components/primitives/button"
import { Card, CardContent } from "@workspace/ui/components/primitives/card"
```

## import 규칙

앱과 도메인 패키지는 전역 규칙에 따라 absolute import를 사용한다. `packages/shared/ui`
내부 Implementation은 `#ui/*` private alias만 사용하고 자기 공개 Interface나 상대
경로를 역참조하지 않는다.
