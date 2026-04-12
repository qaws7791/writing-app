"use client"

import type { SkeletonVariants } from "./skeleton.styles"
import type { ComponentPropsWithRef } from "react"

import { useMemo } from "react"

import { useCSSVariable } from "@workspace/ui/hooks/use-css-variable"

import { skeletonVariants } from "./skeleton.styles"

interface SkeletonRootProps
  extends Omit<ComponentPropsWithRef<"div">, "children">, SkeletonVariants {}

const SkeletonRoot = ({
  animationType,
  className,
  ...props
}: SkeletonRootProps) => {
  const resolvedAnimationType = useCSSVariable(
    "--skeleton-animation",
    animationType ?? undefined
  )
  const slots = useMemo(
    () =>
      skeletonVariants({
        animationType:
          resolvedAnimationType as SkeletonVariants["animationType"],
      }),
    [resolvedAnimationType]
  )

  return <div className={slots.base({ className })} {...props} />
}

export { SkeletonRoot }
export type { SkeletonRootProps }
