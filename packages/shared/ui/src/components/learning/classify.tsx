"use client"

import * as React from "react"
import {
  Accessibility,
  PointerSensor,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/dom"
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react"
import { cva, type VariantProps } from "class-variance-authority"

import {
  learningSeriesDotClass,
  type LearningSeries,
} from "#ui/lib/learning-series"
import { cn } from "#ui/lib/utils"

type ClassifyState =
  | "idle"
  | "active"
  | "placed"
  | "correct"
  | "incorrect"
  | "locked"

type ClassifySurface = "basket" | "pool"

const CLASSIFY_POOL_ID = "classify-pool"
const CLASSIFY_ITEM_PREFIX = "classify-item:"
const CLASSIFY_BASKET_PREFIX = "classify-basket:"
const CLASSIFY_ITEM_TYPE = "classify-item"

type ClassifyContextValue = {
  clearSelection: () => void
  disabled: boolean
  getCategoryLabel: (categoryId: string) => string
  getItemLabel: (itemId: string) => string
  place: (
    itemId: string,
    categoryId: string | null,
    source: "click" | "drag"
  ) => void
  selectedCategoryId: null | string
  selectedItemId: null | string
  selectCategory: (categoryId: string) => void
  selectItem: (itemId: string, containerId: string | null) => void
  shouldSuppressClick: () => boolean
}

type ClassifySurfaceContextValue = {
  containerId: string | null
  surface: ClassifySurface
}

const ClassifyContext = React.createContext<ClassifyContextValue | null>(null)
const ClassifySurfaceContext =
  React.createContext<ClassifySurfaceContextValue | null>(null)

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value)
  } else if (ref) {
    ref.current = value
  }
}

function itemDragId(itemId: string) {
  return `${CLASSIFY_ITEM_PREFIX}${itemId}`
}

function basketDropId(categoryId: string) {
  return `${CLASSIFY_BASKET_PREFIX}${categoryId}`
}

function parseItemId(id: number | string) {
  const value = String(id)
  return value.startsWith(CLASSIFY_ITEM_PREFIX)
    ? value.slice(CLASSIFY_ITEM_PREFIX.length)
    : null
}

function parseDropTarget(id: number | string): string | null | undefined {
  const value = String(id)
  if (value === CLASSIFY_POOL_ID) return null
  if (value.startsWith(CLASSIFY_BASKET_PREFIX)) {
    return value.slice(CLASSIFY_BASKET_PREFIX.length)
  }
  return undefined
}

function useClassify() {
  const context = React.useContext(ClassifyContext)
  if (!context) {
    throw new Error("Classify 하위 부품은 Classify 안에서 사용해야 합니다.")
  }
  return context
}

