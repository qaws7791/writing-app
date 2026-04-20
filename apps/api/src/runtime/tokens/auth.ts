import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"

export const AuthHandler =
  createToken<AppVariables["authHandler"]>("authHandler")
export const AuthSession =
  createToken<AppVariables["authSession"]>("authSession")
export const AuthUser = createToken<AppVariables["authUser"]>("authUser")
export const ReadLatestAuthEmail = createToken<
  AppVariables["readLatestAuthEmail"]
>("readLatestAuthEmail")
export const RequestId = createToken<AppVariables["requestId"]>("requestId")
export const RequestLogger =
  createToken<AppVariables["requestLogger"]>("requestLogger")
export const UserId = createToken<AppVariables["userId"]>("userId")
