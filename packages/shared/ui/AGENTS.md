# Shared UI primitives and domain presentation components

## Rules

- `src/components/ui/` holds the complete shared UI inventory.
- `src/components/<domain>/` holds pure domain presentation components (for example `lesson/`).
- `src/blocks/` holds example blocks and their helper blocks.
- `src/hooks/` holds shared hooks.
- Domain components accept display props and simple change callbacks only.
- Do not put API calls, session/routing, OpenAPI or core imports, or grading policy in this package.
- Block fixtures must remain isolated from product routes and production data.
- Prefer path imports over barrel re-exports for both primitives and domain components.
- Important: don't edit without user request

## Import convention

- App and domain packages should keep using absolute imports.
- Generated or shadcn/Base UI primitive files under `src/components/ui` may use
  local relative imports such as `../../lib/utils` and `./button`.
- Domain components under `src/components/<domain>` may use local relative imports
  for colocated helpers and sibling components.
- Keep that exception limited to colocated implementation details.
  Cross-package imports and app feature imports should stay absolute.

## Examples

```ts
import { Button } from "@workspace/ui/components/ui/button"
import { MultipleChoiceAnswer } from "@workspace/ui/components/lesson/multiple-choice-answer"
```
