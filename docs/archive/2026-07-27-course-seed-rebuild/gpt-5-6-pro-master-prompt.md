# GPT-5.6 Pro 단일 턴 코스 시드 재구축 실행안

## 결론

GPT-5.6 Pro 웹 한 턴에 조사, 분석, 카탈로그 설계, 코스별 집필과 JSON 검증을 모두 맡길 수 있다. 다만 결과를 채팅 본문에 출력시키지 않고 다운로드 가능한 `content-seed-data.json` 파일로 생성하게 해야 한다.

현재 5개 코스 시드도 약 129KB다. 같은 밀도로 10~20개 코스를 작성하면 본문 출력 한도에 걸려 JSON이 잘리거나 닫는 괄호가 누락될 위험이 크다. 파일 생성도 불가능한 실행 환경이면 단일 턴 방식의 신뢰성을 보장할 수 없으므로 결과를 서비스 후보로 채택하지 않는다.

이 방식이 보장하는 것은 `근거를 조사하도록 지시한 고품질 초안`까지다. 실제 작가·국어학자·국어교육 전문가가 검수했다는 사실이나 학습 효과를 보장하지 않는다. 서비스 반영 전에는 저장소 검증과 사람의 표본·전수 검수가 별도로 필요하다.

## 실행 원칙

1. 아래 프롬프트 전체를 새 GPT-5.6 Pro 대화의 첫 메시지로 한 번만 보낸다.
2. 웹 검색과 파일 생성 도구를 사용할 수 있는 대화에서 실행한다.
3. 실행 중에는 코스 수나 중간 결과를 승인하지 않는다. 모델이 근거와 중복도를 기준으로 10~20개 중 가장 작은 충분한 코스 수를 정한다.
4. 최종 응답에서 다운로드 가능한 `content-seed-data.json`과 검증 요약을 받는다.
5. 파일이 아니라 일부 JSON, 설계안, 출처 목록 또는 “계속할까요?”가 나오면 실패로 판정한다. 같은 대화에서 이어 쓰면 이미 단일 턴 조건을 벗어나므로 새 실행에서 프롬프트를 보완한다.
6. 산출물을 바로 덮어쓰지 않고 별도 위치에 저장해 구조·내용 검수를 마친 뒤 권위 파일에 반영한다.

## 마스터 프롬프트

````text
<role>
당신은 한국어 모어 성인을 위한 글쓰기·읽기·사고·정보 문해 교육과정을 설계하고 집필하는 수석 편집자다. 국어학자, 국어교육 연구자, 논증·수사학 연구자, 전문 작가와 학습 설계자가 함께 일하는 편집위원회의 기준으로 판단한다.

목표는 “전문가가 집필하고 검수한 느낌”의 실제 서비스 후보를 만드는 것이다. 실제 전문가 검수를 받았다고 주장하지 말고, 확인한 근거와 직접 만든 교육 콘텐츠를 구분한다.
</role>

<mission>
웹에서 신뢰할 수 있는 자료를 충분히 조사하고 분석한 뒤, 한국어가 모어인 일반 성인이 독립적으로 수강할 수 있는 10~20개의 교육 코스를 탑다운으로 설계하라. 코스별로 유닛, 레슨과 모든 학습 스텝을 완성하고, 아래 저장소 계약에 정확히 맞는 UTF-8 JSON 파일을 생성하라.

최종 필수 산출물은 다운로드 가능한 파일 하나다.

- 파일명: `content-seed-data.json`
- 루트 값: 코스 객체의 JSON 배열
- 형식: 유효한 JSON, 들여쓰기 2칸, 마지막 개행 포함
- 금지: JSON 주석, trailing comma, 생략 기호, placeholder, TODO, “예시는 동일”, 중간 설계안

대화 본문에 대용량 JSON을 붙이지 말고 파일로 첨부하라. 최종 본문에는 파일 링크와 코스·유닛·레슨·스텝 수, 파일 크기, SHA-256, 검증 통과 여부만 간단히 보고하라. 파일 생성 도구를 사용할 수 없다면 작업을 일부 출력하지 말고, 완전한 파일을 만들 수 없어 실패했다는 사실만 보고하라.
</mission>

<autonomy>
이 요청은 한 턴 안에 완결해야 한다. 필요한 웹 검색, 원문 열람, 내부 메모, 계산, 파일 작성과 비파괴 검증을 스스로 수행하라. 중간 승인을 요청하거나 일부 코스만 제출하거나 다음 메시지를 요구하지 마라.

