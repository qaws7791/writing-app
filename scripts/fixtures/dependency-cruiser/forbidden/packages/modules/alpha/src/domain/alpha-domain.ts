import { alphaRepository } from "#alpha/infrastructure/alpha-repository"

import { cycleB } from "#alpha/domain/cycle-b"
import type { HttpCourseResponse } from "@fixture/contracts/content/course"

export const alphaDomain =
  `${alphaRepository}:${cycleB}` satisfies HttpCourseResponse
