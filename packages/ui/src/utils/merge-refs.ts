import type { Ref } from "react"

export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined | null>
): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node)
      } else if (ref != null) {
        ;(ref as { current: T | null }).current = node
      }
    }
  }
}
