import Link from "next/link"

import { globalNavBrandRoute } from "@/app/(learner)/app/_views/global-nav-routes"

export function GlobalNavBrand() {
  return (
    <Link
      className="rounded-lg font-heading text-lg font-semibold tracking-[-0.025em] text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
      href={globalNavBrandRoute.href}
    >
      {globalNavBrandRoute.label}
    </Link>
  )
}
