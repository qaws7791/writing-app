export type OpenApiDocument<
  TSecuritySchemes extends Readonly<Record<string, unknown>>,
> = Readonly<{
  components: Readonly<{
    securitySchemes: TSecuritySchemes
  }>
  info: Readonly<{
    title: string
    version: string
  }>
  openapi: "3.1.0"
  paths: Readonly<Record<string, unknown>>
  servers: readonly Readonly<{
    description?: string
    url: string
  }>[]
}>
