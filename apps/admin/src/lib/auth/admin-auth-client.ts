import { localRuntimeDefaults } from "@workspace/env"

export function createAdminGoogleSignInPath(nextPath = "/"): string {
  return `${getAdminApiBaseUrl()}/api/auth/sign-in/google?callbackURL=${encodeURIComponent(nextPath)}`
}

function getAdminApiBaseUrl(): string {
  return (
    process.env["ADMIN_API_BASE_URL"] ?? localRuntimeDefaults.adminApiBaseUrl
  ).replace(/\/$/, "")
}
