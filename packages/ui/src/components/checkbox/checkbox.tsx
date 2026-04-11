"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@workspace/ui/lib/utils"

export interface CheckboxProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  indeterminate?: boolean
  disabled?: boolean
  name?: string
  className?: string
  children?: React.ReactNode
}

function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  indeterminate,
  disabled,
  name,
  className,
  children,
}: CheckboxProps) {
  return (
    <label
      data-slot="checkbox-label"
      className={cn(
        "inline-flex items-center gap-3 select-none",
        disabled && "pointer-events-none opacity-38",
        className
      )}
    >
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        indeterminate={indeterminate}
        disabled={disabled}
        name={name}
        className={cn(
          "relative flex size-[18px] shrink-0 items-center justify-center rounded-[2px]",
          "duration-short2 border-2 border-on-surface-low transition-colors ease-standard",
          "hover:border-on-surface",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
          "data-checked:border-primary data-checked:bg-primary",
          "data-indeterminate:border-primary data-indeterminate:bg-primary"
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-on-primary">
          {indeterminate ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="5"
                width="8"
                height="2"
                rx="1"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 6.5L4.5 9L10 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {children && (
        <span className="text-body-medium text-on-surface">{children}</span>
      )}
    </label>
  )
}

export { Checkbox }
