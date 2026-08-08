"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen01Icon, Logout03Icon, Settings02Icon, UserIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/registry/luma/lib/utils";
import { Avatar, AvatarFallback } from "@/registry/luma/ui/avatar";
import { Button } from "@/registry/luma/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/luma/ui/dropdown-menu";

export type LearnerNavId = "home" | "learn";

export type LearnerProfileAction = "profile" | "history" | "settings" | "logout";

const NAV_ITEMS: { id: LearnerNavId; href: string; label: string }[] = [
  { id: "home", href: "#home", label: "홈" },
  { id: "learn", href: "#learn", label: "학습" },
];

function preventNav(event: React.MouseEvent | React.SyntheticEvent) {
  event.preventDefault();
}

function LearnerShellHeader({
  currentNav,
  userName = "민지",
  userInitial = "민",
  onProfileAction,
}: {
  currentNav?: LearnerNavId | null;
  userName?: string;
  userInitial?: string;
  onProfileAction?: (action: LearnerProfileAction) => void;
}) {
  return (
    <header
      data-slot="learner-shell-header"
      className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 @[40rem]/learner-shell:h-15 @[40rem]/learner-shell:gap-4 @[40rem]/learner-shell:px-8">
        <a
          href="#home"
          className="flex shrink-0 items-center gap-2 font-heading text-sm font-semibold tracking-[-0.02em] @[40rem]/learner-shell:gap-2.5"
          onClick={preventNav}
        >
          <span className="grid size-7 place-items-center rounded-xl bg-foreground text-[0.65rem] text-background">
            L
          </span>
          <span className="hidden @[28rem]/learner-shell:inline">Luma</span>
        </a>

        <nav
          className="ml-0.5 flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="글로벌 메뉴"
        >
          {NAV_ITEMS.map((item) => {
            const current = item.id === currentNav;
            return (
              <a
                key={item.id}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-xl px-2.5 py-1.5 transition-colors @[40rem]/learner-shell:px-3",
                  current
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
                onClick={preventNav}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}
              aria-label="프로필 메뉴 열기"
            >
              <Avatar size="sm">
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{userName}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onProfileAction?.("profile")}>
                  <HugeiconsIcon icon={UserIcon} strokeWidth={2} />
                  프로필
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onProfileAction?.("history")}>
                  <HugeiconsIcon icon={BookOpen01Icon} strokeWidth={2} />
                  학습 기록
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onProfileAction?.("settings")}>
                  <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
                  설정
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onProfileAction?.("logout")}>
                <HugeiconsIcon icon={Logout03Icon} strokeWidth={2} />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/**
 * Shared chrome for logged-in learner surfaces (home, catalog, course detail, profile).
 * Lesson sessions use their own session chrome and should not use this shell.
 */
export function LearnerShell({
  className,
  currentNav = null,
  userName = "민지",
  userInitial = "민",
  onProfileAction,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  currentNav?: LearnerNavId | null;
  userName?: string;
  userInitial?: string;
  onProfileAction?: (action: LearnerProfileAction) => void;
}) {
  return (
    <div
      data-slot="learner-shell"
      className={cn(
        "@container/learner-shell flex min-h-svh w-full flex-col bg-background",
        className,
      )}
      {...props}
    >
      <LearnerShellHeader
        currentNav={currentNav}
        userName={userName}
        userInitial={userInitial}
        onProfileAction={onProfileAction}
      />
      {children}
    </div>
  );
}

export default LearnerShell;
