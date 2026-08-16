import { GlobalNavAccountMenu } from "@/app/(learner)/app/_views/global-nav-account-menu"
import { GlobalNavBrand } from "@/app/(learner)/app/_views/global-nav-brand"
import type { GlobalNavPathProps } from "@/app/(learner)/app/_views/global-nav-current-path"
import { GlobalNavLinks } from "@/app/(learner)/app/_views/global-nav-links"

export function GlobalNav({ currentPath }: GlobalNavPathProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <div className="flex items-center gap-6 sm:gap-10">
          <GlobalNavBrand />
          <GlobalNavLinks
            {...(currentPath === undefined ? {} : { currentPath })}
          />
        </div>
        <GlobalNavAccountMenu />
      </div>
    </header>
  )
}
