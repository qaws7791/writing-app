type JsonSchema =
  | ObjectJsonSchema
  | {
      readonly additionalProperties?: boolean
      readonly anyOf?: readonly JsonSchema[]
      readonly enum?: readonly string[]
      readonly format?: string
      readonly items?: JsonSchema | readonly JsonSchema[]
      readonly maxItems?: number
      readonly maximum?: number
      readonly minItems?: number
      readonly minimum?: number
      readonly nullable?: boolean
      readonly properties?: Readonly<Record<string, JsonSchema>>
      readonly required?: readonly string[]
      readonly type:
        | "array"
        | "boolean"
        | "integer"
        | "null"
        | "number"
        | "string"
    }
  | {
      readonly anyOf: readonly JsonSchema[]
    }
  | {
      readonly $ref: string
    }

type ObjectJsonSchema = {
  readonly additionalProperties?: boolean
  readonly properties: Readonly<Record<string, JsonSchema>>
  readonly required: readonly string[]
  readonly type: "object"
}

type ResponseObject = {
  readonly content?: {
    readonly "application/json": {
      readonly schema: JsonSchema
    }
  }
  readonly description: string
}

type OperationObject = {
  readonly operationId: string
  readonly parameters?: readonly {
    readonly in: "path"
    readonly name: string
    readonly required: true
    readonly schema: JsonSchema
  }[]
  readonly requestBody?: {
    readonly content: {
      readonly "application/json": {
        readonly schema: JsonSchema
      }
    }
    readonly required: true
  }
  readonly responses: Readonly<Record<string, ResponseObject>>
  readonly security?: readonly {
    readonly bearerAuth: readonly string[]
  }[]
  readonly summary: string
}

type PathItemObject = {
  readonly get?: OperationObject
  readonly post?: OperationObject
}

export type OpenApiDocument = {
  readonly components: {
    readonly securitySchemes: {
      readonly bearerAuth: {
        readonly scheme: "bearer"
        readonly type: "http"
      }
    }
  }
  readonly info: {
    readonly title: "Writing App API"
    readonly version: "0.0.1"
  }
  readonly openapi: "3.1.0"
  readonly paths: Readonly<Record<string, PathItemObject>>
}

const textSchema = { type: "string" } as const
const dateTimeTextSchema = { format: "date-time", type: "string" } as const
const integerSchema = { type: "integer" } as const
const percentSchema = { maximum: 100, minimum: 0, type: "integer" } as const
const booleanSchema = { type: "boolean" } as const
const nullableTextSchema = {
  anyOf: [textSchema, { type: "null" }],
} as const
const authSecurity = [{ bearerAuth: [] }] as const

