export const adminTargetContractProtocolVersion = 1 as const

export const adminTargetContractResultMarker =
  "ADMIN_TARGET_CONTRACT_RESULT:" as const

export type AdminTargetContractWorkspace = "target"

export type AdminTargetContractJson =
  | null
  | boolean
  | number
  | string
  | readonly AdminTargetContractJson[]
  | { readonly [key: string]: AdminTargetContractJson }

type AdminTargetContractRequestBody =
  | {
      readonly encoding: "base64"
      readonly value: string
    }
  | {
      readonly encoding: "utf8"
      readonly value: string
    }

type AdminTargetContractResponseBodyMode =
  | "bytes"
  | "json"
  | "none"
  | "sse"
  | "text"

type AdminTargetContractOpenApiComponentSection =
  | "callbacks"
  | "examples"
  | "headers"
  | "links"
  | "parameters"
  | "requestBodies"
  | "responses"
  | "schemas"
  | "securitySchemes"

export type AdminTargetContractOpenApiProjection = {
  readonly components?: readonly {
    readonly names: readonly string[]
    readonly section: AdminTargetContractOpenApiComponentSection
  }[]
  readonly paths: readonly string[]
}

type AdminTargetContractCaseBase = {
  readonly id: string
  readonly request: {
    readonly body?: AdminTargetContractRequestBody
    readonly headers?: readonly (readonly [name: string, value: string])[]
    readonly method: string
    readonly path: string
  }
  readonly scenario: string
}

export type AdminTargetContractCase =
  | (AdminTargetContractCaseBase & {
      readonly openApiProjection: AdminTargetContractOpenApiProjection
      readonly responseBody: "openapi"
    })
  | (AdminTargetContractCaseBase & {
      readonly openApiProjection?: never
      readonly responseBody: AdminTargetContractResponseBodyMode
    })

export type AdminTargetContractRunInput = {
  readonly cases: readonly AdminTargetContractCase[]
  readonly protocolVersion: typeof adminTargetContractProtocolVersion
  readonly suite: string
}

export type AdminTargetContractRawObservation = {
  readonly bodyBase64: string
  readonly effectJournal: readonly AdminTargetContractJson[]
  readonly headers: readonly {
    readonly name: string
    readonly value: string
  }[]
  readonly id: string
  readonly status: number
}

export type AdminTargetContractRunnerOutput = {
  readonly observations: readonly AdminTargetContractRawObservation[]
  readonly protocolVersion: typeof adminTargetContractProtocolVersion
  readonly runtime: {
    readonly cwd: string
    readonly pid: number
    readonly workspace: AdminTargetContractWorkspace
  }
}

export type AdminTargetContractSseEvent = {
  readonly data:
    | {
        readonly kind: "json"
        readonly value: AdminTargetContractJson
      }
    | {
        readonly kind: "text"
        readonly value: string
      }
  readonly event: string
  readonly id?: string
  readonly retry?: number
}

export type AdminTargetContractSemanticBody =
  | {
      readonly base64: string
      readonly kind: "bytes"
    }
  | {
      readonly kind: "json"
      readonly value: AdminTargetContractJson
    }
  | {
      readonly kind: "openapi"
      readonly projection: AdminTargetContractJson
    }
  | {
      readonly events: readonly AdminTargetContractSseEvent[]
      readonly kind: "sse"
    }
  | {
      readonly kind: "text"
      readonly value: string
    }
  | {
      readonly kind: "none"
    }

export type AdminTargetContractSemanticObservation = {
  readonly body: AdminTargetContractSemanticBody
  readonly effectJournal: readonly AdminTargetContractJson[]
  readonly headers: Readonly<Record<string, readonly string[]>>
  readonly id: string
  readonly status: number
}