최종 파일을 만들기 전에는 조사·분석·설계·집필·검증을 계속하라. 내부 계획과 상세 추론은 최종 응답에 노출하지 않는다.
</autonomy>

<learner_and_scope>
- 핵심 학습자: 한국어가 모어인 일반 성인
- 코스 독립성: 다른 코스의 선이수를 전제하지 않는다.
- 포함 범위: 어휘, 문장 이해, 문법·표기, 독해, 핵심 내용, 추론, 비판·논리·분석·종합·창의적 사고, 주제 설정, 내용 생성, 조직, 일관성과 응집성, 표현, 설명, 설득, 독자, 목적과 장르, 자기 점검, 배경지식, 수정, 정보 탐색, 출처 신뢰성, 매체 문해력
- 제외 범위: 특정 직업 전용, 입시 대비, 문학 창작 전용, 학술 논문 작성 전용 코스
- 코스 수: 10~20개. 숫자를 먼저 정하지 말고 역량 구조와 중복 분석 뒤, 충분한 깊이를 확보하는 가장 작은 수를 선택한다.
- 코스는 서로 다른 핵심 학습 성과를 가져야 한다. 이름만 다른 중복 코스를 만들지 않는다.
- 읽기·이해·사고·정보 판단은 직접 쓰기 결과물 없이도 독립된 목표가 될 수 있다.
- 모든 코스에 종합 쓰기나 AI 피드백을 기계적으로 넣지 않는다. 목표에 유효할 때만 사용한다.
</learner_and_scope>

<research_protocol>
먼저 자료를 수집하고 분석하되, 조사 메모 자체는 최종 파일에 추가하지 않는다.

자료 우선순위:
1. 최신 국립국어원 어문 규범·해설·실태 조사·공공언어 자료, 교육부·국가교육과정정보센터의 국어과 교육과정, 한국교육과정평가원·한국교육학술정보원 등 공공 연구
2. 동료 심사 학술 논문, 체계적 문헌고찰·메타분석, 대학·연구기관 보고서
3. OECD PIAAC·PISA, UNESCO 매체·정보 문해 교육과정, 미국 IES/What Works Clearinghouse 작문 지도, ACRL 정보 문해, Civic Online Reasoning 등 공신력 있는 국제 자료
4. 저자와 출판 주체를 확인할 수 있는 국어학·작문교육·수사학·인지과학 단행본과 공식 강의

반드시 최신 여부를 확인할 기준 자료군:
- 국립국어원의 현행 한글 맞춤법·표준어 규정 및 해설
- 국립국어원의 최신 국민 국어능력·글쓰기 능력 조사와 쉬운 공공언어 자료
- 2022 개정 국어과 교육과정의 최신 고시본과 성취수준 자료
- OECD PIAAC Cycle 2 literacy framework
- IES/WWC `Teaching Secondary Students to Write Effectively` 및 후속 공식 자료
- 작문 인지 과정, 자기조절 전략, 수정, 응집성과 글의 질, 독자·수사적 상황, 장르 교육에 관한 핵심 연구
- UNESCO Media and Information Literacy, ACRL, Civic Online Reasoning의 최신 공식 자료

자료 채택 규칙:
- 공식 원문, DOI 논문, 저자·기관 저장본을 우선한다.
- 검색 결과 요약만 읽고 원문 전체를 확인한 것처럼 쓰지 않는다.
- 책·유료 논문·강의는 실제 확인 가능한 목차·미리보기·초록·공식 소개의 범위만 사용한다.
- 일반 블로그, 커뮤니티, 익명 자료, SEO 요약문은 근거로 사용하지 않는다.
- 핵심 원리는 가능한 경우 독립된 두 자료 이상으로 교차 확인한다.
- 한국어 고유 규범과 실제 사용 판단에는 국내 권위 자료를 반드시 포함한다.
- 어린이·청소년·영어권 연구를 일반 성인 한국어 학습자에게 옮길 때는 전이 한계를 내부적으로 표시하고 효과를 단정하지 않는다.
- 규범, 경험 연구의 경향, 전문가 권고와 이번 교육과정의 설계 판단을 같은 확실성으로 표현하지 않는다.
- 상충하는 자료가 있으면 적용 조건을 구분하고 하나를 임의로 사실처럼 고르지 않는다.
- 존재하지 않는 문헌, DOI, 통계, 페이지와 URL을 만들지 않는다. 실제로 연 자료만 인용한다.
- 원문을 길게 전재하지 않는다. 예문·지문·선택지·참조 답안은 원리를 반영해 새로 집필한다.
- 최신 규범·조사·기관 페이지는 실행일 기준으로 다시 확인한다.

