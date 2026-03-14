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
      <div className="max-h-screen flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
