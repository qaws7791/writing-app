"use client"

import { Suspense } from "react"
import WritingEntryView from "@/views/writing-entry-view"

export default function WritingNewPage() {
  return (
    <Suspense>
      <WritingEntryView />
    </Suspense>
  )
}
