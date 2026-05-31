import * as React from "react"

import { MOBILE_BREAKPOINT_PX } from "@/config/breakpoints"

export function useIsMobile(mobileBreakpoint = MOBILE_BREAKPOINT_PX) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < mobileBreakpoint)
    return () => mql.removeEventListener("change", onChange)
  }, [mobileBreakpoint])

  return !!isMobile
}
