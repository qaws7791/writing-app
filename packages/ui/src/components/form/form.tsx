"use client"

import type { ComponentPropsWithRef } from "react"

import { Form as FormPrimitive } from "react-aria-components"

type FormRootProps = ComponentPropsWithRef<typeof FormPrimitive>

const FormRoot = ({ ...props }: FormRootProps) => {
  return <FormPrimitive {...props} />
}

export { FormRoot }
export type { FormRootProps }
