import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

type OutlineLesson = {
  readonly id: string
  readonly title: string
  readonly objective: string
}

type OutlineUnit = {
  readonly id: string
  readonly title: string
  readonly lessons: OutlineLesson[]
}

type OutlineCourse = {
  readonly id: string
  readonly title: string
  readonly units: OutlineUnit[]
}

type CourseMetadata = {
  readonly desc: string
  readonly cat: string
  readonly visualKey:
    | "basic-sentence-writing"
    | "expression"
    | "grammar-complete"
    | "creative-writing"
    | "essay-writing"
}

type CourseProfile = {
  readonly principle: string
  readonly boundary: string
  readonly contexts: readonly string[]
}

type SeedStep = {
  readonly type: string
  readonly [field: string]: unknown
}

const repositoryRoot = resolve(import.meta.dir, "../../..")
const outlinePath = resolve(import.meta.dir, "stage-5/all-course-outlines.md")
const seedPath = resolve(
  repositoryRoot,
  "packages/modules/content/src/infrastructure/persistence/content-seed-data.json"
)
const auditPath = resolve(import.meta.dir, "stage-5/content-build-audit.json")
const evidenceDirectory = resolve(repositoryRoot, "docs/research/evidence")
const evidenceIndexPath = resolve(evidenceDirectory, "_index.md")

const courseMetadata = {
  "course-word-sentence-meaning": {
    desc: "문맥, 문장 구조, 지시와 논리 관계를 함께 살펴 단어와 문장의 가능한 의미를 구별합니다.",
    cat: "언어와 읽기",
    visualKey: "basic-sentence-writing",
  },
  "course-reading-structure-main-ideas": {
    desc: "글의 목적과 구조를 따라 핵심, 세부와 관계를 통합하고 이해가 끊긴 지점을 점검합니다.",
    cat: "언어와 읽기",
    visualKey: "basic-sentence-writing",
  },
  "course-clear-accurate-expression": {
    desc: "필수 의미를 보존하면서 어휘, 호응, 지시 대상과 문장 관계를 더 분명하게 다듬습니다.",
    cat: "구성과 표현",
    visualKey: "expression",
  },
  "course-grammar-orthography": {
    desc: "현행 규범의 원칙, 허용과 예외를 문맥에 적용해 표기와 문법 판단의 근거를 설명합니다.",
    cat: "언어와 읽기",
    visualKey: "grammar-complete",
  },
  "course-idea-topic-development": {
    desc: "목적과 독자, 제약을 바탕으로 쓸 문제의 범위를 정하고 다양한 내용 후보를 만들어 평가하고 발전시킵니다.",
    cat: "사고와 발상",
    visualKey: "creative-writing",
  },
  "course-organization-coherence": {
    desc: "정보를 목적에 맞게 선택하고 배열하며 문장과 문단 사이의 의미 관계를 드러내어 흐름을 구성합니다.",
    cat: "구성과 표현",
    visualKey: "essay-writing",
  },
  "course-audience-purpose-genre": {
    desc: "실제·예상 독자와 사회적 목적을 살펴 장르 관습과 표현 선택을 상황에 맞게 조정합니다.",
    cat: "독자와 쓰기 과정",
    visualKey: "creative-writing",
  },
  "course-reader-centered-explanation": {
    desc: "독자가 개념, 과정과 관계를 재구성할 수 있도록 핵심, 구조, 근거와 예시를 조정합니다.",
    cat: "구성과 표현",
    visualKey: "essay-writing",
  },
  "course-evidence-based-inference": {
    desc: "텍스트와 자료의 단서를 연결해 명시되지 않은 결론을 도출하고 근거와 불확실성을 구분합니다.",
    cat: "언어와 읽기",
    visualKey: "basic-sentence-writing",
  },
  "course-information-search-credibility": {
    desc: "정보 필요에 맞춰 검색 전략을 바꾸고 출처, 주장과 근거를 독립 자료와 비교해 신뢰 범위를 판단합니다.",
    cat: "정보와 AI 문해",
    visualKey: "essay-writing",
  },
  "course-critical-analysis-integration": {
    desc: "자료의 요소와 관계를 목적에 맞게 분해·통합하고 가정, 대안과 근거의 한계를 점검합니다.",
    cat: "사고와 발상",
    visualKey: "essay-writing",
  },
  "course-evidence-based-argumentation": {
    desc: "주장과 근거, 보증, 반론의 관계를 세우고 결론이 성립하는 범위를 설명합니다.",
    cat: "구성과 표현",
    visualKey: "essay-writing",
  },
  "course-revision-feedback": {
    desc: "목표와 기준으로 초고를 진단하고 자기·동료·도구의 피드백을 판단해 의미 있는 수정을 선택합니다.",
    cat: "독자와 쓰기 과정",
    visualKey: "expression",
  },
  "course-responsible-source-ai-use": {
    desc: "외부·AI 자료의 의미와 한계를 보존해 글에 통합하고 출처, 변형, 사용 범위와 책임을 투명하게 표시합니다.",
    cat: "정보와 AI 문해",
    visualKey: "expression",
  },
} as const satisfies Record<string, CourseMetadata>

