interface WebBindings {
  API: { fetch: (request: Request) => Promise<Response> }
}
declare module "cloudflare:workers" {
  export const env: WebBindings
}
