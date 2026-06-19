import Link from "next/link"

import { globalNavBrandRoute } from "@/components/layout/global-nav-routes"

export function GlobalNavBrand() {
  return (
    <Link
      className="font-black tracking-tighter btn-squish"
      href={globalNavBrandRoute.href}
      style={{ fontSize: "1.375rem" }}
    >
      {globalNavBrandRoute.label}
    </Link>
  )
}
