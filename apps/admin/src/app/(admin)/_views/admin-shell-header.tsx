"use client"

import Link from "next/link"
import type { MouseEvent, ReactNode } from "react"

import { useAdminShellChromeValue } from "@/app/(admin)/_views/admin-shell-chrome"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/ui/breadcrumb"
import { SidebarTrigger } from "@workspace/ui/components/ui/sidebar"

export function AdminShellHeader() {
  const { breadcrumb, onBreadcrumbNavigate, title } = useAdminShellChromeValue()
  const hasBreadcrumb = Boolean(breadcrumb?.length)

  return (
    <header
      data-slot="admin-shell-header"
      className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/90 px-3 backdrop-blur-xl @[40rem]/admin-shell:h-15 @[40rem]/admin-shell:gap-3 @[40rem]/admin-shell:px-5 @[56rem]/admin-shell:gap-4 @[56rem]/admin-shell:px-6"
    >
      <SidebarTrigger aria-label="사이드바 전환" className="shrink-0" />

      <div className="min-w-0 flex-1">
        {hasBreadcrumb ? (
          <>
            <h1 className="sr-only">{title}</h1>
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-wrap gap-1 @[40rem]/admin-shell:gap-1.5">
                {breadcrumb?.map((item) => {
                  if (item.href === undefined) {
                    return (
                      <BreadcrumbSegment
                        key={`${item.label}-page`}
                        label={item.label}
                        onNavigate={onBreadcrumbNavigate}
                      />
                    )
                  }

                  return (
                    <BreadcrumbSegment
                      key={`${item.label}-${item.href}`}
                      href={item.href}
                      label={item.label}
                      onNavigate={onBreadcrumbNavigate}
                    />
                  )
                })}
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="block truncate font-heading text-sm font-semibold tracking-[-0.02em] @[40rem]/admin-shell:text-base">
                    {title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </>
        ) : (
          <h1 className="truncate font-heading text-sm font-semibold tracking-[-0.02em] @[40rem]/admin-shell:text-base">
            {title}
          </h1>
        )}
      </div>
    </header>
  )
}

function BreadcrumbSegment({
  href,
  label,
  onNavigate,
}: {
  readonly href?: string
  readonly label: string
  readonly onNavigate:
    | ((
        href: string,
        modifiers: {
          readonly altKey: boolean
          readonly ctrlKey: boolean
          readonly metaKey: boolean
          readonly shiftKey: boolean
        }
      ) => boolean)
    | null
}) {
  let link: ReactNode

  if (href === undefined) {
    link = <span className="text-sm">{label}</span>
  } else {
    link = (
      <BreadcrumbLink
        className="text-sm"
        render={
          <Link
            href={href}
            prefetch={false}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => {
              if (onNavigate === null) return
              if (
                onNavigate(href, {
                  altKey: event.altKey,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                  shiftKey: event.shiftKey,
                })
              ) {
                return
              }
              event.preventDefault()
            }}
          />
        }
      >
        {label}
      </BreadcrumbLink>
    )
  }

  return (
    <>
      <BreadcrumbItem className="shrink-0">{link}</BreadcrumbItem>
      <BreadcrumbSeparator className="shrink-0" />
    </>
  )
}