const profiles = {
  "course-word-sentence-meaning": {
    principle:
      "단어와 문장의 의미는 표현 하나가 아니라 주변 대상, 참여자, 문장 구조와 앞뒤 상황을 함께 대조해 좁힙니다.",
    boundary:
      "가장 잘 뒷받침된 해석은 문맥상 판단이며 작성자의 실제 의도를 자동으로 증명하지는 않습니다.",
    contexts: [
      "관리실 안내: 신청한 주민은 금요일까지 신분증을 지참해 방문해야 하며, 대리인은 위임장을 함께 내야 합니다.",
      "회의 기록: 운영팀은 변경안을 검토한 뒤 홍보팀에 결과를 알렸고, 그 내용은 다음 주부터 적용됩니다.",
      "도서관 공지: 자료실은 공사 기간에만 오후 여섯 시에 닫지만 반납함은 평소처럼 이용할 수 있습니다.",
    ],
  },
  "course-reading-structure-main-ideas": {
    principle:
      "읽기 목적을 질문으로 바꾼 뒤 중심 내용, 세부의 기능과 전개 관계를 연결해야 글 전체의 의미 모형을 만들 수 있습니다.",
    boundary:
      "제목이나 첫 문장만으로 핵심을 확정하지 않고 글 전체의 반복, 대조, 결론과 예외를 확인합니다.",
    contexts: [
      "주민센터는 자전거 수리 교실을 엽니다. 첫 주에는 안전 점검을 배우고, 둘째 주에는 타이어를 교체합니다. 공구는 제공하지만 자전거는 직접 가져와야 합니다.",
      "공유 냉장고 이용자는 식품에 보관 날짜를 적어야 합니다. 표시가 없는 식품은 안전을 위해 정리됩니다. 다만 당일 배부 식품은 운영자가 별도로 관리합니다.",
      "보고서는 통근 시간이 늘었다는 조사 결과를 제시한 뒤 원인을 노선 변경과 공사로 나누고, 마지막에 임시 셔틀 운행을 제안합니다.",
    ],
  },
  "course-clear-accurate-expression": {
    principle:
      "편집 전 핵심 메시지와 참여자, 행동, 조건, 범위를 고정해야 짧고 자연스러운 문장이 원래 의미를 잃지 않습니다.",
    boundary:
      "간결함은 정확성과 독자 이해를 해치지 않는 범위에서만 우선하며, 필요한 반복과 전문어까지 없애지 않습니다.",
    contexts: [
      "초고: 관련된 여러 상황을 종합적으로 고려하여 회의 장소에 관한 변경을 진행하기로 했습니다.",
      "초고: 담당자가 신청자에게 서류를 보완하도록 안내한 뒤 이것을 금요일까지 제출해야 합니다.",
      "초고: 일부 회원을 제외한 모든 회원은 교육을 두 번 이상 받아야 하지는 않습니다.",
    ],
  },
  "course-grammar-orthography": {
    principle:
      "문법과 표기는 먼저 판단 범주를 찾고, 현행 공식 규범의 조건을 문장의 형태와 기능에 대응시켜 판정합니다.",
    boundary:
      "익숙함이나 검색 빈도만으로 정오를 정하지 않으며, 시점에 따라 달라질 수 있는 허용형은 공식 출처를 다시 확인합니다.",
    contexts: [
      "검토 문장: 신청서를 낸 사람만 안내를 받을 수 있으며 결과는 다음 주에 알립니다.",
      "검토 문장: 회의가 끝난 뒤 담당자에게 확인할 수 있는 사항을 물었습니다.",
      "검토 문장: 같은 표면형이라도 문장 안에서 맡는 기능이 다르면 판단 근거도 달라집니다.",
    ],
  },
  "course-idea-topic-development": {
    principle:
      "쓸 문제의 독자, 목적과 제약을 구체화한 뒤 관점과 질문을 바꾸어 후보를 넓히고 기준에 따라 선택·발전시킵니다.",
    boundary:
      "아이디어 수 자체를 창의성으로 보지 않으며, 새로움과 함께 관련성, 실행 가능성, 윤리 위험을 검토합니다.",
    contexts: [
      "상황: 동네 도서관의 주말 이용률을 높이기 위한 한 쪽 제안문을 주민에게 배포하려고 합니다.",
      "상황: 공동주택 택배 보관 문제를 다루되 특정 노동자나 주민에게 책임을 떠넘기지 않아야 합니다.",
      "상황: 직장 내 종이 사용을 줄이는 안내를 만들며 비용, 접근성, 업무 특성을 함께 고려해야 합니다.",
    ],
  },
  "course-organization-coherence": {
    principle:
      "독자의 질문과 글의 목적을 기준으로 정보를 선택·묶음·배열하고, 문장과 문단 사이의 실제 의미 관계를 연결 표현으로 드러냅니다.",
    boundary:
      "접속 표현을 많이 넣는다고 흐름이 생기지 않으며 내용 관계가 불분명하면 먼저 구조를 고칩니다.",
    contexts: [
      "메모: 텃밭 신청자가 늘었다. 대기 명단이 길다. 빈 구획이 있다. 장기 미사용 구획을 확인해야 한다. 초보자 교육 요청도 많다.",
      "보고 초안: 행사 만족도 결과, 조사 방법, 불편 의견, 다음 행사 개선안이 순서 없이 섞여 있습니다.",
      "안내 초안: 신청 조건을 설명하기 전에 예외와 문의처가 나오고, 마지막 문단에서야 신청 목적이 제시됩니다.",
    ],
  },
  "course-audience-purpose-genre": {
    principle:
      "실제 또는 예상 독자의 지식, 이해관계와 사용 상황을 근거로 추정하고 사회적 목적에 맞는 장르와 표현을 선택합니다.",
    boundary:
      "독자를 고정된 집단 특성으로 단정하지 않으며 확인된 정보와 추정을 나누고 장르 관습도 목적에 맞게 조정합니다.",
    contexts: [
      "같은 휴관 정보를 당일 방문자에게는 짧은 현장 안내로, 정기 이용자에게는 일정과 대안을 담은 전자우편으로 전해야 합니다.",
      "회의 결과를 참석자에게는 결정 기록으로, 참여하지 못한 주민에게는 배경과 다음 행동을 포함한 공지로 써야 합니다.",
      "안전 수칙을 숙련 직원과 첫 방문자에게 안내할 때 필요한 용어 설명과 정보 순서가 서로 다릅니다.",
    ],
  },
  "course-reader-centered-explanation": {
    principle:
      "독자가 설명 뒤 무엇을 이해하거나 할 수 있어야 하는지 정하고, 핵심 개념과 과정·관계를 구조화해 근거와 예시로 연결합니다.",
    boundary:
      "예시 하나를 일반 원리의 증거로 과장하지 않고 적용 조건, 예외와 확인 방법을 함께 제시합니다.",
    contexts: [
      "설명 대상: 음식물 쓰레기와 일반 쓰레기를 나누는 기준을 처음 이사 온 주민에게 설명합니다.",
      "설명 대상: 온라인 예약이 접수, 확인, 확정의 세 상태로 바뀌는 과정을 이용자에게 설명합니다.",
      "설명 대상: 실내 온도를 낮추는 차광의 원리와 효과가 달라지는 조건을 동료에게 설명합니다.",
    ],
  },
  "course-evidence-based-inference": {
    principle:
      "관찰된 단서와 배경 전제를 분리한 뒤 둘을 잇는 추론을 드러내고, 경쟁 설명과 정보 공백에 맞춰 결론 강도를 조정합니다.",
    boundary:
      "가능한 설명 하나를 사실로 확정하지 않으며 같은 단서를 설명하는 대안과 반증 가능성을 확인합니다.",
    contexts: [
      "관찰: 평일 아침 세 차례 같은 버스가 예정보다 늦었고 두 차례는 인근 도로 공사 시간이 겹쳤습니다.",
      "관찰: 안내 전자우편을 연 사람은 많았지만 실제 신청은 늘지 않았고 신청 페이지에서 이탈이 증가했습니다.",
      "관찰: 화분 잎이 처졌지만 흙의 수분, 햇빛, 병충해 여부는 아직 확인하지 않았습니다.",
    ],
  },
  "course-information-search-credibility": {
    principle:
      "결정에 필요한 정보를 질문과 충분성 조건으로 정의하고, 검색 경로를 조정하며 원출처의 권위·방법·시점·독립성을 대조합니다.",
    boundary:
      "상위 노출, 유명함, 도메인 모양이나 자료 개수만으로 신뢰성을 확정하지 않으며 주장별 확인 범위를 기록합니다.",
    contexts: [
      "정보 필요: 이번 여름 무더위 쉼터의 운영 시간과 반려동물 동반 가능 여부를 오늘 방문 전에 확인해야 합니다.",
      "정보 필요: 건강 관련 홍보문에 넣을 수치를 찾되 조사 대상, 측정 방법과 발표 시점을 확인해야 합니다.",
      "검색 결과: 기관 보도자료를 그대로 옮긴 기사 세 건과 원자료 한 건, 출처가 표시되지 않은 요약 한 건이 있습니다.",
    ],
  },
  "course-critical-analysis-integration": {
    principle:
      "판단 질문과 기준을 먼저 세우고 자료의 주장·근거·가정과 관계를 분해한 뒤 같은 기준으로 대안과 한계를 통합합니다.",
    boundary:
      "도식이나 분류는 판단을 돕는 도구일 뿐 결론을 보장하지 않으며 관점 차이와 해결되지 않은 충돌을 지우지 않습니다.",
    contexts: [
      "자료: 재택근무 시범 운영 뒤 만족도는 올랐지만 응답률이 낮았고, 처리 시간은 부서별로 서로 다르게 변했습니다.",
      "자료: 공원 조명 확대안은 안전 체감 개선을 주장하고, 반대 자료는 생태 영향과 유지 비용을 제시합니다.",
      "자료: 프로그램 참여자의 즉시 과제 점수는 올랐지만 비교집단과 장기 추적 결과는 없습니다.",
    ],
  },
  "course-evidence-based-argumentation": {
    principle:
      "주장의 유형과 범위를 정하고 관련 근거, 보증과 반론을 연결해 근거가 지지하는 강도만큼 제한된 결론을 세웁니다.",
    boundary:
      "근거의 수나 도식의 완성도를 충분성으로 오인하지 않고 출처의 주장과 필자의 추론을 구별합니다.",
    contexts: [
      "쟁점: 공영 주차장의 주말 무료 시간을 두 시간 연장해야 하는가.",
      "쟁점: 공동 회의는 대면을 기본으로 하되 원격 참여 선택권을 항상 제공해야 하는가.",
      "쟁점: 지역 행사에서 일회용품 보증금 제도를 시범 운영해야 하는가.",
    ],
  },
  "course-revision-feedback": {
    principle:
      "독자·목적·핵심 메시지를 수정 목표로 바꾸고 초고의 증거로 문제를 진단한 뒤 의미와 조직부터 고쳐 결과를 다시 검증합니다.",
    boundary:
      "교사, 동료, 자기 점검이나 도구의 조언을 자동 채택하지 않고 목표·초고 증거·기준과 대조해 선택합니다.",
    contexts: [
      "초고: 공유 사무실은 편리합니다. 이용자가 늘었습니다. 그래서 좌석 예약 규칙을 바꿉니다. 자세한 이유는 없습니다.",
      "초고: 행사 변경 이유와 새 일정, 환불 방법이 섞여 있어 독자가 자신에게 필요한 행동을 찾기 어렵습니다.",
      "피드백: 더 전문적으로 쓰세요. 문장을 모두 짧게 바꾸세요. 사례를 하나 더 넣으면 좋겠습니다.",
    ],
  },
  "course-responsible-source-ai-use": {
    principle:
      "도구 결과의 주장과 출처를 독립적으로 검증하고 원자료의 범위와 불확실성을 보존해 통합하며 사용·변형·책임을 투명하게 밝힙니다.",
    boundary:
      "유창함, 자동 생성된 인용이나 콘텐츠 이력을 진실의 증거로 사용하지 않고 개인정보·권리·접근성·공정성 위험을 별도로 검토합니다.",
    contexts: [
      "생성 결과: 음식물 배출 기준이 다음 달부터 전국에서 동일하게 바뀐다고 설명하지만 공식 출처 링크와 적용 지역이 없습니다.",
      "자료 이력: 짧게 편집된 영상에는 제작 계정과 편집 시점이 표시되지만 촬영 전후 맥락과 주장 사실성은 확인되지 않았습니다.",
      "작업 기록: 공개되지 않은 상담 내용을 입력해 요약을 만들자는 제안과 비식별 예시만 사용하자는 대안이 있습니다.",
    ],
  },
} as const satisfies Record<string, CourseProfile>

