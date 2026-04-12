import type { ComponentProps } from "react"

import {
  FieldGroup,
  FieldsetActions,
  FieldsetLegend,
  FieldsetRoot,
} from "./fieldset"

export const Fieldset = Object.assign(FieldsetRoot, {
  Root: FieldsetRoot,
  Legend: FieldsetLegend,
  FieldGroup: FieldGroup,
  Actions: FieldsetActions,
})

export type Fieldset = {
  Props: ComponentProps<typeof FieldsetRoot>
  RootProps: ComponentProps<typeof FieldsetRoot>
  LegendProps: ComponentProps<typeof FieldsetLegend>
  FieldGroupProps: ComponentProps<typeof FieldGroup>
  ActionsProps: ComponentProps<typeof FieldsetActions>
}

export {
  FieldsetRoot,
  FieldsetLegend,
  FieldGroup,
  FieldsetActions,
} from "./fieldset"
export type {
  FieldsetRootProps,
  FieldsetRootProps as FieldsetProps,
  FieldsetLegendProps,
  FieldGroupProps,
  FieldsetActionsProps,
} from "./fieldset"
export { fieldsetVariants } from "./fieldset.styles"
export type { FieldsetVariants } from "./fieldset.styles"