export function createOpenApiDocument(): OpenApiDocument {
  return {
    components: {
      securitySchemes: {
        bearerAuth: {
          scheme: "bearer",
          type: "http",
        },
      },
    },
    info: {
      title: "Writing App API",
      version: "0.0.1",
    },
    openapi: "3.1.0",
    paths: {
      "/health": {
        get: {
          operationId: "getHealth",
          responses: {
            "200": jsonResponse(
              "API 상태입니다.",
              objectSchema({
                database: textSchema,
                status: textSchema,
              })
            ),
          },
          summary: "API 상태 조회",
        },
      },
      "/auth/session": {
        get: {
          operationId: "getAuthSession",
          responses: authenticatedResponses(
            jsonResponse(
              "현재 인증 세션입니다.",
              objectSchema({
                user: learnerUserSchema,
              })
            )
          ),
          security: authSecurity,
          summary: "현재 세션 조회",
        },
      },
      "/profile": {
        get: {
          operationId: "getProfile",
          responses: authenticatedResponses(
            jsonResponse(
              "학습자 프로필과 통계입니다.",
              objectSchema({
                stats: objectSchema({
                  completedLessons: integerSchema,
                  currentStreakDays: integerSchema,
                  lastActiveDate: nullableTextSchema,
                  progressPercent: percentSchema,
                  totalLessons: integerSchema,
                }),
                user: learnerUserSchema,
              })
            )
          ),
          security: authSecurity,
          summary: "학습자 프로필 조회",
        },
      },
      "/progress": {
        get: {
          operationId: "getProgress",
          responses: authenticatedResponses(
            jsonResponse(
              "학습자의 코스별 진행 상태입니다.",
              objectSchema({
                courses: arraySchema(
                  objectSchema({
                    id: textSchema,
                    lessons: arraySchema(progressLessonSchema),
                    nextLessons: arraySchema(progressNextLessonSchema),
                    progressPercent: percentSchema,
                    title: textSchema,
                  })
                ),
                user: objectSchema({
                  currentStreakDays: integerSchema,
                }),
              })
            )
          ),
          security: authSecurity,
          summary: "학습 진행 조회",
        },
      },
      "/courses": {
        get: {
          operationId: "getCourses",
          responses: authenticatedResponses(
            jsonResponse(
              "학습 가능한 코스 목록입니다.",
              objectSchema({
                courses: arraySchema(courseSummarySchema),
              })
            )
          ),
          security: authSecurity,
          summary: "코스 목록 조회",
        },
      },
      "/courses/{courseId}": {
        get: {
          operationId: "getCourseDetail",
          parameters: [pathParameter("courseId")],
          responses: authenticatedResponses(
            jsonResponse("코스 상세입니다.", courseDetailSchema)
          ),
          security: authSecurity,
          summary: "코스 상세 조회",
        },
      },
      "/lessons/{lessonId}": {
        get: {
          operationId: "getLesson",
          parameters: [pathParameter("lessonId")],
          responses: authenticatedResponses(
            jsonResponse("레슨 상세입니다.", lessonSchema)
          ),
          security: authSecurity,
          summary: "레슨 상세 조회",
        },
      },
      "/learning/answers": {
        post: {
          operationId: "saveLessonAnswer",
          requestBody: jsonRequest(
            objectSchema({
              answer: lessonAnswerSchema,
              lessonId: textSchema,
              stepId: textSchema,
            })
          ),
          responses: authenticatedResponses(
            jsonResponse(
              "답변 저장 결과입니다.",
              objectSchema({
                saved: booleanSchema,
              })
            )
          ),
          security: authSecurity,
          summary: "레슨 답변 저장",
        },
      },
      "/learning/lessons/{lessonId}/complete": {
        post: {
          operationId: "completeLesson",
          parameters: [pathParameter("lessonId")],
          requestBody: jsonRequest(
            objectSchema({
              currentStepIndex: integerSchema,
            })
          ),
          responses: authenticatedResponses(
            jsonResponse(
              "레슨 완료 저장 결과입니다.",
              objectSchema({
                saved: booleanSchema,
              })
            )
          ),
          security: authSecurity,
          summary: "레슨 완료 저장",
        },
      },
      "/ai-feedback": {
        post: {
          operationId: "createAiFeedback",
          requestBody: jsonRequest(
            objectSchema({
              answer: textSchema,
              lessonId: textSchema,
              stepId: textSchema,
            })
          ),
          responses: {
            ...authenticatedResponses(
              jsonResponse("AI 코칭 결과입니다.", aiFeedbackResultSchema)
            ),
            "429": jsonResponse("AI 코칭 시도 횟수를 모두 사용했습니다.", {
              ...errorResponseSchema,
            }),
            "503": jsonResponse("AI provider를 사용할 수 없습니다.", {
              ...errorResponseSchema,
            }),
          },
          security: authSecurity,
          summary: "AI 코칭 생성",
        },
      },
    },
  }
}

function objectSchema(
  properties: Readonly<Record<string, JsonSchema>>,
  required = Object.keys(properties)
): ObjectJsonSchema {
  return {
    additionalProperties: false,
    properties,
    required,
    type: "object",
  }
}

function arraySchema(items: JsonSchema): JsonSchema {
  return {
    items,
    type: "array",
  }
}

function jsonRequest(schema: JsonSchema) {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
    required: true,
  } as const
}

function jsonResponse(description: string, schema: JsonSchema): ResponseObject {
  return {
    content: {
      "application/json": {
        schema,
      },
    },
    description,
  }
}

function authenticatedResponses(successResponse: ResponseObject) {
  return {
    "200": successResponse,
    "401": jsonResponse("인증이 필요합니다.", errorResponseSchema),
    "403": jsonResponse("계정을 사용할 수 없습니다.", errorResponseSchema),
  } as const
}

function pathParameter(name: string) {
  return {
    in: "path",
    name,
    required: true,
    schema: textSchema,
  } as const
}

const errorResponseSchema = objectSchema({
  error: objectSchema({
    code: textSchema,
  }),
})

const learnerUserSchema = objectSchema({
  email: textSchema,
  id: textSchema,
  image: nullableTextSchema,
  joinedAt: dateTimeTextSchema,
  name: textSchema,
  status: {
    enum: ["active", "suspended", "deleted"],
    type: "string",
  },
})

const courseSummarySchema = objectSchema({
  category: textSchema,
  description: textSchema,
  id: textSchema,
  lessonCount: integerSchema,
  status: {
    enum: ["active", "archived"],
    type: "string",
  },
  title: textSchema,
})

const lessonSummarySchema = objectSchema({
  category: nullableTextSchema,
  description: nullableTextSchema,
  estimatedMinutes: integerSchema,
  id: textSchema,
  sortOrder: integerSchema,
  status: {
    enum: ["active", "archived"],
    type: "string",
  },
  title: textSchema,
})

const courseUnitSchema = objectSchema({
  id: textSchema,
  lessons: arraySchema(lessonSummarySchema),
  sortOrder: integerSchema,
  title: textSchema,
})

const courseDetailSchema = objectSchema({
  ...courseSummarySchema.properties,
  progress: objectSchema({
    completedLessons: integerSchema,
    percentage: percentSchema,
    totalLessons: integerSchema,
  }),
  units: arraySchema(courseUnitSchema),
})

