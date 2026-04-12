import type { ComponentPropsWithRef, ElementType } from "react"

/** Extracts the variant props type from a tv() result */
export type { VariantProps } from "tailwind-variants"

/** Helper to extract ref-forwarded props from an element type */
export type PropsWithRef<T extends ElementType> = ComponentPropsWithRef<T>
