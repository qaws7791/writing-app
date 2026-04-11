"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const topAppBarVariants = cva(
  "flex w-full items-center bg-surface px-1 text-on-surface transition-shadow",
  {
    variants: {
      variant: {
        "center-aligned": "h-16 flex-row justify-between",
        small: "h-16 flex-row",
        medium: "flex-col items-start pt-2 pb-6",
        large: "flex-col items-start pt-2 pb-7",
      },
      scrolled: {
        true: "shadow-sm",
        false: "",
      },
    },
    defaultVariants: {
      variant: "center-aligned",
      scrolled: false,
    },
  }
)

export interface TopAppBarProps
  extends
    Omit<React.HTMLAttributes<HTMLElement>, "title">,
    VariantProps<typeof topAppBarVariants> {
  title?: React.ReactNode
  navigationIcon?: React.ReactNode
  actions?: React.ReactNode[]
  scrollBehavior?: "fixed" | "scroll" | "compress"
  as?: React.ElementType
}

function TopAppBar({
  className,
  variant = "center-aligned",
  scrolled,
  title,
  navigationIcon,
  actions,
  scrollBehavior = "fixed",
  as: Component = "header",
  ...props
}: TopAppBarProps) {
  const isCenterAligned = variant === "center-aligned"
  const isMediumOrLarge = variant === "medium" || variant === "large"

  const titleClass = cn(
    "flex-1 truncate text-on-surface",
    variant === "large" ? "mt-3 px-3 text-headline-medium" : "",
    variant === "medium" ? "mt-3 px-3 text-headline-small" : "",
    variant === "small" ? "mx-2 text-title-large" : "",
    isCenterAligned ? "text-center text-title-large" : ""
  )

  return (
    <Component
      data-slot="top-app-bar"
      data-scroll-behavior={scrollBehavior}
      className={cn(topAppBarVariants({ variant, scrolled }), className)}
      {...props}
    >
      {isMediumOrLarge ? (
        <>
          <div className="flex h-16 w-full items-center justify-between px-1">
            {navigationIcon && (
              <span className="flex size-10 items-center justify-center">
                {navigationIcon}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1">
              {actions?.map((action, i) => (
                <span
                  key={i}
                  className="flex size-10 items-center justify-center"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
          {title && <span className={titleClass}>{title}</span>}
        </>
      ) : (
        <>
          {navigationIcon ? (
            <span className="flex size-10 items-center justify-center">
              {navigationIcon}
            </span>
          ) : (
            !isCenterAligned && <span className="w-4" />
          )}
          <span className={titleClass}>{title}</span>
          <div className="flex items-center gap-1">
            {actions?.map((action, i) => (
              <span
                key={i}
                className="flex size-10 items-center justify-center"
              >
                {action}
              </span>
            ))}
          </div>
        </>
      )}
    </Component>
  )
}

export { TopAppBar }
