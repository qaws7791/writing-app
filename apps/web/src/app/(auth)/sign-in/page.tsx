import SignInView from "@/views/sign-in-view"
import { redirectIfPublicAuthUnavailable } from "@/features/auth/repositories/server-auth"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string
    verified?: string
  }>
}) {
  await redirectIfPublicAuthUnavailable()

  const params = await searchParams

  return (
    <SignInView errorCode={params.error} verified={params.verified === "1"} />
  )
}
