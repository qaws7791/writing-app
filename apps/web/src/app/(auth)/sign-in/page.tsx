import { z } from "zod"
import { redirectIfPublicAuthUnavailable } from "@/features/auth/repositories/server-auth"
import SignInView from "@/views/sign-in-view"

const searchParamsSchema = z.object({
  error: z.string().optional(),
  verified: z.string().optional(),
})

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  await redirectIfPublicAuthUnavailable()

  const { error, verified } =
    searchParamsSchema.safeParse(await searchParams).data ?? {}

  return <SignInView errorCode={error} verified={verified === "1"} />
}
