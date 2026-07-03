export type {
  MatchAnswerPair,
  MatchChoice,
  MatchChoiceId,
  MatchSelectionMap,
  MatchStepPresentation,
  MatchStepPresentationInput,
} from "@workspace/lesson"

export {
  createMatchStepPresentation,
  findMatchedLeftChoiceIdForRightChoiceId,
  isCorrectMatchChoice,
  toMatchAnswerPairs,
  toggleMatchSelection,
} from "@workspace/lesson"
