/** HTML data attribute value type — present ("") or absent (undefined) */
export type Booleanish = "" | undefined

export function dataAttr(condition: unknown): Booleanish {
  return condition ? "" : undefined
}
