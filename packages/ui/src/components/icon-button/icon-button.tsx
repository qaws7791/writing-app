"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const iconButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center overflow-hidden",
    "rounded-full select-none",
    "transition-colors",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-38",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
    "before:opacity-0 before:transition-opacity hover:before:opacity-100",
  ],
  {
    variants: {
      variant: {
        standard: [
          "text-on-surface-variant bg-transparent",
          "before:bg-on-surface-variant/8",
        ],
        filled: [
          "bg-primary text-on-primary shadow-sm",
          "before:bg-on-primary/8",
        ],
        tonal: [
          "bg-secondary-container text-on-secondary-container",
          "before:bg-on-secondary-container/8",
        ],
        outlined: [
          "text-on-surface-variant border border-outline bg-transparent",
          "before:bg-on-surface-variant/8",
        ],
      },
      size: {
        sm: "size-8",
        md: "size-10",
        lg: "size-12",
      },
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "standard",
        selected: true,
        className: "text-primary",
      },
      {
        variant: "outlined",
        selected: true,
        className:
          "bg-inverse-surface text-inverse-on-surface border-transparent",
      },
    ],
    defaultVariants: {
      variant: "standard",
      size: "md",
      selected: false,
    },
  }
)

export interface IconButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  toggle?: boolean
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  "aria-label": string
}

function IconButton({
  className,
  variant,
  size,
  toggle,
  selected: controlledSelected,
  onSelectedChange,
  disabled,
  onClick,
  children,
  ...props
}: IconButtonProps) {
  const [uncontrolledSelected, setUncontrolledSelected] = React.useState(false)
  const isSelected = toggle
    ? (controlledSelected ?? uncontrolledSelected)
    : false

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (toggle) {
      const next = !isSelected
      setUncontrolledSelected(next)
      onSelectedChange?.(next)
    }
    onClick?.(e)
  }

  return (
    <motion.button
      data-slot="icon-button"
      data-selected={isSelected}
      aria-pressed={toggle ? isSelected : undefined}
      className={cn(
        iconButtonVariants({ variant, size, selected: isSelected }),
        className
      )}
      disabled={disabled}
      aria-disabled={disabled}
      onClick={handleClick}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      transition={{ duration: 0.1, ease: [0.2, 0, 0, 1] }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      <span className="size-[18px] [&>*]:size-full">{children}</span>
    </motion.button>
  )
}

export { IconButton, iconButtonVariants }