수집 종료 조건:
- 위 26개 초기 역량이 모두 근거 지형에 포함된다.
- 핵심 원리의 교차 확인과 한국어 고유 근거가 확보된다.
- 상충점, 적용 대상과 전이 한계를 구분할 수 있다.
- 반복 검색에서 코스 구조를 바꿀 새로운 핵심 원리가 거의 나오지 않는다.
- 근거가 부족한 주제는 억지로 코스에 넣거나 강한 표현으로 쓰지 않는다.
</research_protocol>

<analysis_and_curriculum_design>
조사 후 다음 순서로 내부 설계를 완료하라.

1. 출처에서 가르칠 수 있는 개념, 원리, 수행 절차, 흔한 오류, 평가 기준과 적용 한계를 추출한다.
2. 26개 초기 역량의 중복·상하·인접 관계를 분석하고 필요한 경우 근거가 충분한 역량만 추가한다.
3. 역량과 코스 후보의 행렬을 만들고, 코스마다 1~3개의 주역량과 필요한 보조 역량을 배정한다.
4. 독립성, 근거 충분성, 고유한 학습 성과와 중복 정도로 코스를 병합·분리해 10~20개를 확정한다.
5. 전체 카탈로그의 제목, 설명, 카테고리, 순서와 난이도 흐름을 먼저 확정한다.
6. 그다음 반드시 첫 코스의 모든 유닛·레슨·스텝을 완성하고 자체 검수한 뒤 두 번째 코스로 넘어간다. 미완성 코스를 병렬로 늘어놓지 않는다.
7. 모든 코스가 끝나면 전체 카탈로그의 중복, 누락, 용어와 난이도를 다시 감사한다.

전형적 범위는 코스당 3~5개 유닛, 유닛당 2~4개 레슨, 레슨당 3~6개 스텝이다. 숫자를 채우기 위한 할당량은 아니며 학습 목표에 따라 달라질 수 있다. 지나치게 얕은 코스나 불필요하게 긴 코스를 피하라.
</analysis_and_curriculum_design>

<content_quality>
모든 콘텐츠에 다음 기준을 적용하라.

- 정확성: 최신 공식 규범, 실제 사용, 문체상 권장, 허용형과 연구 경향을 구분한다.
- 명료성: 개념 정의, 경계, 왜 필요한지, 적용 절차와 예시가 연결된다.
- 교육 정렬: 레슨 목표, 설명, 모델, 활동, 정답·해설과 요약이 같은 능력을 가르친다.
- 전이: 규칙 암기에 그치지 않고 새 문장·문단·자료에서 판단하고 수정하는 활동을 포함한다.
- 해설: 정답만 말하지 않고 판단 근거와 오답이 틀린 이유를 설명한다.
- 자연스러운 한국어: 설명은 `-습니다`, 활동 지시는 `-해 보세요`를 기본으로 한다. 번역투, 과장, 상투적 AI 문체와 부자연스러운 명사 나열을 피한다.
- 독자 존중: 성인을 어린이처럼 대하지 않고, 특정 성별·지역·세대·직업·정치 입장을 정상으로 가정하지 않는다.
- 예시 품질: 원리를 분명히 보여 주는 현실적인 자체 예시를 사용하고, 사실 확인이 필요한 예시는 검증한다.
- 저작권: 책·논문·강의·기사의 문장과 고유 예시를 장문 복제하거나 피상적으로 바꾸지 않는다.
- 출처: 규범·연구·사실을 설명하는 `READING`에는 실제 확인한 핵심 출처를 `source`에 `기관/저자, 자료명, 연도, URL 또는 DOI` 형식으로 짧게 기록한다. 한 필드에 핵심 출처 1~3개만 둔다. 자체 작성 예시에는 외부 출처가 있는 것처럼 표시하지 않는다.
- 검수 표현: “전문가 검수 완료”, “과학적으로 증명”, “무조건”, “항상” 같은 근거보다 강한 표현을 쓰지 않는다.

서술형 학습 자료는 반드시 `READING.body`의 CommonMark Markdown 문서로 작성한다. 개념 설명, 단계, 체크리스트, 예문과 주의점은 제목, 문단, 목록, 인용문을 적절히 사용해 한 편의 자립적인 학습 문서가 되게 한다. 원시 HTML과 깨진 Markdown을 사용하지 않는다. 다른 활동 필드에 긴 이론을 숨기지 않는다.

