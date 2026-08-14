"use client"

import { useEffect, useRef, useState } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import {
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  HISTORY_MERGE_TAG,
  INSERT_TAB_COMMAND,
  KEY_TAB_COMMAND,
} from "lexical"

import { cn } from "#ui/lib/utils"

import { createComposeCanvasConfig } from "./compose-canvas/editor-config"
import { $exportPlainText, $importPlainText } from "./compose-canvas/plain-text"
import { HistoryPlugin } from "./compose-canvas/plugins/history-plugin"
import { PastePlainTextPlugin } from "./compose-canvas/plugins/paste-plain-text-plugin"

export function ComposeCanvas({
  className,
  contentClassName,
  disabled = false,
  id,
  onBlur,
  onChange,
  placeholder,
  placeholderClassName,
  value,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: {
  readonly "aria-label"?: string
  readonly "aria-labelledby"?: string
  readonly className?: string
  readonly contentClassName?: string
  readonly disabled?: boolean
  readonly id?: string
  readonly onBlur?: () => void
  readonly onChange?: (value: string) => void
  readonly placeholder?: string
  readonly placeholderClassName?: string
  readonly value: string
}) {
  const [initialConfig] = useState(() =>
    createComposeCanvasConfig({
      editable: !disabled,
      initialText: value,
    })
  )

  return (
    <div
      className={cn(
        "relative flex min-h-40 min-w-0 flex-1 flex-col",
        className
      )}
      data-slot="compose-canvas"
    >
      <LexicalComposer initialConfig={initialConfig}>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <RichTextPlugin
            ErrorBoundary={LexicalErrorBoundary}
            contentEditable={
              <ContentEditable
                aria-multiline="true"
                aria-readonly={disabled || undefined}
                className={cn(
                  "relative min-h-full px-5 pt-5 pb-5 text-base leading-7 text-foreground outline-none sm:px-8 sm:pt-8 sm:pb-8",
                  disabled && "cursor-not-allowed opacity-45",
                  contentClassName
                )}
                id={id}
                role="textbox"
                spellCheck={false}
                {...(ariaLabel === undefined
                  ? {}
                  : { "aria-label": ariaLabel })}
                {...(ariaLabelledBy === undefined
                  ? {}
                  : { "aria-labelledby": ariaLabelledBy })}
                {...(placeholder === undefined
                  ? { placeholder: null }
                  : {
                      "aria-placeholder": placeholder,
                      placeholder: (
                        <div
                          className={cn(
                            "pointer-events-none absolute top-5 left-5 text-base leading-7 text-muted-foreground/80 sm:top-8 sm:left-8",
                            placeholderClassName
                          )}
                        >
                          {placeholder}
                        </div>
                      ),
                    })}
              />
            }
          />
        </div>
        <HistoryPlugin />
        <PastePlainTextPlugin />
        <EditablePlugin disabled={disabled} />
        <FormatGuardPlugin />
        <TabLeavePlugin />
        <ValueSyncPlugin
          value={value}
          {...(onBlur === undefined ? {} : { onBlur })}
          {...(onChange === undefined ? {} : { onChange })}
        />
      </LexicalComposer>
    </div>
  )
}

function EditablePlugin({ disabled }: { readonly disabled: boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.setEditable(!disabled)
  }, [disabled, editor])

  return null
}

function FormatGuardPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const unregisterFormatText = editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      () => true,
      COMMAND_PRIORITY_CRITICAL
    )
    const unregisterFormatElement = editor.registerCommand(
      FORMAT_ELEMENT_COMMAND,
      () => true,
      COMMAND_PRIORITY_CRITICAL
    )
    const unregisterInsertTab = editor.registerCommand(
      INSERT_TAB_COMMAND,
      () => true,
      COMMAND_PRIORITY_CRITICAL
    )
    return () => {
      unregisterFormatText()
      unregisterFormatElement()
      unregisterInsertTab()
    }
  }, [editor])

  return null
}

function TabLeavePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        const current = document.activeElement
        if (event === null || !(current instanceof HTMLElement)) {
          return true
        }
        nextTabbable(current, event.shiftKey)?.focus()
        return true
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor])

  return null
}

function ValueSyncPlugin({
  onBlur,
  onChange,
  value,
}: {
  readonly onBlur?: () => void
  readonly onChange?: (value: string) => void
  readonly value: string
}) {
  const [editor] = useLexicalComposerContext()
  const lastEmittedRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)

  useEffect(() => {
    onChangeRef.current = onChange
    onBlurRef.current = onBlur
  }, [onBlur, onChange])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (editor.isComposing()) {
        return
      }
      editorState.read(() => {
        const next = $exportPlainText()
        if (next === lastEmittedRef.current) {
          return
        }
        lastEmittedRef.current = next
        onChangeRef.current?.(next)
      })
    })
  }, [editor])

  useEffect(() => {
    if (value === lastEmittedRef.current || editor.isComposing()) {
      return
    }
    editor.update(
      () => {
        $importPlainText(value)
      },
      { tag: HISTORY_MERGE_TAG }
    )
    lastEmittedRef.current = value
  }, [editor, value])

  useEffect(() => {
    const attachBlur = (rootElement: HTMLElement | null) => {
      if (rootElement === null) {
        return () => undefined
      }
      const handleBlur = () => {
        onBlurRef.current?.()
      }
      rootElement.addEventListener("blur", handleBlur)
      return () => {
        rootElement.removeEventListener("blur", handleBlur)
      }
    }
    let detach = attachBlur(editor.getRootElement())
    const unregister = editor.registerRootListener((rootElement) => {
      detach()
      detach = attachBlur(rootElement)
    })
    return () => {
      unregister()
      detach()
    }
  }, [editor])

  return null
}

function nextTabbable(
  current: HTMLElement,
  shift: boolean
): HTMLElement | null {
  const tabbables = [
    ...document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'
    ),
  ].filter((element) => element.offsetParent !== null || element === current)
  let index = -1
  for (const [candidateIndex, element] of tabbables.entries()) {
    if (element === current || element.contains(current)) {
      index = candidateIndex
    }
  }
  if (index < 0) {
    return null
  }
  const nextIndex = shift ? index - 1 : index + 1
  return tabbables[nextIndex] ?? null
}
