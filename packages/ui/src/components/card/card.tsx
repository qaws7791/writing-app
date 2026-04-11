"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const cardVariants = cva(
  "relative overflow-hidden rounded-xl text-on-surface transition-shadow",
  {
    variants: {
      variant: {
        elevated: "bg-surface-container-low shadow",
        filled: "bg-surface-container-highest",
        outlined: "border border-outline bg-surface",
      },
      interactive: {
        true: [
          "cursor-pointer select-none",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
          "before:bg-on-surface/8 before:opacity-0 before:transition-opacity hover:before:opacity-100",
        ],
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "elevated",
        interactive: true,
        className: "active:shadow-sm",
      },
    ],
    defaultVariants: {
      variant: "elevated",
      interactive: false,
    },
  }
)

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, interactive, ...props }: CardProps) {
  if (interactive) {
    return (
      <motion.div
        data-slot="card"
        className={cn(cardVariants({ variant, interactive }), className)}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
        {...(props as React.ComponentProps<typeof motion.div>)}
      />
    )
  }

  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, interactive }), className)}
      {...props}
    />
  )
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-header"
      className={cn("p-4 pb-0", className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="card-content" className={cn("p-4", className)} {...props} />
  )
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-4 pt-0", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardContent, CardFooter }