각 레슨은 다음 질문에 답할 수 있어야 한다.
- 학습자가 무엇을 이해하거나 수행하게 되는가?
- 어떤 모델·대조·절차가 그 능력을 보이게 하는가?
- 활동이 그 능력을 실제로 연습시키는가?
- 정답과 해설이 하나로 결정되거나, 열린 쓰기라면 평가 초점이 분명한가?
- 레슨 `summary`가 학습자가 다시 사용할 판단 기준을 남기는가?
</content_quality>

<repository_contract>
이 파일은 Bun/TypeScript 모노레포의 시드 입력이다. 당신은 저장소를 볼 수 없으므로 아래 계약만을 권위로 사용하라.

루트 스키마:

```ts
type Seed = Course[]

type Course = {
  id: string
  title: string
  desc: string
  cat: string
  visualKey:
    | "basic-sentence-writing"
    | "grammar-complete"
    | "essay-writing"
    | "creative-writing"
    | "expression"
  units: Unit[]
}

type Unit = {
  id: string
  title: string
  lessons: Lesson[]
}

type Lesson = {
  id: string
  title: string
  time: `${positiveInteger}분`
  cat?: string
  desc?: string
  summary?: string[]
  steps: Step[]
}
```

ID 규칙:
- 코스·유닛·레슨 ID는 비어 있지 않은 ASCII kebab-case다.
- 의미를 드러내는 `course-...`, `unit-...`, `lesson-...` 접두사를 사용한다.
- 코스·유닛·레슨 ID는 계층을 통틀어 전역 중복이 없어야 한다.
- 스텝에는 `id`와 `sortOrder`를 쓰지 않는다.
- 각 스텝의 실제 ID는 배열 순서에 따라 자동으로 `${lesson.id}-s${1부터 시작하는 순번}`이 된다.
- 선택지·구간·항목 ID는 화면 문구가 아니라 의미적으로 안정적인 비어 있지 않은 문자열을 사용하며 해당 스텝 안에서 중복되지 않는다.

허용되는 `Step`은 아래 10개뿐이다. 여기에 없는 필드를 임의로 추가하지 않는다.

```ts
type ReadingStep = {
  type: "reading"
  title: string
  guide: string
  body: string                 // CommonMark Markdown
  source?: string
}

type CompareStep = {
  type: "compare"
  title: string
  versions: Array<{
    label: string
    text: string
  }>                          // 최소 2개
  analysis: string
}

type MultipleChoiceStep = {
  type: "multiple_choice"
  question: string
  options: Array<{
    id: string
    text: string
  }>                          // 최소 2개, id 중복 금지
  correct: string             // options[].id 중 하나
  explanation: string
  wrong?: string
}

type FillBlankStep = {
  type: "fill_blank"
  template: string
  words: string[]             // 최소 1개
  wordIds: string[]           // words와 같은 길이, 중복 금지
  answer: string[]            // 중복 없는 wordIds의 부분집합
  explanation: string
}

type SelectStep = {
  type: "select"
  question: string
  segments: string[]          // 최소 1개
  segmentIds: string[]        // segments와 같은 길이, 중복 금지
  correct: string[]           // 중복 없는 segmentIds의 부분집합
  explanation: string
  layout?: "inline" | "block"
}

type OrderStep = {
  type: "order"
  title: string
  items: string[]             // 최소 1개
  itemIds: string[]           // items와 같은 길이, 중복 금지
  correct: string[]           // 모든 itemIds를 정확히 한 번씩 포함
  showNumbers?: boolean
  explanation: string
}

type WriteStep = {
  type: "write"
  min: number                 // 0 이상의 정수
  title?: string
  guide?: string
  goal?: number               // 0 이상의 정수
  max?: number                // 0 이상의 정수
  badge?: string
  claim?: string
  context?: string
  mode?: string               // 현재 의미 있는 값은 "counter", "self-rebut"
  placeholder?: string
  prompt?: string
  reference?: string
  sample?: string
  structure?: string
  topic?: string
  draft?: boolean
}

type AiFeedbackStep = {
  type: "ai_feedback"
  target: string              // 같은 레슨의 앞선 write 스텝의 자동 생성 ID
  focus: string
  feedback: string
  allowRetry: boolean
}

type MatchStep = {
  type: "match"
  title: string
  guide: string
  pairs: Array<{
    left: string
    leftId: string
    right: string
    rightId: string
  }>                          // 최소 1개
  explanation: string
}

type CategorizeStep = {
  type: "categorize"
  title: string
  guide: string
  categories: Array<{
    id: string
    label: string
  }>                          // 최소 1개
  items: Array<{
    id: string
    text: string
    categoryId: string
  }>                          // 최소 1개
  explanation: string
}

type Step =
  | ReadingStep
  | CompareStep
  | MultipleChoiceStep
  | FillBlankStep
  | SelectStep
  | OrderStep
  | WriteStep
  | AiFeedbackStep
  | MatchStep
  | CategorizeStep
```

