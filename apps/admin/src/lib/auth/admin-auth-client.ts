export function createAdminGoogleSignInPath(nextPath = "/"): string {
  return `/api/auth/sign-in/google?callbackURL=${encodeURIComponent(nextPath)}`
}
