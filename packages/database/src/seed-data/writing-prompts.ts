import type { PromptType } from "../schema/writing-prompts"

export type SeedWritingPrompt = {
  promptType: PromptType
  title: string
  body: string
}

export function seedWritingPrompts(): SeedWritingPrompt[] {
  return [
    {
      promptType: "sensory",
      title: "먼지 쌓인 서랍",
      body: "먼지 쌓인 서랍을 열었을 때, 당신의 시선을 멈추게 한 물건은 무엇인가요? 그 물건의 질감, 냄새, 색깔을 떠올리며 그 순간의 감각을 글로 옮겨보세요.",
    },
    {
      promptType: "sensory",
      title: "오래된 노래 한 곡",
      body: "우연히 들려온 오래된 노래가 당신을 어떤 장소로 데려갔나요? 그곳의 빛, 소리, 공기를 최대한 구체적으로 묘사해보세요.",
    },
    {
      promptType: "sensory",
      title: "계절의 첫 번째 신호",
      body: "올해 계절이 바뀌는 것을 처음 알아챈 순간은 언제였나요? 어떤 감각이 그 변화를 알려주었는지 써보세요.",
    },
    {
      promptType: "sensory",
      title: "낯선 거리의 냄새",
      body: "처음 가본 거리에서 맡았던 특별한 냄새가 있나요? 그 냄새가 어떤 감정이나 기억을 불러일으켰는지 감각적으로 표현해보세요.",
    },
    {
      promptType: "sensory",
      title: "손끝의 기억",
      body: "누군가의 손을 잡았던 순간, 또는 어떤 물건을 만졌던 순간을 떠올려보세요. 그 촉감이 당신에게 남긴 것은 무엇인가요?",
    },
    {
      promptType: "reflection",
      title: "생각이 바뀐 순간",
      body: "최근에 당신의 생각이 180도 바뀐 순간이 있었나요? 무엇이 그 변화를 만들었고, 그 전과 후의 당신은 어떻게 달라졌나요?",
    },
    {
      promptType: "reflection",
      title: "10년 후의 나에게",
      body: "10년 후의 당신에게 편지를 써보세요. 지금의 고민, 바람, 두려움을 솔직하게 담아 미래의 나에게 전해보세요.",
    },
    {
      promptType: "reflection",
      title: "포기했던 것, 그리고 지금",
      body: "한때 간절히 원했지만 포기했던 것이 있나요? 그 결정은 지금의 당신에게 어떤 의미를 가지나요?",
    },
    {
      promptType: "reflection",
      title: "실패가 가르쳐준 것",
      body: "가장 기억에 남는 실패 경험을 떠올려보세요. 그 실패가 당신에게 가르쳐준 것은 무엇이었나요?",
    },
    {
      promptType: "reflection",
      title: "나를 정의하는 한 문장",
      body: "당신을 한 문장으로 정의한다면 어떤 문장이 될까요? 그 문장을 선택한 이유와 그 뒤에 숨은 경험을 써보세요.",
    },
    {
      promptType: "opinion",
      title: "AI 시대의 글쓰기",
      body: "AI가 글을 대신 써주는 시대에, 사람이 직접 글을 쓰는 것이 여전히 의미가 있을까요? 당신의 입장을 근거와 함께 논증해보세요.",
    },
    {
      promptType: "opinion",
      title: "완벽한 하루는 존재하는가",
      body: "'완벽한 하루'라는 개념이 실제로 존재한다고 생각하나요? 당신만의 정의와 근거를 들어 주장해보세요.",
    },
    {
      promptType: "opinion",
      title: "익숙함과 도전 사이",
      body: "사람들은 왜 익숙한 것을 떠나기 어려울까요? 익숙함이 주는 안전과 도전이 주는 성장 중 무엇이 더 중요한지 당신의 생각을 써보세요.",
    },
    {
      promptType: "opinion",
      title: "실패를 공유해야 하는가",
      body: "성공 사례를 넘어, 실패 경험을 적극적으로 공유하는 문화가 필요할까요? 찬성 또는 반대의 입장을 논리적으로 전개해보세요.",
    },
    {
      promptType: "opinion",
      title: "디지털 디톡스의 역설",
      body: "디지털 디톡스가 정말 우리를 자유롭게 할까요, 아니면 또 다른 형태의 강박일까요? 당신의 관점을 구체적 근거와 함께 써보세요.",
    },
  ]
}
