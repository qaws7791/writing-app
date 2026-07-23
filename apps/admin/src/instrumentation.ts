export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const [{ default: sharp }, { applyImageOptimizerSecurityPolicy }] =
    await Promise.all([
      import("sharp"),
      import("@workspace/nextjs-config/image-optimizer-security"),
    ])
  applyImageOptimizerSecurityPolicy(sharp)
}