function Classify({
  className,
  children,
  disabled = false,
  getCategoryLabel = String,
  getItemLabel = String,
  onPlace,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  disabled?: boolean
  getCategoryLabel?: (categoryId: string) => string
  getItemLabel?: (itemId: string) => string
  onPlace?: (itemId: string, categoryId: string | null) => void
}) {
  const [selectedItemId, setSelectedItemId] = React.useState<null | string>(
    null
  )
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    null | string
  >(null)
  const [status, setStatus] = React.useState("")
  const suppressClickRef = React.useRef(false)

  const clearSelection = React.useCallback(() => {
    setSelectedItemId(null)
    setSelectedCategoryId(null)
  }, [])

  const announcePlace = React.useCallback(
    (itemId: string, categoryId: string | null) => {
      const itemLabel = getItemLabel(itemId)
      if (categoryId === null) {
        setStatus(`${itemLabel} 항목을 남은 항목으로 되돌렸습니다.`)
        return
      }
      setStatus(
        `${itemLabel} 항목을 ${getCategoryLabel(categoryId)}에 넣었습니다.`
      )
    },
    [getCategoryLabel, getItemLabel]
  )

  const place = React.useCallback(
    (itemId: string, categoryId: string | null, source: "click" | "drag") => {
      if (disabled) return
      onPlace?.(itemId, categoryId)
      clearSelection()
      if (source === "click") announcePlace(itemId, categoryId)
    },
    [announcePlace, clearSelection, disabled, onPlace]
  )

  const selectItem = React.useCallback(
    (itemId: string, containerId: string | null) => {
      if (disabled) return
      if (selectedCategoryId !== null) {
        place(itemId, selectedCategoryId, "click")
        return
      }
      if (selectedItemId === itemId) {
        if (containerId !== null) {
          place(itemId, null, "click")
          return
        }
        clearSelection()
        return
      }
      setSelectedItemId(itemId)
      setSelectedCategoryId(null)
    },
    [clearSelection, disabled, place, selectedCategoryId, selectedItemId]
  )

  const selectCategory = React.useCallback(
    (categoryId: string) => {
      if (disabled) return
      if (selectedItemId !== null) {
        place(selectedItemId, categoryId, "click")
        return
      }
      setSelectedCategoryId((previous) =>
        previous === categoryId ? null : categoryId
      )
    },
    [disabled, place, selectedItemId]
  )

  const accessibility = React.useMemo(
    () =>
      Accessibility.configure({
        screenReaderInstructions: {
          draggable:
            "항목을 바구니에 넣으려면 항목을 선택한 뒤 바구니 이름을 활성화하세요. 포인터로는 항목을 집어 바구니로 끌어다 놓을 수 있습니다.",
        },
        announcements: {
          dragstart({ operation: { source } }: DragStartEvent) {
            const itemId = source ? parseItemId(source.id) : null
            if (itemId === null) return
            return `${getItemLabel(itemId)} 항목을 들었습니다.`
          },
          dragover({ operation: { source, target } }: DragOverEvent) {
            const itemId = source ? parseItemId(source.id) : null
            if (itemId === null || !target) return
            const categoryId = parseDropTarget(target.id)
            if (categoryId === undefined) return
            if (categoryId === null) {
              return `${getItemLabel(itemId)} 항목을 남은 항목으로 옮겼습니다.`
            }
            return `${getItemLabel(itemId)} 항목을 ${getCategoryLabel(categoryId)} 바구니로 옮겼습니다.`
          },
          dragend({ operation: { source, target }, canceled }: DragEndEvent) {
            const itemId = source ? parseItemId(source.id) : null
            if (itemId === null) return
            if (canceled) {
              return `${getItemLabel(itemId)} 항목 이동을 취소했습니다.`
            }
            const categoryId = target ? parseDropTarget(target.id) : undefined
            if (categoryId === undefined) {
              return `${getItemLabel(itemId)} 항목을 원래 자리에 두었습니다.`
            }
            if (categoryId === null) {
              return `${getItemLabel(itemId)} 항목을 남은 항목에 놓았습니다.`
            }
            return `${getItemLabel(itemId)} 항목을 ${getCategoryLabel(categoryId)} 바구니에 놓았습니다.`
          },
        },
      }),
    [getCategoryLabel, getItemLabel]
  )

  const contextValue = React.useMemo<ClassifyContextValue>(
    () => ({
      clearSelection,
      disabled,
      getCategoryLabel,
      getItemLabel,
      place,
      selectedCategoryId,
      selectedItemId,
      selectCategory,
      selectItem,
      shouldSuppressClick: () => {
        if (!suppressClickRef.current) return false
        suppressClickRef.current = false
        return true
      },
    }),
    [
      clearSelection,
      disabled,
      getCategoryLabel,
      getItemLabel,
      place,
      selectCategory,
      selectItem,
      selectedCategoryId,
      selectedItemId,
    ]
  )

  return (
    <ClassifyContext.Provider value={contextValue}>
      <DragDropProvider
        plugins={(defaults) => [
          ...defaults.filter((plugin) => plugin !== Accessibility),
          accessibility,
        ]}
        onDragEnd={(event) => {
          const { source, target } = event.operation
          if (source) suppressClickRef.current = true
          if (disabled || event.canceled || !source || !target) return
          const itemId = parseItemId(source.id)
          const categoryId = parseDropTarget(target.id)
          if (itemId === null || categoryId === undefined) return
          place(itemId, categoryId, "drag")
        }}
      >
        <div
          data-slot="classify"
          data-disabled={disabled || undefined}
          className={cn("flex w-full flex-col gap-4", className)}
          {...props}
        >
          {children}
          <p className="sr-only" role="status">
            {status}
          </p>
        </div>
      </DragDropProvider>
    </ClassifyContext.Provider>
  )
}

