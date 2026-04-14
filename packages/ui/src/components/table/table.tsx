"use client"

import type { TableVariants } from "./table.styles"
import type { ComponentPropsWithRef } from "react"

import React, { createContext, useContext } from "react"
import {
  Cell as CellPrimitive,
  Collection as CollectionPrimitive,
  Column as ColumnPrimitive,
  ColumnResizer as ColumnResizerPrimitive,
  ResizableTableContainer as ResizableTableContainerPrimitive,
  Row as RowPrimitive,
  TableBody as TableBodyPrimitive,
  TableHeader as TableHeaderPrimitive,
  TableLoadMoreItem as TableLoadMoreItemPrimitive,
  Table as TablePrimitive,
} from "react-aria-components"

import {
  composeSlotClassName,
  composeTwRenderProps,
} from "@workspace/ui/utils/compose"

import { tableVariants } from "./table.styles"

/* -------------------------------------------------------------------------------------------------
 * Table Context
 * -----------------------------------------------------------------------------------------------*/
const TableContext = createContext<{
  slots?: ReturnType<typeof tableVariants>
}>({})

/* -------------------------------------------------------------------------------------------------
 * Table Root
 * -----------------------------------------------------------------------------------------------*/
interface TableRootProps extends ComponentPropsWithRef<"div">, TableVariants {
  className?: string
  children?: React.ReactNode
}

const TableRoot = React.forwardRef<HTMLDivElement, TableRootProps>(
  ({ children, className, variant, ...props }, ref) => {
    const slots = React.useMemo(() => tableVariants({ variant }), [variant])

    return (
      <TableContext value={{ slots }}>
        <div
          ref={ref}
          className={slots.base({ className })}
          data-slot="table"
          {...props}
        >
          {children}
        </div>
      </TableContext>
    )
  }
)

TableRoot.displayName = "Table"

/* -------------------------------------------------------------------------------------------------
 * Table Scroll Container
 * -----------------------------------------------------------------------------------------------*/
type TableScrollContainerProps = ComponentPropsWithRef<"div">

const TableScrollContainer = React.forwardRef<
  HTMLDivElement,
  TableScrollContainerProps
>(({ className, ...props }, ref) => {
  const { slots } = useContext(TableContext)

  return (
    <div
      ref={ref}
      className={composeSlotClassName(slots?.scrollContainer, className)}
      data-slot="table-scroll-container"
      {...props}
    />
  )
})

TableScrollContainer.displayName = "Table.ScrollContainer"

/* -------------------------------------------------------------------------------------------------
 * Table Content
 * -----------------------------------------------------------------------------------------------*/
interface TableContentProps extends Omit<
  ComponentPropsWithRef<typeof TablePrimitive>,
  "className"
> {
  className?: string
}

