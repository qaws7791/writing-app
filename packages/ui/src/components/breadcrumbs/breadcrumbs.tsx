"use client"

import type { BreadcrumbsVariants } from "./breadcrumbs.styles"
import type { ComponentPropsWithRef } from "react"

import React, { createContext, useContext } from "react"
import {
  Breadcrumb as BreadcrumbPrimitive,
  Breadcrumbs as BreadcrumbsPrimitive,
  Link as LinkPrimitive,
} from "react-aria-components"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"
import { IconChevronRight } from "@workspace/ui/components/icons"

import { breadcrumbsVariants } from "./breadcrumbs.styles"

/* -------------------------------------------------------------------------------------------------
 * Breadcrumbs Context
 * -----------------------------------------------------------------------------------------------*/
type BreadcrumbsContext = {
  slots?: ReturnType<typeof breadcrumbsVariants>
  separator?: React.ReactNode
}

const BreadcrumbsContext = createContext<BreadcrumbsContext>({})

/* -------------------------------------------------------------------------------------------------
 * Breadcrumbs Root
 * -----------------------------------------------------------------------------------------------*/
interface BreadcrumbsRootProps
  extends
    ComponentPropsWithRef<typeof BreadcrumbsPrimitive>,
    BreadcrumbsVariants {
  separator?: React.ReactNode
}

const BreadcrumbsRoot = ({
  children,
  className,
  separator,
  ...props
}: BreadcrumbsRootProps) => {
  const slots = React.useMemo(() => breadcrumbsVariants({}), [])

  return (
    <BreadcrumbsContext.Provider value={{ slots, separator }}>
      <BreadcrumbsPrimitive
        data-slot="breadcrumbs"
        {...props}
        className={composeSlotClassName(
          slots.base as (args?: { className?: string }) => string,
          className
        )}
      >
        {children}
      </BreadcrumbsPrimitive>
    </BreadcrumbsContext.Provider>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Breadcrumbs Item
 * -----------------------------------------------------------------------------------------------*/
interface BreadcrumbsItemProps extends ComponentPropsWithRef<
  typeof BreadcrumbPrimitive
> {
  href?: string
}

const BreadcrumbsItem = ({
  children,
  className,
  href,
  ...props
}: BreadcrumbsItemProps) => {
  const { separator, slots } = useContext(BreadcrumbsContext)

  const renderSeparator = () => {
    if (!separator) {
      return (
        <IconChevronRight
          className={composeSlotClassName(slots?.separator, undefined)}
          data-slot="breadcrumbs-separator"
        />
      )
    }

    if (React.isValidElement(separator)) {
      return React.cloneElement(
        separator as React.ReactElement<{
          className?: string
          "data-slot": "breadcrumbs-separator"
        }>,
        {
          className: composeSlotClassName(slots?.separator, undefined),
          "data-slot": "breadcrumbs-separator",
        }
      )
    }

    return separator
  }

  return (
    <BreadcrumbPrimitive
      className={composeTwRenderProps(
        className,
        composeSlotClassName(slots?.item, undefined)
      )}
      data-slot="breadcrumbs-item"
      {...props}
    >
      {({ isCurrent }) => (
        <>
          <LinkPrimitive
            className={composeSlotClassName(slots?.link, undefined)}
            href={href}
          >
            {children}
          </LinkPrimitive>
          {!isCurrent && renderSeparator()}
        </>
      )}
    </BreadcrumbPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { BreadcrumbsRoot, BreadcrumbsItem }
export type { BreadcrumbsRootProps, BreadcrumbsItemProps }
