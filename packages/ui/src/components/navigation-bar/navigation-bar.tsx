"use client"

import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"

export interface NavItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  activeIcon?: React.ReactNode
  label: string
  active?: boolean
  badge?: number
  as?: React.ElementType
  href?: string
}

function NavItem({
  icon,
  activeIcon,
  label,
  active = false,
  badge,
  className,
  as: Component = "button",
  ...props
}: NavItemProps) {
  return (
    <Component
      data-slot="nav-item"
      data-active={active}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-1 py-1",
        "transition-colors select-none",
        active ? "text-on-secondary-container" : "text-on-surface-variant",
        className
      )}
      {...props}
    >
      <span className="relative flex items-center justify-center">
        {/* MD3 Active indicator pill */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 mx-auto h-8 w-16 rounded-full transition-all duration-200",
            active
              ? "bg-secondary-container opacity-100"
              : "bg-transparent opacity-0"
          )}
        />
        <span className="relative z-10 size-6">
          {active && activeIcon ? activeIcon : icon}
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-0.5 left-[calc(50%+8px)]">
            <Badge count={badge} max={99} />
          </span>
        )}
      </span>
      <span className="text-label-small">{label}</span>
    </Component>
  )
}

export interface NavigationBarProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

function NavigationBar({ className, children, ...props }: NavigationBarProps) {
  return (
    <nav
      data-slot="navigation-bar"
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50",
        "flex items-center justify-around",
        "rounded-tl-[2rem] rounded-tr-[2rem]",
        "border-t border-outline/20",
        "bg-surface/95 backdrop-blur-xl",
        "px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]",
        "shadow-[0px_-12px_40px_0px_rgba(47,52,48,0.04)]",
        className
      )}
      {...props}
    >
      {children}
    </nav>
  )
}

export { NavigationBar, NavItem }
