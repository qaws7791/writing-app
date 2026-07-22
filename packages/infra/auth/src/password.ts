import { hashPassword } from "better-auth/crypto"

export function hashAuthPassword(password: string): Promise<string> {
  return hashPassword(password)
}
