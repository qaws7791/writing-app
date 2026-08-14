"use client"

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react"

import { XIcon } from "#ui/components/icons/control-icons"
import { Button } from "#ui/components/primitives/button"
import { cn } from "#ui/lib/utils"

const STUDIO_WIDE_MIN_WIDTH_PX = 1024
const KEYBOARD_INSET_PX = 80
const COMPANION_TITLE_ID = "writing-studio-companion-title"

export function WritingStudioShell({
  children,
  className,
  companion,
  companionDescription,
  companionTitle,
  editorId = "writing-studio-editor",
  footer,
  header,
  notice,
  onCompanionClose,
}: {
  readonly children: ReactNode
  readonly className?: string
  readonly companion?: ReactNode
  readonly companionDescription?: string
  readonly companionTitle?: string
  readonly editorId?: string
  readonly footer: ReactNode
  readonly header: ReactNode
  readonly notice?: ReactNode
  readonly onCompanionClose?: () => void
}) {
  const hasCompanion = companion !== undefined && companion !== null
  const keyboardPeek = useStudioKeyboardPeek()
  const peek = hasCompanion && keyboardPeek
  const titleRef = useRef<HTMLHeadingElement>(null)
  const previousTitleRef = useRef<string | null>(null)

  useEffect(() => {
    if (!hasCompanion) {
      if (previousTitleRef.current !== null) {
        document.getElementById(editorId)?.focus()
      }
      previousTitleRef.current = null
      return
    }

    const nextTitle = companionTitle ?? ""
    if (previousTitleRef.current === nextTitle) return
    previousTitleRef.current = nextTitle
    if (!keyboardPeek) titleRef.current?.focus()
  }, [companionTitle, editorId, hasCompanion, keyboardPeek])

  useEffect(() => {
    if (!hasCompanion || onCompanionClose === undefined) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (event.defaultPrevented) return
      if (document.querySelector('[role="alertdialog"]')) return
      event.preventDefault()
      onCompanionClose()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [hasCompanion, onCompanionClose])

  return (
    <div
      className={cn(
        "relative isolate h-dvh min-h-0 w-full bg-background text-foreground",
        className
      )}
      data-slot="writing-studio-shell"
    >
      <div className="h-full min-h-0 px-4 pt-[4.75rem] pb-[max(5.75rem,env(safe-area-inset-bottom))] lg:px-6 lg:pt-20 lg:pb-6">
        <div
          className={cn(
            "mx-auto flex h-full min-h-0 w-full flex-col overflow-hidden rounded-4xl border border-border/40 bg-card has-[:focus-visible]:border-border sm:rounded-5xl",
            hasCompanion ? "max-w-5xl lg:flex-row" : "max-w-3xl"
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
          {hasCompanion ? (
            <StudioCompanionPane
              peek={peek}
              title={companionTitle ?? "과제"}
              titleRef={titleRef}
              {...(companionDescription === undefined
                ? {}
                : { description: companionDescription })}
              {...(onCompanionClose === undefined
                ? {}
                : { onClose: onCompanionClose })}
            >
              {companion}
            </StudioCompanionPane>
          ) : null}
        </div>
      </div>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <div className="pointer-events-auto mx-auto flex max-w-5xl items-center gap-2 rounded-full border border-border/40 bg-card px-2 py-1.5 shadow-2xs">
          {header}
        </div>
      </header>
      {notice === undefined || notice === null ? null : (
        <div className="pointer-events-none absolute inset-x-0 top-[4.75rem] z-20 px-4 sm:px-6">
          <div className="pointer-events-auto mx-auto max-w-3xl">{notice}</div>
        </div>
      )}
      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-3 rounded-full border border-border/40 bg-card px-3 py-2 shadow-2xs">
          {footer}
        </div>
      </footer>
    </div>
  )
}

function StudioCompanionPane({
  children,
  description,
  onClose,
  peek,
  title,
  titleRef,
}: {
  readonly children: ReactNode
  readonly description?: string
  readonly onClose?: () => void
  readonly peek: boolean
  readonly title: string
  readonly titleRef: RefObject<HTMLHeadingElement | null>
}) {
  return (
    <aside
      aria-label={title}
      className={cn(
        "flex min-h-0 min-w-0 shrink-0 flex-col border-t border-border/40 bg-card lg:h-full lg:w-[min(22rem,38%)] lg:border-t-0 lg:border-l",
        peek ? "h-11" : "h-[40%]"
      )}
      data-size={peek ? "peek" : "split"}
      data-slot="writing-studio-companion"
    >
      {peek ? (
        <div className="flex h-11 min-w-0 items-center gap-1 px-2">
          <button
            aria-label="패널 펼치기"
            className="min-w-0 flex-1 truncate rounded-xl px-2 py-1 text-left text-sm font-medium tracking-[-0.01em] outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
            onClick={() => {
              const active = document.activeElement
              if (active instanceof HTMLElement) active.blur()
            }}
            type="button"
          >
            {title}
          </button>
          {onClose === undefined ? null : (
            <Button
              aria-label="닫기"
              onClick={onClose}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <XIcon />
            </Button>
          )}
        </div>
      ) : (
        <>
          <header className="flex shrink-0 items-start gap-2 border-b border-border/70 px-4 py-3">
            <div className="min-w-0 flex-1">
              <h2
                className="font-heading text-base leading-6 font-semibold tracking-[-0.014em] text-foreground outline-none"
                id={COMPANION_TITLE_ID}
                ref={titleRef}
                tabIndex={-1}
              >
                {title}
              </h2>
              {description === undefined || description === "" ? null : (
                <p className="text-sm leading-6 text-pretty text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {onClose === undefined ? null : (
              <Button
                aria-label="닫기"
                className="text-muted-foreground hover:text-foreground"
                onClick={onClose}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <XIcon />
              </Button>
            )}
          </header>
          <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
            {children}
          </div>
        </>
      )}
    </aside>
  )
}

function useStudioKeyboardPeek(): boolean {
  return useSyncExternalStore(
    subscribeStudioKeyboardPeek,
    readStudioKeyboardPeek,
    readStudioKeyboardPeekServer
  )
}

function subscribeStudioKeyboardPeek(onStoreChange: () => void) {
  const media = window.matchMedia(`(min-width: ${STUDIO_WIDE_MIN_WIDTH_PX}px)`)
  media.addEventListener("change", onStoreChange)
  window.addEventListener("resize", onStoreChange)
  const viewport = window.visualViewport
  viewport?.addEventListener("resize", onStoreChange)
  viewport?.addEventListener("scroll", onStoreChange)
  return () => {
    media.removeEventListener("change", onStoreChange)
    window.removeEventListener("resize", onStoreChange)
    viewport?.removeEventListener("resize", onStoreChange)
    viewport?.removeEventListener("scroll", onStoreChange)
  }
}

function readStudioKeyboardPeek() {
  const isWide = window.matchMedia(
    `(min-width: ${STUDIO_WIDE_MIN_WIDTH_PX}px)`
  ).matches
  if (isWide) return false
  const visualHeight = window.visualViewport?.height ?? window.innerHeight
  return window.innerHeight - visualHeight > KEYBOARD_INSET_PX
}

function readStudioKeyboardPeekServer() {
  return false
}
