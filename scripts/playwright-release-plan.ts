export const releaseE2eProjects = [
  "release-chromium",
  "release-webkit",
] as const

export const releaseE2eTestFiles = [
  "admin-content-publishing.spec.ts",
  "browser-support.smoke.spec.ts",
  "credentials-auth.spec.ts",
  "lesson-draft-autosave.smoke.spec.ts",
  "writing-app.spec.ts",
] as const

export type ReleaseE2eProject = (typeof releaseE2eProjects)[number]