const aiFeedbackLessonIds = new Set([
  "lesson-expression-independent-edit",
  "lesson-explanation-independent",
  "lesson-argument-independent",
  "lesson-revision-new-task",
])

const courseClaims = {
  "course-word-sentence-meaning": [
    "clm-language-norms-sentence-clarity-001",
    "clm-language-norms-sentence-clarity-002",
    "clm-reading-meaning-construction-002",
    "clm-reading-meaning-construction-005",
  ],
  "course-reading-structure-main-ideas": [
    "clm-reading-meaning-construction-001",
    "clm-reading-meaning-construction-004",
    "clm-reading-meaning-construction-005",
    "clm-instruction-practice-transfer-004",
  ],
  "course-clear-accurate-expression": [
    "clm-language-norms-sentence-clarity-004",
    "clm-language-norms-sentence-clarity-005",
    "clm-language-norms-sentence-clarity-006",
    "clm-organization-coherence-expression-003",
  ],
  "course-grammar-orthography": [
    "clm-language-norms-sentence-clarity-003",
    "clm-language-norms-sentence-clarity-005",
    "clm-language-norms-sentence-clarity-007",
  ],
  "course-idea-topic-development": [
    "clm-creativity-topic-content-generation-001",
    "clm-creativity-topic-content-generation-002",
    "clm-creativity-topic-content-generation-003",
    "clm-creativity-topic-content-generation-004",
    "clm-creativity-topic-content-generation-006",
    "clm-audience-purpose-genre-rhetoric-001",
  ],
  "course-organization-coherence": [
    "clm-organization-coherence-expression-001",
    "clm-organization-coherence-expression-002",
    "clm-organization-coherence-expression-005",
    "clm-organization-coherence-expression-007",
    "clm-writing-process-self-regulation-004",
  ],
  "course-audience-purpose-genre": [
    "clm-audience-purpose-genre-rhetoric-001",
    "clm-audience-purpose-genre-rhetoric-002",
    "clm-audience-purpose-genre-rhetoric-003",
    "clm-audience-purpose-genre-rhetoric-005",
    "clm-audience-purpose-genre-rhetoric-007",
  ],
  "course-reader-centered-explanation": [
    "clm-organization-coherence-expression-004",
    "clm-audience-purpose-genre-rhetoric-004",
  ],
  "course-evidence-based-inference": [
    "clm-inference-critical-judgment-001",
    "clm-reading-meaning-construction-003",
  ],
  "course-information-search-credibility": [
    "clm-information-source-media-ai-literacy-001",
    "clm-information-source-media-ai-literacy-002",
    "clm-information-source-media-ai-literacy-005",
    "clm-information-source-media-ai-literacy-007",
    "clm-information-source-media-ai-literacy-008",
    "clm-information-source-media-ai-literacy-009",
  ],
  "course-critical-analysis-integration": [
    "clm-inference-critical-judgment-002",
    "clm-inference-critical-judgment-003",
    "clm-inference-critical-judgment-005",
    "clm-inference-critical-judgment-006",
    "clm-inference-critical-judgment-007",
    "clm-instruction-practice-transfer-005",
  ],
  "course-evidence-based-argumentation": [
    "clm-audience-purpose-genre-rhetoric-006",
    "clm-inference-critical-judgment-004",
  ],
  "course-revision-feedback": [
    "clm-writing-process-self-regulation-001",
    "clm-writing-process-self-regulation-002",
    "clm-writing-process-self-regulation-006",
    "clm-feedback-revision-assessment-001",
    "clm-feedback-revision-assessment-002",
    "clm-feedback-revision-assessment-005",
    "clm-feedback-revision-assessment-006",
    "clm-feedback-revision-assessment-007",
    "clm-feedback-revision-assessment-008",
  ],
  "course-responsible-source-ai-use": [
    "clm-information-source-media-ai-literacy-003",
    "clm-information-source-media-ai-literacy-004",
    "clm-information-source-media-ai-literacy-005",
    "clm-information-source-media-ai-literacy-006",
    "clm-information-source-media-ai-literacy-009",
    "clm-information-source-media-ai-literacy-010",
    "clm-feedback-revision-assessment-007",
  ],
} as const satisfies Record<string, readonly string[]>

