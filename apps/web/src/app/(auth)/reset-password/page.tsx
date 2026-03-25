import { z } from "zod"
import { redirectIfPublicAuthUnavailable } from "@/features/auth/repositories/server-auth"
import ResetPasswordView from "@/views/reset-password-view"

const searchParamsSchema = z.object({
  error: z.string().optional(),
  token: z.string().optional(),
})

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  await redirectIfPublicAuthUnavailable()

  const { error, token } =
    searchParamsSchema.safeParse(await searchParams).data ?? {}

  return <ResetPasswordView errorCode={error} token={token} />
}
