import { GlobalNavAccountMenu } from "@/app/(learner)/app/_views/global-nav-account-menu"
import { GlobalNavBrand } from "@/app/(learner)/app/_views/global-nav-brand"
import type { GlobalNavPathProps } from "@/app/(learner)/app/_views/global-nav-current-path"
import { GlobalNavLinks } from "@/app/(learner)/app/_views/global-nav-links"

export function GlobalNav({ currentPath }: GlobalNavPathProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-surface/50 bg-background/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-12 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <GlobalNavBrand />
          <GlobalNavLinks
            {...(currentPath === undefined ? {} : { currentPath })}
          />
        </div>
        <div className="flex items-center gap-3">
          <GlobalNavAccountMenu />
        </div>
      </div>
    </header>
  )
}
