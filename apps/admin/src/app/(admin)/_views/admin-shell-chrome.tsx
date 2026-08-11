"use client"

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

import {
  resolveAdminShellChrome,
  type AdminShellBreadcrumbItem,
  type AdminShellChromeValue,
} from "@/app/(admin)/_views/admin-navigation"

type BreadcrumbNavigateHandler = (
  href: string,
  modifiers: {
    readonly altKey: boolean
    readonly ctrlKey: boolean
    readonly metaKey: boolean
    readonly shiftKey: boolean
  }
) => boolean

type AdminShellChromeOverride = {
  readonly breadcrumb?: readonly AdminShellBreadcrumbItem[]
  readonly pathname: string
  readonly title: string
}

type AdminShellChromeState = AdminShellChromeValue & {
  readonly onBreadcrumbNavigate: BreadcrumbNavigateHandler | null
}

type AdminShellChromeDispatch = {
  readonly clearOverride: (pathname: string) => void
  readonly setBreadcrumbNavigate: (
    pathname: string,
    handler: BreadcrumbNavigateHandler | null
  ) => void
  readonly setOverride: (override: AdminShellChromeOverride) => void
}

const AdminShellChromeStateContext =
  createContext<AdminShellChromeState | null>(null)

const AdminShellChromeDispatchContext =
  createContext<AdminShellChromeDispatch | null>(null)

export function AdminShellChromeProvider({
  children,
}: {
  readonly children: ReactNode
}) {
  const pathname = usePathname()
  const [override, setOverride] = useState<AdminShellChromeOverride | null>(
    null
  )
  const breadcrumbNavigateRef = useRef<{
    handler: BreadcrumbNavigateHandler | null
    pathname: string
  }>({ handler: null, pathname })

  const setChromeOverride = useCallback((next: AdminShellChromeOverride) => {
    setOverride(next)
  }, [])

  const clearOverride = useCallback((targetPathname: string) => {
    setOverride((current) => {
      if (current === null || current.pathname !== targetPathname) {
        return current
      }
      return null
    })
  }, [])

  const setBreadcrumbNavigate = useCallback(
    (targetPathname: string, handler: BreadcrumbNavigateHandler | null) => {
      breadcrumbNavigateRef.current = {
        handler,
        pathname: targetPathname,
      }
    },
    []
  )

  const dispatch = useMemo(
    (): AdminShellChromeDispatch => ({
      clearOverride,
      setBreadcrumbNavigate,
      setOverride: setChromeOverride,
    }),
    [clearOverride, setBreadcrumbNavigate, setChromeOverride]
  )

  const chrome = useMemo((): AdminShellChromeState => {
    const defaults = resolveAdminShellChrome(pathname)
    const activeOverride =
      override !== null && override.pathname === pathname ? override : null

    const onBreadcrumbNavigate: BreadcrumbNavigateHandler | null = (
      href,
      modifiers
    ) => {
      const registered = breadcrumbNavigateRef.current
      if (registered.pathname !== pathname || registered.handler === null) {
        return true
      }
      return registered.handler(href, modifiers)
    }

    if (activeOverride === null) {
      return {
        ...defaults,
        onBreadcrumbNavigate: null,
      }
    }

    if (activeOverride.breadcrumb === undefined) {
      return {
        onBreadcrumbNavigate,
        title: activeOverride.title,
      }
    }

    return {
      breadcrumb: activeOverride.breadcrumb,
      onBreadcrumbNavigate,
      title: activeOverride.title,
    }
  }, [override, pathname])

  return (
    <AdminShellChromeDispatchContext.Provider value={dispatch}>
      <AdminShellChromeStateContext.Provider value={chrome}>
        {children}
      </AdminShellChromeStateContext.Provider>
    </AdminShellChromeDispatchContext.Provider>
  )
}

export function useAdminShellChromeValue() {
  const chrome = useContext(AdminShellChromeStateContext)
  if (chrome === null) {
    throw new Error(
      "useAdminShellChromeValue must be used within AdminShellChromeProvider."
    )
  }
  return chrome
}

export function useAdminShellChrome(chrome: {
  readonly breadcrumb?: readonly AdminShellBreadcrumbItem[]
  readonly onBreadcrumbNavigate?: BreadcrumbNavigateHandler
  readonly title: string
}) {
  const pathname = usePathname()
  const dispatch = useContext(AdminShellChromeDispatchContext)
  if (dispatch === null) {
    throw new Error(
      "useAdminShellChrome must be used within AdminShellChromeProvider."
    )
  }

  const breadcrumbKey = JSON.stringify(chrome.breadcrumb ?? null)
  const onBreadcrumbNavigate = chrome.onBreadcrumbNavigate

  useLayoutEffect(() => {
    dispatch.setBreadcrumbNavigate(pathname, onBreadcrumbNavigate ?? null)
  }, [dispatch, onBreadcrumbNavigate, pathname])

  useLayoutEffect(() => {
    if (chrome.breadcrumb === undefined) {
      dispatch.setOverride({
        pathname,
        title: chrome.title,
      })
    } else {
      dispatch.setOverride({
        breadcrumb: chrome.breadcrumb,
        pathname,
        title: chrome.title,
      })
    }

    return () => {
      dispatch.clearOverride(pathname)
      dispatch.setBreadcrumbNavigate(pathname, null)
    }
  }, [breadcrumbKey, chrome.breadcrumb, chrome.title, dispatch, pathname])
}
