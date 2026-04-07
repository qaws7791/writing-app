import { Suspense } from "react"
import ProfileView from "@/views/profile-view"

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileView />
    </Suspense>
  )
}