function ClassifyPool({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const board = useClassify()
  const { isDropTarget, ref } = useDroppable({
    id: CLASSIFY_POOL_ID,
    accept: CLASSIFY_ITEM_TYPE,
    disabled: board.disabled,
  })
  const isReturnTarget = !board.disabled && board.selectedItemId !== null

  return (
    <ClassifySurfaceContext.Provider
      value={{ containerId: null, surface: "pool" }}
    >
      <div
        ref={ref}
        role="group"
        aria-label="남은 항목"
        data-slot="classify-pool"
        data-drop-target={isDropTarget || undefined}
        className={cn(
          "flex flex-col gap-2 rounded-3xl border border-dashed border-border/70 bg-surface/40 p-3 transition-[background-color,border-color] duration-150 motion-reduce:transition-none",
          isReturnTarget && "border-info/40 bg-info/10",
          isDropTarget && "border-foreground/35 bg-accent/40",
          className
        )}
        onClick={() => {
          if (board.disabled) return
          if (board.selectedItemId !== null) {
            board.place(board.selectedItemId, null, "click")
            return
          }
          board.clearSelection()
        }}
        {...props}
      >
        <button
          type="button"
          data-slot="classify-pool-trigger"
          aria-pressed={isReturnTarget}
          disabled={board.disabled}
          className="flex h-7 items-center px-0.5 text-left text-xs font-medium text-muted-foreground outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45"
          onClick={(event) => {
            event.stopPropagation()
            if (board.selectedItemId !== null) {
              board.place(board.selectedItemId, null, "click")
              return
            }
            board.clearSelection()
          }}
        >
          남은 항목
        </button>
        <div className="flex min-h-12 flex-wrap content-start gap-2">
          {children}
        </div>
      </div>
    </ClassifySurfaceContext.Provider>
  )
}

function ClassifyBaskets({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="classify-baskets"
      className={cn(
        "grid grid-cols-1 gap-3 min-[28rem]:grid-cols-2",
        className
      )}
      {...props}
    />
  )
}

function ClassifySeriesDot({
  className,
  series,
}: {
  className?: string
  series: LearningSeries
}) {
  return (
    <span
      aria-hidden
      data-slot="classify-series-dot"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        learningSeriesDotClass[series],
        className
      )}
    />
  )
}

function ClassifyBasket({
  className,
  children,
  id,
  label,
  series,
  state = "idle",
  ...props
}: Omit<React.ComponentProps<"div">, "id"> & {
  id: string
  label: string
  series?: LearningSeries
  state?: "idle" | "locked"
}) {
  const board = useClassify()
  const isLocked = state === "locked" || board.disabled
  const isActive = !isLocked && board.selectedCategoryId === id
  const isAwaitingItem = !isLocked && board.selectedItemId !== null
  const { isDropTarget, ref } = useDroppable({
    id: basketDropId(id),
    accept: CLASSIFY_ITEM_TYPE,
    disabled: isLocked,
  })
  const isEmpty = React.Children.count(children) === 0

  return (
    <ClassifySurfaceContext.Provider
      value={{ containerId: id, surface: "basket" }}
    >
      <div
        ref={ref}
        data-slot="classify-basket"
        data-series={series}
        data-state={isLocked ? "locked" : isActive ? "active" : "idle"}
        data-drop-target={isDropTarget || undefined}
        className={cn(
          "flex min-h-28 flex-col gap-2 rounded-3xl border p-3 transition-[background-color,border-color] duration-150 motion-reduce:transition-none",
          isLocked && "border-border/60 bg-muted/30",
          !isLocked &&
            isEmpty &&
            "border-dashed border-border/70 bg-surface/40",
          !isLocked && !isEmpty && "border-border/80 bg-card",
          isAwaitingItem && !isActive && "border-info/35",
          isActive && "border-solid border-info/40 bg-info/10",
          isDropTarget &&
            !isLocked &&
            "border-solid border-foreground/35 bg-accent/40",
          className
        )}
        {...props}
      >
        <button
          type="button"
          data-slot="classify-basket-trigger"
          aria-pressed={isActive}
          disabled={isLocked}
          className={cn(
            "flex h-7 items-center gap-1.5 px-0.5 text-left text-sm font-medium tracking-[-0.005em] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45",
            isLocked ? "text-muted-foreground" : "text-foreground"
          )}
          onClick={(event) => {
            event.stopPropagation()
            board.selectCategory(id)
          }}
        >
          {series === undefined ? null : <ClassifySeriesDot series={series} />}
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </button>
        <div
          data-slot="classify-basket-body"
          className="flex min-h-16 flex-1 flex-col gap-2"
          onClick={() => {
            if (isLocked) return
            board.selectCategory(id)
          }}
        >
          {children}
        </div>
      </div>
    </ClassifySurfaceContext.Provider>
  )
}