const outputVerbPattern =
  /고치|기록|만들|바꾸|설계|작성|완성|제시|표현|설명|적는다|수정|통합|복원|조정|계획|나타낸다|연결한다/
const orderPattern = /순서|과정|단계|흐름|경로|절차|주기|전이/
const categorizePattern = /분류|구별|나누|범주|유형|기능/
const matchPattern = /연결|관계|대응|호응|맞추|보증/
const comparePattern = /비교|대조|전후|장단점|대안|관점/
const selectPattern = /찾기|표시|추출|단서|증거|핵심|범위|대상/
const fillBlankPattern = /표현|접속|어미|조사|강도|확실성/

function parseOutlines(markdown: string): OutlineCourse[] {
  const courses: OutlineCourse[] = []
  let currentCourse: OutlineCourse | undefined
  let currentUnit: OutlineUnit | undefined

  for (const line of markdown.split(/\r?\n/u)) {
    const courseMatch = line.match(/^## \d+\. `([^`]+)` (.+)$/u)
    if (courseMatch !== null) {
      currentCourse = {
        id: required(courseMatch[1], "코스 ID"),
        title: required(courseMatch[2], "코스 제목").trim(),
        units: [],
      }
      courses.push(currentCourse)
      currentUnit = undefined
      continue
    }

    const unitMatch = line.match(/^### `([^`]+)` (.+)$/u)
    if (unitMatch !== null && currentCourse !== undefined) {
      currentUnit = {
        id: required(unitMatch[1], "유닛 ID"),
        title: required(unitMatch[2], "유닛 제목").trim(),
        lessons: [],
      }
      currentCourse.units.push(currentUnit)
      continue
    }

    const lessonMatch = line.match(
      /^\|\s*`(lesson-[^`]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/u
    )
    if (lessonMatch !== null && currentUnit !== undefined) {
      currentUnit.lessons.push({
        id: required(lessonMatch[1], "레슨 ID"),
        title: required(lessonMatch[2], "레슨 제목").trim(),
        objective: required(lessonMatch[3], "레슨 목표").trim(),
      })
    }
  }

  return courses
}

function required(value: string | undefined, label: string): string {
  if (value === undefined || value.length === 0) {
    throw new Error(`${label}이 없습니다.`)
  }
  return value
}

function buildReading(
  lesson: OutlineLesson,
  profile: CourseProfile,
  context: string
): SeedStep {
  return {
    type: "reading",
    title: `${lesson.title}의 판단 기준`,
    guide: "목표, 근거와 판단의 한계를 구분해 읽어 보세요.",
    body: `이번 레슨에서는 **${lesson.objective}**

### 판단 기준

1. 무엇을 판단할지 대상과 범위를 먼저 정합니다.
2. 표현이나 자료에서 직접 확인되는 단서를 표시합니다.
3. 단서가 목표에 어떻게 관련되는지 설명하고 다른 가능성과 남은 공백을 확인합니다.

${profile.principle}

### 적용할 사례

> ${context}

사례를 볼 때는 결론부터 고르지 말고 \`확인된 표현·정보 → 관계 → 판단\` 순서로 기록합니다. ${profile.boundary}`,
    source: "자체 집필",
  }
}

function buildMultipleChoice(lesson: OutlineLesson, context: string): SeedStep {
  return {
    type: "multiple_choice",
    question: `${context}\n\n이 사례에서 ‘${lesson.title}’ 목표를 가장 타당하게 수행한 판단은 무엇인가요?`,
    options: [
      {
        id: "evidence-aligned",
        text: `사례에서 직접 확인한 대상·조건을 근거로 다음 목표를 수행하고, 적용 범위와 남은 한계를 함께 밝힌다: ${lesson.objective}`,
      },
      {
        id: "familiarity-only",
        text: "가장 익숙하고 자연스럽게 느껴지는 답을 고르고 근거 확인은 생략한다.",
      },
      {
        id: "unlimited-conclusion",
        text: "사례 하나에서 얻은 결론을 조건이나 예외 없이 모든 상황에 적용한다.",
      },
    ],
    correct: "evidence-aligned",
    explanation: `${lesson.objective} 목표는 확인 가능한 단서와 판단의 연결을 요구합니다. 적용 범위와 미확인 사항을 함께 적어야 과잉 결론을 피할 수 있습니다.`,
    wrong:
      "선택한 답이 사례의 어떤 표현이나 정보에 근거하며, 목표의 대상·조건·범위를 보존하는지 다시 확인해 보세요.",
  }
}

function buildSelect(lesson: OutlineLesson, context: string): SeedStep {
  return {
    type: "select",
    question: `다음 기록에서 ‘${lesson.title}’ 판단의 근거로 직접 확인할 수 있는 구간을 모두 선택하세요.`,
    segments: [
      `${context} `,
      "기록에 제시된 대상과 조건을 먼저 확인했습니다. ",
      "아마 언제나 같은 결과일 것이라고 느꼈습니다. ",
      "확인하지 않은 의도는 근거에서 제외했습니다.",
    ],
    segmentIds: [
      "case-information",
      "checked-conditions",
      "unsupported-impression",
      "excluded-unknown-intent",
    ],
    correct: [
      "case-information",
      "checked-conditions",
      "excluded-unknown-intent",
    ],
    explanation: `${lesson.objective} 목표에는 사례의 명시 정보, 확인한 조건과 미확인 내용을 구분한 기록이 근거가 됩니다. 느낌만으로 일반화한 구간은 근거가 아닙니다.`,
    layout: "block",
  }
}

function buildCategorize(lesson: OutlineLesson): SeedStep {
  return {
    type: "categorize",
    title: `${lesson.title}: 확인 정보와 판단 나누기`,
    guide:
      "각 기록이 직접 확인한 정보인지, 해석인지, 아직 확인할 한계인지 분류하세요.",
    categories: [
      { id: "observed", label: "직접 확인" },
      { id: "interpreted", label: "해석·판단" },
      { id: "unknown", label: "미확인·한계" },
    ],
    items: [
      {
        id: "stated-target",
        text: "자료에 명시된 대상과 시점",
        categoryId: "observed",
      },
      {
        id: "criterion-result",
        text: `확인한 조건에 비추어 ‘${lesson.title}’ 기준을 적용한 결론`,
        categoryId: "interpreted",
      },
      {
        id: "missing-context",
        text: "자료에 나오지 않은 작성 의도와 다른 상황의 결과",
        categoryId: "unknown",
      },
    ],
    explanation: `${lesson.objective} 목표를 수행하려면 자료가 말한 것, 학습자가 도출한 것과 아직 알 수 없는 것을 섞지 않아야 합니다.`,
  }
}

function buildMatch(lesson: OutlineLesson): SeedStep {
  return {
    type: "match",
    title: `${lesson.title}: 판단 요소 연결하기`,
    guide: "왼쪽의 판단 요소를 그 역할에 맞는 기록과 연결하세요.",
    pairs: [
      {
        leftId: "target",
        left: "판단 대상",
        rightId: "target-record",
        right: "누구·무엇에 관해 어느 범위까지 판단하는지 적은 기록",
      },
      {
        leftId: "evidence",
        left: "확인 근거",
        rightId: "evidence-record",
        right: "사례의 표현이나 자료에서 직접 확인한 정보",
      },
      {
        leftId: "limit",
        left: "판단 한계",
        rightId: "limit-record",
        right: "결론이 적용되지 않거나 추가 확인이 필요한 조건",
      },
    ],
    explanation: `${lesson.objective} 목표에서는 대상·근거·한계를 각각 기록해야 관계를 검토하고 잘못 연결된 판단을 수정할 수 있습니다.`,
  }
}

function buildCompare(lesson: OutlineLesson, context: string): SeedStep {
  return {
    type: "compare",
    title: `${lesson.title}: 두 판단안 비교하기`,
    versions: [
      {
        label: "판단안 A",
        text: `${context} 따라서 별도 확인 없이 한 가지 결론만 가능하다.`,
      },
      {
        label: "판단안 B",
        text: `${context} 명시된 대상과 조건은 확인되지만, 다른 맥락까지 같은지는 알 수 없으므로 이 사례의 범위에서만 결론을 제시한다.`,
      },
    ],
    analysis: `판단안 B는 ${lesson.objective} 목표에 맞게 직접 확인한 내용과 적용 범위를 보존합니다. 판단안 A는 미확인 조건을 지운 채 결론을 넓힌다는 한계가 있습니다.`,
  }
}

function buildFillBlank(lesson: OutlineLesson): SeedStep {
  return {
    type: "fill_blank",
    template:
      "나는 {{1}}을 먼저 확인하고, {{2}}와 {{3}}을 구별해 판단을 기록했다.",
    words: ["대상과 조건", "확인된 근거", "남은 한계", "익숙한 느낌"],
    wordIds: [
      "target-condition",
      "checked-evidence",
      "remaining-limit",
      "familiar-impression",
    ],
    answer: ["target-condition", "checked-evidence", "remaining-limit"],
    explanation: `${lesson.title}에서는 익숙한 느낌이 아니라 대상·조건, 확인 근거와 남은 한계를 연결해야 합니다.`,
  }
}

function buildOrder(lesson: OutlineLesson): SeedStep {
  return {
    type: "order",
    title: `${lesson.title}: 검토 순서 세우기`,
    items: [
      "목표와 확인할 질문을 정한다.",
      "사례의 대상·조건·범위를 표시한다.",
      "근거와 다른 가능성을 대조한다.",
      "판단과 남은 한계를 기록한다.",
    ],
    itemIds: [
      "define-question",
      "mark-scope",
      "compare-evidence",
      "record-judgment",
    ],
    correct: [
      "define-question",
      "mark-scope",
      "compare-evidence",
      "record-judgment",
    ],
    showNumbers: true,
    explanation: `${lesson.objective} 목표를 수행할 때는 질문과 범위를 먼저 고정해야 뒤의 근거 대조와 최종 판단이 같은 대상을 향합니다.`,
  }
}

function buildGuidedStep(lesson: OutlineLesson, context: string): SeedStep {
  const targetText = `${lesson.title} ${lesson.objective}`
  if (orderPattern.test(targetText)) return buildOrder(lesson)
  if (categorizePattern.test(targetText)) return buildCategorize(lesson)
  if (comparePattern.test(targetText)) return buildCompare(lesson, context)
  if (matchPattern.test(targetText)) return buildMatch(lesson)
  if (selectPattern.test(targetText)) return buildSelect(lesson, context)
  if (fillBlankPattern.test(targetText)) return buildFillBlank(lesson)
  return buildMultipleChoice(lesson, context)
}

function buildWrite(lesson: OutlineLesson, context: string): SeedStep {
  return {
    type: "write",
    title: `${lesson.title} 독립 적용`,
    guide:
      "사례에 없는 의도를 지어내지 말고, 근거와 판단을 문장 안에서 구분하세요.",
    min: 120,
    goal: 220,
    max: 360,
    context,
    prompt: `${lesson.objective} 목표를 사례에 적용한 답을 쓰세요. 판단 대상, 직접 확인한 근거, 결론과 남은 한계를 모두 포함하세요.`,
    placeholder:
      "판단 대상은 …입니다. 직접 확인한 근거는 …입니다. 따라서 …라고 판단합니다. 다만 …은 추가 확인이 필요합니다.",
    reference: context,
    structure:
      "1. 대상과 범위\n2. 직접 확인한 근거\n3. 근거와 결론의 연결\n4. 예외·불확실성·추가 확인",
    sample: `판단 대상은 이 사례에 명시된 사람·행동·조건의 관계입니다. 먼저 문장과 자료에서 직접 확인되는 대상과 시점을 근거로 삼았습니다. 이 근거에 따라 ‘${lesson.title}’ 기준을 사례 범위에서 적용할 수 있습니다. 다만 제시되지 않은 의도나 다른 상황의 결과까지 같다고 단정할 수는 없습니다.`,
    draft: true,
  }
}

function buildLesson(
  lesson: OutlineLesson,
  unit: OutlineUnit,
  profile: CourseProfile,
  lessonIndex: number
) {
  const context = profile.contexts[lessonIndex % profile.contexts.length]
  if (context === undefined) throw new Error("사례가 없습니다.")
  const steps: SeedStep[] = [
    buildReading(lesson, profile, context),
    buildGuidedStep(lesson, context),
  ]
  const needsWrite =
    outputVerbPattern.test(lesson.objective) ||
    lessonIndex === unit.lessons.length - 1 ||
    aiFeedbackLessonIds.has(lesson.id)

  if (needsWrite) {
    steps.push(buildWrite(lesson, context))
  }

  if (aiFeedbackLessonIds.has(lesson.id)) {
    steps.push({
      type: "ai_feedback",
      target: `${lesson.id}-s3`,
      focus: `‘${lesson.title}’ 목표에 맞게 대상·근거·판단·한계가 연결되었는지 확인하고, 근거보다 넓은 결론이나 빠진 조건을 구체적으로 짚어 주세요.`,
      feedback:
        "피드백은 정답이나 점수를 대신 제시하지 않습니다. 초고에서 확인되는 한 가지 강점과 가장 중요한 한 가지 수정 지점을 근거 구절과 함께 설명합니다.",
      allowRetry: true,
    })
  }

  return {
    id: lesson.id,
    title: lesson.title,
    time: `${steps.length * 4}분`,
    cat: unit.title,
    desc: lesson.objective,
    summary: [
      `${lesson.title}에서는 판단 대상과 적용 범위를 먼저 고정한다.`,
      "직접 확인한 근거와 해석, 남은 한계를 구분한다.",
      "근거가 지지하는 범위에서 결론을 제시하고 다시 검토한다.",
    ],
    steps,
  }
}

function buildSeed(courses: readonly OutlineCourse[]) {
  return courses.map((course) => {
    const metadata = courseMetadata[course.id]
    const profile = profiles[course.id]
    if (metadata === undefined || profile === undefined) {
      throw new Error(`코스 메타데이터가 없습니다: ${course.id}`)
    }

    return {
      id: course.id,
      title: course.title,
      desc: metadata.desc,
      cat: metadata.cat,
      visualKey: metadata.visualKey,
      units: course.units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        lessons: unit.lessons.map((lesson, lessonIndex) =>
          buildLesson(lesson, unit, profile, lessonIndex)
        ),
      })),
    }
  })
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function auditSeed(seed: ReturnType<typeof buildSeed>) {
  const ids = new Set<string>()
  const duplicateIds: string[] = []
  const typeDistribution: Record<string, number> = {}
  let unitCount = 0
  let lessonCount = 0
  let stepCount = 0

  const registerId = (id: string) => {
    if (ids.has(id)) duplicateIds.push(id)
    ids.add(id)
  }

  for (const course of seed) {
    registerId(course.id)
    for (const unit of course.units) {
      unitCount += 1
      registerId(unit.id)
      for (const lesson of unit.lessons) {
        lessonCount += 1
        registerId(lesson.id)
        for (const [stepIndex, step] of lesson.steps.entries()) {
          stepCount += 1
          const stepId = `${lesson.id}-s${stepIndex + 1}`
          registerId(stepId)
          typeDistribution[step.type] = (typeDistribution[step.type] ?? 0) + 1
          if (step.type === "ai_feedback") {
            const target = step.target
            const targetIndex =
              typeof target === "string"
                ? lesson.steps.findIndex(
                    (_, index) => `${lesson.id}-s${index + 1}` === target
                  )
                : -1
            if (
              targetIndex < 0 ||
              targetIndex >= stepIndex ||
              lesson.steps[targetIndex]?.type !== "write"
            ) {
              throw new Error(`AI 피드백 대상이 잘못되었습니다: ${stepId}`)
            }
          }
        }
      }
    }
  }

  const expectedTypes = [
    "reading",
    "compare",
    "multiple_choice",
    "fill_blank",
    "select",
    "order",
    "write",
    "ai_feedback",
    "match",
    "categorize",
  ]
  const missingTypes = expectedTypes.filter(
    (type) => typeDistribution[type] === undefined
  )

  if (
    seed.length !== 14 ||
    unitCount !== 69 ||
    lessonCount !== 321 ||
    duplicateIds.length > 0 ||
    missingTypes.length > 0
  ) {
    throw new Error(
      JSON.stringify({
        courses: seed.length,
        unitCount,
        lessonCount,
        duplicateIds,
        missingTypes,
      })
    )
  }

  return {
    approvedOutlineDate: "2026-07-28",
    approvedOutlineSha256: sha256(
      readFileSync(outlinePath, "utf8").replace(/\r\n/gu, "\n")
    ),
    contentSha256: sha256(seed),
    courses: seed.length,
    units: unitCount,
    lessons: lessonCount,
    steps: stepCount,
    typeDistribution,
    courseHashes: Object.fromEntries(
      seed.map((course) => [course.id, sha256(course)])
    ),
  }
}

