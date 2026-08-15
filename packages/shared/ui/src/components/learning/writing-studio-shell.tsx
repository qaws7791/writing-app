"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react"

import { XIcon } from "#ui/components/icons/control-icons"
import { Button } from "#ui/components/primitives/button"
import { cn } from "#ui/lib/utils"

const STUDIO_WIDE_MIN_WIDTH_PX = 1024
const KEYBOARD_INSET_PX = 80
const COMPANION_TITLE_ID = "writing-studio-companion-title"
const COMPANION_EXIT_DURATION_MS = 240

const CHROME_CLUSTER_CLASS =
  "pointer-events-auto flex min-w-0 items-center gap-2 rounded-full border border-border/40 bg-popover px-2 py-1.5 shadow-2xs supports-backdrop-filter:bg-popover/85 supports-backdrop-filter:backdrop-blur-2xl"

export const writingStudioCanvasContentClassName =
  "mx-auto w-full max-w-3xl pt-[4.75rem] pb-[max(5.75rem,env(safe-area-inset-bottom))] sm:pt-[4.75rem] sm:pb-[max(5.75rem,env(safe-area-inset-bottom))] lg:pt-20 lg:pb-10"

export const writingStudioCanvasPlaceholderClassName =
  "pt-[4.75rem] sm:pt-[4.75rem] lg:pt-20"

export function WritingStudioShell({
  children,
  className,
  companion,
  companionDescription,
  companionTitle,
  editorId = "writing-studio-editor",
  footer,
  headerCenter,
  headerEnd,
  headerStart,
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
  readonly headerCenter?: ReactNode
  readonly headerEnd: ReactNode
  readonly headerStart: ReactNode
  readonly notice?: ReactNode
  readonly onCompanionClose?: () => void
}) {
  const hasCompanion = companion !== undefined && companion !== null
  const { content, isMounted, isOpen } = useCompanionPresence({
    companion,
    description: companionDescription,
    title: companionTitle,
  })
  const layout = useStudioLayout()
  const peek = hasCompanion && layout.keyboardPeek
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
    if (!layout.keyboardPeek) titleRef.current?.focus()
  }, [companionTitle, editorId, hasCompanion, layout.keyboardPeek])

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
        "relative isolate min-h-0 w-full bg-background text-foreground",
        layout.viewportHeight === null ? "h-dvh" : null,
        className
      )}
      data-slot="writing-studio-shell"
      style={studioViewportStyle(layout)}
    >
      <div
        className={cn(
          "flex h-full min-h-0 w-full flex-col overflow-hidden",
          isMounted && "lg:flex-row"
        )}
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {children}
          <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
            <div className="relative flex min-w-0 items-start justify-between gap-2">
              <StudioChromeCluster className="max-w-[calc(100%-5.5rem)] overflow-hidden lg:max-w-[calc(50%-1rem)]">
                {headerStart}
              </StudioChromeCluster>
              {headerCenter === undefined || headerCenter === null ? null : (
                <div className="pointer-events-none absolute inset-x-0 top-0 hidden justify-center lg:flex">
                  <StudioChromeCluster>{headerCenter}</StudioChromeCluster>
                </div>
              )}
              <StudioChromeCluster className="shrink-0">
                {headerEnd}
              </StudioChromeCluster>
            </div>
          </header>
          {notice === undefined || notice === null ? null : (
            <div className="pointer-events-none absolute inset-x-0 top-[4.75rem] z-20 px-4 sm:px-6">
              <div className="pointer-events-auto mx-auto max-w-3xl">
                {notice}
              </div>
            </div>
          )}
          <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
            <StudioChromeCluster className="mx-auto w-full max-w-3xl gap-3 px-3 py-2">
              {footer}
            </StudioChromeCluster>
          </footer>
        </div>
        {isMounted &&
        content.companion !== null &&
        content.companion !== undefined ? (
          <StudioCompanionPane
            isOpen={isOpen}
            peek={peek}
            title={content.title}
            titleRef={titleRef}
            {...(content.description === undefined
              ? {}
              : { description: content.description })}
            {...(onCompanionClose === undefined
              ? {}
              : { onClose: onCompanionClose })}
          >
            {content.companion}
          </StudioCompanionPane>
        ) : null}
      </div>
    </div>
  )
}

type CompanionContent = {
  readonly companion: ReactNode
  readonly description?: string | undefined
  readonly title: string
}

