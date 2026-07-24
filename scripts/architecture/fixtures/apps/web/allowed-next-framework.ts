import type { NextRequest } from "next/server"

export type AllowedNextRequest = Pick<NextRequest, "method">
