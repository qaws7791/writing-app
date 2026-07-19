export type AdminNoticeSettingsRequest = {
  readonly announce: string
  readonly banner: string
}
export type AdminLegalSettingsRequest = {
  readonly privacy: string
  readonly terms: string
}
export type AdminSettings = {
  readonly legal: AdminLegalSettingsRequest
  readonly notice: AdminNoticeSettingsRequest
}
export type AdminContentResetResult = {
  readonly changed: {
    readonly archived: number
    readonly courses: number
    readonly lessons: number
    readonly steps: number
    readonly units: number
  }
  readonly revision: number
}
