/**
 * 예문에 쓸 수 없는 실제 서비스·브랜드 이름.
 * 일반 명사와 겹치는 이름(줌, 잔디, 스레드, 브런치)은 오탐을 피하기 위해 넣지 않는다.
 * 제품 문서: docs/product/authoring-guidelines.md
 */
export const forbiddenBrandTerms = [
  "슬랙",
  "카톡",
  "카카오톡",
  "카카오",
  "노션",
  "지라",
  "인스타",
  "인스타그램",
  "링크드인",
  "엑셀",
  "파워포인트",
  "챗GPT",
  "챗지피티",
  "ChatGPT",
  "구글",
  "네이버",
  "유튜브",
  "페이스북",
  "트위터",
  "텔레그램",
  "디스코드",
  "피그마",
  "깃허브",
  "트렐로",
  "팀즈",
] as const

const hangulOrJamoPattern = /[\u1100-\u11FF\u3130-\u318F가-힣]/u

export function findForbiddenBrandTerms(text: string): readonly string[] {
  return forbiddenBrandTerms.filter((term) =>
    containsStandaloneTerm(text, term)
  )
}

/** 앞 글자가 한글이면 단어 내부로 보고 건너뛴다. 'ㄹ지라도'가 '지라'로 잡히지 않게 한다. */
function containsStandaloneTerm(text: string, term: string): boolean {
  let from = 0
  while (from <= text.length - term.length) {
    const index = text.indexOf(term, from)
    if (index === -1) return false
    const before = index === 0 ? "" : text[index - 1]
    if (
      before === undefined ||
      before === "" ||
      !hangulOrJamoPattern.test(before)
    ) {
      return true
    }
    from = index + term.length
  }
  return false
}
