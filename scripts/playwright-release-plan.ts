export const releaseE2eProjects = [
  "release-chromium",
  "release-webkit",
] as const

export const releaseE2eTestFiles = ["pr-smoke.spec.ts"] as const

export type ReleaseE2eProject = (typeof releaseE2eProjects)[number]
