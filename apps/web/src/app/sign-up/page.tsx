import SignUpPageClient from "./sign-up-page-client"
import { redirectIfPublicAuthUnavailable } from "@/lib/server-auth"

export default async function SignUpPage() {
  await redirectIfPublicAuthUnavailable()

  return <SignUpPageClient />
}
