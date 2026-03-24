export { AuthSignOutButton } from "@/features/auth/components/auth-sign-out-button"
export { authClient } from "@/features/auth/repositories/auth-client"
export {
  type SessionSnapshot,
  fetchSessionSnapshot,
  getCurrentSession,
  getSessionAccessRedirectPath,
  isLocalPhaseOneMode,
  redirectIfProtectedAccessMissing,
  redirectIfPublicAuthUnavailable,
  resolveSessionApiBaseUrl,
} from "@/features/auth/repositories/server-auth"
