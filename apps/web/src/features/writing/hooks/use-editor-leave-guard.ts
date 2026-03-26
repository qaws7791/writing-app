"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type FlushPendingWritingResult = "blocked" | "noop" | "saved"

type PendingNavigationTarget =
  | {
      href: string
      kind: "href"
    }
  | {
      delta: number
      kind: "history"
    }

type UseEditorLeaveGuardOptions = {
  flushPendingWriting: () => Promise<FlushPendingWritingResult>
  hasPendingChanges: boolean
  navigate: (href: string) => void
  pathname: string
}

type UseEditorLeaveGuardResult = {
  cancelPendingNavigation: () => void
  confirmPendingNavigation: () => void
  isLeaveConfirmOpen: boolean
}

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

function findNavigableAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return null
  }

  const anchor = target.closest("a[href]")
  return anchor instanceof HTMLAnchorElement ? anchor : null
}

function toRelativeHref(url: URL) {
  return `${url.pathname}${url.search}${url.hash}`
}

export function useEditorLeaveGuard({
  flushPendingWriting,
  hasPendingChanges,
  navigate,
  pathname,
}: UseEditorLeaveGuardOptions): UseEditorLeaveGuardResult {
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)

  const flushPendingWritingRef = useRef(flushPendingWriting)
  const hasPendingChangesRef = useRef(hasPendingChanges)
  const navigateRef = useRef(navigate)
  const leaveInFlightRef = useRef(false)
  const pendingTargetRef = useRef<PendingNavigationTarget | null>(null)
  const skipGuardRef = useRef(false)
  const sentinelInstalledRef = useRef(false)

  flushPendingWritingRef.current = flushPendingWriting
  hasPendingChangesRef.current = hasPendingChanges
  navigateRef.current = navigate

  useEffect(() => {
    if (!hasPendingChanges) {
      sentinelInstalledRef.current = false
    }
  }, [hasPendingChanges])

  useEffect(() => {
    pendingTargetRef.current = null
    setIsLeaveConfirmOpen(false)
  }, [pathname])

  const navigateToTarget = useCallback((target: PendingNavigationTarget) => {
    pendingTargetRef.current = null
    setIsLeaveConfirmOpen(false)

    if (target.kind === "href") {
      skipGuardRef.current = true
      navigateRef.current(target.href)
      window.setTimeout(() => {
        skipGuardRef.current = false
      }, 0)
      return
    }

    skipGuardRef.current = true
    window.history.go(target.delta)
  }, [])

  const attemptLeave = useCallback(
    async (target: PendingNavigationTarget) => {
      if (leaveInFlightRef.current) {
        return
      }

      leaveInFlightRef.current = true

      try {
        const result = await flushPendingWritingRef.current()

        if (result !== "blocked" || !hasPendingChangesRef.current) {
          navigateToTarget(target)
          return
        }

        pendingTargetRef.current = target
        setIsLeaveConfirmOpen(true)
      } catch {
        pendingTargetRef.current = target
        setIsLeaveConfirmOpen(true)
      } finally {
        leaveInFlightRef.current = false
      }
    },
    [navigateToTarget]
  )

  const cancelPendingNavigation = useCallback(() => {
    pendingTargetRef.current = null
    setIsLeaveConfirmOpen(false)
  }, [])

  const confirmPendingNavigation = useCallback(() => {
    const target = pendingTargetRef.current

    if (!target) {
      setIsLeaveConfirmOpen(false)
      return
    }

    navigateToTarget(target)
  }, [navigateToTarget])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        skipGuardRef.current ||
        !hasPendingChangesRef.current ||
        event.defaultPrevented ||
        event.button !== 0 ||
        isModifiedClick(event)
      ) {
        return
      }

      const anchor = findNavigableAnchor(event.target)
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return
      }

      const nextUrl = new URL(anchor.href, window.location.href)
      const currentUrl = new URL(window.location.href)

      if (nextUrl.origin !== currentUrl.origin) {
        return
      }

      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search
      ) {
        return
      }

      event.preventDefault()
      void attemptLeave({
        href: toRelativeHref(nextUrl),
        kind: "href",
      })
    }

    document.addEventListener("click", handleDocumentClick, true)

    return () => {
      document.removeEventListener("click", handleDocumentClick, true)
    }
  }, [attemptLeave, pathname])

  useEffect(() => {
    if (!hasPendingChanges) {
      return
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasPendingChangesRef.current) {
        return
      }

      void flushPendingWritingRef.current()
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasPendingChanges, pathname])

  useEffect(() => {
    if (!hasPendingChanges || typeof window === "undefined") {
      return
    }

    if (!sentinelInstalledRef.current) {
      window.history.pushState(
        {
          ...window.history.state,
          __editorLeaveGuard: true,
        },
        "",
        window.location.href
      )
      sentinelInstalledRef.current = true
    }

    function handlePopState() {
      if (skipGuardRef.current) {
        skipGuardRef.current = false
        return
      }

      if (!hasPendingChangesRef.current) {
        sentinelInstalledRef.current = false
        return
      }

      window.history.pushState(
        {
          ...window.history.state,
          __editorLeaveGuard: true,
        },
        "",
        window.location.href
      )

      void attemptLeave({
        delta: -1,
        kind: "history",
      })
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [attemptLeave, hasPendingChanges, pathname])

  return {
    cancelPendingNavigation,
    confirmPendingNavigation,
    isLeaveConfirmOpen,
  }
}
