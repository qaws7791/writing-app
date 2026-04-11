"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 overflow-hidden",
    "rounded-full text-label-large select-none",
    "transition-colors",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-38",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
    "before:opacity-0 before:transition-opacity hover:before:opacity-100",
  ],
  {
    variants: {
      variant: {
        filled: [
          "bg-primary text-on-primary shadow-sm",
          "before:bg-on-primary/8",
          "active:shadow-none",
        ],
        tonal: [
          "bg-secondary-container text-on-secondary-container shadow-sm",
          "before:bg-on-secondary-container/8",
          "active:shadow-none",
        ],
        outlined: [
          "border border-outline bg-transparent text-primary",
          "before:bg-primary/8",
        ],
        text: ["bg-transparent text-primary", "before:bg-primary/8"],
        elevated: [
          "bg-surface-container-low text-primary shadow",
          "before:bg-primary/8",
          "active:shadow-sm",
        ],
      },
      size: {
        sm: "h-8 px-4 text-label-medium",
        md: "h-10 px-6",
        lg: "h-12 px-8 text-label-large-em",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  loading?: boolean
}

function Button({
  className,
  variant,
  size,
  leadingIcon,
  trailingIcon,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      transition={{ duration: 0.1, ease: [0.2, 0, 0, 1] }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        leadingIcon && <span className="size-[18px]">{leadingIcon}</span>
      )}
      {children}
      {trailingIcon && !loading && (
        <span className="size-[18px]">{trailingIcon}</span>
      )}
    </motion.button>
  )
}

export { Button, buttonVariants }
