import type { Definition, Root } from "mdast"
import { visit } from "unist-util-visit"

export function collectResourceMarkdownDefinitions(
  root: Root
): ReadonlyMap<string, Definition> {
  const definitions = new Map<string, Definition>()

  visit(root, "definition", (definition) => {
    if (!definitions.has(definition.identifier)) {
      definitions.set(definition.identifier, definition)
    }
  })

  return definitions
}
