export interface paths {
  "/health": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description 서버 상태를 확인합니다. */
    get: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 서버 정상 */
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              /** @enum {string} */
              status: "ok"
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/api/auth/sign-up/email": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 이메일과 비밀번호로 회원가입합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            /** Format: email */
            email: string
            name: string
            password: string
          }
        }
      }
      responses: {
        /** @description 회원가입 성공 */
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              id: string
              email: string
              name: string
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/api/auth/sign-in/email": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 이메일과 비밀번호로 로그인합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            /** Format: email */
            email: string
            password: string
          }
        }
      }
      responses: {
        /** @description 로그인 성공 */
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              session: {
                id: string
                token: string
                userId: string
              }
              user: {
                id: string
                email: string
                name: string
              }
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/api/auth/sign-out": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 현재 세션을 종료합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 로그아웃 성공 */
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": { success: boolean }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/api/auth/forget-password": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 비밀번호 재설정 이메일을 전송합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            /** Format: email */
            email: string
            /** Format: uri */
            redirectTo?: string
          }
        }
      }
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": { status: boolean }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/api/auth/reset-password": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 이메일로 전송된 토큰으로 비밀번호를 재설정합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            newPassword: string
            token: string
          }
        }
      }
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": { status: boolean }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/session": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description 현재 인증된 사용자의 세션 정보를 반환합니다. */
    get: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              session: {
                createdAt: string
                expiresAt: string
                id: string
                ipAddress?: string | null
                token: string
                updatedAt: string
                userAgent?: string | null
                userId: string
              }
              user: {
                email: string
                emailVerified: boolean
                id: string
                image?: string | null
                name: string
              }
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/home": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 홈 스냅샷 조회
     * @description 오늘의 글감과 진행 중인 여정 목록을 반환합니다.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 홈 스냅샷 */
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              dailyPrompt: components["schemas"]["PromptSummary"] | null
              activeJourneys: components["schemas"]["ActiveJourneySummary"][]
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/prompts": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 글감 목록 조회
     * @description 유형, 북마크 여부로 필터링하여 글감 목록을 조회합니다.
     */
    get: {
      parameters: {
        query?: {
          /** @enum {string} */
          type?: "sensory" | "reflection" | "opinion"
          bookmarked?: boolean
          query?: string
        }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 글감 목록 */
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              items: components["schemas"]["PromptSummary"][]
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/prompts/{promptId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description 특정 글감의 상세 정보를 조회합니다. */
    get: {
      parameters: {
        query?: never
        header?: never
        path: { promptId: number }
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": components["schemas"]["PromptSummary"]
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/prompts/{promptId}/bookmark": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /** @description 글감을 북마크에 추가합니다. */
    put: {
      parameters: {
        query?: never
        header?: never
        path: { promptId: number }
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              /** @enum {string} */
              kind: "bookmarked"
              savedAt: string
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    post?: never
    /** @description 글감 북마크를 해제합니다. */
    delete: {
      parameters: {
        query?: never
        header?: never
        path: { promptId: number }
        cookie?: never
      }
      requestBody?: never
      responses: {
        204: {
          headers: { [name: string]: unknown }
          content?: never
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/journeys": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description 여정 목록을 조회합니다. */
    get: {
      parameters: {
        query?: {
          /** @enum {string} */
          category?: "writing_skill" | "mindfulness" | "practical"
        }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              items: components["schemas"]["JourneySummary"][]
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/journeys/{journeyId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description 특정 여정의 상세 정보(세션 목록 포함)를 조회합니다. */
    get: {
      parameters: {
        query?: never
        header?: never
        path: { journeyId: number }
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": components["schemas"]["JourneyDetail"]
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/journeys/{journeyId}/enroll": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 여정에 등록합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path: { journeyId: number }
        cookie?: never
      }
      requestBody?: never
      responses: {
        201: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": components["schemas"]["UserJourneyProgress"]
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{sessionId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description 특정 세션의 상세 정보(스텝 목록 포함)를 조회합니다. */
    get: {
      parameters: {
        query?: never
        header?: never
        path: { sessionId: number }
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": components["schemas"]["JourneySessionDetail"]
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{sessionId}/start": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 세션을 시작합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path: { sessionId: number }
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": components["schemas"]["UserSessionProgress"]
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{sessionId}/steps/{stepOrder}/submit": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 스텝 응답을 제출합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path: { sessionId: number; stepOrder: number }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            response: unknown
          }
        }
      }
      responses: {
        204: {
          headers: { [name: string]: unknown }
          content?: never
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{sessionId}/complete": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 세션을 완료 처리합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path: { sessionId: number }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            journeyId: number
            nextSessionOrder: number
            totalSessions: number
          }
        }
      }
      responses: {
        204: {
          headers: { [name: string]: unknown }
          content?: never
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/writings": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description 현재 사용자의 글 목록을 조회합니다. */
    get: {
      parameters: {
        query?: {
          limit?: number
          cursor?: string
        }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              items: components["schemas"]["WritingSummary"][]
              nextCursor: string | null
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    /** @description 새 글을 생성합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            title?: string
            bodyJson?: unknown
            bodyPlainText?: string
            wordCount?: number
            sourcePromptId?: number
            sourceSessionId?: number
          }
        }
      }
      responses: {
        /** @description 글 생성 완료 */
        201: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": components["schemas"]["WritingDetail"]
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/writings/{writingId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description 특정 글의 전체 내용을 조회합니다. */
    get: {
      parameters: {
        query?: never
        header?: never
        path: { writingId: number }
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": components["schemas"]["WritingDetail"]
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    /** @description 특정 글을 영구적으로 삭제합니다. */
    delete: {
      parameters: {
        query?: never
        header?: never
        path: { writingId: number }
        cookie?: never
      }
      requestBody?: never
      responses: {
        204: {
          headers: { [name: string]: unknown }
          content?: never
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    options?: never
    head?: never
    /** @description 글을 자동 저장합니다. */
    patch: {
      parameters: {
        query?: never
        header?: never
        path: { writingId: number }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            title?: string
            bodyJson?: unknown
            bodyPlainText?: string
            wordCount?: number
          }
        }
      }
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              /** @enum {string} */
              kind: "autosaved"
              writing: components["schemas"]["WritingDetail"]
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    trace?: never
  }
  "/writings/{writingId}/feedback": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description AI 소크라테스식 피드백을 생성합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path: { writingId: number }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            /** @enum {string} */
            level: "beginner" | "intermediate" | "advanced"
          }
        }
      }
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              strengths: string[]
              improvements: string[]
              question: string
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/writings/{writingId}/compare": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /** @description 두 버전의 글을 비교하여 개선 사항을 분석합니다. */
    post: {
      parameters: {
        query?: never
        header?: never
        path: { writingId: number }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            originalText: string
            revisedText: string
          }
        }
      }
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              improvements: string[]
              summary: string
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/dev/auth-emails": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description 개발 환경에서 전송된 인증 메일을 조회합니다. */
    get: {
      parameters: {
        query: {
          email: string
          kind: "password-reset" | "verification"
        }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              email: string
              /** @enum {string} */
              kind: "password-reset" | "verification"
              sentAt: string
              token: string
              url: string
            }
          }
        }
        default: components["responses"]["ErrorResponse"]
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export interface components {
  schemas: {
    PromptSummary: {
      id: number
      /** @enum {string} */
      promptType: "sensory" | "reflection" | "opinion"
      title: string
      body: string
      responseCount: number
      isBookmarked: boolean
    }
    ActiveJourneySummary: {
      journeyId: number
      title: string
      description: string
      thumbnailUrl: string | null
      completionRate: number
      currentSessionOrder: number
    }
    JourneySummary: {
      id: number
      title: string
      description: string
      /** @enum {string} */
      category: "writing_skill" | "mindfulness" | "practical"
      thumbnailUrl: string | null
      sessionCount: number
    }
    JourneySessionSummary: {
      id: number
      journeyId: number
      order: number
      title: string
      description: string
      estimatedMinutes: number
    }
    StepSummary: {
      id: number
      sessionId: number
      order: number
      /** @enum {string} */
      type:
        | "learn"
        | "read"
        | "guided_question"
        | "write"
        | "feedback"
        | "revise"
      contentJson: unknown
    }
    JourneyDetail: components["schemas"]["JourneySummary"] & {
      sessions: components["schemas"]["JourneySessionSummary"][]
    }
    JourneySessionDetail: components["schemas"]["JourneySessionSummary"] & {
      steps: components["schemas"]["StepSummary"][]
    }
    UserJourneyProgress: {
      userId: string
      journeyId: number
      currentSessionOrder: number
      completionRate: number
      /** @enum {string} */
      status: "in_progress" | "completed"
    }
    UserSessionProgress: {
      userId: string
      sessionId: number
      currentStepOrder: number
      /** @enum {string} */
      status: "locked" | "in_progress" | "completed"
      stepResponsesJson: Record<string, unknown>
    }
    WritingSummary: {
      id: number
      title: string
      preview: string
      wordCount: number
      sourcePromptId: number | null
      createdAt: string
      updatedAt: string
    }
    WritingDetail: components["schemas"]["WritingSummary"] & {
      bodyJson: unknown
      bodyPlainText: string
    }
  }
  responses: {
    ErrorResponse: {
      headers: { [name: string]: unknown }
      content: {
        "application/json": {
          error: {
            code: string
            message: string
            details?: unknown
          }
        }
      }
    }
  }
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export type operations = Record<string, never>
