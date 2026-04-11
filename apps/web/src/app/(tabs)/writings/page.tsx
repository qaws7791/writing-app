import { Suspense } from "react"
import WritingsListView from "@/views/writings-list-view"

export default function WritingsPage() {
  return (
    <Suspense>
      <WritingsListView />
    </Suspense>
  )
}
