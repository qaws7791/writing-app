import * as React from "react"

import { ToggleGroup, ToggleGroupItem } from "#ui/components/ui/toggle-group"

type SegmentedControlProps = Omit<
  React.ComponentProps<typeof ToggleGroup>,
  "defaultValue" | "multiple" | "onValueChange" | "value"
> & {
  readonly defaultValue?: string
  readonly onValueChange?: (value: string) => void
  readonly value?: string
}

function SegmentedControl({
  defaultValue,
  onValueChange,
  value,
  ...props
}: SegmentedControlProps) {
  return (
    <ToggleGroup
      defaultValue={defaultValue ? [defaultValue] : undefined}
      multiple={false}
      onValueChange={(nextValue) => {
        const selectedValue = nextValue[0]

        if (selectedValue) {
          onValueChange?.(selectedValue)
        }
      }}
      value={value ? [value] : undefined}
      {...props}
    />
  )
}

function SegmentedControlItem({
  ...props
}: React.ComponentProps<typeof ToggleGroupItem>) {
  return <ToggleGroupItem data-slot="segmented-control-item" {...props} />
}

export { SegmentedControl, SegmentedControlItem }
