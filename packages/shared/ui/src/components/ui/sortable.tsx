"use client"

import * as React from "react"
import {
  Accessibility,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/dom"
import { DragDropProvider } from "@dnd-kit/react"
import { isSortable, useSortable } from "@dnd-kit/react/sortable"

import { GripVerticalIcon } from "#ui/components/icons/control-icons"
import { cn } from "#ui/lib/utils"

type SortableState = "idle" | "correct" | "incorrect" | "locked"
type SortableValue = string | number

type SortableContextValue = {
  disabled: boolean
  getItemLabel: (value: SortableValue) => string
  value: SortableValue[]
}

type SortableItemContextValue = {
  disabled: boolean
  handleRef: (element: Element | null) => void
  index: number
  label: string
}

const SortableContext = React.createContext<SortableContextValue | null>(null)
const SortableItemContext =
  React.createContext<SortableItemContextValue | null>(null)

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

type SortableProps<T extends SortableValue = SortableValue> = Omit<
  React.ComponentProps<"ol">,
  "defaultValue"
> & {
  disabled?: boolean
  getItemLabel?: (value: T) => string
  onValueChange: (value: T[]) => void
  value: T[]
}

function Sortable<T extends SortableValue>({
  className,
  children,
  disabled = false,
  getItemLabel = String,
  onValueChange,
  value,
  ...props
}: SortableProps<T>) {
  const accessibility = React.useMemo(
    () =>
      Accessibility.configure({
        screenReaderInstructions: {
          draggable:
            "항목을 들려면 스페이스 또는 엔터 키를 누르세요. 위아래 방향키로 위치를 바꾸고, 스페이스 또는 엔터 키로 놓거나 Esc 키로 취소하세요.",
        },
        announcements: {
          dragstart({ operation: { source } }: DragStartEvent) {
            if (!source) return
            return `${getItemLabel(source.id as T)} 항목을 들었습니다.`
          },
          dragover({ operation: { source, target } }: DragOverEvent) {
            if (!source || !target || !isSortable(target)) return
            return `${getItemLabel(source.id as T)} 항목을 ${target.index + 1}번째 위치로 이동했습니다.`
          },
          dragend({ operation: { source }, canceled }: DragEndEvent) {
            if (!source || !isSortable(source)) return
            if (canceled) {
              return `${getItemLabel(source.id as T)} 항목 이동을 취소했습니다.`
            }
            return `${getItemLabel(source.id as T)} 항목을 ${source.index + 1}번째 위치에 놓았습니다.`
          },
        },
      }),
    [getItemLabel]
  )

  const contextValue = React.useMemo<SortableContextValue>(
    () => ({
      disabled,
      getItemLabel: (itemValue) => getItemLabel(itemValue as T),
      value,
    }),
    [disabled, getItemLabel, value]
  )

  return (
    <SortableContext.Provider value={contextValue}>
      <DragDropProvider
        plugins={(defaults) => [
          ...defaults.filter((plugin) => plugin !== Accessibility),
          accessibility,
        ]}
        onDragEnd={(event) => {
          const { source } = event.operation

          if (disabled || event.canceled || !source || !isSortable(source)) {
            return
          }

          const { initialIndex, index } = source
          const current = value
          if (
            initialIndex === index ||
            initialIndex < 0 ||
            initialIndex >= current.length ||
            index < 0 ||
            index >= current.length
          ) {
            return
          }

          const next = [...current]
          const [item] = next.splice(initialIndex, 1)
          if (item === undefined) return
          next.splice(index, 0, item)
          onValueChange(next)
        }}
      >
        <ol
          data-slot="sortable"
          data-disabled={disabled || undefined}
          className={cn("flex w-full flex-col gap-2.5", className)}
          {...props}
        >
          {children}
        </ol>
      </DragDropProvider>
    </SortableContext.Provider>
  )
}

type SortableItemProps = Omit<React.ComponentProps<"li">, "value"> & {
  disabled?: boolean
  state?: SortableState
  value: SortableValue
}

function SortableItem({
  className,
  disabled = false,
  ref,
  state = "idle",
  value,
  ...props
}: SortableItemProps) {
  const root = React.useContext(SortableContext)
  if (!root) throw new Error("SortableItem은 Sortable 안에서 사용해야 합니다.")

  const index = root.value.indexOf(value)
  const isDisabled = disabled || root.disabled || state !== "idle" || index < 0
  const {
    handleRef,
    isDragging,
    isDropTarget,
    ref: sortableRef,
  } = useSortable({
    id: value,
    index: Math.max(index, 0),
    disabled: isDisabled,
  })

  const composedRef = React.useCallback(
    (element: HTMLLIElement | null) => {
      sortableRef(element)
      assignRef(ref, element)
    },
    [ref, sortableRef]
  )

  const itemContext = React.useMemo<SortableItemContextValue>(
    () => ({
      disabled: isDisabled,
      handleRef,
      index,
      label: root.getItemLabel(value),
    }),
    [handleRef, index, isDisabled, root, value]
  )

  return (
    <SortableItemContext.Provider value={itemContext}>
      <li
        ref={composedRef}
        data-slot="sortable-item"
        data-state={state}
        data-dragging={isDragging || undefined}
        data-drop-target={isDropTarget || undefined}
        data-disabled={isDisabled || undefined}
        className={cn(
          "group/sortable-item flex items-center gap-2 rounded-3xl border px-2.5 py-2 text-sm transition-[background-color,border-color,box-shadow,opacity,transform] duration-150 outline-none motion-reduce:transition-none",
          state === "idle" && "border-border/80 bg-card shadow-2xs",
          state === "correct" && "border-foreground/20 bg-foreground/[0.035]",
          state === "incorrect" &&
            "border-destructive/30 bg-destructive/6 text-destructive",
          state === "locked" &&
            "border-border/60 bg-muted/40 text-muted-foreground",
          isDragging && "z-10 opacity-55 shadow-md",
          isDropTarget && !isDragging && "border-foreground/35 bg-accent/45",
          className
        )}
        {...props}
      />
    </SortableItemContext.Provider>
  )
}

function SortableHandle({
  "aria-label": ariaLabel,
  "aria-roledescription": ariaRoleDescription = "드래그 핸들",
  className,
  disabled,
  ref,
  ...props
}: React.ComponentProps<"button">) {
  const item = React.useContext(SortableItemContext)
  const isDisabled = disabled || item?.disabled
  const composedRef = React.useCallback(
    (element: HTMLButtonElement | null) => {
      item?.handleRef(element)
      assignRef(ref, element)
    },
    [item, ref]
  )

  return (
    <button
      ref={composedRef}
      type="button"
      data-slot="sortable-handle"
      aria-label={ariaLabel ?? (item ? `${item.label} 항목 이동` : "항목 이동")}
      aria-roledescription={ariaRoleDescription}
      disabled={isDisabled}
      className={cn(
        "flex size-9 shrink-0 touch-none cursor-grab items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-accent/70 hover:text-foreground active:cursor-grabbing focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-default disabled:opacity-45",
        className
      )}
      {...props}
    >
      <GripVerticalIcon aria-hidden="true" className="size-4" />
    </button>
  )
}

function SortableIndex({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  const item = React.useContext(SortableItemContext)

  return (
    <span
      data-slot="sortable-index"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium tabular-nums text-muted-foreground",
        className
      )}
      {...props}
    >
      {children ?? (item ? item.index + 1 : null)}
    </span>
  )
}

function SortableContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sortable-content"
      className={cn(
        "min-w-0 flex-1 px-1.5 py-1.5 leading-6 font-medium tracking-[-0.01em]",
        className
      )}
      {...props}
    />
  )
}

export {
  Sortable,
  SortableContent,
  SortableHandle,
  SortableIndex,
  SortableItem,
}
export type { SortableItemProps, SortableProps, SortableState, SortableValue }
