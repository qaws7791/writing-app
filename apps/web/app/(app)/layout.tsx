import GlobalNavigation from "@/components/global-navigation"
import React from "react"

export default function layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex">
      <GlobalNavigation />
      <div className="flex-1">{children}</div>
    </div>
  )
}
