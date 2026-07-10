"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import type { ItemInstance, TreeInstance } from "@headless-tree/core"
import { ChevronDownIcon, MinusIcon, PlusIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

type TreeToggleIconType = "chevron" | "plus-minus"

type TreeContextItem = Pick<
  ItemInstance<never>,
  "getItemName" | "isExpanded" | "isFolder"
>

type TreeContextValue = {
  readonly currentItem?: TreeContextItem
  readonly indent: number
  readonly toggleIconType: TreeToggleIconType
  readonly tree?: Pick<TreeInstance<never>, "getDragLineStyle">
}

const TreeContext = createContext<TreeContextValue | null>(null)

type TreeProps<TItem> = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  readonly children?: ReactNode
  readonly indent?: number
  readonly toggleIconType?: TreeToggleIconType
  readonly tree: TreeInstance<TItem>
}

function Tree<TItem>({
  children,
  className,
  indent = 20,
  style,
  toggleIconType = "chevron",
  tree,
  ...props
}: TreeProps<TItem>) {
  const mergedProps = mergeProps<"div">(
    tree.getContainerProps(props["aria-label"]),
    {
      ...props,
      children,
      className: cn("relative flex min-h-12 flex-col", className),
      style: {
        ...style,
        "--tree-indent": `${indent}px`,
      } as CSSProperties,
    }
  )

  return (
    <TreeContext.Provider
      value={{
        indent,
        toggleIconType,
        tree: {
          getDragLineStyle: (...arguments_) =>
            tree.getDragLineStyle(...arguments_),
        },
      }}
    >
      <div data-slot="tree" {...mergedProps} />
    </TreeContext.Provider>
  )
}

type TreeItemProps<TItem> = Omit<
  useRender.ComponentProps<"button">,
  "children"
> & {
  readonly children?: ReactNode
  readonly item: ItemInstance<TItem>
}

function TreeItem<TItem>({
  children,
  className,
  item,
  render,
  ...props
}: TreeItemProps<TItem>) {
  const context = useRequiredTreeContext()
  const elementRef = useRef<HTMLButtonElement>(null)
  const setElementRef = useCallback(
    (element: HTMLButtonElement | null) => {
      elementRef.current = element
      item.registerElement(element)
    },
    [item]
  )
  const isFocused = item.isFocused()
  const { ref: _headlessTreeRef, ...itemProps } = item.getProps()
  const defaultProps = {
    ...props,
    "aria-expanded": item.isFolder() ? item.isExpanded() : undefined,
    children,
    className: cn(
      "z-10 pb-0.5 ps-(--tree-padding) outline-hidden select-none focus:z-20 data-disabled:pointer-events-none data-disabled:opacity-50",
      className
    ),
    "data-drag-target":
      typeof item.isDragTarget === "function" ? item.isDragTarget() : undefined,
    "data-focus": isFocused,
    "data-folder": item.isFolder(),
    "data-selected":
      typeof item.isSelected === "function" ? item.isSelected() : undefined,
    "data-slot": "tree-item",
    style: {
      "--tree-padding": `${item.getItemMeta().level * context.indent}px`,
    } as CSSProperties,
  }
  const mergedProps = mergeProps<"button">(defaultProps, itemProps)
  const renderProps = { ...mergedProps, ref: setElementRef }

  useEffect(() => {
    const element = elementRef.current
    const activeElement = document.activeElement

    if (
      isFocused &&
      element !== null &&
      activeElement instanceof HTMLElement &&
      activeElement.closest('[role="tree"]') ===
        element.closest('[role="tree"]') &&
      activeElement !== element
    ) {
      element.focus()
    }
  }, [isFocused])

  return (
    <TreeContext.Provider
      value={{
        ...context,
        currentItem: {
          getItemName: () => item.getItemName(),
          isExpanded: () => item.isExpanded(),
          isFolder: () => item.isFolder(),
        },
      }}
    >
      {useRender({
        defaultTagName: "button",
        props: renderProps,
        render,
      })}
    </TreeContext.Provider>
  )
}

type TreeItemLabelProps<TItem> = HTMLAttributes<HTMLSpanElement> & {
  readonly item?: ItemInstance<TItem>
}

function TreeItemLabel<TItem>({
  children,
  className,
  item: itemProp,
  ...props
}: TreeItemLabelProps<TItem>) {
  const context = useRequiredTreeContext()
  const item = itemProp ?? context.currentItem

  if (item === undefined) {
    throw new Error("TreeItemLabel은 TreeItem 내부에서 사용해야 합니다.")
  }

  return (
    <span
      className={cn(
        "flex min-h-9 items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-medium text-foreground transition-colors motion-reduce:transition-none in-focus-visible:ring-2 in-focus-visible:ring-ring/50 hover:bg-accent in-data-[drag-target=true]:bg-accent in-data-[selected=true]:bg-accent in-data-[selected=true]:text-accent-foreground not-in-data-[folder=true]:ps-7 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="tree-item-label"
      {...props}
    >
      {item.isFolder() ? (
        context.toggleIconType === "plus-minus" ? (
          item.isExpanded() ? (
            <MinusIcon aria-hidden="true" className="size-3.5" />
          ) : (
            <PlusIcon aria-hidden="true" className="size-3.5" />
          )
        ) : (
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              "size-4 transition-transform motion-reduce:transition-none",
              item.isExpanded() ? "rotate-0" : "-rotate-90"
            )}
          />
        )
      ) : null}
      {children ?? item.getItemName()}
    </span>
  )
}

function TreeDragLine({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { tree } = useRequiredTreeContext()

  if (tree === undefined) {
    throw new Error("TreeDragLine은 Tree 내부에서 사용해야 합니다.")
  }

  return (
    <div
      className={cn(
        "absolute z-30 -mt-px h-0.5 w-[unset] bg-primary before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-background",
        className
      )}
      data-slot="tree-drag-line"
      style={tree.getDragLineStyle()}
      {...props}
    />
  )
}

function useRequiredTreeContext(): TreeContextValue {
  const context = useContext(TreeContext)

  if (context === null) {
    throw new Error("Tree 컴포넌트는 Tree 내부에서 사용해야 합니다.")
  }

  return context
}

export { Tree, TreeDragLine, TreeItem, TreeItemLabel }
export type { TreeToggleIconType }
