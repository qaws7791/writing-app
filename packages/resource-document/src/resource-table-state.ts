import { $createTableNodeWithDimensions, type TableNode } from "@lexical/table"
import { $getState, $setState, createState } from "lexical"

export type ResourceTableColumnAlignment = "center" | "left" | "right" | null

export const RESOURCE_TABLE_COLUMN_ALIGNMENTS_STATE_KEY =
  "resource-table-column-alignments"

const tableColumnAlignmentsState = createState(
  RESOURCE_TABLE_COLUMN_ALIGNMENTS_STATE_KEY,
  {
    isEqual: areTableAlignmentsEqual,
    parse: parseTableAlignments,
  }
)

export function $getResourceTableColumnAlignments(
  tableNode: TableNode
): readonly ResourceTableColumnAlignment[] {
  return $getState(tableNode, tableColumnAlignmentsState)
}

export function $setResourceTableColumnAlignments(
  tableNode: TableNode,
  alignments: readonly ResourceTableColumnAlignment[]
): void {
  $setState(tableNode, tableColumnAlignmentsState, [...alignments])
}

export function $createResourceTableNodeWithDimensions(
  rows: number,
  columns: number
): TableNode {
  if (
    !Number.isSafeInteger(rows) ||
    !Number.isSafeInteger(columns) ||
    rows < 1 ||
    columns < 1
  ) {
    throw new RangeError("자료 표의 행과 열은 1 이상의 정수여야 합니다.")
  }

  const table = $createTableNodeWithDimensions(rows, columns, {
    columns: false,
    rows: true,
  })

  $setResourceTableColumnAlignments(
    table,
    Array.from({ length: columns }, () => null)
  )

  return table
}

function parseTableAlignments(
  value: unknown
): readonly ResourceTableColumnAlignment[] {
  if (value === undefined) {
    return []
  }

  if (!isResourceTableColumnAlignments(value)) {
    throw new TypeError("자료 표 열 정렬 상태가 올바르지 않습니다.")
  }

  return value
}

export function isResourceTableColumnAlignments(
  value: unknown
): value is readonly ResourceTableColumnAlignment[] {
  return (
    Array.isArray(value) &&
    value.every(
      (alignment) =>
        alignment === null ||
        alignment === "center" ||
        alignment === "left" ||
        alignment === "right"
    )
  )
}

function areTableAlignmentsEqual(
  left: readonly ResourceTableColumnAlignment[],
  right: readonly ResourceTableColumnAlignment[]
): boolean {
  return (
    left.length === right.length &&
    left.every((alignment, index) => alignment === right[index])
  )
}
