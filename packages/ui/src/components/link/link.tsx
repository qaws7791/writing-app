"use client"

import type { ComponentPropsWithRef } from "react"

import { createContext, useContext, useMemo } from "react"
import { Link as LinkPrimitive } from "react-aria-components"

import type { LinkVariants } from "./link.styles"

import { dataAttr } from "@workspace/ui/utils/assertion"
import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"
import { ExternalLinkIcon } from "@workspace/ui/components/icons"

import { linkVariants } from "./link.styles"

type LinkContext = {
  slots?: ReturnType<typeof linkVariants>
}

const LinkContext = createContext<LinkContext>({})

interface LinkRootProps
  extends ComponentPropsWithRef<typeof LinkPrimitive>, LinkVariants {}

const LinkRoot = ({ children, className, ...props }: LinkRootProps) => {
  const slots = useMemo(() => linkVariants(), [])

  return (
    <LinkContext value={{ slots }}>
      <LinkPrimitive
        {...props}
        className={composeTwRenderProps(className, slots?.base())}
      >
        {(values) => (
          <>{typeof children === "function" ? children(values) : children}</>
        )}
      </LinkPrimitive>
    </LinkContext>
  )
}

type LinkIconProps = ComponentPropsWithRef<"span">

const LinkIcon = ({ children, className, ...rest }: LinkIconProps) => {
  const { slots } = useContext(LinkContext)

  return (
    <span
      className={composeSlotClassName(slots?.icon, className)}
      data-default-icon={dataAttr(!children)}
      data-slot="link-icon"
      {...rest}
    >
      {children ?? <ExternalLinkIcon data-slot="link-default-icon" />}
    </span>
  )
}

export { LinkRoot, LinkIcon }
export type { LinkRootProps, LinkIconProps }
