export function globalNavClassName(
  ...classes: Array<false | null | string | undefined>
): string {
  return classes.filter(Boolean).join(" ")
}
