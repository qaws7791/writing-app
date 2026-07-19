"use client"

import { useState } from "react"
import { ChevronRightIcon, EllipsisIcon, InfoIcon } from "lucide-react"

import type { AdminResourceBreadcrumbItem } from "@/entities/resource-document/model/resource-document"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover"

export function ResourceBreadcrumb({
  currentName,
  path,
}: {
  readonly currentName: string
  readonly path: readonly AdminResourceBreadcrumbItem[]
}) {
  const [isExpandedPathOpen, setIsExpandedPathOpen] = useState(false)
  const shouldCollapse = path.length > 3
  const visibleBefore = shouldCollapse ? path.slice(0, 1) : path
  const collapsed = shouldCollapse ? path.slice(1, -1) : []
  const visibleAfter = shouldCollapse ? path.slice(-1) : []

  return (
    <nav
      aria-label="자료 경로"
      className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground"
    >
      {visibleBefore.map((item) => (
        <BreadcrumbPart item={item} key={item.id} />
      ))}
      {collapsed.length === 0 ? null : (
        <>
          <ChevronRightIcon aria-hidden="true" className="size-3.5 shrink-0" />
          <Popover
            onOpenChange={setIsExpandedPathOpen}
            open={isExpandedPathOpen}
          >
            <PopoverTrigger
              render={
                <Button
                  aria-label="축약된 자료 경로 보기"
                  onFocus={() => {
                    setIsExpandedPathOpen(true)
                  }}
                  onMouseEnter={() => {
                    setIsExpandedPathOpen(true)
                  }}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                />
              }
            >
              <EllipsisIcon aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-auto min-w-52 gap-1"
              onMouseEnter={() => {
                setIsExpandedPathOpen(true)
              }}
              onMouseLeave={() => {
                setIsExpandedPathOpen(false)
              }}
            >
              {collapsed.map((item) => (
                <span className="block px-2 py-1.5" key={item.id}>
                  {item.name}
                </span>
              ))}
            </PopoverContent>
          </Popover>
        </>
      )}
      {visibleAfter.map((item) => (
        <BreadcrumbPart item={item} key={item.id} />
      ))}
      {path.length === 0 ? null : (
        <ChevronRightIcon aria-hidden="true" className="size-3.5 shrink-0" />
      )}
      <span
        aria-current="page"
        className="truncate font-medium text-foreground"
      >
        {currentName}
      </span>
    </nav>
  )
}

export function ResourceDocumentMetadata({
  createdBy,
  exactUpdatedAt,
  relativeUpdatedAt,
  updatedBy,
}: {
  readonly createdBy: string
  readonly exactUpdatedAt: string
  readonly relativeUpdatedAt: string
  readonly updatedBy: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger
        render={
          <Button
            className="h-auto px-2 py-1 text-muted-foreground"
            onFocus={() => {
              setIsOpen(true)
            }}
            onMouseEnter={() => {
              setIsOpen(true)
            }}
            type="button"
            variant="ghost"
          />
        }
      >
        <InfoIcon aria-hidden="true" className="size-4" />
        {relativeUpdatedAt} 수정
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="gap-2"
        onMouseEnter={() => {
          setIsOpen(true)
        }}
        onMouseLeave={() => {
          setIsOpen(false)
        }}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">생성자</dt>
          <dd>{createdBy}</dd>
          <dt className="text-muted-foreground">수정자</dt>
          <dd>{updatedBy}</dd>
          <dt className="text-muted-foreground">수정 시각</dt>
          <dd>{exactUpdatedAt}</dd>
        </dl>
      </PopoverContent>
    </Popover>
  )
}

function BreadcrumbPart({
  item,
}: {
  readonly item: AdminResourceBreadcrumbItem
}) {
  return (
    <>
      <ChevronRightIcon
        aria-hidden="true"
        className="size-3.5 shrink-0 first:hidden"
      />
      <span className="max-w-40 truncate">{item.name}</span>
    </>
  )
}
