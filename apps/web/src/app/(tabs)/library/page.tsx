import { Suspense } from "react"
import WritingsListView from "@/views/writings-list-view"

export default function LibraryPage() {
  return (
    <Suspense>
      <WritingsListView />
    </Suspense>
  )
}
