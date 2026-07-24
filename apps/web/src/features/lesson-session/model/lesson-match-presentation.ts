export type MatchChoiceId = string & {
  readonly __brand: "MatchChoiceId"
}

type MatchStepItemInput = {
  readonly id: string
  readonly text: string
}

export type MatchStepPresentationInput = {
  readonly leftItems: readonly MatchStepItemInput[]
  readonly rightItems: readonly MatchStepItemInput[]
}

export type MatchChoice = {
  readonly id: MatchChoiceId
  readonly itemId: string
  readonly pairIndex: number
  readonly text: string
}

export type MatchAnswerPair = {
  readonly left: string
  readonly leftItemId: string
  readonly right: string
  readonly rightItemId: string
}

export type MatchSelectionMap = Readonly<Record<MatchChoiceId, MatchChoiceId>>

export type MatchStepPresentation = {
  readonly leftChoices: readonly MatchChoice[]
  readonly rightChoices: readonly MatchChoice[]
}

export type MatchEvaluationItemInput = {
  readonly leftItemId: string
  readonly rightItemId: string
  readonly verdict: "correct" | "incorrect" | "missed"
}

export type PendingMatchChoice =
  | { readonly id: MatchChoiceId; readonly side: "left" }
  | { readonly id: MatchChoiceId; readonly side: "right" }

export type MatchInteractionState = {
  readonly pendingChoice: PendingMatchChoice | null
  readonly selectionMap: MatchSelectionMap
}

export type MatchInteractionTransition =
  | {
      readonly state: MatchInteractionState
      readonly type: "answer-changed"
    }
  | {
      readonly state: MatchInteractionState
      readonly type: "pending-changed"
    }

export type MatchAnswerConnection = {
  readonly leftChoiceId: MatchChoiceId
  readonly rightChoiceId: MatchChoiceId
  readonly tone: "correct" | "default" | "wrong"
}

export function createMatchStepPresentation(
  step: MatchStepPresentationInput
): MatchStepPresentation {
  const leftChoices = step.leftItems.map((item, index) =>
    createMatchChoice("left", item, index)
  )
  const rightChoices = step.rightItems.map((item, index) =>
    createMatchChoice("right", item, index)
  )

  return {
    leftChoices,
    rightChoices: shuffleRightChoices(rightChoices),
  }
}

export function createMatchInteractionState(
  presentation?: MatchStepPresentation,
  initialPairs: readonly Readonly<{
    leftItemId: string
    rightItemId: string
  }>[] = []
): MatchInteractionState {
  const selectionMap: Record<string, MatchChoiceId> = {}

  if (presentation !== undefined) {
    for (const pair of initialPairs) {
      const leftChoice = presentation.leftChoices.find(
        (choice) => choice.itemId === pair.leftItemId
      )
      const rightChoice = presentation.rightChoices.find(
        (choice) => choice.itemId === pair.rightItemId
      )
      if (leftChoice !== undefined && rightChoice !== undefined) {
        selectionMap[leftChoice.id] = rightChoice.id
      }
    }
  }

  return {
    pendingChoice: null,
    selectionMap: selectionMap as MatchSelectionMap,
  }
}

export function transitionMatchChoiceSelection(
  state: MatchInteractionState,
  selection: PendingMatchChoice
): MatchInteractionTransition {
  const pendingChoice = state.pendingChoice

  if (pendingChoice === null) {
    return {
      state: { ...state, pendingChoice: selection },
      type: "pending-changed",
    }
  }

  if (pendingChoice.side === selection.side) {
    return {
      state: {
        ...state,
        pendingChoice: pendingChoice.id === selection.id ? null : selection,
      },
      type: "pending-changed",
    }
  }

  const leftChoiceId =
    selection.side === "left" ? selection.id : pendingChoice.id
  const rightChoiceId =
    selection.side === "right" ? selection.id : pendingChoice.id

  return {
    state: {
      pendingChoice: null,
      selectionMap: toggleMatchSelection(state.selectionMap, {
        leftChoiceId,
        rightChoiceId,
      }),
    },
    type: "answer-changed",
  }
}

export function findMatchedLeftChoiceIdForRightChoiceId(
  selectionMap: MatchSelectionMap,
  rightChoiceId: MatchChoiceId
): MatchChoiceId | null {
  const entry = Object.entries(selectionMap).find(
    ([, value]) => value === rightChoiceId
  )

  return entry === undefined ? null : (entry[0] as MatchChoiceId)
}

