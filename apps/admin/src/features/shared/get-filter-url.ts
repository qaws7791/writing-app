export type GetFilterValue = string | number

export function createGetFilterHref(
  fields: Iterable<readonly [string, GetFilterValue]>,
  overrides: Readonly<Record<string, GetFilterValue>> = {}
): string {
  const params = new URLSearchParams()

  for (const [name, value] of fields) {
    params.set(name, String(value))
  }
  for (const [name, value] of Object.entries(overrides)) {
    params.set(name, String(value))
  }

  return `?${params.toString()}`
}

export function readGetFormFields(
  form: HTMLFormElement
): readonly (readonly [string, string])[] {
  return [...new FormData(form).entries()].flatMap(([name, value]) =>
    typeof value === "string" ? [[name, value] as const] : []
  )
}
