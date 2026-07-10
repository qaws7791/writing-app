import { z } from "zod"

export const adminNoticeTextMaxLength = 2_000
export const adminLegalTextMaxLength = 100_000

export const adminNoticeSettingsRequestSchema = z.object({
  announce: z.string().max(adminNoticeTextMaxLength),
  banner: z.string().max(adminNoticeTextMaxLength),
})
export const adminLegalSettingsRequestSchema = z.object({
  privacy: z.string().max(adminLegalTextMaxLength),
  terms: z.string().max(adminLegalTextMaxLength),
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
