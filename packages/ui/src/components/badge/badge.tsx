"use client"

import type { BadgeVariants } from "./badge.styles"
import type { ComponentPropsWithRef, ReactNode } from "react"

import { createContext, useContext, useMemo } from "react"
import { cx } from "tailwind-variants"

import { composeSlotClassName } from "@workspace/ui/utils/compose"

import { badgeVariants } from "./badge.styles"

type BadgeContext = {
  slots?: ReturnType<typeof badgeVariants>
}

const BadgeContext = createContext<BadgeContext>({})

interface BadgeAnchorProps extends ComponentPropsWithRef<"span"> {
  className?: string
  children: ReactNode
}

const BadgeAnchor = ({ children, className, ...props }: BadgeAnchorProps) => {
  return (
    <span
      {...props}
      className={cx("badge-anchor", className) ?? undefined}
      data-slot="badge-anchor"
    >
      {children}
    </span>
  )
}

interface BadgeRootProps
  extends Omit<ComponentPropsWithRef<"span">, "color">, BadgeVariants {
  className?: string
  children?: ReactNode
}

const BadgeRoot = ({
  children,
  className,
  color,
  placement,
  size,
  variant,
  ...props
}: BadgeRootProps) => {
  const slots = useMemo(
    () => badgeVariants({ color, placement, size, variant }),
    [color, placement, size, variant]
  )

  const badgeChildren = useMemo(() => {
    if (typeof children === "string" || typeof children === "number") {
      return <BadgeLabel>{children}</BadgeLabel>
    }

    return children
  }, [children])

  return (
    <BadgeContext value={{ slots }}>
      <span
        {...props}
        className={composeSlotClassName(slots.base, className)}
        data-slot="badge"
      >
        {badgeChildren}
      </span>
    </BadgeContext>
  )
}

interface BadgeLabelProps extends ComponentPropsWithRef<"span"> {
  className?: string
}

const BadgeLabel = ({ children, className, ...props }: BadgeLabelProps) => {
  const { slots } = useContext(BadgeContext)

  return (
    <span
      className={composeSlotClassName(slots?.label, className)}
      data-slot="badge-label"
      {...props}
    >
      {children}
    </span>
  )
}

export { BadgeRoot, BadgeLabel, BadgeAnchor }
export type { BadgeRootProps, BadgeLabelProps, BadgeAnchorProps }