const classifyItemVariants = cva(
  "group/classify-item flex items-start gap-3 border text-left text-sm transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none",
  {
    variants: {
      surface: {
        pool: "max-w-full rounded-2xl px-3 py-2 shadow-xs",
        basket: "w-full rounded-2xl px-3 py-2.5 shadow-xs",
      },
      state: {
        idle: "border-border/80 bg-card text-foreground hover:bg-accent/40",
        active: "border-info/35 bg-info/10 text-foreground shadow-xs",
        placed: "border-border bg-card text-foreground",
        correct: "border-success/30 bg-success/10 text-success",
        incorrect: "border-destructive/30 bg-destructive/6 text-destructive",
        locked: "border-border/60 bg-muted/40 text-muted-foreground",
      },
    },
    defaultVariants: {
      surface: "pool",
      state: "idle",
    },
  }
)

function ClassifyItem({
  className,
  id,
  onClick,
  ref,
  state = "idle",
  ...props
}: Omit<React.ComponentProps<"button">, "id"> &
  VariantProps<typeof classifyItemVariants> & {
    id: string
    state?: ClassifyState
  }) {
  const board = useClassify()
  const surface = React.useContext(ClassifySurfaceContext)
  const containerId = surface?.containerId ?? null
  const itemSurface = surface?.surface ?? "pool"
  const isLocked = state === "locked" || board.disabled
  const isSelected = !isLocked && board.selectedItemId === id
  const visualState: ClassifyState = isLocked
    ? state === "correct" || state === "incorrect"
      ? state
      : "locked"
    : isSelected
      ? "active"
      : state
  const { isDragging, ref: draggableRef } = useDraggable({
    id: itemDragId(id),
    type: CLASSIFY_ITEM_TYPE,
    disabled: isLocked,
    sensors: [PointerSensor],
  })
  const composedRef = React.useCallback(
    (element: HTMLButtonElement | null) => {
      draggableRef(element)
      assignRef(ref, element)
    },
    [draggableRef, ref]
  )
  const label = board.getItemLabel(id)
  const locationLabel =
    containerId === null ? "남은 항목" : board.getCategoryLabel(containerId)

  return (
    <button
      ref={composedRef}
      type="button"
      data-slot="classify-item"
      data-state={visualState}
      data-dragging={isDragging || undefined}
      data-surface={itemSurface}
      aria-pressed={isSelected}
      aria-label={`${label}, ${locationLabel}`}
      disabled={isLocked}
      className={cn(
        classifyItemVariants({ state: visualState, surface: itemSurface }),
        !isLocked && "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "z-10 opacity-55 shadow-md",
        className
      )}
      {...props}
      onClick={(event) => {
        event.stopPropagation()
        if (board.shouldSuppressClick()) return
        board.selectItem(id, containerId)
        onClick?.(event)
      }}
    />
  )
}

function ClassifyItemLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="classify-item-label"
      className={cn(
        "min-w-0 flex-1 leading-6 font-medium tracking-[-0.01em]",
        className
      )}
      {...props}
    />
  )
}

export {
  Classify,
  ClassifyBasket,
  ClassifyBaskets,
  ClassifyItem,
  ClassifyItemLabel,
  ClassifyPool,
  classifyItemVariants,
}
export type { ClassifyState }
