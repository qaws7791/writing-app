"use client"

import type { TagVariants } from "./tag.styles"
import type { ComponentPropsWithRef } from "react"
import type { Button as ButtonPrimitive } from "react-aria-components"

import React, { Children, createContext, useContext, useMemo } from "react"
import { Tag as TagPrimitive } from "react-aria-components"

import { pickChildren } from "@workspace/ui/utils/children"
import { composeTwRenderProps } from "@workspace/ui/utils/compose"
import { CloseButton } from "@workspace/ui/components/close-button"
import { TagGroupContext } from "@workspace/ui/components/tag-group"

import { tagVariants } from "./tag.styles"

/* -------------------------------------------------------------------------------------------------
 * Tag Context
 * -----------------------------------------------------------------------------------------------*/
type TagContext = {
  slots?: ReturnType<typeof tagVariants>
}

const TagContext = createContext<TagContext>({})

/* -------------------------------------------------------------------------------------------------
 * Tag Root
 * -----------------------------------------------------------------------------------------------*/
interface TagRootProps
  extends ComponentPropsWithRef<typeof TagPrimitive>, TagVariants {}

const TagRoot = ({ children, className, ...restProps }: TagRootProps) => {
  const { size, variant } = useContext(TagGroupContext)

  const slots = useMemo(() => tagVariants({ size, variant }), [size, variant])

  const textValue = useMemo(() => {
    if (typeof children === "string") {
      return children
    }

    if (typeof children === "object") {
      return Children.toArray(children)
        .filter((node) => typeof node === "string")
        .at(0)
    }

    return undefined
  }, [children])

  // Extract custom RemoveButton from children if present
  const [childrenWithoutRemoveButton, removeButtonChildren] = useMemo(() => {
    if (typeof children === "function") {
      return [children, undefined] as const
    }

    return pickChildren(children, TagRemoveButton)
  }, [children])

  return (
    <TagPrimitive
      className={composeTwRenderProps(className, slots.base())}
      data-slot="tag"
      textValue={textValue as string | undefined}
      {...restProps}
    >
      {(renderProps) => (
        <TagContext value={{ slots }}>
          {typeof children === "function" ? (
            children(renderProps)
          ) : (
            <>
              {childrenWithoutRemoveButton}
              {!!renderProps.allowsRemoving &&
                (removeButtonChildren && removeButtonChildren.length > 0 ? (
                  removeButtonChildren
                ) : (
                  <TagRemoveButton />
                ))}
            </>
          )}
        </TagContext>
      )}
    </TagPrimitive>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Tag Remove Button
 * -----------------------------------------------------------------------------------------------*/
type TagRemoveButtonProps = ComponentPropsWithRef<typeof ButtonPrimitive> & {
  children?: React.ReactNode
}

const TagRemoveButton = ({
  children,
  className,
  ...restProps
}: TagRemoveButtonProps) => {
  const { slots } = useContext(TagContext)

  return (
    <CloseButton
      aria-label="Remove tag"
      className={composeTwRenderProps(className, slots?.removeButton())}
      data-slot="tag-remove-button"
      slot="remove"
      {...restProps}
    >
      {children}
    </CloseButton>
  )
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export { TagRoot, TagRemoveButton }

export type { TagRootProps, TagRemoveButtonProps }
