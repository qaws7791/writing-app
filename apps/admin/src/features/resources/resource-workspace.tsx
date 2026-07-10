"use client"

import type { ReactNode } from "react"
import { useCallback, useMemo, useState, useSyncExternalStore } from "react"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"

import { createBrowserResourceLibraryApi } from "@/features/resources/resource-library-api"
import {
  ResourceTree,
  type InitialResourceTreeState,
} from "@/features/resources/tree/resource-tree"
import type { AdminResourceTreeScope } from "@/lib/api/admin-api"
import type { AdminApiBaseUrl } from "@/runtime-config"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/ui/drawer"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/ui/resizable"
import { Spinner } from "@workspace/ui/components/ui/spinner"

const desktopMediaQuery = "(min-width: 768px)"

export function ResourceWorkspace({
  adminId,
  apiBaseUrl,
  children,
  initialTree,
}: {
  readonly adminId: string
  readonly apiBaseUrl: AdminApiBaseUrl
  readonly children: ReactNode
  readonly initialTree: InitialResourceTreeState
}) {
  const api = useMemo(
    () => createBrowserResourceLibraryApi(apiBaseUrl),
    [apiBaseUrl]
  )
  const isDesktop = useSyncExternalStore<boolean | null>(
    subscribeDesktopMediaQuery,
    readDesktopMediaQuery,
    () => null
  )
  const params = useParams<{ documentId?: string | string[] }>()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isMobileTreeOpen, setIsMobileTreeOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isInitialActiveTreeAvailable, setIsInitialActiveTreeAvailable] =
    useState(true)
  const consumeInitialActiveTree = useCallback(() => {
    setIsInitialActiveTreeAvailable(false)
  }, [])
  const documentId = Array.isArray(params.documentId)
    ? params.documentId[0]
    : params.documentId
  const scope: AdminResourceTreeScope =
    pathname === "/resources/trash" || searchParams.get("scope") === "trash"
      ? "trash"
      : "active"
  function renderSidebar(toolbarEnd?: ReactNode) {
    return (
      <ResourceTree
        adminId={adminId}
        api={api}
        initialTree={
          scope === "active" && isInitialActiveTreeAvailable
            ? initialTree
            : undefined
        }
        key={scope}
        onInitialTreeConsumed={consumeInitialActiveTree}
        onDocumentOpen={() => {
          setIsMobileTreeOpen(false)
        }}
        scope={scope}
        selectedDocumentId={documentId}
        toolbarEnd={toolbarEnd}
      />
    )
  }

  if (isDesktop === null) {
    return (
      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        role="status"
      >
        <Spinner aria-hidden="true" />
        <span className="ml-2 text-sm text-muted-foreground">
          자료실 화면을 준비하는 중입니다.
        </span>
      </div>
    )
  }

  if (!isDesktop) {
    return (
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <Button
          aria-label="자료 트리 열기"
          className="absolute top-3 left-3 z-20 shadow-sm"
          onClick={() => {
            setIsMobileTreeOpen(true)
          }}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <MenuIcon aria-hidden="true" />
        </Button>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        <Drawer
          onOpenChange={setIsMobileTreeOpen}
          open={isMobileTreeOpen}
          swipeDirection="left"
        >
          <DrawerContent>
            <DrawerHeader className="sr-only">
              <DrawerTitle>자료 트리</DrawerTitle>
            </DrawerHeader>
            {renderSidebar()}
          </DrawerContent>
        </Drawer>
      </div>
    )
  }

  if (isSidebarCollapsed) {
    return (
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-12 shrink-0 justify-center border-r border-border bg-surface/40 pt-3">
          <Button
            aria-label="자료 트리 펼치기"
            onClick={() => {
              setIsSidebarCollapsed(false)
            }}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <PanelLeftOpenIcon aria-hidden="true" />
          </Button>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    )
  }

  return (
    <ResizablePanelGroup className="min-h-0 flex-1" orientation="horizontal">
      <ResizablePanel defaultSize="24%" maxSize="36rem" minSize="18rem">
        <aside className="h-full border-r border-border">
          {renderSidebar(
            <Button
              aria-label="자료 트리 접기"
              onClick={() => {
                setIsSidebarCollapsed(true)
              }}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <PanelLeftCloseIcon aria-hidden="true" />
            </Button>
          )}
        </aside>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="76%" minSize="30rem">
        <main className="h-full min-w-0 overflow-y-auto">{children}</main>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function subscribeDesktopMediaQuery(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(desktopMediaQuery)
  mediaQuery.addEventListener("change", onChange)
  return () => {
    mediaQuery.removeEventListener("change", onChange)
  }
}

function readDesktopMediaQuery(): boolean {
  return window.matchMedia(desktopMediaQuery).matches
}
