import { createAdminAuthClient } from "@workspace/auth/admin/client"

import { resolveSafeAdminNextPath } from "@/features/authentication/model/admin-auth-navigation"

export async function requestAdminPasswordLogin({
  email,
  nextPath,
  password,
}: {
  readonly email: string
  readonly nextPath: string
  readonly password: string
}): Promise<{ readonly nextPath: string }> {
  const safeNextPath = resolveSafeAdminNextPath(nextPath)
  await getAdminAuthClient().signInWithPassword({
    callbackURL: safeNextPath,
    email,
    password,
  })

  return { nextPath: safeNextPath }
}

export async function requestAdminSignOut(): Promise<void> {
  await getAdminAuthClient().signOut()
}

function getAdminAuthClient() {
  return createAdminAuthClient({
    fetch: globalThis.fetch.bind(globalThis),
  })
}
