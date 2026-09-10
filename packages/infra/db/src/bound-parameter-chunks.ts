export const d1BoundParameterLimit = 100

export function chunkByBoundParameters<T>(
  items: readonly T[],
  input: {
    readonly fixedParameters: number
    readonly parametersPerItem: number
  }
): readonly (readonly T[])[] {
  if (
    !Number.isInteger(input.fixedParameters) ||
    input.fixedParameters < 0 ||
    input.fixedParameters > d1BoundParameterLimit ||
    !Number.isInteger(input.parametersPerItem) ||
    input.parametersPerItem < 1 ||
    input.parametersPerItem > d1BoundParameterLimit
  ) {
    throw new Error("bind parameter 수 계산 조건이 올바르지 않습니다.")
  }

  const maximumItems = Math.floor(
    (d1BoundParameterLimit - input.fixedParameters) / input.parametersPerItem
  )
  if (maximumItems < 1) {
    throw new Error("bind parameter를 추가할 수 없는 SQL 문장입니다.")
  }

  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += maximumItems) {
    chunks.push(items.slice(index, index + maximumItems))
  }
  return chunks
}
