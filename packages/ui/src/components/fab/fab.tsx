"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const fabVariants = cva(
  [
    "relative inline-flex items-center justify-center overflow-hidden",
    "shadow-md select-none",
    "transition-shadow",
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-38",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
    "before:opacity-0 before:transition-opacity hover:before:opacity-100",
    "hover:shadow-lg",
    "active:shadow-md",
  ],
  {
    variants: {
      variant: {
        surface: [
          "bg-surface-container-high text-primary",
          "before:bg-primary/8",
        ],
        primary: [
          "bg-primary-container text-on-primary-container",
          "before:bg-on-primary-container/8",
        ],
        secondary: [
          "bg-secondary-container text-on-secondary-container",
          "before:bg-on-secondary-container/8",
        ],
        tertiary: [
          "bg-surface-container-high text-on-surface",
          "before:bg-on-surface/8",
        ],
      },
      size: {
        sm: "size-10 rounded-xl",
        md: "size-14 rounded-2xl",
        lg: "size-24 rounded-[28px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface FABProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  "aria-label": string
}

function FAB({
  className,
  variant,
  size,
  disabled,
  children,
  ...props
}: FABProps) {
  const iconSize =
    size === "lg" ? "size-9" : size === "sm" ? "size-5" : "size-6"

  return (
    <motion.button
      data-slot="fab"
      type="button"
      className={cn(fabVariants({ variant, size }), className)}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.1, ease: [0.2, 0, 0, 1] }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      <span className={iconSize} aria-hidden="true">
        {children}
      </span>
    </motion.button>
  )
}

const extendedFabVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-3 overflow-hidden",
    "shadow-md select-none",
    "transition-shadow",
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-38",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
    "before:opacity-0 before:transition-opacity hover:before:opacity-100",
    "hover:shadow-lg",
    "active:shadow-md",
    "h-14 rounded-2xl px-4 text-label-large",
  ],
  {
    variants: {
      variant: {
        surface: [
          "bg-surface-container-high text-primary",
          "before:bg-primary/8",
        ],
        primary: [
          "bg-primary-container text-on-primary-container",
          "before:bg-on-primary-container/8",
        ],
        secondary: [
          "bg-secondary-container text-on-secondary-container",
          "before:bg-on-secondary-container/8",
        ],
        tertiary: [
          "bg-surface-container-high text-on-surface",
          "before:bg-on-surface/8",
        ],
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
)

export interface ExtendedFABProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof extendedFabVariants> {
  icon?: React.ReactNode
}

function ExtendedFAB({
  className,
  variant,
  icon,
  disabled,
  children,
  ...props
}: ExtendedFABProps) {
  return (
    <motion.button
      data-slot="extended-fab"
      type="button"
      className={cn(extendedFabVariants({ variant }), className)}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.1, ease: [0.2, 0, 0, 1] }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {icon && (
        <span className="size-6 shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </motion.button>
  )
}

export { FAB, fabVariants, ExtendedFAB, extendedFabVariants }