export function toggleMatchSelection(
  selectionMap: MatchSelectionMap,
  selection: {
    readonly leftChoiceId: MatchChoiceId
    readonly rightChoiceId: MatchChoiceId
  }
): MatchSelectionMap {
  const nextMap: Record<string, MatchChoiceId> = {
    ...selectionMap,
  }

  if (nextMap[selection.leftChoiceId] === selection.rightChoiceId) {
    delete nextMap[selection.leftChoiceId]

    return nextMap as MatchSelectionMap
  }

  const previousLeftChoiceId = findMatchedLeftChoiceIdForRightChoiceId(
    selectionMap,
    selection.rightChoiceId
  )

  if (previousLeftChoiceId !== null) {
    delete nextMap[previousLeftChoiceId]
  }

  nextMap[selection.leftChoiceId] = selection.rightChoiceId

  return nextMap as MatchSelectionMap
}

export function toMatchAnswerPairs(
  presentation: MatchStepPresentation,
  selectionMap: MatchSelectionMap
): readonly MatchAnswerPair[] {
  return presentation.leftChoices.flatMap((leftChoice) => {
    const matchedRightChoiceId = selectionMap[leftChoice.id]

    if (matchedRightChoiceId === undefined) {
      return []
    }

    const matchedRightChoice = findChoiceById(
      presentation.rightChoices,
      matchedRightChoiceId
    )

    if (matchedRightChoice === undefined) {
      throw new Error(
        `알 수 없는 매칭 오른쪽 선택지입니다: ${matchedRightChoiceId}`
      )
    }

    return [
      {
        left: leftChoice.text,
        leftItemId: leftChoice.itemId,
        right: matchedRightChoice.text,
        rightItemId: matchedRightChoice.itemId,
      },
    ]
  })
}

export function toMatchAnswerConnections(
  presentation: MatchStepPresentation,
  selectionMap: MatchSelectionMap,
  evaluationItems?: readonly MatchEvaluationItemInput[]
): readonly MatchAnswerConnection[] {
  return presentation.leftChoices.flatMap((leftChoice) => {
    const rightChoiceId = selectionMap[leftChoice.id]

    if (rightChoiceId === undefined) {
      return []
    }

    const rightChoice = findChoiceById(presentation.rightChoices, rightChoiceId)
    const evaluatedItem =
      rightChoice === undefined
        ? undefined
        : evaluationItems?.find(
            (item) =>
              item.leftItemId === leftChoice.itemId &&
              item.rightItemId === rightChoice.itemId
          )

    return [
      {
        leftChoiceId: leftChoice.id,
        rightChoiceId,
        tone:
          evaluationItems === undefined
            ? "default"
            : evaluatedItem?.verdict === "correct"
              ? "correct"
              : "wrong",
      },
    ]
  })
}

export function findMatchChoice(
  presentation: MatchStepPresentation,
  selection: { readonly id: string; readonly side: "left" | "right" }
): MatchChoice | undefined {
  return findChoiceById(
    selection.side === "left"
      ? presentation.leftChoices
      : presentation.rightChoices,
    selection.id
  )
}

function createMatchChoice(
  side: "left" | "right",
  item: MatchStepItemInput,
  pairIndex: number
): MatchChoice {
  return {
    id: `${side}-${pairIndex + 1}` as MatchChoiceId,
    itemId: item.id,
    pairIndex,
    text: item.text,
  }
}

function shuffleRightChoices(
  rightChoices: readonly MatchChoice[]
): readonly MatchChoice[] {
  const seed = rightChoices.map((choice) => choice.itemId).join("")
  const nextChoices = [...rightChoices]
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(index)) | 0
  }

  for (let index = nextChoices.length - 1; index > 0; index -= 1) {
    hash = (Math.imul(hash, 1664525) + 1013904223) | 0
    const swapIndex = Math.abs(hash) % (index + 1)
    const current = nextChoices[index]
    const swap = nextChoices[swapIndex]

    if (current !== undefined && swap !== undefined) {
      nextChoices[index] = swap
      nextChoices[swapIndex] = current
    }
  }

  return nextChoices
}

function findChoiceById(
  choices: readonly MatchChoice[],
  choiceId: string
): MatchChoice | undefined {
  return choices.find((choice) => choice.id === choiceId)
}
