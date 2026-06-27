import Link from "next/link"

import { globalNavBrandRoute } from "@/components/layout/global-nav-routes"

export function GlobalNavBrand() {
  return (
    <Link
      className="text-title-lg font-black tracking-normal btn-squish"
      href={globalNavBrandRoute.href}
    >
      {globalNavBrandRoute.label}
    </Link>
  )
}
