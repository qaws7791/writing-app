"use client"

import type { ChipVariants } from "./chip.styles"
import type { ComponentPropsWithRef, ReactNode } from "react"

import { createContext, useContext, useMemo } from "react"

import { composeSlotClassName } from "@workspace/ui/utils/compose"

import { chipVariants } from "./chip.styles"

type ChipContext = {
  slots?: ReturnType<typeof chipVariants>
}

const ChipContext = createContext<ChipContext>({})

interface ChipRootProps
  extends Omit<ComponentPropsWithRef<"div">, "type" | "color">, ChipVariants {
  className?: string
  children: ReactNode
}

const ChipRoot = ({
  children,
  className,
  color,
  size,
  variant,
  ...props
}: ChipRootProps) => {
  const slots = useMemo(
    () => chipVariants({ color, size, variant }),
    [color, size, variant]
  )

  const chipChildren = useMemo(() => {
    if (typeof children === "string" || typeof children === "number") {
      return <ChipLabel>{children}</ChipLabel>
    }

    return children
  }, [children])

  return (
    <ChipContext value={{ slots }}>
      <span
        {...props}
        className={composeSlotClassName(slots.base, className)}
        data-slot="chip"
      >
        {chipChildren}
      </span>
    </ChipContext>
  )
}

interface ChipLabelProps extends ComponentPropsWithRef<"span"> {
  className?: string
}

const ChipLabel = ({ children, className, ...props }: ChipLabelProps) => {
  const { slots } = useContext(ChipContext)

  return (
    <span
      className={composeSlotClassName(slots?.label, className)}
      data-slot="chip-label"
      {...props}
    >
      {children}
    </span>
  )
}

export { ChipRoot, ChipLabel }
export type { ChipRootProps, ChipLabelProps }
