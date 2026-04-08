import { Suspense } from "react"
import HomeView from "@/views/home-view"

export default function Page() {
  return (
    <Suspense>
      <HomeView />
    </Suspense>
  )
}
