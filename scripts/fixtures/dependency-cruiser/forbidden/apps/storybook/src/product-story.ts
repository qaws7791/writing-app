import { featureValue } from "../../web/src/features/beta/model/value"
import { authValue } from "../../../packages/infra/auth/src/client"
import { alphaDomain } from "../../../packages/modules/alpha/src/domain/alpha-domain"

export const forbiddenStory = `${featureValue}:${authValue}:${alphaDomain}`
