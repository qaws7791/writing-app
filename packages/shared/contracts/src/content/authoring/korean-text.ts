/** 공백 포함 한국어 글자 수(유니코드 코드 포인트 기준). */
export function koreanCharCount(value: string): number {
  return [...value].length
}
