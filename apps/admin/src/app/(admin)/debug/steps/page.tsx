import type { Metadata } from "next"

import { StepDebugPage } from "@/features/step-debug/step-debug-page"

export const metadata: Metadata = {
  title: "스텝 디버그",
  robots: "noindex",
}

export default function Page() {
  return <StepDebugPage />
}
