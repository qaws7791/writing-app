import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const fieldsetVariants = tv({
  slots: {
    actions: "fieldset__actions",
    base: "fieldset",
    fieldGroup: "fieldset__field_group",
    legend: "fieldset__legend",
  },
})

export type FieldsetVariants = VariantProps<typeof fieldsetVariants>
