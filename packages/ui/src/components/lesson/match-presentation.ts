export type MatchChoiceId = string & {
  readonly __brand: "MatchChoiceId"
}

export type MatchStepPairInput = {
  readonly left: string
  readonly right: string
}

export type MatchStepPresentationInput = {
  readonly pairs: readonly MatchStepPairInput[]
}

export type MatchChoice = {
  readonly id: MatchChoiceId
  readonly pairIndex: number
  readonly text: string
}

export type MatchAnswerPair = {
  readonly left: string
  readonly right: string
}

export type MatchSelectionMap = Readonly<Record<MatchChoiceId, MatchChoiceId>>

export type MatchStepPresentation = {
  readonly correctRightChoiceIdByLeftChoiceId: MatchSelectionMap
  readonly leftChoices: readonly MatchChoice[]
  readonly rightChoices: readonly MatchChoice[]
}

export function createMatchStepPresentation(
  step: MatchStepPresentationInput
): MatchStepPresentation {
  const leftChoices = step.pairs.map((pair, index) =>
    createMatchChoice("left", pair.left, index)
  )
  const rightChoices = step.pairs.map((pair, index) =>
    createMatchChoice("right", pair.right, index)
  )

  return {
    correctRightChoiceIdByLeftChoiceId: createCorrectRightChoiceMap(
      leftChoices,
      rightChoices
    ),
    leftChoices,
    rightChoices: shuffleRightChoices(rightChoices),
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
        right: matchedRightChoice.text,
      },
    ]
  })
}

export function isCorrectMatchChoice(
  presentation: MatchStepPresentation,
  leftChoiceId: MatchChoiceId,
  rightChoiceId: MatchChoiceId
): boolean {
  return (
    presentation.correctRightChoiceIdByLeftChoiceId[leftChoiceId] ===
    rightChoiceId
  )
}

function createMatchChoice(
  side: "left" | "right",
  text: string,
  pairIndex: number
): MatchChoice {
  return {
    id: `${side}-${pairIndex + 1}` as MatchChoiceId,
    pairIndex,
    text,
  }
}

function createCorrectRightChoiceMap(
  leftChoices: readonly MatchChoice[],
  rightChoices: readonly MatchChoice[]
): MatchSelectionMap {
  const correctMap: Record<string, MatchChoiceId> = {}

  for (const leftChoice of leftChoices) {
    const rightChoice = rightChoices.find(
      (choice) => choice.pairIndex === leftChoice.pairIndex
    )

    if (rightChoice === undefined) {
      throw new Error(
        `매칭 pair가 오른쪽 선택지를 찾지 못했습니다: ${leftChoice.id}`
      )
    }

    correctMap[leftChoice.id] = rightChoice.id
  }

  return correctMap as MatchSelectionMap
}

function shuffleRightChoices(
  rightChoices: readonly MatchChoice[]
): readonly MatchChoice[] {
  const seed = rightChoices.map((choice) => choice.text).join("")
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
  choiceId: MatchChoiceId
): MatchChoice | undefined {
  return choices.find((choice) => choice.id === choiceId)
}
