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
        /** @description 서버 정상 */
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
        /** @description 세션 정보 */
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
     * @description 오늘의 글감, 최근 초안, 이어쓸 초안, 저장된 글감을 한 번에 조회합니다.
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
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              recentDrafts: {
                characterCount: number
                id: number
                lastSavedAt: string
                preview: string
                sourcePromptId: number | null
                title: string
                wordCount: number
              }[]
              resumeDraft: {
                characterCount: number
                id: number
                lastSavedAt: string
                preview: string
                sourcePromptId: number | null
                title: string
                wordCount: number
              } | null
              savedPrompts: {
                id: number
                level: 1 | 2 | 3
                saved: boolean
                /** @enum {string} */
                suggestedLengthLabel: "깊이" | "보통" | "짧음"
                tags: string[]
                text: string
                /** @enum {string} */
                topic:
                  | "감정"
                  | "경험"
                  | "관계"
                  | "기술"
                  | "기억"
                  | "문화"
                  | "사회"
                  | "상상"
                  | "성장"
                  | "여행"
                  | "일상"
                  | "자기이해"
                  | "진로"
              }[]
              todayPrompts: {
                id: number
                level: 1 | 2 | 3
                saved: boolean
                /** @enum {string} */
                suggestedLengthLabel: "깊이" | "보통" | "짧음"
                tags: string[]
                text: string
                /** @enum {string} */
                topic:
                  | "감정"
                  | "경험"
                  | "관계"
                  | "기술"
                  | "기억"
                  | "문화"
                  | "사회"
                  | "상상"
                  | "성장"
                  | "여행"
                  | "일상"
                  | "자기이해"
                  | "진로"
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
     * @description 주제, 난이도, 검색어 등 필터를 적용하여 글감 목록을 조회합니다.
     */
    get: {
      parameters: {
        query?: {
          level?: 1 | 2 | 3
          query?: string
          saved?: "false" | "true"
          topic?:
            | "감정"
            | "경험"
            | "관계"
            | "기술"
            | "기억"
            | "문화"
            | "사회"
            | "상상"
            | "성장"
            | "여행"
            | "일상"
            | "자기이해"
            | "진로"
        }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 글감 목록 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              items: {
                id: number
                level: 1 | 2 | 3
                saved: boolean
                /** @enum {string} */
                suggestedLengthLabel: "깊이" | "보통" | "짧음"
                tags: string[]
                text: string
                /** @enum {string} */
                topic:
                  | "감정"
                  | "경험"
                  | "관계"
                  | "기술"
                  | "기억"
                  | "문화"
                  | "사회"
                  | "상상"
                  | "성장"
                  | "여행"
                  | "일상"
                  | "자기이해"
                  | "진로"
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
        /** @description 글감 상세 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              level: 1 | 2 | 3
              saved: boolean
              /** @enum {string} */
              suggestedLengthLabel: "깊이" | "보통" | "짧음"
              tags: string[]
              text: string
              /** @enum {string} */
              topic:
                | "감정"
                | "경험"
                | "관계"
                | "기술"
                | "기억"
                | "문화"
                | "사회"
                | "상상"
                | "성장"
                | "여행"
                | "일상"
                | "자기이해"
                | "진로"
              description: string
              outline: string[]
              tips: string[]
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
  "/prompts/{promptId}/save": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * 글감 저장
     * @description 특정 글감을 저장 목록에 추가합니다. 이미 저장된 경우 멱등적으로 동작합니다.
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
        /** @description 글감 저장 완료 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              /** @enum {string} */
              kind: "saved"
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
              }
            }
          }
        }
      }
    }
    post?: never
    /**
     * 글감 저장 해제
     * @description 특정 글감을 저장 목록에서 제거합니다.
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
        /** @description 글감 저장 해제 완료 */
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
  "/drafts": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 초안 목록 조회
     * @description 현재 사용자의 초안 목록을 최근 수정 순으로 조회합니다.
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
        /** @description 초안 목록 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              items: {
                characterCount: number
                id: number
                lastSavedAt: string
                preview: string
                sourcePromptId: number | null
                title: string
                wordCount: number
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
              }
            }
          }
        }
      }
    }
    put?: never
    /**
     * 초안 생성
     * @description 새 초안을 생성합니다. 글감을 기반으로 생성할 수 있습니다.
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
            content?: components["schemas"]["DraftContent"]
            sourcePromptId?: number
            title?: string
          }
        }
      }
      responses: {
        /** @description 초안 생성 완료 */
        201: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              characterCount: number
              id: number
              lastSavedAt: string
              preview: string
              sourcePromptId: number | null
              title: string
              wordCount: number
              content: components["schemas"]["DraftContent"]
              createdAt: string
              updatedAt: string
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
  "/drafts/{draftId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 초안 상세 조회
     * @description 특정 초안의 전체 내용을 조회합니다.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path: {
          draftId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 초안 상세 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              characterCount: number
              id: number
              lastSavedAt: string
              preview: string
              sourcePromptId: number | null
              title: string
              wordCount: number
              content: components["schemas"]["DraftContent"]
              createdAt: string
              updatedAt: string
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
              }
            }
          }
        }
      }
    }
    put?: never
    post?: never
    /**
     * 초안 삭제
     * @description 특정 초안을 영구적으로 삭제합니다.
     */
    delete: {
      parameters: {
        query?: never
        header?: never
        path: {
          draftId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 초안 삭제 완료 */
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
              }
            }
          }
        }
      }
    }
    options?: never
    head?: never
    /**
     * 초안 자동 저장
     * @description 초안의 제목 또는 본문을 자동 저장합니다.
     */
    patch: {
      parameters: {
        query?: never
        header?: never
        path: {
          draftId: number
        }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": {
            content?: components["schemas"]["DraftContent"]
            title?: string
          }
        }
      }
      responses: {
        /** @description 자동 저장 완료 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              draft: {
                characterCount: number
                id: number
                lastSavedAt: string
                preview: string
                sourcePromptId: number | null
                title: string
                wordCount: number
                content: components["schemas"]["DraftContent"]
                createdAt: string
                updatedAt: string
              }
              /** @enum {string} */
              kind: "autosaved"
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
              }
            }
          }
        }
      }
    }
    trace?: never
  }
  "/writings/{writingId}/sync/push": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * 트랜잭션 푸시
     * @description 에디터 트랜잭션을 서버에 푸시하여 동기화합니다.
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
            baseVersion: number
            transactions: {
              operations: (
                | {
                    /** @enum {string} */
                    type: "setTitle"
                    title: string
                  }
                | {
                    /** @enum {string} */
                    type: "setContent"
                    content: components["schemas"]["DraftContent"]
                  }
              )[]
              createdAt: string
            }[]
            restoreFrom?: number
          }
        }
      }
      responses: {
        /** @description 동기화 결과 (승인 또는 충돌) */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json":
              | {
                  /** @enum {boolean} */
                  accepted: true
                  serverVersion: number
                }
              | {
                  /** @enum {boolean} */
                  accepted: false
                  serverVersion: number
                  serverContent: components["schemas"]["DraftContent"]
                  serverTitle: string
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
  "/writings/{writingId}/sync/pull": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 문서 상태 풀
     * @description 서버에서 최신 문서 상태를 가져옵니다.
     */
    get: {
      parameters: {
        query?: {
          since?: number | null
        }
        header?: never
        path: {
          writingId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 현재 문서 상태 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              version: number
              title: string
              content: components["schemas"]["DraftContent"]
              lastSavedAt: string
              hasNewerVersion: boolean
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
  "/writings/{writingId}/versions": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 버전 기록 목록
     * @description 문서의 버전 기록 목록을 조회합니다.
     */
    get: {
      parameters: {
        query?: {
          limit?: number
        }
        header?: never
        path: {
          writingId: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 버전 기록 목록 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              items: {
                id: number
                draftId: number
                version: number
                title: string
                createdAt: string
                /** @enum {string} */
                reason: "auto" | "manual" | "restore"
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
  "/writings/{writingId}/versions/{version}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * 버전 상세 조회
     * @description 특정 버전의 문서 스냅샷을 조회합니다.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path: {
          writingId: number
          version: number
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description 버전 상세 정보 */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": {
              id: number
              draftId: number
              version: number
              title: string
              createdAt: string
              /** @enum {string} */
              reason: "auto" | "manual" | "restore"
              content: components["schemas"]["DraftContent"]
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
        /** @description 인증 메일 정보 */
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
  schemas: {
    DraftContent: {
      content?: components["schemas"]["TiptapNode"][]
      /** @enum {string} */
      type: "doc"
    }
    TiptapNode: {
      attrs?: {
        [key: string]: unknown
      }
      content?: components["schemas"]["TiptapNode"][]
      marks?: components["schemas"]["TiptapMark"][]
      text?: string
      type: string
    }
    TiptapMark: {
      attrs?: {
        [key: string]: unknown
      }
      type: string
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export type operations = Record<string, never>
