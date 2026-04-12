"use client"

import type { ComponentPropsWithRef } from "react"

import { createContext } from "react"

import type { SurfaceVariants } from "./surface.styles"

import { surfaceVariants } from "./surface.styles"

type SurfaceContext = {
  variant?: SurfaceVariants["variant"]
}

const SurfaceContext = createContext<SurfaceContext>({})

interface SurfaceRootProps
  extends ComponentPropsWithRef<"div">, SurfaceVariants {}

const SurfaceRoot = ({
  children,
  className,
  variant = "default",
  ...rest
}: SurfaceRootProps) => {
  return (
    <SurfaceContext value={{ variant }}>
      <div
        className={surfaceVariants({ variant, className })}
        data-slot="surface"
        {...rest}
      >
        {children}
      </div>
    </SurfaceContext>
  )
}

export { SurfaceRoot, SurfaceContext }
export type { SurfaceRootProps }
