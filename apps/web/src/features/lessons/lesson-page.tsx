import { LessonExperience } from "@/features/lessons/lesson-experience"
import type { Lesson } from "@/features/lessons/lesson-types"

interface LessonPageProps {
  lesson: Lesson
}

export function LessonPage({ lesson }: LessonPageProps) {
  return <LessonExperience lesson={lesson} />
}
