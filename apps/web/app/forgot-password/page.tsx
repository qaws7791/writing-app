import ForgotPasswordPageClient from "./forgot-password-page-client"
import { redirectIfPublicAuthUnavailable } from "@/lib/server-auth"

export default async function ForgotPasswordPage() {
  await redirectIfPublicAuthUnavailable()

  return <ForgotPasswordPageClient />
}
