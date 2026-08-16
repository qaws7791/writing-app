"use client"

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react"

import { XIcon } from "#ui/components/icons/control-icons"
import { Button } from "#ui/components/primitives/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "#ui/components/primitives/drawer"
import { cn } from "#ui/lib/utils"
import {
  COMPANION_SNAP_FRACTIONS,
  COMPANION_SNAP_POINTS,
  companionSnapFromPoint,
  stepCompanionSnap,
} from "./companion-snap"

const STUDIO_WIDE_MIN_WIDTH_PX = 1024
const KEYBOARD_INSET_PX = 80
const COMPANION_PANE_ID = "writing-studio-companion"
const COMPANION_TITLE_ID = "writing-studio-companion-title"
const COMPANION_EXIT_DURATION_MS = 450

export const writingStudioCanvasContentClassName =
  "mx-auto w-full max-w-3xl pt-5 pb-[max(5.75rem,env(safe-area-inset-bottom))] sm:pt-6 sm:pb-[max(5.75rem,env(safe-area-inset-bottom))] lg:pt-8 lg:pb-10"

export const writingStudioCanvasPlaceholderClassName = "pt-5 sm:pt-6 lg:pt-8"

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
  const isWide = layout.viewportHeight === null
  const [snapPoint, setSnapPoint] = useState<number>(
    COMPANION_SNAP_FRACTIONS.split
  )
  const titleRef = useRef<HTMLHeadingElement>(null)
  const previousTitleRef = useRef<string | null>(null)
  const drawerOpen = isOpen && !isWide && !peek

  useEffect(() => {
    if (!hasCompanion) {
      if (previousTitleRef.current !== null) {
        document.getElementById(editorId)?.focus()
      }
      previousTitleRef.current = null
      return
    }

    const nextTitle = companionTitle ?? ""
    if (previousTitleRef.current !== nextTitle) {
      previousTitleRef.current = nextTitle
      if (!layout.keyboardPeek) titleRef.current?.focus()
    }
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
          isMounted && isWide && "flex-row"
        )}
      >
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-30 shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
            <div className="mx-auto flex h-12 w-full items-center justify-between gap-2.5 px-3 sm:px-4">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                {headerStart}
              </div>
              {headerCenter === undefined || headerCenter === null ? null : (
                <div className="hidden shrink-0 items-center justify-center lg:flex">
                  {headerCenter}
                </div>
              )}
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                {headerEnd}
              </div>
            </div>
          </header>
          {notice === undefined || notice === null ? null : (
            <div className="pointer-events-none absolute inset-x-0 top-[calc(3rem+env(safe-area-inset-top,0px))] z-[60] px-4 pt-2 sm:px-6">
              <div className="pointer-events-auto mx-auto max-w-3xl">
                {notice}
              </div>
            </div>
          )}
          {children}
          <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
              {footer}
            </div>
          </footer>
        </div>
        {peek ? <StudioCompanionPeek title={content.title} /> : null}
        {isMounted &&
        isWide &&
        content.companion !== null &&
        content.companion !== undefined ? (
          <StudioCompanionDock
            isOpen={isOpen}
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
          </StudioCompanionDock>
        ) : null}
      </div>
      {isMounted &&
      !isWide &&
      content.companion !== null &&
      content.companion !== undefined ? (
        <StudioCompanionDrawer
          onSnapPointChange={setSnapPoint}
          open={drawerOpen}
          peek={peek}
          snapPoint={snapPoint}
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
        </StudioCompanionDrawer>
      ) : null}
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

function StudioCompanionPeek({ title }: { readonly title: string }) {
  return (
    <div className="z-30 flex h-11 shrink-0 items-center border-t border-border/40 bg-card px-2 lg:hidden">
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
    </div>
  )
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const name = target.tagName
  return name === "INPUT" || name === "TEXTAREA" || name === "SELECT"
}

