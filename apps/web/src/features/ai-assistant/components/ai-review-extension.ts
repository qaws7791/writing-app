import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { ReviewItem } from "@workspace/core/modules/ai-assistant"

export const aiReviewPluginKey = new PluginKey("aiReview")

type PluginState = {
  items: ReviewItem[]
  decorations: DecorationSet
}

type PluginMeta =
  | { action: "set"; items: ReviewItem[] }
  | { action: "remove"; id: string }
  | { action: "clear" }

function buildDecorations(
  items: ReviewItem[],
  doc: import("@tiptap/pm/state").EditorState["doc"]
): DecorationSet {
  const decorations = items
    .filter(
      (item) => item.from < doc.content.size && item.to <= doc.content.size
    )
    .map((item) =>
      Decoration.inline(item.from, item.to, {
        class: `ai-review-highlight ai-review-${item.type}`,
        "data-review-id": item.id,
      })
    )
  return DecorationSet.create(doc, decorations)
}

export const AIReviewExtension = Extension.create({
  name: "aiReview",

  addProseMirrorPlugins() {
    return [
      new Plugin<PluginState>({
        key: aiReviewPluginKey,

        state: {
          init(): PluginState {
            return { items: [], decorations: DecorationSet.empty }
          },

          apply(tr, value, _oldState, newState): PluginState {
            const meta = tr.getMeta(aiReviewPluginKey) as PluginMeta | undefined

            if (meta?.action === "set") {
              const items = meta.items
              return {
                items,
                decorations: buildDecorations(items, newState.doc),
              }
            }

            if (meta?.action === "remove") {
              const items = value.items.filter((i) => i.id !== meta.id)
              return {
                items,
                decorations: buildDecorations(items, newState.doc),
              }
            }

            if (meta?.action === "clear") {
              return { items: [], decorations: DecorationSet.empty }
            }

            if (tr.docChanged) {
              return {
                items: value.items,
                decorations: value.decorations.map(tr.mapping, tr.doc),
              }
            }

            return value
          },
        },

        props: {
          decorations(state) {
            return (this as unknown as Plugin<PluginState>).getState(state)
              ?.decorations
          },
        },
      }),
    ]
  },
})

// --- 에디터 커맨드 헬퍼 ---

export function setReviewItems(
  editor: import("@tiptap/react").Editor,
  items: ReviewItem[]
) {
  editor.view.dispatch(
    editor.view.state.tr.setMeta(aiReviewPluginKey, {
      action: "set",
      items,
    } satisfies PluginMeta)
  )
}

export function removeReviewItem(
  editor: import("@tiptap/react").Editor,
  id: string
) {
  editor.view.dispatch(
    editor.view.state.tr.setMeta(aiReviewPluginKey, {
      action: "remove",
      id,
    } satisfies PluginMeta)
  )
}

export function clearReviewItems(editor: import("@tiptap/react").Editor) {
  editor.view.dispatch(
    editor.view.state.tr.setMeta(aiReviewPluginKey, {
      action: "clear",
    } satisfies PluginMeta)
  )
}

export function getReviewItems(
  editor: import("@tiptap/react").Editor
): ReviewItem[] {
  return aiReviewPluginKey.getState(editor.view.state)?.items ?? []
}
