import { env } from "cloudflare:workers"

export const fetchApi = (request: Request): Promise<Response> =>
  env.API.fetch(request)