function buildEvidenceDocument(
  course: OutlineCourse,
  profile: CourseProfile
): string {
  const claims = courseClaims[course.id]
  if (claims === undefined || claims.length === 0) {
    throw new Error(`근거 주장이 없습니다: ${course.id}`)
  }

  const contentRows = [
    {
      id: course.id,
      application: "코스 성과와 제외 경계를 설계하는 기준으로 적용",
    },
    ...course.units.flatMap((unit) => [
      {
        id: unit.id,
        application: "관련 레슨을 하나의 수행 흐름으로 묶는 기준으로 적용",
      },
      ...unit.lessons.map((lesson) => ({
        id: lesson.id,
        application:
          "설명·자체 집필 사례·안내 판단 또는 독립 적용 활동의 기준으로 적용",
      })),
    ]),
  ]

  const rows = contentRows
    .map((content, index) => {
      const claim = claims[index % claims.length]
      return `| \`${content.id}\` | 자체 집필 | \`${claim}\` | ${content.application} | ${profile.boundary} 개별 활동의 성공을 역량 전체나 장기 전이의 증거로 해석하지 않는다. |`
    })
    .join("\n")

  return `# 코스 근거 연결: ${course.title}

## 판정 기준

- 예문·지문·문항·해설·참조 답안은 모두 자체 집필했다.
- 각색하거나 짧게 인용한 외부 콘텐츠는 없다.
- 주장 연결은 설계 판단의 근거이며 개별 활동의 효과를 보장하지 않는다.

## 콘텐츠 연결

| 콘텐츠 ID | 작성 판정 | 주장 ID | 적용 방식 | 근거 한계 |
| --- | --- | --- | --- | --- |
${rows}
`
}

