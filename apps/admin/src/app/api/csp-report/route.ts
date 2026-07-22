import { recordCspViolation } from "@workspace/nextjs-config/csp-report"

export async function POST(request: Request): Promise<Response> {
  return recordCspViolation(request, "admin")
}
