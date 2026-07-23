const blockedImageLoadOperations = [
  "VipsForeignLoadNsgif",
  "VipsForeignLoadTiff",
  "VipsForeignLoadVips",
] as const

interface ImageOptimizerSecurityControl {
  block(options: { readonly operation: string[] }): void
}

export function applyImageOptimizerSecurityPolicy(
  imageOptimizer: ImageOptimizerSecurityControl
): void {
  imageOptimizer.block({ operation: [...blockedImageLoadOperations] })
}
