import { z } from "zod"

export const adminNoticeSettingsRequestSchema = z.object({
  announce: z.string(),
  banner: z.string(),
})
export const adminLegalSettingsRequestSchema = z.object({
  privacy: z.string(),
  terms: z.string(),
})
export const adminSettingsDtoSchema = z.object({
  legal: adminLegalSettingsRequestSchema,
  notice: adminNoticeSettingsRequestSchema,
})

export type AdminSettingsDto = z.infer<typeof adminSettingsDtoSchema>
export type AdminNoticeSettingsRequest = z.infer<
  typeof adminNoticeSettingsRequestSchema
>
export type AdminLegalSettingsRequest = z.infer<
  typeof adminLegalSettingsRequestSchema
>
