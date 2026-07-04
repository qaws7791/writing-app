export type {
  MatchAnswerPair,
  MatchChoice,
  MatchChoiceId,
  MatchSelectionMap,
  MatchStepPresentation,
  MatchStepPresentationInput,
} from "@workspace/ui/components/lesson/match-presentation"

export {
  createMatchStepPresentation,
  findMatchedLeftChoiceIdForRightChoiceId,
  isCorrectMatchChoice,
  toMatchAnswerPairs,
  toggleMatchSelection,
} from "@workspace/ui/components/lesson/match-presentation"
