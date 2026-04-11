"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const switchVariants = cva(
  [
    "group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full",
    "duration-short3 border-2 border-outline transition-colors ease-standard",
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-38",
    "data-checked:border-primary data-checked:bg-primary",
    "data-unchecked:bg-surface-container-highest",
  ],
  {
    variants: {
      size: {
        sm: "h-7 w-11",
        md: "h-8 w-[52px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const thumbVariants = cva(
  [
    "duration-short3 block rounded-full transition-all ease-standard",
    "bg-outline shadow-sm",
    "group-data-checked/switch:bg-on-primary",
  ],
  {
    variants: {
      size: {
        sm: [
          "size-4 translate-x-0.5",
          "group-data-checked/switch:size-[18px] group-data-checked/switch:translate-x-[18px]",
        ],
        md: [
          "size-4 translate-x-[2px]",
          "group-data-checked/switch:size-6 group-data-checked/switch:translate-x-[22px]",
        ],
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface SwitchProps extends VariantProps<typeof switchVariants> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  name?: string
  className?: string
  children?: React.ReactNode
}

function Switch({
  size,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  name,
  className,
  children,
}: SwitchProps) {
  const switchElement = (
    <SwitchPrimitive.Root
      data-slot="switch"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      name={name}
      className={cn(switchVariants({ size }), className)}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={thumbVariants({ size })}
      />
    </SwitchPrimitive.Root>
  )

  if (children) {
    return (
      <label
        data-slot="switch-label"
        className={cn(
          "inline-flex items-center gap-3 select-none",
          disabled && "pointer-events-none opacity-38"
        )}
      >
        {switchElement}
        <span className="text-body-medium text-on-surface">{children}</span>
      </label>
    )
  }

  return switchElement
}

export { Switch }
