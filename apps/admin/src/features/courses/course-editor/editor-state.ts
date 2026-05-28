export type CourseEditorDirtyState = {
  hasChanges: boolean
  changedFields: string[]
}

export function getDirtyState(changedFields: string[]): CourseEditorDirtyState {
  return {
    hasChanges: changedFields.length > 0,
    changedFields,
  }
}

export function moveItem<TItem>(
  items: readonly TItem[],
  fromIndex: number,
  toIndex: number
): TItem[] {
  const nextItems = [...items]
  const [item] = nextItems.splice(fromIndex, 1)

  if (item === undefined) {
    return nextItems
  }

  nextItems.splice(toIndex, 0, item)
  return nextItems
}
