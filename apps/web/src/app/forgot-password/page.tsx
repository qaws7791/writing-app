import ForgotPasswordView from "@/views/forgot-password-view"
import { redirectIfPublicAuthUnavailable } from "@/features/auth/repositories/server-auth"

export default async function ForgotPasswordPage() {
  await redirectIfPublicAuthUnavailable()

  return <ForgotPasswordView />
}
