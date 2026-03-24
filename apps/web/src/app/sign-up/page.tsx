import SignUpView from "@/views/sign-up-view"
import { redirectIfPublicAuthUnavailable } from "@/features/auth/repositories/server-auth"

export default async function SignUpPage() {
  await redirectIfPublicAuthUnavailable()

  return <SignUpView />
}
