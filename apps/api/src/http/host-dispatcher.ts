import {
  normalizeApiHostAuthority,
  type ApiHostConfiguration,
} from "@/config/api-hosts"

export type ApiRequestHandler = (
  request: Request
) => Promise<Response> | Response

export type HostDispatchRejection = {
  readonly reason: "invalid" | "mismatch" | "missing" | "unknown"
}

export function createHostDispatcher(input: {
  readonly adminFetch: ApiRequestHandler
  readonly hosts: ApiHostConfiguration
  readonly learnerFetch: ApiRequestHandler
  readonly onRejectedHost?: (event: HostDispatchRejection) => void
}): ApiRequestHandler {
  return (request) => {
    const rawHost = request.headers.get("host")
    if (rawHost === null) return rejectHost(input, "missing")

    let authority: ReturnType<typeof normalizeApiHostAuthority>
    let urlAuthority: ReturnType<typeof normalizeApiHostAuthority>
    try {
      authority = normalizeApiHostAuthority(rawHost)
      urlAuthority = normalizeApiHostAuthority(new URL(request.url).host)
    } catch {
      return rejectHost(input, "invalid")
    }

    if (authority !== urlAuthority) return rejectHost(input, "mismatch")
    if (input.hosts.learner.has(authority)) return input.learnerFetch(request)
    if (input.hosts.admin.has(authority)) return input.adminFetch(request)

    return rejectHost(input, "unknown")
  }
}

function rejectHost(
  input: {
    readonly onRejectedHost?: (event: HostDispatchRejection) => void
  },
  reason: HostDispatchRejection["reason"]
): Response {
  try {
    input.onRejectedHost?.({ reason })
  } catch {
    // 관찰 callback 장애가 fail-closed Host 응답을 바꾸지 않게 격리한다.
  }

  return Response.json(
    {
      code: "MISDIRECTED_REQUEST",
      message: "요청 대상 Host가 올바르지 않습니다.",
    },
    {
      headers: { "Cache-Control": "no-store" },
      status: 421,
    }
  )
}
