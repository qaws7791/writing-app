import type { AdminTiptapDocument } from "@/lib/api/admin-api"

export function createTiptapDocumentFromPlainText(
  text: string
): AdminTiptapDocument {
  const lines = text.split(/\r?\n/)
  const content = lines.length === 0 ? [""] : lines

  return {
    content: content.map((line) => ({
      content:
        line.length === 0
          ? undefined
          : [
              {
                text: line,
                type: "text",
              },
            ],
      type: "paragraph",
    })),
    type: "doc",
  }
}

export function readPlainTextFromTiptapDocument(
  document: AdminTiptapDocument
): string {
  return document.content
    .map((node) => node.content?.map((child) => child.text).join("") ?? "")
    .join("\n")
}
