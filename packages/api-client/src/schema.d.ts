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
     * @description DB 쿼리 가능 여부와 AI 서브시스템 상태를 함께 확인합니다.
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
              ai: {
                reason: string
                /** @enum {string} */
                status: "degraded"
              }
              db: {
                latencyMs: number | null
                /** @enum {string} */
                status: "degraded" | "ok"
              }
              sqliteVersion: string
              /** @enum {string} */
              status: "degraded" | "ok"
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
  "/me": {
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
     * @description 첫 문장 루프 시작 행동과 문체 정원 요약을 조회합니다.
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
              startActions: {
                /** @enum {string} */
                id: "photo" | "garden" | "manual"
                title: string
                description: string
                href: string
              }[]
              recentWork: {
                sceneId: string
                title: string
                updatedAt: string
              } | null
              garden: {
                cardCount: number
                sentenceCount: number
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
              /** Format: email */
              email: string
              emailVerified: boolean
              gardenCardCount: number
              image?: string | null
              name: string
              sentenceCount: number
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
