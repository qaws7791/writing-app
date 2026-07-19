export const resourceLibraryScopePaths = {
  active: "/resources",
  trash: "/resources/trash",
} as const

export type ResourceLibraryScope = keyof typeof resourceLibraryScopePaths

export function resolveResourceLibraryScope(
  pathname: string
): ResourceLibraryScope {
  return pathname === resourceLibraryScopePaths.trash ? "trash" : "active"
}