추가 불변식:
- 모든 코스와 유닛에는 적어도 하나의 하위 항목이 있고 모든 레슨에는 적어도 하나의 스텝이 있어야 한다.
- `time`은 `5분`, `12분`처럼 양의 정수와 `분`만 사용한다.
- `summary`는 2~5개의 구체적인 학습 요점으로 작성한다.
- `fill_blank.template`의 빈칸과 `answer` 순서는 서로 대응해야 한다.
- `match`의 모든 `leftId`와 `rightId`는 양쪽을 합쳐서도 서로 달라야 한다.
- `categorize.items[].categoryId`는 반드시 존재하는 `categories[].id`를 참조한다. 카테고리 ID와 항목 ID에는 서로 다른 접두사를 사용한다.
- `write`는 `title` 또는 `prompt` 중 적어도 하나를 가진다. 값이 존재하면 `min <= goal <= max` 순서를 지키고 학습 과제에 현실적인 글자 수를 사용한다.
- `ai_feedback.target`은 같은 레슨에서 자신보다 앞선 `write` 스텝의 자동 생성 ID여야 한다. 다른 레슨이나 뒤 스텝을 참조하면 안 된다.
- `ai_feedback.feedback`은 아직 보지 않은 학습자 답안을 이미 평가한 칭찬이나 점수가 아니라, 피드백 방식·관찰 기준을 설명하는 문구여야 한다.
- 정답은 문구나 배열 위치가 아니라 안정적인 ID를 참조한다.
- 빈 문자열, 공백뿐인 문자열, 중복 선택지, 의미상 복수 정답인데 단일 정답만 허용한 문제를 만들지 않는다.
</repository_contract>

<construction_process>
파일은 내부 작업 공간에서 점진적으로 작성하라.

1. 전체 코스 카탈로그와 전역 ID 목록을 확정한다.
2. 첫 코스를 완성한다.
3. 해당 코스의 교육 품질, 출처, Markdown과 스키마를 검수한다.
4. 검수를 통과한 코스를 파일의 배열에 추가한다.
5. 다음 코스에 같은 절차를 반복한다.
6. 마지막에 전체 파일을 다시 파싱하고 전역 검증한다.

한 코스를 작성할 때의 순서:
1. 코스의 고유 학습 성과와 근거 묶음을 확인한다.
2. 제목, 설명, 일관된 카테고리와 가장 가까운 `visualKey`를 선택한다. 5개 visualKey는 여러 코스가 공유할 수 있다.
3. 유닛과 전체 레슨의 점진적 흐름을 설계한다.
4. 각 레슨에 필요한 Markdown 학습 문서, 모델 비교, 판단 활동, 적용·쓰기 활동을 선택한다.
5. 활동과 해설을 실제로 풀어 보고 정답의 결정성과 난이도를 확인한다.
6. 코스 안의 중복과 빠진 선수 설명을 제거한 뒤 다음 코스로 이동한다.
</construction_process>

<programmatic_validation>
최종 응답 전에 코드로 JSON을 파싱하고 다음을 모두 검사하라. 실패하면 파일을 수정하고 전부 다시 검사한다.

- JSON 파싱 성공과 루트 배열
- 코스 수 10~20
- 모든 필수 필드의 타입과 허용 enum
- 코스·유닛·레슨의 비어 있지 않은 배열
- 전역 course/unit/lesson ID의 kebab-case와 유일성
- 레슨 시간 형식과 양의 정수
- 허용된 10개 스텝 타입만 사용
- 각 스텝 타입의 필수·선택 필드와 추가 필드 부재
- 선택형 stable ID의 존재·유일성·참조 무결성
- ORDER 정답의 완전 순열
- MATCH 양쪽 전체 ID의 유일성
- CATEGORIZE category 참조 무결성
- WRITE 글자 수 순서
- AI_FEEDBACK의 같은 레슨·앞선 WRITE 참조
- 빈 문자열, placeholder, TODO, 생략 기호
- 모든 READING.body의 비어 있지 않은 Markdown
- 모든 출처 URL의 실제 형식과 조사 중 연 자료와의 일치
- 제목·설명·요약·문항·해설의 완전성

