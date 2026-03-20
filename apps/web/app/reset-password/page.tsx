import ResetPasswordPageClient from "./reset-password-page-client"
import { redirectIfPublicAuthUnavailable } from "@/lib/server-auth"

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

  return (
    <ResetPasswordPageClient errorCode={params.error} token={params.token} />
  )
}
