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

/** Phase 3 — Tier 2 Composite Components */
export { Select, selectVariants } from "./components/select"
export type { SelectVariants } from "./components/select"

export { ComboBox, comboBoxVariants } from "./components/combo-box"
export type { ComboBoxVariants } from "./components/combo-box"

export {
  Dropdown,
  DropdownRoot,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  DropdownItemIndicator,
  DropdownSubmenuIndicator,
  DropdownSubmenuTrigger,
  dropdownVariants,
} from "./components/dropdown"
export type { DropdownVariants } from "./components/dropdown"

export {
  AlertDialog,
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogBackdrop,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogIcon,
  AlertDialogCloseTrigger,
  alertDialogVariants,
} from "./components/alert-dialog"
export type { AlertDialogVariants } from "./components/alert-dialog"

export {
  TagGroup,
  TagGroupRoot,
  TagGroupList,
  tagGroupVariants,
} from "./components/tag-group"
export type { TagGroupVariants } from "./components/tag-group"

export { Tag, TagRoot, TagRemoveButton, tagVariants } from "./components/tag"
export type { TagVariants } from "./components/tag"

/** Phase 3 — Tier 3 High-level Components */
export {
  Autocomplete,
  AutocompleteRoot,
  AutocompleteTrigger,
  AutocompleteValue,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteFilter,
  AutocompleteClearButton,
  autocompleteVariants,
} from "./components/autocomplete"
export type { AutocompleteVariants } from "./components/autocomplete"

/** Phase 3 — Internal Primitives (for advanced composition) */
export {
  MenuItem,
  MenuItemRoot,
  MenuItemIndicator,
  MenuItemSubmenuIndicator,
  menuItemVariants,
} from "./components/menu-item"
export type { MenuItemVariants } from "./components/menu-item"

export { MenuSectionRoot, menuSectionVariants } from "./components/menu-section"
export type { MenuSectionVariants } from "./components/menu-section"
