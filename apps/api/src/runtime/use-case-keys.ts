import { HOME_USE_CASE_KEYS } from "./modules/home"

export const USE_CASE_KEYS = [...HOME_USE_CASE_KEYS] as const

export type UseCaseKey = (typeof USE_CASE_KEYS)[number]
