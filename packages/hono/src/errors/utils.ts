export function formatZodPath(path: readonly PropertyKey[]): string {
  return path.map(String).join(".")
}
