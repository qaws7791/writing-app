# Luma upstream

## Source

- Project: `qaws7791/ui`
- Repository: <https://github.com/qaws7791/ui>
- Commit: `010ddc4421d0d2875c858f3cec69a4a93dbf2f28`
- Registry style: Luma
- Primitive library: Base UI
- Full import: 2026-08-09

The upstream registry records shadcn/ui commit `cb2bcd88d93b2f9bddb030e9136f1f8773e7eac4` as its own source.

## Local integration

`@workspace/ui` keeps its package name and public subpath exports.

Every registry UI source, block source and hook is copied into `packages/shared/ui`.

Registry imports are converted to the package-private `#ui/*` alias.

Registry block fixtures remain example data and are not connected to product routes or production data.

The complete Astro site, registry tooling, previews, documentation and tracked repository files are imported into `apps/ui`.

The light `muted-foreground` and `destructive` lightness values are reduced locally to preserve WCAG 2.2 AA contrast in existing product compositions. Destructive alert descriptions use the full status color instead of the upstream 85% opacity.

`FieldSeparator` and `FieldError` use explicit conditional rendering so `0` and empty content do not leak through boolean JSX expressions.

English close labels are localized to Korean. `Select` keeps an explicit Korean list label. `Tabs` keeps `renderBeforeHydration` so Base UI receives the request CSP nonce. Inactive default tabs use the full `muted-foreground` color to meet WCAG 2.2 AA contrast.

Icons use `@hugeicons/react` with direct `@hugeicons/core-free-icons/*` data imports. Shared semantic export names preserve the application import boundary. Route-critical control, navigation and action icons use separate modules so unused icon data does not enter initial chunks.

`Spinner` defaults to the Korean status label `로딩 중`. A spinner with `aria-hidden="true"` omits the status role and accessible name.

`Sortable` uses `@dnd-kit/dom` and `@dnd-kit/react` 0.5.0. Korean screen-reader instructions and announcements replace the upstream English copy. Drag completion reads the current controlled value directly so the component satisfies the repository React ref rule.

`PairConnections` skips line measurement when `ResizeObserver` is unavailable. This keeps non-browser rendering deterministic without changing browser behavior.

## Complete source coverage

| Local path                | Upstream path                                           |
| ------------------------- | ------------------------------------------------------- |
| `apps/ui/`                | all Git-tracked repository files except `.git` metadata |
| `src/components/ui/*.tsx` | `registry/luma/ui/*.tsx`                                |
| `src/blocks/*.tsx`        | `registry/luma/blocks/*.tsx`                            |
| `src/hooks/use-mobile.ts` | `registry/luma/hooks/use-mobile.ts`                     |
| `src/lib/utils.ts`        | `registry/luma/lib/utils.ts`                            |

The fixed import inventory and integration mappings are recorded in `apps/ui/UPSTREAM_IMPORT.md`.

## Locally adapted source

| Local path                            | Upstream path                        |
| ------------------------------------- | ------------------------------------ |
| `src/lib/utils.ts`                    | `registry/luma/lib/utils.ts`         |
| `src/components/ui/button.tsx`        | `registry/luma/ui/button.tsx`        |
| `src/components/ui/field.tsx`         | `registry/luma/ui/field.tsx`         |
| `src/components/ui/input.tsx`         | `registry/luma/ui/input.tsx`         |
| `src/components/ui/textarea.tsx`      | `registry/luma/ui/textarea.tsx`      |
| `src/components/ui/label.tsx`         | `registry/luma/ui/label.tsx`         |
| `src/components/ui/card.tsx`          | `registry/luma/ui/card.tsx`          |
| `src/components/ui/badge.tsx`         | `registry/luma/ui/badge.tsx`         |
| `src/components/ui/separator.tsx`     | `registry/luma/ui/separator.tsx`     |
| `src/components/ui/dialog.tsx`        | `registry/luma/ui/dialog.tsx`        |
| `src/components/ui/alert-dialog.tsx`  | `registry/luma/ui/alert-dialog.tsx`  |
| `src/components/ui/dropdown-menu.tsx` | `registry/luma/ui/dropdown-menu.tsx` |
| `src/components/ui/select.tsx`        | `registry/luma/ui/select.tsx`        |
| `src/components/ui/tabs.tsx`          | `registry/luma/ui/tabs.tsx`          |
| `src/components/ui/accordion.tsx`     | `registry/luma/ui/accordion.tsx`     |
| `src/components/ui/popover.tsx`       | `registry/luma/ui/popover.tsx`       |
| `src/components/ui/progress.tsx`      | `registry/luma/ui/progress.tsx`      |
| `src/components/ui/table.tsx`         | `registry/luma/ui/table.tsx`         |
| `src/components/ui/empty.tsx`         | `registry/luma/ui/empty.tsx`         |
| `src/components/ui/spinner.tsx`       | `registry/luma/ui/spinner.tsx`       |
| `src/components/ui/lesson.tsx`        | `registry/luma/ui/lesson.tsx`        |
| `src/components/ui/step.tsx`          | `registry/luma/ui/step.tsx`          |
| `src/components/ui/insight.tsx`       | `registry/luma/ui/insight.tsx`       |
| `src/components/ui/prose.tsx`         | `registry/luma/ui/prose.tsx`         |
| `src/components/ui/compare.tsx`       | `registry/luma/ui/compare.tsx`       |
| `src/components/ui/choice.tsx`        | `registry/luma/ui/choice.tsx`        |
| `src/components/ui/token.tsx`         | `registry/luma/ui/token.tsx`         |
| `src/components/ui/segment.tsx`       | `registry/luma/ui/segment.tsx`       |
| `src/components/ui/sortable.tsx`      | `registry/luma/ui/sortable.tsx`      |
| `src/components/ui/pair.tsx`          | `registry/luma/ui/pair.tsx`          |
| `src/components/ui/classify.tsx`      | `registry/luma/ui/classify.tsx`      |
| `src/components/ui/compose.tsx`       | `registry/luma/ui/compose.tsx`       |
| `src/components/ui/coaching.tsx`      | `registry/luma/ui/coaching.tsx`      |
| `src/styles/tokens/reference.css`     | `registry/base/registry.json`        |
| `src/styles/tokens/semantic.css`      | `registry/base/registry.json`        |
| `src/styles/tokens/motion.css`        | `registry/base/registry.json`        |
| `src/styles/globals.css`              | `src/styles/global.css`              |

Upstream import paths are rewritten to `#ui/*`.

Oxfmt applies the repository format after each source adoption.

## Update procedure

1. Record the new full upstream commit SHA.
2. Verify that every registry UI, block and hook name exists in both integration targets.
3. Review public API, keyboard behavior, dependency and token changes.
4. Preserve the notices in `THIRD_PARTY_NOTICES.md`.
5. Run the repository UI and quality gates before accepting the update.
