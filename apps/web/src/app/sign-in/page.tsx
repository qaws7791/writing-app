import SignInPageClient from "./sign-in-page-client"
import { redirectIfPublicAuthUnavailable } from "@/lib/server-auth"

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
    <SignInPageClient
      errorCode={params.error}
      verified={params.verified === "1"}
    />
  )
}
