"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

export type ListProps = React.HTMLAttributes<HTMLUListElement>

function List({ className, children, ...props }: ListProps) {
  return (
    <ul
      data-slot="list"
      className={cn("flex flex-col", className)}
      role="list"
      {...props}
    >
      {children}
    </ul>
  )
}

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  leadingContent?: React.ReactNode
  headlineText: React.ReactNode
  supportingText?: React.ReactNode
  trailingContent?: React.ReactNode
  interactive?: boolean
}

function ListItem({
  className,
  leadingContent,
  headlineText,
  supportingText,
  trailingContent,
  interactive = false,
  onClick,
  children,
  ...props
}: ListItemProps) {
  return (
    <li
      data-slot="list-item"
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick?.(e as unknown as React.MouseEvent<HTMLLIElement>)
              }
            }
          : undefined
      }
      className={cn(
        "relative flex min-h-14 items-center gap-4 px-4 py-2",
        "text-on-surface",
        interactive && [
          "cursor-pointer select-none",
          "before:pointer-events-none before:absolute before:inset-0",
          "before:bg-on-surface/8 before:opacity-0 before:transition-opacity",
          "hover:before:opacity-100",
          "focus-visible:outline-none focus-visible:before:opacity-100",
        ],
        className
      )}
      {...props}
    >
      {leadingContent && (
        <span className="shrink-0 text-on-surface-low" aria-hidden="true">
          {leadingContent}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-body-large">{headlineText}</span>
        {supportingText && (
          <span className="truncate text-body-medium text-on-surface-low">
            {supportingText}
          </span>
        )}
      </span>
      {trailingContent && (
        <span className="shrink-0 text-on-surface-low">{trailingContent}</span>
      )}
      {children}
    </li>
  )
}

export { List, ListItem }
