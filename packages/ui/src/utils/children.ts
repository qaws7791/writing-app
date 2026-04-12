import type { ReactNode } from "react"

import { Children, isValidElement } from "react"

/**
 * Returns only the valid React children (ignores null/undefined/falsy).
 */
export function getValidChildren(children: ReactNode) {
  return Children.toArray(children).filter((child) =>
    isValidElement(child)
  ) as React.ReactElement[]
}

/**
 * Splits children into two arrays: one without the target component, one with.
 * Used for compound components that need to extract specific sub-components.
 */
export const pickChildren = <T = ReactNode>(
  children: T | undefined,
  targetChild: React.ElementType
): [T | undefined, T[] | undefined] => {
  const target: T[] = []

  const withoutTargetChildren = Children.map(children, (item) => {
    if (!isValidElement(item)) return item
    if (item.type === targetChild) {
      target.push(item as T)
      return null
    }
    return item
  })?.filter(Boolean) as T

  const targetChildren = target.length >= 0 ? target : undefined

  return [withoutTargetChildren, targetChildren]
}
