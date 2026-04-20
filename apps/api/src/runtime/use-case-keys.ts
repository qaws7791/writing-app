import { AI_USE_CASE_KEYS } from "./modules/ai"
import { HOME_USE_CASE_KEYS } from "./modules/home"
import { JOURNEY_USE_CASE_KEYS } from "./modules/journeys"
import { PROMPT_USE_CASE_KEYS } from "./modules/prompts"
import { SESSION_USE_CASE_KEYS } from "./modules/sessions"
import { WRITING_USE_CASE_KEYS } from "./modules/writings"

export const USE_CASE_KEYS = [
  ...WRITING_USE_CASE_KEYS,
  ...PROMPT_USE_CASE_KEYS,
  ...HOME_USE_CASE_KEYS,
  ...JOURNEY_USE_CASE_KEYS,
  ...SESSION_USE_CASE_KEYS,
  ...AI_USE_CASE_KEYS,
] as const

export type UseCaseKey = (typeof USE_CASE_KEYS)[number]