function TableContent({ className, ...props }: TableContentProps) {
  const { slots } = useContext(TableContext)

  return (
    <TablePrimitive
      className={composeTwRenderProps(className, slots?.content())}
      data-slot="table-content"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Table Header
 * -----------------------------------------------------------------------------------------------*/
type TableHeaderProps<T extends object> = ComponentPropsWithRef<
  typeof TableHeaderPrimitive<T>
>

function TableHeader<T extends object>({
  className,
  ...props
}: TableHeaderProps<T>) {
  const { slots } = useContext(TableContext)

  return (
    <TableHeaderPrimitive
      className={composeTwRenderProps(className, slots?.header())}
      data-slot="table-header"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Table Column
 * -----------------------------------------------------------------------------------------------*/
type TableColumnProps = ComponentPropsWithRef<typeof ColumnPrimitive>

const TableColumn = React.forwardRef<HTMLTableCellElement, TableColumnProps>(
  ({ className, ...props }, ref) => {
    const { slots } = useContext(TableContext)

    return (
      <ColumnPrimitive
        ref={ref}
        className={composeTwRenderProps(className, slots?.column())}
        data-slot="table-column"
        {...props}
      />
    )
  }
)

TableColumn.displayName = "Table.Column"

/* -------------------------------------------------------------------------------------------------
 * Table Body
 * -----------------------------------------------------------------------------------------------*/
type TableBodyProps<T extends object> = ComponentPropsWithRef<
  typeof TableBodyPrimitive<T>
>

function TableBody<T extends object>({
  className,
  ...props
}: TableBodyProps<T>) {
  const { slots } = useContext(TableContext)

  return (
    <TableBodyPrimitive
      className={composeTwRenderProps(className, slots?.body())}
      data-slot="table-body"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Table Row
 * -----------------------------------------------------------------------------------------------*/
type TableRowProps<T extends object> = ComponentPropsWithRef<
  typeof RowPrimitive<T>
>

function TableRow<T extends object>({ className, ...props }: TableRowProps<T>) {
  const { slots } = useContext(TableContext)

  return (
    <RowPrimitive
      className={composeTwRenderProps(className, slots?.row())}
      data-slot="table-row"
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------------------------------
 * Table Cell
 * -----------------------------------------------------------------------------------------------*/
type TableCellProps = ComponentPropsWithRef<typeof CellPrimitive>

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    const { slots } = useContext(TableContext)

    return (
      <CellPrimitive
        ref={ref}
        className={composeTwRenderProps(className, slots?.cell())}
        data-slot="table-cell"
        {...props}
      />
    )
  }
)

TableCell.displayName = "Table.Cell"

/* -------------------------------------------------------------------------------------------------
 * Table Footer
 * -----------------------------------------------------------------------------------------------*/
interface TableFooterProps extends ComponentPropsWithRef<"div"> {
  className?: string
}

const TableFooter = React.forwardRef<HTMLDivElement, TableFooterProps>(
  ({ className, ...props }, ref) => {
    const { slots } = useContext(TableContext)

    return (
      <div
        ref={ref}
        className={composeSlotClassName(slots?.footer, className)}
        data-slot="table-footer"
        {...props}
      />
    )
  }
)

TableFooter.displayName = "Table.Footer"

/* -------------------------------------------------------------------------------------------------
 * Table Resizable Container
 * -----------------------------------------------------------------------------------------------*/
type TableResizableContainerProps = ComponentPropsWithRef<
  typeof ResizableTableContainerPrimitive
>

const TableResizableContainer = React.forwardRef<
  HTMLDivElement,
  TableResizableContainerProps
>(({ className, ...props }, ref) => {
  const { slots } = useContext(TableContext)

  return (
    <ResizableTableContainerPrimitive
      ref={ref}
      className={composeSlotClassName(slots?.resizableContainer, className)}
      data-slot="table-resizable-container"
      {...props}
    />
  )
})

TableResizableContainer.displayName = "Table.ResizableContainer"

/* -------------------------------------------------------------------------------------------------
 * Table Column Resizer
 * -----------------------------------------------------------------------------------------------*/
type TableColumnResizerProps = ComponentPropsWithRef<
  typeof ColumnResizerPrimitive
>

const TableColumnResizer = React.forwardRef<
  HTMLDivElement,
  TableColumnResizerProps
>(({ className, ...props }, ref) => {
  const { slots } = useContext(TableContext)

  return (
    <ColumnResizerPrimitive
      ref={ref}
      className={composeTwRenderProps(className, slots?.columnResizer())}
      data-slot="table-column-resizer"
      {...props}
    />
  )
})

TableColumnResizer.displayName = "Table.ColumnResizer"

/* -------------------------------------------------------------------------------------------------
 * Table Load More Item
 * -----------------------------------------------------------------------------------------------*/
type TableLoadMoreItemProps = ComponentPropsWithRef<
  typeof TableLoadMoreItemPrimitive
>

const TableLoadMoreItem = React.forwardRef<
  HTMLTableRowElement,
  TableLoadMoreItemProps
>(({ className, ...props }, ref) => {
  const { slots } = useContext(TableContext)

  return (
    <TableLoadMoreItemPrimitive
      ref={ref}
      className={composeSlotClassName(slots?.loadMore, className)}
      data-slot="table-load-more"
      {...props}
    />
  )
})

TableLoadMoreItem.displayName = "Table.LoadMoreItem"

/* -------------------------------------------------------------------------------------------------
 * Table Load More Content
 * -----------------------------------------------------------------------------------------------*/
type TableLoadMoreContentProps = ComponentPropsWithRef<"div">

const TableLoadMoreContent = React.forwardRef<
  HTMLDivElement,
  TableLoadMoreContentProps
>(({ className, ...props }, ref) => {
  const { slots } = useContext(TableContext)

  return (
    <div
      ref={ref}
      className={composeSlotClassName(slots?.loadMoreContent, className)}
      data-slot="table-load-more-content"
      {...props}
    />
  )
})

TableLoadMoreContent.displayName = "Table.LoadMoreContent"

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
const TableCollection = CollectionPrimitive

export {
  TableRoot,
  TableScrollContainer,
  TableContent,
  TableHeader,
  TableColumn,
  TableColumnResizer,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  TableCollection,
  TableLoadMoreItem,
  TableLoadMoreContent,
  TableResizableContainer,
}

export type {
  TableRootProps,
  TableScrollContainerProps,
  TableContentProps,
  TableHeaderProps,
  TableColumnProps,
  TableColumnResizerProps,
  TableBodyProps,
  TableRowProps,
  TableCellProps,
  TableFooterProps,
  TableLoadMoreItemProps,
  TableLoadMoreContentProps,
  TableResizableContainerProps,
}