function useCompanionPresence({
  companion,
  description,
  title,
}: {
  readonly companion?: ReactNode
  readonly description?: string | undefined
  readonly title?: string | undefined
}) {
  const hasCompanion = companion !== undefined && companion !== null
  const [isMounted, setIsMounted] = useState(hasCompanion)
  const [isOpen, setIsOpen] = useState(false)
  const [cachedContent, setCachedContent] = useState<CompanionContent>(() => ({
    companion: companion ?? null,
    description,
    title: title ?? "과제",
  }))

  const nextTitle = title ?? "과제"

  if (hasCompanion && !isMounted) {
    setIsMounted(true)
  }

  if (
    hasCompanion &&
    (cachedContent.companion !== companion ||
      cachedContent.description !== description ||
      cachedContent.title !== nextTitle)
  ) {
    setCachedContent({
      companion,
      description,
      title: nextTitle,
    })
  }

  useEffect(() => {
    if (hasCompanion) {
      const frame = requestAnimationFrame(() => {
        setIsOpen(true)
      })
      return () => cancelAnimationFrame(frame)
    }

    const timer = setTimeout(() => {
      setIsMounted(false)
    }, COMPANION_EXIT_DURATION_MS)

    const frame = requestAnimationFrame(() => {
      setIsOpen(false)
    })

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [hasCompanion])

  return {
    content: hasCompanion
      ? { companion, description, title: nextTitle }
      : cachedContent,
    isMounted,
    isOpen,
  }
}

function StudioChromeCluster({
  children,
  className,
}: {
  readonly children: ReactNode
  readonly className?: string
}) {
  return <div className={cn(CHROME_CLUSTER_CLASS, className)}>{children}</div>
}

function StudioCompanionPane({
  children,
  description,
  isOpen,
  onClose,
  peek,
  title,
  titleRef,
}: {
  readonly children: ReactNode
  readonly description?: string | undefined
  readonly isOpen: boolean
  readonly onClose?: () => void
  readonly peek: boolean
  readonly title: string
  readonly titleRef: RefObject<HTMLHeadingElement | null>
}) {
  return (
    <aside
      aria-label={title}
      className={cn(
        "flex min-h-0 min-w-0 shrink-0 flex-col border-t border-border/40 bg-card",
        "will-change-transform motion-reduce:animate-none motion-reduce:transition-none",
        "transition-[height] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]",
        isOpen ? "animate-slide-up" : "animate-slide-down pointer-events-none",
        "lg:h-full lg:w-[min(22rem,38%)] lg:border-t-0 lg:border-l lg:animate-none lg:pointer-events-auto",
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

type StudioLayout = {
  readonly keyboardPeek: boolean
  readonly viewportHeight: number | null
  readonly viewportOffsetTop: number
}

const STUDIO_LAYOUT_WIDE: StudioLayout = {
  keyboardPeek: false,
  viewportHeight: null,
  viewportOffsetTop: 0,
}

let cachedStudioLayout: StudioLayout = STUDIO_LAYOUT_WIDE

function useStudioLayout(): StudioLayout {
  return useSyncExternalStore(
    subscribeStudioViewport,
    readStudioLayout,
    readStudioLayoutServer
  )
}

function subscribeStudioViewport(onStoreChange: () => void) {
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

function readStudioLayout(): StudioLayout {
  const next = measureStudioLayout()
  if (isSameStudioLayout(cachedStudioLayout, next)) {
    return cachedStudioLayout
  }
  cachedStudioLayout = next
  return cachedStudioLayout
}

function measureStudioLayout(): StudioLayout {
  const isWide = window.matchMedia(
    `(min-width: ${STUDIO_WIDE_MIN_WIDTH_PX}px)`
  ).matches
  if (isWide) return STUDIO_LAYOUT_WIDE

  const viewport = window.visualViewport
  const visualHeight = viewport?.height ?? window.innerHeight
  return {
    keyboardPeek: window.innerHeight - visualHeight > KEYBOARD_INSET_PX,
    viewportHeight: visualHeight,
    viewportOffsetTop: viewport?.offsetTop ?? 0,
  }
}

function isSameStudioLayout(left: StudioLayout, right: StudioLayout) {
  return (
    left.keyboardPeek === right.keyboardPeek &&
    left.viewportHeight === right.viewportHeight &&
    left.viewportOffsetTop === right.viewportOffsetTop
  )
}

function readStudioLayoutServer(): StudioLayout {
  return STUDIO_LAYOUT_WIDE
}

function studioViewportStyle(layout: StudioLayout): CSSProperties | undefined {
  if (layout.viewportHeight === null) return undefined
  return {
    height: layout.viewportHeight,
    transform:
      layout.viewportOffsetTop === 0
        ? undefined
        : `translateY(${layout.viewportOffsetTop}px)`,
  }
}
