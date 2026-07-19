import Link from "next/link"

import { globalNavBrandRoute } from "@/app/(learner)/app/_views/global-nav-routes"
import { buttonVariants } from "@workspace/ui/components/ui/button"

export function GlobalNavBrand() {
  return (
    <Link
      className={buttonVariants({
        className:
          "h-auto rounded-sm border-0 bg-transparent p-0 text-title-lg font-black tracking-normal text-foreground no-underline hover:bg-transparent hover:no-underline",
        size: "sm",
        variant: "link",
      })}
      href={globalNavBrandRoute.href}
    >
      {globalNavBrandRoute.label}
    </Link>
  )
}
