"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const chipVariants = cva(
  [
    "relative inline-flex items-center gap-2 overflow-hidden",
    "rounded-lg text-label-large select-none",
    "transition-colors",
    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-38",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
    "before:opacity-0 before:transition-opacity hover:before:opacity-100",
  ],
  {
    variants: {
      variant: {
        assist: [
          "border border-outline bg-transparent text-on-surface",
          "before:bg-on-surface/8",
        ],
        filter: [
          "border border-outline bg-transparent text-on-surface-low",
          "before:bg-on-surface/8",
        ],
        input: [
          "border border-outline bg-transparent text-on-surface",
          "before:bg-on-surface/8",
        ],
        suggestion: [
          "border border-outline bg-transparent text-on-surface",
          "before:bg-on-surface/8",
        ],
      },
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "filter",
        selected: true,
        className:
          "border-transparent bg-secondary-container text-on-secondary-container before:bg-on-secondary-container/8",
      },
      {
        variant: "input",
        selected: true,
        className:
          "border-transparent bg-secondary-container text-on-secondary-container before:bg-on-secondary-container/8",
      },
    ],
    defaultVariants: {
      variant: "assist",
      selected: false,
    },
  }
)

export interface ChipProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect">,
    VariantProps<typeof chipVariants> {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  onDelete?: () => void
  selected?: boolean
  onSelect?: (selected: boolean) => void
}

function Chip({
  className,
  variant,
  selected,
  leadingIcon,
  trailingIcon,
  onDelete,
  onSelect,
  disabled,
  onClick,
  children,
  ...props
}: ChipProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (onSelect) {
      onSelect(!selected)
    }
    onClick?.(e)
  }

  return (
    <motion.button
      data-slot="chip"
      type="button"
      role={variant === "filter" ? "option" : undefined}
      aria-selected={variant === "filter" ? (selected ?? false) : undefined}
      className={cn(
        chipVariants({ variant, selected }),
        "h-8 px-4",
        leadingIcon && "pl-3",
        (trailingIcon || onDelete) && "pr-3",
        className
      )}
      disabled={disabled}
      onClick={handleClick}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: 0.1, ease: [0.2, 0, 0, 1] }}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {leadingIcon && (
        <span className="size-[18px] shrink-0" aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      {selected && variant === "filter" && !leadingIcon && (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M3.75 9L7.5 12.75L14.25 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="truncate">{children}</span>
      {onDelete && (
        <button
          type="button"
          className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-full text-on-surface-low transition-colors hover:text-on-surface"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="삭제"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5.25 5.25L12.75 12.75M12.75 5.25L5.25 12.75"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
      {trailingIcon && !onDelete && (
        <span className="size-[18px] shrink-0" aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </motion.button>
  )
}

export { Chip, chipVariants }
