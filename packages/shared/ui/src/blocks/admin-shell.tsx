"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  Audit01Icon,
  BookOpen01Icon,
  Home01Icon,
  Logout03Icon,
  Menu01Icon,
  Notification03Icon,
  Robot01Icon,
  Search01Icon,
  Settings02Icon,
  UserIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
import { Avatar, AvatarFallback } from "#ui/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#ui/components/ui/breadcrumb"
import { Button } from "#ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#ui/components/ui/dropdown-menu"
import { Input } from "#ui/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#ui/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "#ui/components/ui/sidebar"

export type AdminBreadcrumbItem = {
  label: string
  href?: string
}

export type AdminNavId =
  | "home"
  | "courses"
  | "users"
  | "analytics"
  | "settings"
  | "agents"
  | "audit"

type NavItem = {
  id: AdminNavId
  label: string
  icon: typeof Home01Icon
}

type NavGroup = {
  id: string
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "개요",
    items: [{ id: "home", label: "홈", icon: Home01Icon }],
  },
  {
    id: "content",
    label: "콘텐츠",
    items: [{ id: "courses", label: "코스", icon: BookOpen01Icon }],
  },
  {
    id: "learners",
    label: "학습자",
    items: [{ id: "users", label: "사용자", icon: UserMultipleIcon }],
  },
  {
    id: "insights",
    label: "인사이트",
    items: [{ id: "analytics", label: "분석", icon: Analytics01Icon }],
  },
  {
    id: "system",
    label: "시스템",
    items: [
      { id: "settings", label: "설정", icon: Settings02Icon },
      { id: "agents", label: "에이전트", icon: Robot01Icon },
      { id: "audit", label: "감사 로그", icon: Audit01Icon },
    ],
  },
]

function preventNav(event: React.MouseEvent | React.SyntheticEvent) {
  event.preventDefault()
}

