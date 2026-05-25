import { z } from "zod"

export const lessonToneSchema = z.enum([
  "primary",
  "success",
  "info",
  "warning",
  "danger",
  "neutral",
])

export const courseSummaryDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  lessonCount: z.number().int().nonnegative(),
  thumbnail: z.string().min(1),
})

export const courseCategoryDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  courses: z.array(courseSummaryDtoSchema),
})

export const courseCategoryListDtoSchema = z.object({
  categories: z.array(courseCategoryDtoSchema),
})

export const courseLessonDtoSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
})

export const courseChapterDtoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  title: z.string().min(1),
  lessons: z.array(courseLessonDtoSchema),
})

export const courseDetailDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  thumbnail: z.string().min(1),
  lessonCount: z.number().int().nonnegative(),
  firstLessonId: z.string().min(1).optional(),
  chapters: z.array(courseChapterDtoSchema),
})

const introContentSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  tagTone: lessonToneSchema,
  bullets: z.array(z.string().min(1)),
  estimatedMinutes: z.number().int().positive(),
  totalSteps: z.number().int().positive(),
  xpAvailable: z.number().int().nonnegative(),
})

const summaryContentSchema = z.object({
  points: z.array(
    z.object({
      number: z.number().int().positive(),
      text: z.string().min(1),
      icon: z.string().min(1).optional(),
    })
  ),
  nextLesson: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1).optional(),
    })
    .optional(),
  shareableQuote: z.string().min(1).optional(),
})

const completeContentSchema = z.object({
  celebrationStyle: z.literal("confetti"),
  xpEarned: z.number().int().nonnegative(),
  showStreak: z.boolean(),
  lessonStats: z.object({
    correctRate: z.number().int().min(0).max(100).optional(),
    writingCount: z.number().int().nonnegative().optional(),
    aiFeedbackCount: z.number().int().nonnegative().optional(),
  }),
  nextAction: z.literal("next-lesson"),
})

export const lessonStepDtoSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("INTRO"),
    order: z.number().int().positive(),
    points: z.number().int().nonnegative(),
    required: z.boolean(),
    content: introContentSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("SUMMARY"),
    order: z.number().int().positive(),
    points: z.number().int().nonnegative(),
    required: z.boolean(),
    content: summaryContentSchema,
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("COMPLETE"),
    order: z.number().int().positive(),
    points: z.number().int().nonnegative(),
    required: z.boolean(),
    content: completeContentSchema,
  }),
])

export const lessonDtoSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  categoryId: z.string().min(1),
  courseId: z.string().min(1),
  unitNumber: z.number().int().positive(),
  nextLessonId: z.string().min(1).optional(),
  steps: z.array(lessonStepDtoSchema),
})

export type CourseSummaryDto = z.infer<typeof courseSummaryDtoSchema>
export type CourseCategoryDto = z.infer<typeof courseCategoryDtoSchema>
export type CourseCategoryListDto = z.infer<typeof courseCategoryListDtoSchema>
export type CourseLessonDto = z.infer<typeof courseLessonDtoSchema>
export type CourseChapterDto = z.infer<typeof courseChapterDtoSchema>
export type CourseDetailDto = z.infer<typeof courseDetailDtoSchema>
export type LessonStepDto = z.infer<typeof lessonStepDtoSchema>
export type LessonDto = z.infer<typeof lessonDtoSchema>
