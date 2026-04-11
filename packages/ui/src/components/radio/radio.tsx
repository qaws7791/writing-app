"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { cn } from "@workspace/ui/lib/utils"

export interface RadioGroupProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  name?: string
  className?: string
  children: React.ReactNode
}

function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
  className,
  children,
}: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      className={cn("flex flex-col gap-3", className)}
    >
      {children}
    </RadioGroupPrimitive>
  )
}

export interface RadioProps {
  value: string
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

function Radio({ value, disabled, className, children }: RadioProps) {
  return (
    <label
      data-slot="radio-label"
      className={cn(
        "inline-flex items-center gap-3 select-none",
        disabled && "pointer-events-none opacity-38",
        className
      )}
    >
      <RadioPrimitive.Root
        data-slot="radio"
        value={value}
        disabled={disabled}
        className={cn(
          "relative flex size-5 shrink-0 items-center justify-center rounded-full",
          "duration-short2 border-2 border-on-surface-low transition-colors ease-standard",
          "hover:border-on-surface",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
          "data-checked:border-primary"
        )}
      >
        <RadioPrimitive.Indicator
          className={cn(
            "size-2.5 rounded-full bg-primary",
            "duration-short2 transition-transform ease-standard",
            "scale-0 data-checked:scale-100"
          )}
        />
      </RadioPrimitive.Root>
      {children && (
        <span className="text-body-medium text-on-surface">{children}</span>
      )}
    </label>
  )
}

export { RadioGroup, Radio }
