import GlobalNavigation from "@/components/global-navigation"
import React from "react"

export default function layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen">
      <GlobalNavigation />
      <div className="max-h-screen flex-1 overflow-y-auto bg-[#FAFAFA] pb-20 md:pb-0">
        {children}
      </div>
    </div>
  )
}