검증이 끝난 뒤 JSON을 2칸 들여쓰기로 다시 직렬화하고 마지막 개행을 넣는다. 최종 파일에서 다시 파싱한 뒤 SHA-256과 계층별 개수를 계산한다.
</programmatic_validation>

<final_quality_audit>
기계 검증 뒤 다음 의미 감사를 수행하라.

- 26개 초기 역량 중 실질적으로 다뤄지지 않은 항목이 없는가?
- 코스 제목만 다르고 같은 설명·활동을 반복하지 않는가?
- 공식 규범과 저자의 문체 취향을 혼동하지 않는가?
- 어린이·영어권 연구의 결과를 성인 한국어 효과로 단정하지 않는가?
- 각 핵심 원리의 정의, 절차, 예시, 연습과 피드백이 정렬되는가?
- 오답이 단순히 우스운 선택지가 아니라 흔한 오개념을 진단하는가?
- 읽기 자료가 짧은 블로그 요약처럼 피상적이지 않고, 그렇다고 원문을 대체할 정도로 복제하지 않는가?
- 설명·설득·정보 판단에서 증거의 질과 윤리를 함께 다루는가?
- 매체·생성형 AI 환경의 최신 문제를 유행어가 아니라 검증 가능한 원리로 다루는가?
- 모든 코스가 선행 코스 없이 이해 가능한가?

하나라도 실패하면 해당 코스를 고친 뒤 구조 검증과 의미 감사를 다시 수행하라.
</final_quality_audit>

<final_response>
완성된 `content-seed-data.json` 파일을 첨부하라. 본문은 다음 정보만 간단히 보고한다.

- 코스 / 유닛 / 레슨 / 스텝 수
- 파일 크기
- SHA-256
- JSON 파싱·스키마·참조 무결성·의미 감사 통과 여부

연구 과정, 내부 추론, 코스별 설명과 JSON 본문을 대화 본문에 반복하지 않는다.
</final_response>
````

## 수령 후 저장소 통합 계획

1. 받은 파일의 SHA-256과 보고된 값을 먼저 비교한다.
2. 기존 시드를 보존한 상태에서 후보 파일을 별도 경로에 저장하고 JSON 파싱, 스키마와 콘텐츠 감사를 다시 실행한다.
3. 표본 검수가 아니라 코스별 전수 검수를 수행한다. 특히 규범, 출처 URL, 정답 결정성, AI 피드백 대상과 저작권 위험을 본다.
4. 승인된 파일만 [`content-seed-data.json`](../../../packages/modules/content/src/infrastructure/persistence/content-seed-data.json)에 반영한다.
5. 현재 콘텐츠 테스트는 기존 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝과 특정 제목·ID를 기준선으로 고정하고 있다. 새 시드에 맞게 테스트의 기준선과 의미 있는 회귀 위험을 다시 정하지 않으면 테스트가 실패한다.
6. 콘텐츠 모듈 테스트, 전체 typecheck·test·build, 시드 적용과 브라우저 검수를 순서대로 실행한다.
7. 최종 수량과 코스 목록이 확정되면 제품 권위 문서를 갱신하고 연구 근거 연결을 완성한다.

## 판단과 한계

- 단기적으로는 단일 프롬프트가 가장 적은 조정 비용으로 대규모 후보를 얻는 방법이다.
- 유지보수 관점에서는 JSON 하나에 출처 추적성을 완전히 담을 수 없다. 현재 계약에서 출처는 `READING.source`에만 들어가므로 활동·코스 수준의 `콘텐츠 ID → 주장 → 출처` 연결은 별도 연구 문서가 맡아야 한다.
- 신뢰성 관점에서는 GPT의 자체 검증이 같은 모델의 오류를 완전히 독립적으로 발견하지 못한다. 저장소 스키마 검증은 구조적 적합성의 증거일 뿐, 국어·교육·저작권 품질의 증명이 아니다.
- 장기적으로는 이 단일 실행을 기준선으로 삼되, 출처 감사와 전문가 검수를 별도 게이트로 두고 콘텐츠 개정을 코스 단위로 발행하는 방식이 안전하다.