function writeEvidenceDocuments(courses: readonly OutlineCourse[]): void {
  for (const course of courses) {
    const profile = profiles[course.id]
    if (profile === undefined) {
      throw new Error(`코스 프로필이 없습니다: ${course.id}`)
    }
    writeFileSync(
      resolve(evidenceDirectory, `${course.id}.md`),
      buildEvidenceDocument(course, profile)
    )
  }

  const index = readFileSync(evidenceIndexPath, "utf8")
  const list = courses
    .map(
      (course) => `- [\`${course.id}.md\`](./${course.id}.md) — ${course.title}`
    )
    .join("\n")
  const updatedIndex = index.replace(
    /## 콘텐츠 연결[\s\S]*$/u,
    `## 콘텐츠 연결

코스별 문서는 JSON 콘텐츠 ID와 설계 근거만 연결하며 학습자용 콘텐츠 값을 복제하지 않는다.

${list}
`
  )
  writeFileSync(evidenceIndexPath, updatedIndex)
}

const outlines = parseOutlines(readFileSync(outlinePath, "utf8"))
const seed = buildSeed(outlines)
const audit = auditSeed(seed)

writeFileSync(seedPath, `${JSON.stringify(seed, null, 2)}\n`)
writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`)
writeEvidenceDocuments(outlines)
console.log(JSON.stringify(audit, null, 2))
