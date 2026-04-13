/** Re-exports all public utils + variant utilities for component authors. */
export * from "./utils/index"
export { cn } from "./lib/utils"

/** Hooks */
export { useSafeLayoutEffect } from "./hooks/use-safe-layout-effect"
export { useCSSVariable } from "./hooks/use-css-variable"
export { useOverlayState } from "./hooks/use-overlay-state"
export type {
  UseOverlayStateProps,
  UseOverlayStateReturn,
} from "./hooks/use-overlay-state"
export { useMeasuredHeight } from "./hooks/use-measured-height"
export { useMediaQuery } from "./hooks/use-media-query"
export { useResizeObserver } from "./hooks/use-resize-observer"

/** Phase 0 — Tier 0 Primitives */
export * from "./components/alert"
export * from "./components/avatar"
export * from "./components/badge"
export * from "./components/button"
export * from "./components/checkbox"
export * from "./components/description"
export * from "./components/error-message"
export * from "./components/input"
export * from "./components/label"
export * from "./components/link"
export * from "./components/progress-bar"
export * from "./components/meter"
export * from "./components/radio-group"
export * from "./components/scroll-shadow"
export * from "./components/separator"
export * from "./components/skeleton"
export * from "./components/spinner"
export * from "./components/surface"
export * from "./components/switch"
export * from "./components/textarea"
export * from "./components/text-field"
export * from "./components/toggle-button"

/** Phase 1 — Tier 1 Composite Components */
export * from "./components/button-group"
export * from "./components/card"
export * from "./components/checkbox-group"
export * from "./components/chip"
export * from "./components/close-button"
export * from "./components/field-error"
export * from "./components/fieldset"
export * from "./components/form"
export * from "./components/input-group"
export * from "./components/list-box"
export * from "./components/modal"
export * from "./components/popover"
export * from "./components/tabs"
export * from "./components/toast"
export * from "./components/toggle-button-group"
export * from "./components/toolbar"
export * from "./components/tooltip"

/** Phase 2 — Search Components */
export * from "./components/search-field"

/** Phase 3 — Tier 2 Composite Components */
export * from "./components/select"
export * from "./components/combo-box"
export * from "./components/dropdown"
export * from "./components/alert-dialog"
export * from "./components/tag-group"
export * from "./components/tag"

/** Phase 3 — Tier 3 High-level Components */
export * from "./components/autocomplete"

/** Phase 3 — Internal Primitives (for advanced composition) */
export * from "./components/menu-item"
export * from "./components/menu-section"
