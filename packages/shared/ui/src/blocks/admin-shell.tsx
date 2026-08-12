"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  ArrowUpDownIcon,
  Audit01Icon,
  BookOpen01Icon,
  ComputerIcon,
  Home01Icon,
  LinkSquare02Icon,
  Logout03Icon,
  MoonIcon,
  Robot01Icon,
  Settings02Icon,
  Sun03Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "#ui/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "#ui/components/primitives/breadcrumb"
import { Button } from "#ui/components/primitives/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "#ui/components/primitives/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "#ui/components/primitives/sidebar"

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

type ThemeValue = "system" | "light" | "dark"

const DEMO_PROFILE = {
  name: "수진",
  email: "sujin@luma.example",
} as const

const THEME_OPTIONS = [
  { icon: ComputerIcon, label: "시스템", value: "system" as const },
  { icon: Sun03Icon, label: "라이트", value: "light" as const },
  { icon: MoonIcon, label: "다크", value: "dark" as const },
]

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

function resolveIsDark(mode: ThemeValue) {
  if (mode === "dark") return true
  if (mode === "light") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyThemeMode(mode: ThemeValue) {
  document.documentElement.classList.toggle("dark", resolveIsDark(mode))
}

function AdminNavGroups({ activeNav }: { activeNav: AdminNavId }) {
  const { isMobile, setOpenMobile } = useSidebar()

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
                            if (isMobile) setOpenMobile(false)
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

function AdminProfileMenu() {
  const [theme, setTheme] = React.useState<ThemeValue>("system")

  React.useEffect(() => {
    if (theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    function onChange() {
      applyThemeMode("system")
    }

    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="프로필 메뉴"
            className="h-auto w-full justify-start gap-3 rounded-2xl px-2.5 py-2 text-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
            variant="ghost"
          />
        }
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {DEMO_PROFILE.name}
          </span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {DEMO_PROFILE.email}
          </span>
        </span>
        <HugeiconsIcon
          icon={ArrowUpDownIcon}
          strokeWidth={2}
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-(--anchor-width) min-w-56"
        side="top"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-popover-foreground">
                {DEMO_PROFILE.name}
              </span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {DEMO_PROFILE.email}
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuItem onClick={preventNav}>
          <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} />
          앱으로 이동
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} />
            화면 테마
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {THEME_OPTIONS.map(({ icon, label, value }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={theme === value}
                onCheckedChange={(checked) => {
                  if (!checked) return
                  applyThemeMode(value)
                  setTheme(value)
                }}
              >
                <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
                {label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem variant="destructive">
          <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
          어드민 로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AdminSidebar({ activeNav }: { activeNav: AdminNavId }) {
  return (
    <Sidebar className="absolute! h-full!">
      <SidebarHeader>
        <AdminBrand />
      </SidebarHeader>
      <SidebarContent>
        <AdminNavGroups activeNav={activeNav} />
      </SidebarContent>
      <SidebarFooter>
        <AdminProfileMenu />
      </SidebarFooter>
    </Sidebar>
  )
}

function AdminHeader({
  title,
  breadcrumb,
}: {
  title: string
  breadcrumb?: AdminBreadcrumbItem[]
}) {
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
      </div>
    </header>
  )
}

export function AdminShell({
  activeNav,
  title,
  breadcrumb,
  className,
  contentClassName,
  children,
  ...props
}: {
  activeNav: AdminNavId
  title: string
  breadcrumb?: AdminBreadcrumbItem[]
  contentClassName?: string
  children: React.ReactNode
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="admin-shell"
      className={cn(
        "@container/admin-shell relative flex h-full min-h-0 w-full overflow-hidden bg-background",
        className
      )}
      {...props}
    >
      <SidebarProvider className="relative flex h-full min-h-0! w-full flex-1 overflow-hidden">
        <AdminSidebar activeNav={activeNav} />

        <SidebarInset className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <AdminHeader title={title} breadcrumb={breadcrumb} />
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