function AdminNavGroups({
  activeNav,
  onNavigate,
}: {
  activeNav: AdminNavId
  onNavigate?: () => void
}) {
  return (
    <>
      {NAV_GROUPS.map((group) => (
        <SidebarGroup key={group.id}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const current = item.id === activeNav
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={current}
                      tooltip={item.label}
                      render={
                        <a
                          href={`#${item.id}`}
                          aria-label={item.label}
                          aria-current={current ? "page" : undefined}
                          onClick={(event) => {
                            preventNav(event)
                            onNavigate?.()
                          }}
                        />
                      }
                    >
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

function AdminBrand() {
  return (
    <div className="flex items-center gap-2.5 px-0.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-foreground text-[0.65rem] font-semibold text-background">
        L
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-[-0.01em]">
          Luma
        </p>
        <p className="truncate text-[11px] text-muted-foreground">운영</p>
      </div>
    </div>
  )
}

function AdminSidebar({ activeNav }: { activeNav: AdminNavId }) {
  return (
    <Sidebar
      collapsible="none"
      className="hidden h-full min-h-0 w-(--sidebar-width) shrink-0 border-e border-sidebar-border/80 @[56rem]/admin-shell:flex"
    >
      <SidebarHeader>
        <AdminBrand />
      </SidebarHeader>
      <SidebarContent>
        <AdminNavGroups activeNav={activeNav} />
      </SidebarContent>
    </Sidebar>
  )
}

function AdminHeader({
  title,
  description,
  breadcrumb,
  showSearch = false,
  onOpenNav,
}: {
  title: string
  description?: string
  breadcrumb?: AdminBreadcrumbItem[]
  showSearch?: boolean
  onOpenNav: () => void
}) {
  const hasBreadcrumb = Boolean(breadcrumb?.length)

  return (
    <header
      data-slot="admin-shell-header"
      className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/90 px-3 backdrop-blur-xl @[40rem]/admin-shell:h-15 @[40rem]/admin-shell:gap-3 @[40rem]/admin-shell:px-5 @[56rem]/admin-shell:gap-4 @[56rem]/admin-shell:px-6"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 rounded-full @[56rem]/admin-shell:hidden"
        aria-label="메뉴 열기"
        onClick={onOpenNav}
      >
        <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
      </Button>

      <div className="min-w-0 flex-1">
        {hasBreadcrumb ? (
          <>
            <h1 className="sr-only">{title}</h1>
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-wrap gap-1 @[40rem]/admin-shell:gap-1.5">
                {breadcrumb?.map((item) => (
                  <React.Fragment key={`${item.label}-${item.href ?? "page"}`}>
                    <BreadcrumbItem className="shrink-0">
                      <BreadcrumbLink
                        href={item.href ?? "#"}
                        onClick={preventNav}
                        className="text-sm"
                      >
                        {item.label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="shrink-0" />
                  </React.Fragment>
                ))}
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
        {description ? (
          <p className="mt-0.5 hidden truncate text-xs text-muted-foreground @[40rem]/admin-shell:block">
            {description}
          </p>
        ) : null}
      </div>

      {showSearch ? (
        <div className="relative ms-auto hidden min-w-0 max-w-[14rem] flex-1 @[48rem]/admin-shell:block @[64rem]/admin-shell:max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="코스·학습자·문항 검색"
            className="h-9 ps-9"
            aria-label="코스·학습자·문항 검색"
          />
        </div>
      ) : (
        <div className="ms-auto" />
      )}

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative rounded-full"
          aria-label="알림 3건"
        >
          <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} />
          <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-foreground px-1 text-[0.6rem] leading-4 font-semibold text-background tabular-nums">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="rounded-full" />
            }
            aria-label="프로필 메뉴 열기"
          >
            <Avatar size="sm">
              <AvatarFallback>수</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel>수진</DropdownMenuLabel>
              <DropdownMenuItem>
                <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
                프로필
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
                설정
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export function AdminShell({
  activeNav,
  title,
  description,
  breadcrumb,
  showSearch = false,
  className,
  contentClassName,
  children,
  ...props
}: {
  activeNav: AdminNavId
  title: string
  description?: string
  breadcrumb?: AdminBreadcrumbItem[]
  showSearch?: boolean
  contentClassName?: string
  children: React.ReactNode
} & React.ComponentProps<"div">) {
  const [navOpen, setNavOpen] = React.useState(false)

  return (
    <div
      data-slot="admin-shell"
      className={cn(
        "@container/admin-shell relative flex h-full min-h-svh w-full overflow-hidden bg-background",
        className
      )}
      {...props}
    >
      <SidebarProvider className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden">
        <AdminSidebar activeNav={activeNav} />

        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent
            side="left"
            className="w-[min(100%,18rem)] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>운영 메뉴</SheetTitle>
              <SheetDescription>운영 화면 탐색 메뉴</SheetDescription>
            </SheetHeader>
            <div className="flex h-full w-full flex-col">
              <div className="flex h-14 items-center border-b border-sidebar-border/80 px-3">
                <AdminBrand />
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-2">
                <Sidebar
                  collapsible="none"
                  className="h-auto w-full bg-transparent"
                >
                  <SidebarContent>
                    <AdminNavGroups
                      activeNav={activeNav}
                      onNavigate={() => setNavOpen(false)}
                    />
                  </SidebarContent>
                </Sidebar>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <SidebarInset className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <AdminHeader
            title={title}
            description={description}
            breadcrumb={breadcrumb}
            showSearch={showSearch}
            onOpenNav={() => setNavOpen(true)}
          />
          <div
            data-slot="admin-shell-main"
            className={cn(
              "@container/admin-main flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-3 py-5 @[40rem]/admin-shell:gap-8 @[40rem]/admin-shell:px-5 @[40rem]/admin-shell:py-7 @[56rem]/admin-shell:px-6 @[56rem]/admin-shell:py-8",
              contentClassName
            )}
          >
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
