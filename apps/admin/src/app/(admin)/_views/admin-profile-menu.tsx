"use client"

import { useTheme } from "next-themes"

import { Button } from "@workspace/ui/components/ui/button"
import { ChevronsUpDownIcon } from "@workspace/ui/components/icons/control-icons"
import {
  ExternalLinkIcon,
  LogOutIcon,
} from "@workspace/ui/components/icons/navigation-icons"
import {
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "@workspace/ui/components/icons/profile-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"

export type AdminProfile = {
  readonly email: string
  readonly name: string
}

const themeOptions = [
  { Icon: MonitorIcon, label: "시스템", value: "system" },
  { Icon: SunIcon, label: "라이트", value: "light" },
  { Icon: MoonIcon, label: "다크", value: "dark" },
] as const

type ThemeValue = (typeof themeOptions)[number]["value"]

export function AdminProfileMenu({
  adminProfile,
  isSigningOut,
  learnerWebOrigin,
  onSignOut,
}: {
  readonly adminProfile: AdminProfile
  readonly isSigningOut: boolean
  readonly learnerWebOrigin: string
  readonly onSignOut: () => void
}) {
  const { setTheme, theme } = useTheme()
  const activeTheme = isThemeValue(theme) ? theme : "system"

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
            {adminProfile.name}
          </span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {adminProfile.email}
          </span>
        </span>
        <ChevronsUpDownIcon
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
                {adminProfile.name}
              </span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {adminProfile.email}
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <a href={learnerWebOrigin} rel="noreferrer" target="_blank" />
          }
        >
          <ExternalLinkIcon aria-hidden="true" />
          앱으로 이동
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>화면 테마</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            onValueChange={(value) => {
              if (isThemeValue(value)) setTheme(value)
            }}
            value={activeTheme}
          >
            {themeOptions.map(({ Icon, label, value }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon aria-hidden="true" />
                {label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isSigningOut}
          onClick={onSignOut}
          variant="destructive"
        >
          <LogOutIcon aria-hidden="true" />
          {isSigningOut ? "로그아웃 중…" : "어드민 로그아웃"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function isThemeValue(value: string | undefined): value is ThemeValue {
  return value === "system" || value === "light" || value === "dark"
}
