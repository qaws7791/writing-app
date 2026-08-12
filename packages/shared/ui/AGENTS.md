# Shared UI primitives and domain presentation components

## Rules

- `src/components/primitives/` holds shadcn/Base UI primitives.
- `src/components/learning/` holds learning-domain presentation components.
- `src/blocks/` holds example blocks and their helper blocks.
- `src/hooks/` holds shared hooks.
- Domain components accept display props and simple change callbacks only.
- Do not put API calls, session/routing, OpenAPI or core imports, or grading policy in this package.
- Block fixtures must remain isolated from product routes and production data.
- Prefer path imports over barrel re-exports for both primitives and domain components.
- Important: don't edit without user request

## Import convention

- App and domain packages should keep using absolute imports.
- Generated or shadcn/Base UI primitive files under `src/components/primitives` may use
  local relative imports such as `../../lib/utils` and `./button`.
- Learning components under `src/components/learning` may use local relative imports
  for colocated helpers and sibling components.
- Keep that exception limited to colocated implementation details.
  Cross-package imports and app feature imports should stay absolute.

## Examples

```ts
import { Button } from "@workspace/ui/components/primitives/button"
import { MultipleChoiceAnswer } from "@workspace/ui/components/learning/multiple-choice-answer"
```
