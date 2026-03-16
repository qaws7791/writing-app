export type AIFeatureType = "vocabulary" | "clarity" | "rhythm"

export type AISuggestion = {
  id: string
  original: string
  suggestion: string
  reason: string
}

export type ReviewItemType = "spelling" | "duplicate" | "flow"

export type ReviewItem = {
  id: string
  type: ReviewItemType
  from: number
  to: number
  original: string
  suggestion: string
  reason: string
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let idCounter = 0
function uid(prefix: string): string {
  return `${prefix}-${++idCounter}`
}

const synonyms: Record<string, { alts: string[]; reason: string }> = {
  좋은: {
    alts: ["탁월한", "뛰어난", "훌륭한"],
    reason: "보다 구체적인 긍정 표현으로 글의 인상을 높일 수 있습니다.",
  },
  나쁜: {
    alts: ["부적절한", "미흡한", "아쉬운"],
    reason: "상황에 맞는 부정 표현을 선택하면 의미가 명확해집니다.",
  },
  많은: {
    alts: ["다수의", "풍부한", "상당한"],
    reason: "'많은'보다 구체적인 양적 표현이 전달력을 높입니다.",
  },
  하지만: {
    alts: ["그러나", "다만", "반면에"],
    reason: "접속 부사를 다양하게 사용하면 글의 리듬감이 살아납니다.",
  },
  그래서: {
    alts: ["따라서", "이에", "그러므로"],
    reason: "격식에 맞는 접속 부사로 글의 완성도를 높일 수 있습니다.",
  },
  중요한: {
    alts: ["핵심적인", "결정적인", "필수적인"],
    reason: "보다 구체적인 표현으로 논점을 명확히 할 수 있습니다.",
  },
  사람들은: {
    alts: ["우리는", "누구나", "많은 이들은"],
    reason: "주어를 바꾸면 독자와의 거리감이 달라집니다.",
  },
  생각한다: {
    alts: ["여긴다", "판단한다", "믿는다"],
    reason: "사고의 깊이를 드러내는 동사로 글의 무게감을 줄 수 있습니다.",
  },
  아름다운: {
    alts: ["고운", "빼어난", "수려한"],
    reason: "보다 문학적인 표현으로 분위기를 강화할 수 있습니다.",
  },
  갑자기: {
    alts: ["불현듯", "돌연", "문득"],
    reason: "같은 의미이지만 뉘앙스가 달라 문맥에 따라 선택할 수 있습니다.",
  },
}

function findSynonym(text: string): {
  word: string
  alts: string[]
  reason: string
} | null {
  for (const [word, data] of Object.entries(synonyms)) {
    if (text.includes(word)) {
      return { word, ...data }
    }
  }
  return null
}

function generateVocabularySuggestions(text: string): AISuggestion[] {
  const found = findSynonym(text)

  if (found) {
    return found.alts.slice(0, 3).map((alt, i) => ({
      id: uid("vocab"),
      original: text,
      suggestion: text.replace(found.word, alt),
      reason:
        i === 0
          ? found.reason
          : `'${found.word}' 대신 '${alt}'을(를) 사용하면 뉘앙스가 달라집니다.`,
    }))
  }

  return [
    {
      id: uid("vocab"),
      original: text,
      suggestion: `${text.replace(/[.!?]+$/, "")}라고 볼 수 있습니다.`,
      reason: "서술 방식을 바꾸면 문장의 어조가 조금 더 단정해집니다.",
    },
    {
      id: uid("vocab"),
      original: text,
      suggestion: `특히 ${text}`,
      reason: "강조 지점을 앞에 두면 같은 내용도 더 선명하게 읽힙니다.",
    },
    {
      id: uid("vocab"),
      original: text,
      suggestion: `"${text.slice(0, Math.min(text.length, 12))}..."`,
      reason: "인용 부호로 감싸면 강조 효과를 줄 수 있습니다.",
    },
  ]
}

function generateClaritySuggestions(text: string): AISuggestion[] {
  const commaIdx = text.indexOf(",")
  const andIdx = text.indexOf("그리고")
  const splitPoint =
    commaIdx > 5 ? commaIdx : andIdx > 5 ? andIdx : Math.floor(text.length / 2)
  const normalizedText = text.replace(/[.!?]+$/, "")
  const splitSuggestion =
    text.slice(0, splitPoint).trim() +
    ". " +
    text
      .slice(splitPoint)
      .replace(/^[,\s그리고]+/, "")
      .trim()

  const particleAdjustedText =
    text.length > 20
      ? text.replace(/[은는이가]/g, (m, offset) =>
          offset < text.length / 2 ? m : m === "은" ? "는" : m
        )
      : `핵심은 ${text.replace(/^[\s,]+/, "")}`

  return [
    {
      id: uid("clarity"),
      original: text,
      suggestion: splitSuggestion,
      reason:
        "하나의 문장에 여러 의미가 담겨 있어 두 가지로 해석될 수 있습니다. 분리하면 의미가 명확해집니다.",
    },
    {
      id: uid("clarity"),
      original: text,
      suggestion: particleAdjustedText,
      reason:
        text.length > 20
          ? "주격 조사의 일관성을 맞추면 주어가 더 명확해집니다."
          : "핵심어를 앞쪽에 두면 독자가 문장의 중심을 더 빨리 파악할 수 있습니다.",
    },
    {
      id: uid("clarity"),
      original: text,
      suggestion: `${normalizedText}. 다시 말해, ${text}`,
      reason: "같은 내용을 짧게 덧붙이면 앞 문장의 의미가 더 선명해집니다.",
    },
  ]
}

function generateRhythmSuggestions(text: string): AISuggestion[] {
  const normalizedText = text.replace(/[.!?]+$/, "")
  const splitSuggestion =
    text.length > 40
      ? (() => {
          const midPoint = text.indexOf(". ")
          const splitAt =
            midPoint > 10
              ? midPoint + 1
              : text.indexOf(",") > 10
                ? text.indexOf(",")
                : Math.floor(text.length * 0.55)

          return (
            text.slice(0, splitAt).trim() +
            ".\n" +
            text
              .slice(splitAt)
              .replace(/^[,.\s]+/, "")
              .trim()
          )
        })()
      : `${normalizedText}.\n한 번 더 호흡을 정리해 보세요.`

  const bridgeSuggestion =
    text.length < 15
      ? `${text}—그리고`
      : `${normalizedText}, 그리고 다음 문장으로 자연스럽게 이어집니다.`

  return [
    {
      id: uid("rhythm"),
      original: text,
      suggestion: splitSuggestion,
      reason:
        text.length > 40
          ? "문장이 길어 숨이 차는 구조입니다. 분리하면 리듬감이 생깁니다."
          : "호흡을 한 번 끊어 주면 문장 리듬이 조금 더 안정적으로 읽힙니다.",
    },
    {
      id: uid("rhythm"),
      original: text,
      suggestion: bridgeSuggestion,
      reason:
        text.length < 15
          ? "짧은 문장이 연속되면 단조로울 수 있습니다. 다음 문장과 연결하면 흐름이 부드러워집니다."
          : "완급을 한 번 더 주면 다음 문장으로 넘어가는 흐름이 부드러워집니다.",
    },
    {
      id: uid("rhythm"),
      original: text,
      suggestion: text,
      reason:
        "현재 문장의 호흡이 적절합니다. 전후 문장과의 리듬을 함께 확인해 보세요.",
    },
  ]
}

// --- 공개 API ---

export async function getAISuggestions(
  text: string,
  type: AIFeatureType
): Promise<AISuggestion[]> {
  await delay(600 + Math.random() * 600)

  switch (type) {
    case "vocabulary":
      return generateVocabularySuggestions(text)
    case "clarity":
      return generateClaritySuggestions(text)
    case "rhythm":
      return generateRhythmSuggestions(text)
  }
}

export async function getDocumentReview(
  paragraphs: { from: number; to: number; text: string }[]
): Promise<ReviewItem[]> {
  await delay(1000 + Math.random() * 800)

  const items: ReviewItem[] = []

  for (const para of paragraphs) {
    const words = para.text.split(/\s+/)

    for (let i = 1; i < words.length; i++) {
      const curr = words[i]
      const prev = words[i - 1]
      if (curr && prev && curr === prev && curr.length >= 2) {
        const firstIdx = para.text.indexOf(prev)
        const secondIdx = para.text.indexOf(curr, firstIdx + prev.length)
        if (secondIdx >= 0) {
          items.push({
            id: uid("dup"),
            type: "duplicate",
            from: para.from + secondIdx,
            to: para.from + secondIdx + curr.length,
            original: curr,
            suggestion: "",
            reason: `"${curr}"이(가) 바로 앞에서 반복됩니다. 제거하거나 다른 표현으로 바꿔 보세요.`,
          })
        }
      }
    }

    const spellingMocks: {
      find: string
      fix: string
      reason: string
    }[] = [
      {
        find: "되요",
        fix: "돼요",
        reason: '"되어요"의 준말은 "돼요"가 맞습니다.',
      },
      {
        find: "됬",
        fix: "됐",
        reason: '"되었"의 준말은 "됐"이 올바른 표기입니다.',
      },
      {
        find: "웬지",
        fix: "왠지",
        reason: '"왜인지"의 준말은 "왠지"가 맞습니다.',
      },
      { find: "몇일", fix: "며칠", reason: '"며칠"이 표준어입니다.' },
      {
        find: "않해",
        fix: "안 해",
        reason: "부정 부사 '안'과 동사는 띄어 씁니다.",
      },
    ]

    for (const sp of spellingMocks) {
      const idx = para.text.indexOf(sp.find)
      if (idx >= 0) {
        items.push({
          id: uid("spell"),
          type: "spelling",
          from: para.from + idx,
          to: para.from + idx + sp.find.length,
          original: sp.find,
          suggestion: sp.fix,
          reason: sp.reason,
        })
      }
    }
  }

  if (items.length === 0 && paragraphs.length > 0) {
    const para = paragraphs[0]!
    const words = para.text.split(/\s+/).filter((w) => w.length >= 2)
    if (words.length >= 3) {
      const target = words[Math.min(2, words.length - 1)]!
      const idx = para.text.indexOf(target)
      if (idx >= 0) {
        items.push({
          id: uid("spell"),
          type: "spelling",
          from: para.from + idx,
          to: para.from + idx + target.length,
          original: target,
          suggestion: target,
          reason:
            "이 단어의 맞춤법을 확인해 주세요. 문맥에 따라 띄어쓰기가 필요할 수 있습니다.",
        })
      }
    }
  }

  return items
}

export async function getFlowReview(
  paragraphs: { from: number; to: number; text: string }[]
): Promise<ReviewItem[]> {
  await delay(800 + Math.random() * 600)

  const items: ReviewItem[] = []

  if (paragraphs.length >= 2) {
    const para = paragraphs[Math.min(1, paragraphs.length - 1)]!
    const len = Math.min(para.text.length, 15)
    items.push({
      id: uid("flow"),
      type: "flow",
      from: para.from,
      to: para.from + len,
      original: para.text.slice(0, len),
      suggestion: "",
      reason:
        "이전 문단에서 이 문단으로의 전환이 갑작스럽습니다. 연결 표현을 추가하거나 문단 순서를 조정해 보세요.",
    })
  }

  if (paragraphs.length >= 4) {
    const para = paragraphs[Math.min(3, paragraphs.length - 1)]!
    const len = Math.min(para.text.length, 15)
    items.push({
      id: uid("flow"),
      type: "flow",
      from: para.from,
      to: para.from + len,
      original: para.text.slice(0, len),
      suggestion: "",
      reason:
        "앞 문단의 논점과 이 문단 사이에 논리적 공백이 느껴집니다. 독자가 흐름을 따라가기 어려울 수 있습니다.",
    })
  }

  return items
}
