export interface paths {
  "/health": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 헬스 체크
     * @description 서버 상태와 SQLite 버전을 확인합니다.
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
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              sqliteVersion: string
              /** @enum {string} */
              status: "ok"
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 이메일 회원가입
     * @description 이메일과 비밀번호로 회원가입합니다. 가입 후 이메일 인증이 필요합니다.
     */
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
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: string
              email: string
              name: string
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 이메일 로그인
     * @description 이메일과 비밀번호로 로그인합니다.
     */
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
          headers: {
            [name: string]: unknown
          }
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
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 로그아웃
     * @description 현재 세션을 종료하고 로그아웃합니다.
     */
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
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              success: boolean
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 비밀번호 재설정 요청
     * @description 비밀번호 재설정 이메일을 전송합니다.
     */
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
        /** @description 재설정 이메일 전송 완료 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              status: boolean
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 비밀번호 재설정
     * @description 이메일로 전송된 토큰을 사용하여 비밀번호를 재설정합니다.
     */
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
        /** @description 비밀번호 재설정 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              status: boolean
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 세션 조회
     * @description 현재 인증된 사용자의 세션 정보를 반환합니다.
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
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
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
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
     * 홈 조회
     * @description 오늘의 글감, 최근 글, 이어쓸 글, 저장된 글감을 한 번에 조회합니다.
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
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              dailyPrompt: {
                id: number
                /** @enum {string} */
                promptType: "sensory" | "reflection" | "opinion"
                title: string
                body: string
                thumbnailUrl: string
                responseCount: number
                isBookmarked: boolean
              } | null
              activeJourneys: {
                journeyId: number
                title: string
                description: string
                thumbnailUrl: string | null
                completionRate: number
                currentSessionOrder: number
              }[]
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
     * @description 카테고리(promptType) 필터와 커서 기반 페이지네이션으로 글감 목록을 조회합니다.
     */
    get: {
      parameters: {
        query?: {
          promptType?: "sensory" | "reflection" | "opinion"
          cursor?: number
          limit?: number
        }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              items: {
                id: number
                /** @enum {string} */
                promptType: "sensory" | "reflection" | "opinion"
                title: string
                body: string
                thumbnailUrl: string
                responseCount: number
                isBookmarked: boolean
              }[]
              nextCursor: number | null
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
  "/prompts/categories": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 글감 카테고리 목록
     * @description 글감 카테고리 목록을 반환합니다. (감각, 회고, 의견)
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
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              items: {
                /** @enum {string} */
                key: "sensory" | "reflection" | "opinion"
                label: string
              }[]
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 글감 상세 조회
     * @description 특정 글감의 상세 정보를 조회합니다.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path: {
          promptId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              /** @enum {string} */
              promptType: "sensory" | "reflection" | "opinion"
              title: string
              body: string
              thumbnailUrl: string
              responseCount: number
              isBookmarked: boolean
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
  "/prompts/{promptId}/writings": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 글감별 공개 글 목록 조회
     * @description 특정 글감을 주제로 작성된 공개 글 목록을 커서 기반 페이지네이션으로 조회합니다.
     */
    get: {
      parameters: {
        query?: {
          cursor?: string
          limit?: number
        }
        header?: never
        path: {
          promptId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              items: {
                id: number
                title: string
                preview: string
                wordCount: number
                createdAt: string
                isOwner: boolean
              }[]
              nextCursor: string | null
              hasMore: boolean
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 글감 북마크
     * @description 글감을 북마크에 추가합니다.
     */
    put: {
      parameters: {
        query?: never
        header?: never
        path: {
          promptId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              /** @enum {string} */
              kind: "bookmarked"
              savedAt: string
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
      }
    }
    post?: never
    /**
     * 글감 북마크 해제
     * @description 글감 북마크를 해제합니다.
     */
    delete: {
      parameters: {
        query?: never
        header?: never
        path: {
          promptId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 북마크 해제 완료 */
        204: {
          headers: {
            [name: string]: unknown
          }
          content?: never
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 여정 목록 조회
     * @description 여정 목록을 조회합니다.
     */
    get: {
      parameters: {
        query?: {
          category?: "writing_skill" | "mindfulness" | "practical"
        }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              items: {
                id: number
                title: string
                description: string
                /** @enum {string} */
                category: "writing_skill" | "mindfulness" | "practical"
                thumbnailUrl: string | null
                sessionCount: number
              }[]
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 여정 상세 조회
     * @description 특정 여정의 상세 정보(세션 목록 포함)를 조회합니다.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path: {
          journeyId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              title: string
              description: string
              /** @enum {string} */
              category: "writing_skill" | "mindfulness" | "practical"
              thumbnailUrl: string | null
              sessionCount: number
              sessions: {
                id: number
                journeyId: number
                order: number
                title: string
                description: string
                estimatedMinutes: number
              }[]
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 여정 등록
     * @description 여정에 등록합니다.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path: {
          journeyId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 생성 완료 */
        201: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              userId: string
              journeyId: number
              currentSessionOrder: number
              completionRate: number
              /** @enum {string} */
              status: "in_progress" | "completed"
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 세션 상세 조회
     * @description 특정 세션의 런타임 스냅샷을 조회합니다.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path: {
          sessionId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              journeyId: number
              order: number
              title: string
              description: string
              estimatedMinutes: number
              steps: {
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
                contentJson?: unknown
              }[]
              currentStepOrder: number
              /** @enum {string} */
              status: "locked" | "in_progress" | "completed"
              stepResponsesJson: {
                [key: string]: unknown
              }
              stepAiStates: {
                stepOrder: number
                /** @enum {string} */
                kind: "feedback" | "comparison"
                sourceStepOrder: number
                /** @enum {string} */
                status: "pending" | "succeeded" | "failed"
                attemptCount: number
                resultJson:
                  | {
                      strengths: string[]
                      improvements: string[]
                      question: string
                    }
                  | {
                      improvements: string[]
                      summary: string
                    }
                  | unknown
                errorMessage: string | null
                updatedAt: string
              }[]
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 세션 시작
     * @description 세션을 시작합니다.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path: {
          sessionId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              journeyId: number
              order: number
              title: string
              description: string
              estimatedMinutes: number
              steps: {
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
                contentJson?: unknown
              }[]
              currentStepOrder: number
              /** @enum {string} */
              status: "locked" | "in_progress" | "completed"
              stepResponsesJson: {
                [key: string]: unknown
              }
              stepAiStates: {
                stepOrder: number
                /** @enum {string} */
                kind: "feedback" | "comparison"
                sourceStepOrder: number
                /** @enum {string} */
                status: "pending" | "succeeded" | "failed"
                attemptCount: number
                resultJson:
                  | {
                      strengths: string[]
                      improvements: string[]
                      question: string
                    }
                  | {
                      improvements: string[]
                      summary: string
                    }
                  | unknown
                errorMessage: string | null
                updatedAt: string
              }[]
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 스텝 제출
     * @description 스텝 응답을 제출하고 갱신된 세션 스냅샷을 반환합니다.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path: {
          sessionId: number
          stepOrder: number
        }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            response?: unknown
          }
        }
      }
      responses: {
        /** @description 스텝 제출 완료 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              journeyId: number
              order: number
              title: string
              description: string
              estimatedMinutes: number
              steps: {
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
                contentJson?: unknown
              }[]
              currentStepOrder: number
              /** @enum {string} */
              status: "locked" | "in_progress" | "completed"
              stepResponsesJson: {
                [key: string]: unknown
              }
              stepAiStates: {
                stepOrder: number
                /** @enum {string} */
                kind: "feedback" | "comparison"
                sourceStepOrder: number
                /** @enum {string} */
                status: "pending" | "succeeded" | "failed"
                attemptCount: number
                resultJson:
                  | {
                      strengths: string[]
                      improvements: string[]
                      question: string
                    }
                  | {
                      improvements: string[]
                      summary: string
                    }
                  | unknown
                errorMessage: string | null
                updatedAt: string
              }[]
            }
          }
        }
        /** @description AI 처리 수락 */
        202: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              journeyId: number
              order: number
              title: string
              description: string
              estimatedMinutes: number
              steps: {
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
                contentJson?: unknown
              }[]
              currentStepOrder: number
              /** @enum {string} */
              status: "locked" | "in_progress" | "completed"
              stepResponsesJson: {
                [key: string]: unknown
              }
              stepAiStates: {
                stepOrder: number
                /** @enum {string} */
                kind: "feedback" | "comparison"
                sourceStepOrder: number
                /** @enum {string} */
                status: "pending" | "succeeded" | "failed"
                attemptCount: number
                resultJson:
                  | {
                      strengths: string[]
                      improvements: string[]
                      question: string
                    }
                  | {
                      improvements: string[]
                      summary: string
                    }
                  | unknown
                errorMessage: string | null
                updatedAt: string
              }[]
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/sessions/{sessionId}/steps/{stepOrder}/retry": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * 세션 AI 재시도
     * @description 실패한 세션 AI 작업을 다시 시작합니다.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path: {
          sessionId: number
          stepOrder: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 처리 수락 */
        202: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              journeyId: number
              order: number
              title: string
              description: string
              estimatedMinutes: number
              steps: {
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
                contentJson?: unknown
              }[]
              currentStepOrder: number
              /** @enum {string} */
              status: "locked" | "in_progress" | "completed"
              stepResponsesJson: {
                [key: string]: unknown
              }
              stepAiStates: {
                stepOrder: number
                /** @enum {string} */
                kind: "feedback" | "comparison"
                sourceStepOrder: number
                /** @enum {string} */
                status: "pending" | "succeeded" | "failed"
                attemptCount: number
                resultJson:
                  | {
                      strengths: string[]
                      improvements: string[]
                      question: string
                    }
                  | {
                      improvements: string[]
                      summary: string
                    }
                  | unknown
                errorMessage: string | null
                updatedAt: string
              }[]
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 세션 완료
     * @description 세션을 완료 처리합니다.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path: {
          sessionId: number
        }
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
        /** @description 세션 완료 */
        204: {
          headers: {
            [name: string]: unknown
          }
          content?: never
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/users/profile": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 프로필 조회
     * @description 현재 로그인한 사용자의 프로필과 기본 통계를 조회합니다.
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
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              activeJourneyCount: number
              completedJourneys: {
                journeyId: number
                title: string
                description: string
                thumbnailUrl: string | null
              }[]
              /** Format: email */
              email: string
              emailVerified: boolean
              image?: string | null
              name: string
              writingCount: number
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
  "/writings": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 글 목록 조회
     * @description 현재 사용자의 글 목록을 최근 수정 순으로 조회합니다.
     */
    get: {
      parameters: {
        query?: {
          cursor?: string
          limit?: number
        }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              items: {
                id: number
                title: string
                preview: string
                wordCount: number
                sourcePromptId: number | null
                createdAt: string
                updatedAt: string
              }[]
              nextCursor: string | null
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
      }
    }
    put?: never
    /**
     * 글 생성
     * @description 새 글을 생성합니다. 글감을 기반으로 생성할 수 있습니다.
     */
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
          }
        }
      }
      responses: {
        /** @description 생성 완료 */
        201: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              title: string
              preview: string
              wordCount: number
              sourcePromptId: number | null
              createdAt: string
              updatedAt: string
              bodyJson?: unknown
              bodyPlainText: string
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 글 상세 조회
     * @description 특정 글의 전체 내용을 조회합니다.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path: {
          writingId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              title: string
              preview: string
              wordCount: number
              sourcePromptId: number | null
              createdAt: string
              updatedAt: string
              bodyJson?: unknown
              bodyPlainText: string
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
      }
    }
    put?: never
    post?: never
    /**
     * 글 삭제
     * @description 특정 글을 영구적으로 삭제합니다.
     */
    delete: {
      parameters: {
        query?: never
        header?: never
        path: {
          writingId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 글 삭제 완료 */
        204: {
          headers: {
            [name: string]: unknown
          }
          content?: never
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
      }
    }
    options?: never
    head?: never
    /**
     * 글 자동 저장
     * @description 글의 제목 또는 본문을 자동 저장합니다.
     */
    patch: {
      parameters: {
        query?: never
        header?: never
        path: {
          writingId: number
        }
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
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              /** @enum {string} */
              kind: "autosaved"
              writing: {
                id: number
                title: string
                preview: string
                wordCount: number
                sourcePromptId: number | null
                createdAt: string
                updatedAt: string
                bodyJson?: unknown
                bodyPlainText: string
              }
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * AI 피드백 생성
     * @description AI 소크라테스식 피드백을 생성합니다.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path: {
          writingId: number
        }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            /**
             * @default beginner
             * @enum {string}
             */
            level?: "beginner" | "intermediate" | "advanced"
          }
        }
      }
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              strengths: string[]
              improvements: string[]
              question: string
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 글 버전 비교
     * @description 두 버전의 글을 비교하여 개선 사항을 분석합니다.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path: {
          writingId: number
        }
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
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              improvements: string[]
              summary: string
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/ai/feedback": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * AI 텍스트 피드백 생성
     * @description 텍스트에 대한 AI 소크라테스식 피드백을 생성합니다.
     */
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
            text: string
            /**
             * @default beginner
             * @enum {string}
             */
            level?: "beginner" | "intermediate" | "advanced"
          }
        }
      }
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              strengths: string[]
              improvements: string[]
              question: string
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/ai/compare": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * AI 텍스트 비교 분석
     * @description 두 텍스트를 비교하여 개선 사항을 분석합니다.
     */
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
            originalText: string
            revisedText: string
          }
        }
      }
      responses: {
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              improvements: string[]
              summary: string
            }
          }
        }
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
    /**
     * 인증 메일 조회 (개발용)
     * @description 개발 환경에서 전송된 인증 메일을 조회합니다. 프로덕션에서는 비활성화됩니다.
     */
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
        /** @description 성공 */
        200: {
          headers: {
            [name: string]: unknown
          }
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
        /** @description 에러 응답 */
        default: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              error: {
                code: string
                details?: unknown
                message: string
                requestId?: string
              }
            }
          }
        }
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
  schemas: never
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export type operations = Record<string, never>
