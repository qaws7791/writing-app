import type {
  WritingDifficulty,
  WritingDomain,
} from "@workspace/contracts/writing/writing"
import type {
  WritingTaskId,
  WritingTaskPublicationId,
} from "@workspace/types/ids"

export type WritingTaskDraft = Readonly<{
  audience: string
  createdAt: Date
  difficulty: WritingDifficulty
  domain: WritingDomain
  editVersion: number
  goalChars: number
  id: WritingTaskId
  latestPublicationId: WritingTaskPublicationId | null
  minChars: number
  requiredElements: readonly string[]
  situation: string
  title: string
  typeName: string
  updatedAt: Date
}>

export type WritingTaskPublication = Readonly<{
  audience: string
  difficulty: WritingDifficulty
  domain: WritingDomain
  goalChars: number
  id: WritingTaskPublicationId
  minChars: number
  publishedAt: Date
  requiredElements: readonly string[]
  situation: string
  taskId: WritingTaskId
  title: string
  typeName: string
}>

export type WritingTaskPublishError = Readonly<{
  kind: "writing-task-not-ready-to-publish"
  reason: string
}>

export function createWritingTaskDraft(input: {
  readonly id: WritingTaskId
  readonly now: Date
}): WritingTaskDraft {
  return {
    audience: "",
    createdAt: input.now,
    difficulty: "입문",
    domain: "일상·실용문",
    editVersion: 0,
    goalChars: 0,
    id: input.id,
    latestPublicationId: null,
    minChars: 0,
    requiredElements: [],
    situation: "",
    title: "새 과제",
    typeName: "",
    updatedAt: input.now,
  }
}

export function saveWritingTaskDraft(
  draft: WritingTaskDraft,
  input: Readonly<{
    audience: string
    difficulty: WritingDifficulty
    domain: WritingDomain
    goalChars: number
    minChars: number
    now: Date
    requiredElements: readonly string[]
    situation: string
    title: string
    typeName: string
  }>
): WritingTaskDraft {
  return {
    ...draft,
    audience: input.audience,
    difficulty: input.difficulty,
    domain: input.domain,
    editVersion: draft.editVersion + 1,
    goalChars: input.goalChars,
    minChars: input.minChars,
    requiredElements: input.requiredElements,
    situation: input.situation,
    title: input.title,
    typeName: input.typeName,
    updatedAt: input.now,
  }
}

export function publishWritingTask(
  draft: WritingTaskDraft,
  input: Readonly<{ id: WritingTaskPublicationId; now: Date }>
):
  | Readonly<{
      draft: WritingTaskDraft
      publication: WritingTaskPublication
    }>
  | WritingTaskPublishError {
  const ready = readPublishReadyFields(draft)
  if (ready === null) {
    return {
      kind: "writing-task-not-ready-to-publish",
      reason:
        "발행하려면 제목, 유형, 상황, 독자, 글자 수, 필수 요소가 필요합니다.",
    }
  }

  const publication: WritingTaskPublication = {
    ...ready,
    id: input.id,
    publishedAt: input.now,
    taskId: draft.id,
  }

  return {
    draft: {
      ...draft,
      editVersion: draft.editVersion + 1,
      latestPublicationId: publication.id,
      updatedAt: input.now,
    },
    publication,
  }
}

function readPublishReadyFields(
  draft: WritingTaskDraft
): Omit<WritingTaskPublication, "id" | "publishedAt" | "taskId"> | null {
  const title = draft.title.trim()
  const typeName = draft.typeName.trim()
  const situation = draft.situation.trim()
  const audience = draft.audience.trim()
  const requiredElements = draft.requiredElements
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  if (
    title.length === 0 ||
    typeName.length === 0 ||
    situation.length === 0 ||
    audience.length === 0 ||
    draft.minChars < 1 ||
    draft.goalChars < draft.minChars ||
    requiredElements.length === 0
  ) {
    return null
  }

  return {
    audience,
    difficulty: draft.difficulty,
    domain: draft.domain,
    goalChars: draft.goalChars,
    minChars: draft.minChars,
    requiredElements,
    situation,
    title,
    typeName,
  }
}
