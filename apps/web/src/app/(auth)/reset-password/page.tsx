import ResetPasswordView from "@/views/reset-password-view"
import { redirectIfPublicAuthUnavailable } from "@/features/auth/repositories/server-auth"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string
    token?: string
  }>
}) {
  await redirectIfPublicAuthUnavailable()

  const params = await searchParams

  return <ResetPasswordView errorCode={params.error} token={params.token} />
}
