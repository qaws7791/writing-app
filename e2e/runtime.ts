import {
  e2eRuntimeOrigins,
  e2eSeededCredentials,
  readRequiredE2eEnvironment,
} from "@workspace/env/e2e-runtime"

export const e2eRuntime = e2eRuntimeOrigins
export const e2eCredentials = e2eSeededCredentials
export { readRequiredE2eEnvironment }
