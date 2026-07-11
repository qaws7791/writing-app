import { recordCspViolation } from "@workspace/config/nextjs/csp-report"

export async function POST(request: Request): Promise<Response> {
  return recordCspViolation(request, "admin")
}
