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
