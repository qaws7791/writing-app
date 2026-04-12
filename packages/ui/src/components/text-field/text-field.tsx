"use client"

import type { ComponentPropsWithRef } from "react"

import { createContext, useMemo } from "react"
import { TextField as TextFieldPrimitive } from "react-aria-components"

import type { TextFieldVariants } from "./text-field.styles"

import { composeTwRenderProps } from "@workspace/ui/utils/compose"

import { textFieldVariants } from "./text-field.styles"

/* -------------------------------------------------------------------------------------------------
 * TextField Context
 * -----------------------------------------------------------------------------------------------*/
type TextFieldContext = {
  variant?: "primary" | "secondary"
}

const TextFieldContext = createContext<TextFieldContext>({})

/* -------------------------------------------------------------------------------------------------
 * TextField Root
 * -----------------------------------------------------------------------------------------------*/
interface TextFieldRootProps
  extends ComponentPropsWithRef<typeof TextFieldPrimitive>, TextFieldVariants {
  variant?: "primary" | "secondary"
}

const TextFieldRoot = ({
  children,
  className,
  fullWidth,
  variant,
  ...props
}: TextFieldRootProps) => {
  const styles = useMemo(() => textFieldVariants({ fullWidth }), [fullWidth])

  return (
    <TextFieldPrimitive
      data-slot="textfield"
      {...props}
      className={composeTwRenderProps(className, styles)}
    >
      {(values) => (
        <TextFieldContext value={{ variant }}>
          <>{typeof children === "function" ? children(values) : children}</>
        </TextFieldContext>
      )}
    </TextFieldPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { TextFieldRoot, TextFieldContext }

export type { TextFieldRootProps }
