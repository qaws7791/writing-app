# Shared UI primitives and design-system level components

## Rules

- shadcn/ui-based primitives live here
- this package should remain domain-agnostic
- avoid embedding essay-specific product language here
- Important: don't edit without user request

## Import convention

- App and domain packages should keep using absolute imports.
- Generated or shadcn/Base UI primitive files under `src/components/ui` may use
  local relative imports such as `../../lib/utils` and `./button`.
- Keep that exception limited to colocated primitive implementation details.
  Cross-package imports and app feature imports should stay absolute.
