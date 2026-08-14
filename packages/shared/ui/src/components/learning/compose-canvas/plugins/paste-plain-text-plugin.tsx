import { useEffect } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  PASTE_COMMAND,
  tokenizeRawText,
} from "lexical"

export function PastePlainTextPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (
          !(event instanceof ClipboardEvent) ||
          event.clipboardData === null
        ) {
          return false
        }
        const text = event.clipboardData.getData("text/plain")
        event.preventDefault()
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return true
        }
        tokenizeRawText(text.replaceAll("\r\n", "\n").replaceAll("\r", "\n"), {
          linebreak: () => {
            selection.insertParagraph()
          },
          tab: () => {
            selection.insertText(" ")
          },
          text: (chunk) => {
            selection.insertText(chunk)
          },
        })
        return true
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor])

  return null
}
