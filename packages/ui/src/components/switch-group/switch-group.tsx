"use client"

import type { ComponentPropsWithRef } from "react"

import { useMemo } from "react"

import type { SwitchGroupVariants } from "./switch-group.styles"

import { switchGroupVariants } from "./switch-group.styles"

/* -------------------------------------------------------------------------------------------------
 * Switch Group Root
 * -----------------------------------------------------------------------------------------------*/
interface SwitchGroupRootProps
  extends ComponentPropsWithRef<"div">, SwitchGroupVariants {}

const SwitchGroupRoot = ({
  children,
  className,
  orientation,
  ...props
}: SwitchGroupRootProps) => {
  const slots = useMemo(
    () => switchGroupVariants({ orientation }),
    [orientation]
  )

  return (
    <div
      data-slot="switch-group"
      {...props}
      className={slots.base({ className })}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { SwitchGroupRoot }

export type { SwitchGroupRootProps }