const lessonStepSchema = objectSchema(
  {
    allowRetry: booleanSchema,
    analysis: textSchema,
    answer: arraySchema(textSchema),
    badge: textSchema,
    body: textSchema,
    categories: arraySchema(
      objectSchema({
        id: textSchema,
        label: textSchema,
      })
    ),
    correct: {
      anyOf: [textSchema, arraySchema(textSchema), arraySchema(integerSchema)],
    },
    claim: textSchema,
    context: textSchema,
    draft: booleanSchema,
    explanation: textSchema,
    feedback: textSchema,
    focus: textSchema,
    goal: integerSchema,
    guide: textSchema,
    id: textSchema,
    items: {
      anyOf: [
        arraySchema(textSchema),
        arraySchema(
          objectSchema({
            categoryId: textSchema,
            id: textSchema,
            text: textSchema,
          })
        ),
      ],
    },
    layout: textSchema,
    max: integerSchema,
    min: integerSchema,
    mode: textSchema,
    options: arraySchema(
      objectSchema({
        id: textSchema,
        text: textSchema,
      })
    ),
    pairs: arraySchema(
      objectSchema({
        left: textSchema,
        right: textSchema,
      })
    ),
    placeholder: textSchema,
    prompt: textSchema,
    question: textSchema,
    reference: textSchema,
    sample: textSchema,
    score: integerSchema,
    scoreMax: integerSchema,
    segments: arraySchema(textSchema),
    showNumbers: booleanSchema,
    showScore: booleanSchema,
    sortOrder: integerSchema,
    source: textSchema,
    structure: textSchema,
    target: textSchema,
    template: textSchema,
    title: textSchema,
    topic: textSchema,
    type: {
      enum: [
        "READING",
        "COMPARE",
        "MULTIPLE_CHOICE",
        "FILL_BLANK",
        "SELECT",
        "ORDER",
        "WRITE",
        "AI_FEEDBACK",
        "MATCH",
        "CATEGORIZE",
      ],
      type: "string",
    },
    versions: arraySchema(
      objectSchema({
        label: textSchema,
        text: textSchema,
      })
    ),
    wrong: textSchema,
    words: arraySchema(textSchema),
  },
  ["id", "sortOrder", "type"]
)

const lessonSchema = objectSchema({
  category: nullableTextSchema,
  courseId: textSchema,
  description: nullableTextSchema,
  estimatedMinutes: integerSchema,
  id: textSchema,
  steps: arraySchema(lessonStepSchema),
  summary: arraySchema(textSchema),
  title: textSchema,
  unitId: textSchema,
})

const lessonAnswerSchema = {
  anyOf: [
    objectSchema({
      kind: {
        enum: ["lesson-started"],
        type: "string",
      },
    }),
    objectSchema({
      selectedOptionId: textSchema,
      type: {
        enum: ["MULTIPLE_CHOICE"],
        type: "string",
      },
    }),
    objectSchema({
      selectedWords: arraySchema(textSchema),
      type: {
        enum: ["FILL_BLANK"],
        type: "string",
      },
    }),
    objectSchema({
      selectedIndexes: arraySchema(integerSchema),
      type: {
        enum: ["SELECT"],
        type: "string",
      },
    }),
    objectSchema({
      orderedItems: arraySchema(textSchema),
      type: {
        enum: ["ORDER"],
        type: "string",
      },
    }),
    objectSchema({
      pairs: arraySchema(
        objectSchema({
          left: textSchema,
          right: textSchema,
        })
      ),
      type: {
        enum: ["MATCH"],
        type: "string",
      },
    }),
    objectSchema({
      items: arraySchema(
        objectSchema({
          categoryId: textSchema,
          itemId: textSchema,
        })
      ),
      type: {
        enum: ["CATEGORIZE"],
        type: "string",
      },
    }),
    objectSchema({
      text: textSchema,
      type: {
        enum: ["WRITE"],
        type: "string",
      },
    }),
    objectSchema({
      requested: booleanSchema,
      type: {
        enum: ["AI_FEEDBACK"],
        type: "string",
      },
    }),
  ],
} as const

const progressLessonSchema = objectSchema({
  estimatedMinutes: integerSchema,
  id: textSchema,
  status: {
    enum: ["available", "completed", "locked"],
    type: "string",
  },
  title: textSchema,
})

const progressNextLessonSchema = objectSchema({
  courseId: textSchema,
  estimatedMinutes: integerSchema,
  id: textSchema,
  status: {
    enum: ["available", "completed", "locked"],
    type: "string",
  },
  title: textSchema,
})

const aiFeedbackResultSchema = objectSchema({
  improvements: arraySchema(textSchema),
  nextAction: textSchema,
  remainingAttempts: integerSchema,
  score: percentSchema,
  scoreRange: {
    items: [integerSchema, integerSchema],
    maxItems: 2,
    minItems: 2,
    type: "array",
  },
  showScore: booleanSchema,
  strengths: arraySchema(textSchema),
  summary: textSchema,
})