function StudioCompanionDock({
  children,
  description,
  isOpen,
  onClose,
  title,
  titleRef,
}: {
  readonly children: ReactNode
  readonly description?: string | undefined
  readonly isOpen: boolean
  readonly onClose?: () => void
  readonly title: string
  readonly titleRef: RefObject<HTMLHeadingElement | null>
}) {
  return (
    <aside
      aria-hidden={!isOpen}
      aria-label={title}
      className={cn(
        "relative z-10 hidden min-h-0 min-w-0 shrink-0 flex-col overflow-hidden bg-card transition-[width,opacity,border-color] lg:flex lg:h-full",
        isOpen
          ? "w-[min(22rem,38%)] border-l border-border/40 opacity-100 duration-320 ease-quiet"
          : "w-0 border-l border-transparent opacity-0 duration-240 ease-quiet-in pointer-events-none"
      )}
      data-slot="writing-studio-companion"
      data-state={isOpen ? "open" : "closed"}
      id={COMPANION_PANE_ID}
      inert={!isOpen ? true : undefined}
    >
      <div
        className={cn(
          "flex h-full min-h-0 w-[min(22rem,calc(100vw*0.38))] flex-col transition-transform",
          isOpen
            ? "translate-x-0 duration-320 ease-quiet"
            : "translate-x-3 duration-240 ease-quiet-in"
        )}
      >
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
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">{children}</div>
      </div>
    </aside>
  )
}

function StudioCompanionDrawer({
  children,
  description,
  onClose,
  onSnapPointChange,
  open,
  peek,
  snapPoint,
  title,
  titleRef,
}: {
  readonly children: ReactNode
  readonly description?: string | undefined
  readonly onClose?: () => void
  readonly onSnapPointChange: (point: number) => void
  readonly open: boolean
  readonly peek: boolean
  readonly snapPoint: number
  readonly title: string
  readonly titleRef: RefObject<HTMLHeadingElement | null>
}) {
  const snap = companionSnapFromPoint(snapPoint)

  const handleSnapKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (isEditableKeyboardTarget(event.target)) return
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault()
      onSnapPointChange(COMPANION_SNAP_FRACTIONS[stepCompanionSnap(snap, 1)])
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault()
      if (snap === "compact") {
        onSnapPointChange(COMPANION_SNAP_FRACTIONS.split)
        if (onClose !== undefined) onClose()
        return
      }
      onSnapPointChange(COMPANION_SNAP_FRACTIONS[stepCompanionSnap(snap, -1)])
      return
    }
    if (event.key === "Home") {
      event.preventDefault()
      onSnapPointChange(COMPANION_SNAP_FRACTIONS.compact)
      return
    }
    if (event.key === "End") {
      event.preventDefault()
      onSnapPointChange(COMPANION_SNAP_FRACTIONS.read)
    }
  }

  return (
    <Drawer
      disablePointerDismissal
      modal={false}
      onOpenChange={(nextOpen) => {
        if (nextOpen || peek || onClose === undefined) return
        onSnapPointChange(COMPANION_SNAP_FRACTIONS.split)
        onClose()
      }}
      onSnapPointChange={(point) => {
        if (typeof point === "number") onSnapPointChange(point)
      }}
      open={open}
      showSwipeHandle
      snapPoint={snapPoint}
      snapPoints={COMPANION_SNAP_POINTS}
      snapToSequentialPoints
      swipeDirection="down"
    >
      <DrawerContent
        aria-labelledby={COMPANION_TITLE_ID}
        className="rounded-t-5xl rounded-b-none border-x-0 border-b-0 bg-card [--drawer-inset:0px] lg:hidden"
        id={COMPANION_PANE_ID}
        onKeyDown={handleSnapKeyDown}
      >
        <div
          className="flex min-h-0 flex-1 flex-col"
          data-size={snap}
          data-slot="writing-studio-companion"
        >
          <DrawerHeader className="gap-0.5 p-4 pt-1 pb-3 text-left">
            <DrawerTitle
              className="font-heading text-base leading-6 font-semibold tracking-[-0.014em]"
              id={COMPANION_TITLE_ID}
              ref={titleRef}
              tabIndex={-1}
            >
              {title}
            </DrawerTitle>
            {description === undefined || description === "" ? null : (
              <DrawerDescription className="text-sm leading-6 text-pretty text-left">
                {description}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div
            className="min-h-0 flex-1 overflow-auto px-4 py-4 pb-[max(5.75rem,env(safe-area-inset-bottom))]"
            data-base-ui-swipe-ignore=""
          >
            {children}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
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
