import type { AppVariables } from "../../app-env"
import { createToken } from "../../lib/injection-token"

export const GenerateFeedbackUseCase = createToken<
  AppVariables["generateFeedbackUseCase"]
>("generateFeedbackUseCase")

export const CompareRevisionsUseCase = createToken<
  AppVariables["compareRevisionsUseCase"]
>("compareRevisionsUseCase")
