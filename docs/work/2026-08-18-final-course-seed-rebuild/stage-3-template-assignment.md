# 3단계 입력: 레슨별 템플릿 배정표

이 문서는 308개 레슨에 스텝 배치 템플릿을 배정하는 작업표다. 현재 제품 사실의 권위 소스가 아니다. 레슨 ID와 제목은 [`content-seed-data.json`](../../../packages/modules/content/src/infrastructure/persistence/content-seed-data.json)이, 템플릿은 [`stage-2-step-templates.md`](./stage-2-step-templates.md)가 소유한다.

## 사용법

각 유닛 표의 `배정` 칸에 템플릿 ID를 적는다. 레슨 제목이 요구하는 판별 지점과 컨셉이 맞는 템플릿을 고른다. 유닛의 통과 기준은 소제목 옆에 적어 두었다.

후보를 미리 좁혀 두지 않았다. 통과 기준과 레슨 제목을 보고 「컨셉 색인」에서 고르는 것이 판단을 왜곡하지 않는다. 색인은 컨셉군 9개로 묶여 있으므로 통과 기준이 가리키는 군을 먼저 보고 다른 군으로 넓히면 된다.

## 배정 제약

1. 한 유닛에 같은 템플릿을 두 번 적지 않는다. 유닛의 레슨 수만큼 서로 다른 템플릿이 필요하다.
2. 한 유닛을 한 컨셉군으로만 채우지 않는다. 통과 기준이 하나라도 확인 방식은 레슨마다 달라야 한다.
3. 맞지 않는 템플릿을 다양성을 위해 배정하지 않는다. 레슨의 판별 지점이 우선이다. 1번과 2번을 지킬 수 없다면 템플릿을 억지로 고르지 말고 컨셉이 빠졌다는 신호로 보고 기록한다.
4. 배정을 마치면 1번과 2번을 대조해 확인한다. 레슨 ID와 제목이 시드와 어긋나지 않는지도 함께 본다.

## 컨셉 색인

**A 규범과 표기**

| ID   | 컨셉                                          | 스텝 |
| ---- | --------------------------------------------- | ---- |
| `A1` | 조항을 사례에 적용해 근거를 댄다              | 19   |
| `A2` | 규범·허용·취향을 세 층으로 가른다             | 18   |
| `A3` | 품사를 판정한 뒤 표기를 결정한다              | 19   |
| `A4` | 원문 재현으로 표기를 굳힌다                   | 19   |
| `A5` | 소리와 표기가 어긋나는 조건과 예외를 진술한다 | 20   |
| `A6` | 부호가 바꾸는 뜻을 전후로 확인한다            | 18   |
| `A7` | 검사기가 놓치는 오류를 스스로 잡는다          | 19   |
| `A8` | 원칙과 관용을 함께 적용한다                   | 19   |

**B 문장 성분과 구조**

| ID   | 컨셉                                      | 스텝 |
| ---- | ----------------------------------------- | ---- |
| `B1` | 어긋난 성분을 찾아 고친다                 | 20   |
| `B2` | 어절을 조립해 성분 관계를 체득한다        | 18   |
| `B3` | 나눌 문장과 유지할 문장을 가른다          | 20   |
| `B4` | 지워도 뜻이 남는지 검증한다               | 20   |
| `B5` | 위험 신호를 금칙어가 아니라 지표로 다룬다 | 20   |
| `B6` | 사라진 행위자를 되살린다                  | 20   |
| `B7` | 길이와 구조로 정보 무게를 조절한다        | 20   |

**C 어휘 선택**

| ID   | 컨셉                                       | 스텝 |
| ---- | ------------------------------------------ | ---- |
| `C1` | 비슷한 말이 갈리는 축을 지목한다           | 19   |
| `C2` | 문맥으로 뜻을 확정한다                     | 19   |
| `C3` | 문법은 맞지만 안 어울리는 결합을 잡는다    | 19   |
| `C4` | 한 편의 글에서 톤이 흔들린 자리를 찾는다   | 21   |
| `C5` | 추상어를 검증 가능한 말로 내린다           | 19   |
| `C6` | 관용구와 고사성어를 정확한 형태로 조립한다 | 19   |

**D 문단과 글 구조**

| ID   | 컨셉                                           | 스텝 |
| ---- | ---------------------------------------------- | ---- |
| `D1` | 통일성·충분성·긴밀성 중 무엇이 깨졌는지 말한다 | 19   |
| `D2` | 문단에서 무관한 문장을 걸러낸다                | 19   |
| `D3` | 논리 전개에 맞게 문단을 배열한다               | 19   |
| `D4` | 빠진 뒷받침의 종류를 지목한다                  | 20   |
| `D5` | 완성 글에서 개요를 복원한다                    | 19   |
| `D6` | 다리가 없는 지점을 찾아 이유를 댄다            | 20   |
| `D7` | 서론의 약속과 결론의 회수를 대조한다           | 20   |
| `D8` | 접속어를 넣을 자리와 뺄 자리를 가른다          | 20   |

**E 설명과 논증**

| ID   | 컨셉                                         | 스텝 |
| ---- | -------------------------------------------- | ---- |
| `E1` | 독자가 이미 아는 것과 모르는 것을 나눈다     | 20   |
| `E2` | 정의의 결함 유형을 이름으로 지목한다         | 19   |
| `E3` | 비교 층위와 예시 대표성을 검사한다           | 20   |
| `E4` | 인과 주장의 강도를 근거에 맞춘다             | 19   |
| `E5` | 반박 가능한 명제와 그렇지 않은 진술을 가른다 | 20   |
| `E6` | 숨은 보증을 문장으로 복원한다                | 20   |
| `E7` | 근거를 탈락시킬 기준을 댄다                  | 19   |
| `E8` | 오류를 이름으로 지목한다                     | 20   |
| `E9` | 반론 처리가 논증을 강화한 지점을 설명한다    | 20   |

**F 관찰과 묘사**

| ID   | 컨셉                                     | 스텝 |
| ---- | ---------------------------------------- | ---- |
| `F1` | 오감 가운데 무엇을 골랐는지 확인한다     | 18   |
| `F2` | 무엇으로 구체화했는지 수단을 지목한다    | 19   |
| `F3` | 비유의 근거를 말하고 진부·과잉을 가른다  | 20   |
| `F4` | 말한 문장과 보여준 문장을 가른다         | 20   |
| `F5` | 관념어를 장면으로 바꾸고 과잉을 덜어낸다 | 20   |

**G 요약·비판·정보 판별**

| ID   | 컨셉                                  | 스텝 |
| ---- | ------------------------------------- | ---- |
| `G1` | 버릴 정보의 기준을 진술한다           | 20   |
| `G2` | 판단 구조가 보존된 요약을 골라낸다    | 20   |
| `G3` | 사실·의견·전제를 문장 단위로 가른다   | 21   |
| `G4` | 인용·바꿔 쓰기·표절의 경계를 판정한다 | 19   |
| `G5` | 그럴듯함과 검증 가능함을 가른다       | 19   |
| `G6` | 자료의 신뢰도에 우선순위를 매긴다     | 19   |

**H 발상과 주제**

| ID   | 컨셉                                     | 스텝 |
| ---- | ---------------------------------------- | ---- |
| `H1` | 생성 단계와 평가 단계를 구분한다         | 19   |
| `H2` | 관찰에서 판단까지 순서를 지킨다          | 20   |
| `H3` | 화제를 논쟁 가능한 주제문으로 좁힌다     | 19   |
| `H4` | 답할 수 있는 질문과 공허한 질문을 가른다 | 20   |
| `H5` | 해석에 반증 조건을 붙인다                | 19   |

**I 종합·판별**

| ID   | 컨셉                             | 스텝 |
| ---- | -------------------------------- | ---- |
| `I1` | 오류를 갈래로 분류한다           | 22   |
| `I2` | 분류한 뒤 우선순위를 정한다      | 23   |
| `I3` | 점검 질문을 목록으로 세운다      | 22   |
| `I4` | 같은 내용 두 판본을 대조한다     | 22   |
| `I5` | 오류가 섞인 문단을 해부한다      | 23   |
| `I6` | 여러 갈래를 한 자리에서 진단한다 | 24   |

---

## 코스 1. 정확하고 힘 있는 문장

`course-precise-powerful-sentence` · 구성과 표현 · 유닛 7개

### 유닛 1. 문장의 골격과 호응

통과: 어긋난 성분을 이름으로 지목한다 · 레슨 6개

| #   | 레슨 ID                                      | 제목                                              | 배정 |
| --- | -------------------------------------------- | ------------------------------------------------- | ---- |
| 1   | `lesson-sentence-subject-predicate-distance` | 주어와 서술어 사이가 멀어질 때                    | `B1` |
| 2   | `lesson-sentence-missing-object`             | 목적어를 잃어버린 서술어                          | `B2` |
| 3   | `lesson-sentence-adverb-predicate-demand`    | 부사어가 요구하는 서술어 ('결코', '전혀', '조차') | `C3` |
| 4   | `lesson-sentence-honorific-mismatch`         | 높임의 주체와 대상이 어긋날 때                    | `E8` |
| 5   | `lesson-sentence-tense-adverb-mismatch`      | 시제와 시간 부사어의 불일치                       | `A7` |
| 6   | `lesson-sentence-omitted-subject-drift`      | 생략한 주어가 다른 주어로 읽히는 문장             | `B6` |

### 유닛 2. 한 문장 한 판단

통과: 분할할 문장과 유지할 문장을 가른다 · 레슨 6개

| #   | 레슨 ID                                    | 제목                                     | 배정 |
| --- | ------------------------------------------ | ---------------------------------------- | ---- |
| 1   | `lesson-sentence-multiple-judgment-signal` | 한 문장에 판단이 둘 이상 들어간 신호     | `B3` |
| 2   | `lesson-sentence-overlapping-conditions`   | 조건이 겹칠 때 문장을 끊는 자리          | `D6` |
| 3   | `lesson-sentence-triple-clause-chain`      | 접속 어미로 이어 붙인 세 겹 문장         | `B2` |
| 4   | `lesson-sentence-stacked-modifier-clauses` | 관형절이 쌓이면 서술어가 늦어진다        | `B7` |
| 5   | `lesson-sentence-information-order`        | 앞으로 당길 정보와 뒤로 미룰 정보        | `E1` |
| 6   | `lesson-sentence-do-not-split-criteria`    | 나누면 나빠지는 문장: 분할하지 않을 기준 | `I3` |

### 유닛 3. 군더더기와 상투 표현

통과: 삭제해도 뜻이 남는 요소만 덜어낸다 · 레슨 6개

| #   | 레슨 ID                                    | 제목                                          | 배정 |
| --- | ------------------------------------------ | --------------------------------------------- | ---- |
| 1   | `lesson-sentence-seems-like-hedge`         | '~것 같다'가 판단을 흐리는 자리               | `B5` |
| 2   | `lesson-sentence-stacked-genitive`         | 관형격 '-의'가 겹쳐 쌓인 명사구               | `B2` |
| 3   | `lesson-sentence-jeok-suffix-habit`        | 접미사 '-적'이 필요한 자리와 습관인 자리      | `C1` |
| 4   | `lesson-sentence-itda-replacing-predicate` | '있다/있는'이 서술어를 대신할 때              | `B6` |
| 5   | `lesson-sentence-plural-suffix-overlap`    | 복수 '-들'과 뜻이 겹친 표현                   | `A7` |
| 6   | `lesson-sentence-deletion-test`            | 삭제 검증: 지운 뒤 의미가 보존되는지 확인하기 | `B4` |

### 유닛 4. 번역투와 명사화

통과: 위험 신호를 금칙어가 아니라 점검 지표로 다룬다 · 레슨 6개

| #   | 레슨 ID                                       | 제목                                        | 배정 |
| --- | --------------------------------------------- | ------------------------------------------- | ---- |
| 1   | `lesson-sentence-inanimate-subject`           | 무생물이 주어 자리에 올 때                  | `B6` |
| 2   | `lesson-sentence-about-regarding`             | '~에 대하여'와 '~에 관하여'의 자리          | `C1` |
| 3   | `lesson-sentence-in-doing-so`                 | '~에 있어서'와 '~함에 있어'의 대체          | `A7` |
| 4   | `lesson-sentence-through-for-overuse`         | '~을 통해'와 '~을 위해'의 획일화            | `C3` |
| 5   | `lesson-sentence-gajida-flattening`           | '가지다'로 뭉개진 서술어 되살리기           | `C2` |
| 6   | `lesson-sentence-risk-signal-not-banned-word` | 위험 신호는 금칙어가 아니다: 문맥 판단 기준 | `B5` |

### 유닛 5. 태와 책임 주체

통과: 주체가 숨은 지점과 그 이유를 말한다 · 레슨 6개

| #   | 레슨 ID                                        | 제목                                 | 배정 |
| --- | ---------------------------------------------- | ------------------------------------ | ---- |
| 1   | `lesson-sentence-passive-focus-choice`         | 피동을 골라야 하는 경우: 정보의 초점 | `I4` |
| 2   | `lesson-sentence-double-passive-structure`     | 이중 피동이 만들어지는 결합 구조     | `A7` |
| 3   | `lesson-sentence-sikida-displacing-transitive` | '-시키다'가 타동사를 밀어낼 때       | `C1` |
| 4   | `lesson-sentence-by-cause-selection`           | '~에 의해'와 '~로 인해'의 선별       | `E4` |
| 5   | `lesson-sentence-nominal-ending-erases-agent`  | 명사형 종결(~함, ~음)이 지우는 주체  | `C5` |
| 6   | `lesson-sentence-finding-responsibility`       | 행위자가 사라진 문장에서 책임 찾기   | `B6` |

### 유닛 6. 문장 구조와 리듬

통과: 길이와 구조로 정보 무게를 조절한 예를 판별한다 · 레슨 6개

| #   | 레슨 ID                                          | 제목                                | 배정 |
| --- | ------------------------------------------------ | ----------------------------------- | ---- |
| 1   | `lesson-sentence-simple-versus-complex`          | 홑문장과 겹문장, 정보량으로 고르기  | `B3` |
| 2   | `lesson-sentence-coordinate-relations`           | 이어진 문장으로 관계를 드러내기     | `B2` |
| 3   | `lesson-sentence-embedded-compression`           | 안은 문장으로 정보를 압축하기       | `G2` |
| 4   | `lesson-sentence-length-controls-weight`         | 문장 길이로 정보의 무게 조절하기    | `B7` |
| 5   | `lesson-sentence-parallel-antithesis-conditions` | 병렬 구조와 대구가 성립하는 조건    | `E3` |
| 6   | `lesson-sentence-monotonous-endings`             | 종결 어미가 단조로울 때 생기는 문제 | `C4` |

### 유닛 7. 문장 판별 종합

통과: 오류를 갈래로 분류하고 우선순위를 정한다 · 레슨 6개

| #   | 레슨 ID                                                | 제목                                      | 배정 |
| --- | ------------------------------------------------------ | ----------------------------------------- | ---- |
| 1   | `lesson-sentence-two-readings-cause`                   | 두 가지로 읽히는 문장의 원인 분류         | `I1` |
| 2   | `lesson-sentence-modifier-position-shift`              | 수식어의 자리가 뜻을 바꾸는 순간          | `B2` |
| 3   | `lesson-sentence-overcompression-side-effect`          | 과도하게 압축된 문장의 부작용             | `B4` |
| 4   | `lesson-sentence-read-aloud-friction`                  | 소리 내어 읽었을 때 걸리는 지점           | `A7` |
| 5   | `lesson-sentence-two-versions-style-versus-redundancy` | 같은 내용 두 판본: 문체와 군더더기 가르기 | `I4` |
| 6   | `lesson-sentence-six-error-categories`                 | 문장 오류 여섯 갈래로 분류하기            | `I2` |

## 코스 2. 정확한 어휘 선택

`course-accurate-word-choice` · 언어와 읽기 · 유닛 6개

### 유닛 1. 유의어의 갈림

통과: 무엇이 갈리는지 축을 지목한다 · 레슨 6개

| #   | 레슨 ID                                     | 제목                                 | 배정 |
| --- | ------------------------------------------- | ------------------------------------ | ---- |
| 1   | `lesson-word-synonym-splits-by-usage`       | 유의어는 뜻이 아니라 쓰임에서 갈린다 | `C1` |
| 2   | `lesson-word-synonym-intensity`             | 정도의 세기가 다른 유의어            | `C5` |
| 3   | `lesson-word-synonym-emotional-grain`       | 감정의 결이 다른 유의어              | `F1` |
| 4   | `lesson-word-synonym-formality-layer`       | 격식의 층이 다른 유의어              | `C4` |
| 5   | `lesson-word-synonym-polarity-implicature`  | 긍정·부정의 함축이 붙은 유의어       | `G3` |
| 6   | `lesson-word-reading-split-from-definition` | 사전 뜻풀이에서 갈림점 읽어내기      | `I4` |

### 유닛 2. 다의어와 동음이의어

통과: 문맥으로 뜻을 확정한다 · 레슨 5개

| #   | 레슨 ID                                    | 제목                               | 배정 |
| --- | ------------------------------------------ | ---------------------------------- | ---- |
| 1   | `lesson-word-polysemy-core-and-peripheral` | 다의어의 중심 뜻과 주변 뜻         | `I2` |
| 2   | `lesson-word-context-fixes-meaning`        | 문맥이 뜻을 확정하는 방식          | `C2` |
| 3   | `lesson-word-homonym-misreading`           | 동음이의어가 만드는 오해           | `A7` |
| 4   | `lesson-word-dictionary-sense-numbers`     | 사전의 뜻 번호와 용례 읽는 법      | `A1` |
| 5   | `lesson-word-inferring-unfamiliar-meaning` | 낯선 단어의 뜻을 문맥으로 추론하기 | `H5` |

### 유닛 3. 대상과 상황에 맞는 단어

통과: 대상 자질과 추상도로 후보를 탈락시킨다 · 레슨 6개

| #   | 레슨 ID                                   | 제목                                    | 배정 |
| --- | ----------------------------------------- | --------------------------------------- | ---- |
| 1   | `lesson-word-person-versus-object`        | 사람에게 쓰는 말과 사물에 쓰는 말       | `C3` |
| 2   | `lesson-word-lowering-abstraction`        | 추상어를 검증 가능한 말로 내리기        | `C5` |
| 3   | `lesson-word-sino-korean-versus-native`   | 한자어와 고유어, 무엇이 독자에게 쉬운가 | `E1` |
| 4   | `lesson-word-keeping-or-unpacking-jargon` | 전문 용어를 남길 자리와 풀 자리         | `G1` |
| 5   | `lesson-word-loanword-selection-criteria` | 외래어와 차용어를 고르는 기준           | `A2` |
| 6   | `lesson-word-hypernym-hyponym-scope`      | 상위어와 하위어로 진술의 범위 맞추기    | `E3` |

### 유닛 4. 어휘의 격과 톤

통과: 한 편의 글에서 톤이 흔들린 자리를 찾는다 · 레슨 6개

| #   | 레슨 ID                                   | 제목                               | 배정 |
| --- | ----------------------------------------- | ---------------------------------- | ---- |
| 1   | `lesson-word-written-versus-spoken`       | 문어체 어휘와 구어체 어휘          | `A2` |
| 2   | `lesson-word-honorific-levels-and-excess` | 높임 어휘의 단계와 과잉 높임       | `E8` |
| 3   | `lesson-word-slang-and-buzzwords`         | 은어와 유행어가 글에서 걸리는 지점 | `B5` |
| 4   | `lesson-word-euphemism-versus-directness` | 완곡어와 직설어의 선택 효과        | `I4` |
| 5   | `lesson-word-tone-drift-signal`           | 어휘 톤이 흔들리는 신호            | `C4` |
| 6   | `lesson-word-ending-register-mismatch`    | 종결 어미와 어휘 격의 어긋남       | `B1` |

### 유닛 5. 연어와 결합 관계

통과: 문법은 맞지만 안 어울리는 결합을 잡는다 · 레슨 5개

| #   | 레슨 ID                                        | 제목                               | 배정 |
| --- | ---------------------------------------------- | ---------------------------------- | ---- |
| 1   | `lesson-word-grammatical-but-unnatural`        | 문법은 맞지만 어울리지 않는 결합   | `C3` |
| 2   | `lesson-word-learning-collocations-in-bundles` | 자주 쓰이는 연어를 묶음으로 익히기 | `B2` |
| 3   | `lesson-word-idiom-exact-form`                 | 관용구의 정확한 형태               | `C6` |
| 4   | `lesson-word-proverbs-in-context`              | 속담과 고사성어를 문맥에 맞게 쓰기 | `F3` |
| 5   | `lesson-word-particle-predicate-demand`        | 조사와 서술어가 요구하는 결합      | `B1` |

### 유닛 6. 어휘 판별 종합

통과: 오류를 갈래로 분류한다 · 레슨 6개

| #   | 레슨 ID                                           | 제목                                        | 배정 |
| --- | ------------------------------------------------- | ------------------------------------------- | ---- |
| 1   | `lesson-word-redundant-meaning`                   | 뜻이 겹친 표현                              | `B4` |
| 2   | `lesson-word-keep-concept-terms-fixed`            | 개념어는 바꿔 쓰지 않는다: 유의어 변주 억제 | `G4` |
| 3   | `lesson-word-conditions-for-replacing-repetition` | 반복되는 단어를 대체할 때의 조건            | `I3` |
| 4   | `lesson-word-antonym-boundary-check`              | 반의어로 어휘의 경계 확인하기               | `C1` |
| 5   | `lesson-word-one-word-changes-sentence`           | 밋밋한 문장을 단어 하나로 바꾸기            | `F5` |
| 6   | `lesson-word-five-error-categories`               | 어휘 오류 다섯 갈래로 분류하기              | `I1` |

## 코스 3. 표기의 원리: 맞춤법·띄어쓰기·문장부호

`course-orthography-principles` · 언어와 읽기 · 유닛 7개

### 유닛 1. 띄어쓰기의 원리

통과: 원칙 조항으로 판단 근거를 댄다 · 레슨 6개

| #   | 레슨 ID                                              | 제목                                | 배정 |
| --- | ---------------------------------------------------- | ----------------------------------- | ---- |
| 1   | `lesson-spelling-words-apart-particles-attached`     | 단어는 띄고 조사는 붙인다           | `A1` |
| 2   | `lesson-spelling-dependent-noun-spacing`             | 의존명사를 띄우는 이유              | `A3` |
| 3   | `lesson-spelling-auxiliary-verb-principle-allowance` | 보조 용언, 원칙과 허용의 경계       | `A2` |
| 4   | `lesson-spelling-unit-noun-with-numeral`             | 단위 명사와 숫자가 만날 때          | `A8` |
| 5   | `lesson-spelling-numbers-by-ten-thousand`            | 수는 만 단위로 띄어 쓴다            | `A4` |
| 6   | `lesson-spelling-name-title-proper-noun-unit`        | 성명·직함·고유명사·전문 용어의 단위 | `I3` |

### 유닛 2. 형태가 같은 말 가르기

통과: 품사를 판정한 뒤 표기를 결정한다 · 레슨 6개

| #   | 레슨 ID                                         | 제목                                           | 배정 |
| --- | ----------------------------------------------- | ---------------------------------------------- | ---- |
| 1   | `lesson-spelling-part-of-speech-splits-spacing` | 품사가 갈리면 띄어쓰기도 갈린다                | `A3` |
| 2   | `lesson-spelling-doe-dwae-an-anh`               | '되-'와 '돼', '안'과 '않'을 한 원리로 정리하기 | `A5` |
| 3   | `lesson-spelling-de-versus-dae`                 | '-데'와 '-대': 경험과 전달                     | `C1` |
| 4   | `lesson-spelling-deunji-versus-deonji`          | '-든지'와 '-던지': 선택과 회상                 | `C2` |
| 5   | `lesson-spelling-roseo-versus-rosseo`           | '-로서'와 '-로써': 자격과 수단                 | `A1` |
| 6   | `lesson-spelling-ieyo-yeyo-io-yo`               | '이에요·예요'와 '-이오·요'의 결합              | `A4` |

### 유닛 3. 소리와 표기가 어긋나는 자리

통과: 조건을 진술하고 예외를 구분한다 · 레슨 6개

| #   | 레슨 ID                                             | 제목                                  | 배정 |
| --- | --------------------------------------------------- | ------------------------------------- | ---- |
| 1   | `lesson-spelling-sait-siot-conditions`              | 사이시옷이 붙는 조건과 붙지 않는 조건 | `A5` |
| 2   | `lesson-spelling-initial-sound-rule-exceptions`     | 두음법칙과 그 예외                    | `A1` |
| 3   | `lesson-spelling-yul-ryul-nan-ran`                  | '-율'과 '-률', '-난'과 '-란'          | `C1` |
| 4   | `lesson-spelling-contraction-principles`            | 준말이 만들어지는 원리                | `A4` |
| 5   | `lesson-spelling-double-final-consonant-inflection` | 겹받침과 활용형의 표기                | `A7` |
| 6   | `lesson-spelling-detecting-nonexistent-forms`       | 없는 표기 가려내기                    | `G5` |

### 유닛 4. 문장부호로 의미 조율

통과: 부호가 바꾸는 뜻을 문장 성분으로 설명한다 · 레슨 6개

| #   | 레슨 ID                                          | 제목                             | 배정 |
| --- | ------------------------------------------------ | -------------------------------- | ---- |
| 1   | `lesson-spelling-comma-splits-sentence`          | 쉼표 하나로 갈라지는 문장        | `A6` |
| 2   | `lesson-spelling-middle-dot-and-colon`           | 가운뎃점과 쌍점, 열거의 층위     | `E3` |
| 3   | `lesson-spelling-quotation-marks-cite-emphasis`  | 따옴표의 인용과 강조             | `G4` |
| 4   | `lesson-spelling-ellipsis-dash-tilde`            | 줄임표·줄표·붙임표·물결표의 자리 | `A1` |
| 5   | `lesson-spelling-parenthesis-types`              | 괄호의 종류와 보충 설명의 층위   | `B4` |
| 6   | `lesson-spelling-punctuation-resolves-ambiguity` | 문장부호로 중의성 해소하기       | `I4` |

### 유닛 5. 표준어와 허용형

통과: 규범·허용·취향을 세 층으로 가른다 · 레슨 5개

| #   | 레슨 ID                                              | 제목                           | 배정 |
| --- | ---------------------------------------------------- | ------------------------------ | ---- |
| 1   | `lesson-spelling-standard-language-and-plural-forms` | 표준어 사정 원칙과 복수 표준어 | `A2` |
| 2   | `lesson-spelling-dialect-becoming-standard`          | 방언이 표준어가 되는 경우      | `A1` |
| 3   | `lesson-spelling-added-standard-and-convention`      | 추가 사정된 표준어와 관용 표기 | `A8` |
| 4   | `lesson-spelling-norm-versus-style-preference`       | 규범과 문체 취향을 구별하기    | `B5` |
| 5   | `lesson-spelling-unifying-allowed-forms`             | 허용형을 문서 안에서 통일하기  | `C4` |

### 유닛 6. 외래어·숫자·단위 표기

통과: 원칙과 관용을 함께 적용한다 · 레슨 5개

| #   | 레슨 ID                                          | 제목                              | 배정 |
| --- | ------------------------------------------------ | --------------------------------- | ---- |
| 1   | `lesson-spelling-loanword-five-principles`       | 외래어 표기의 다섯 가지 기본 원칙 | `A1` |
| 2   | `lesson-spelling-frequent-loanword-errors`       | 자주 틀리는 외래어 표기           | `A4` |
| 3   | `lesson-spelling-person-place-name-convention`   | 인명·지명 표기와 관용             | `A8` |
| 4   | `lesson-spelling-number-unit-period-consistency` | 숫자·단위·기간의 표기 일관성      | `C4` |
| 5   | `lesson-spelling-roman-hangul-mixing`            | 로마자와 한글이 섞일 때           | `A2` |

### 유닛 7. 표기 판별 종합

통과: 검사기가 놓치는 오류를 스스로 잡는다 · 레슨 6개

| #   | 레슨 ID                                          | 제목                                      | 배정 |
| --- | ------------------------------------------------ | ----------------------------------------- | ---- |
| 1   | `lesson-spelling-what-checkers-miss`             | 검사기가 잡는 오류와 놓치는 오류          | `A7` |
| 2   | `lesson-spelling-document-wide-consistency`      | 문서 전체의 표기 일관성 점검              | `C4` |
| 3   | `lesson-spelling-public-language-versus-general` | 공공언어 표기 기준과 일반 글의 차이       | `A2` |
| 4   | `lesson-spelling-four-judgment-criteria`         | 규범·용례·장르·독자, 네 기준으로 판단하기 | `I3` |
| 5   | `lesson-spelling-errors-that-change-meaning`     | 표기 오류가 뜻을 바꾼 사례                | `I4` |
| 6   | `lesson-spelling-six-error-categories`           | 표기 오류 여섯 갈래로 분류하기            | `I1` |

## 코스 4. 문단과 글의 설계

`course-paragraph-text-design` · 독자와 쓰기 과정 · 유닛 5개

### 유닛 1. 문단의 세 요건

통과: 통일성·충분성·긴밀성 중 무엇이 깨졌는지 말한다 · 레슨 6개

| #   | 레슨 ID                                          | 제목                               | 배정 |
| --- | ------------------------------------------------ | ---------------------------------- | ---- |
| 1   | `lesson-paragraph-bundle-is-not-paragraph`       | 문장 묶음과 문단은 다르다          | `D1` |
| 2   | `lesson-paragraph-finding-topic-sentence`        | 소주제문을 찾아내는 눈             | `G2` |
| 3   | `lesson-paragraph-topic-sentence-placement`      | 두괄식·미괄식·양괄식의 효과 차이   | `I4` |
| 4   | `lesson-paragraph-unity-off-topic-sentence`      | 통일성: 화제에서 벗어난 문장       | `D2` |
| 5   | `lesson-paragraph-sufficiency-missing-substance` | 충분성: 주장만 있고 살이 없는 문단 | `D4` |
| 6   | `lesson-paragraph-cohesion-interlocking`         | 긴밀성: 문장이 서로 맞물리는 방식  | `D6` |

### 유닛 2. 뒷받침의 종류와 순서

통과: 빠진 뒷받침의 종류를 지목한다 · 레슨 6개

| #   | 레슨 ID                                              | 제목                        | 배정 |
| --- | ---------------------------------------------------- | --------------------------- | ---- |
| 1   | `lesson-paragraph-support-by-grounds`                | 근거로 뒷받침한 문장        | `E7` |
| 2   | `lesson-paragraph-support-by-example`                | 예시로 뒷받침한 문장        | `E3` |
| 3   | `lesson-paragraph-support-by-explanation-comparison` | 설명과 비교로 뒷받침한 문장 | `E1` |
| 4   | `lesson-paragraph-support-by-citation`               | 인용으로 뒷받침할 때의 조건 | `G4` |
| 5   | `lesson-paragraph-support-arrangement-order`         | 뒷받침 문장의 배열 순서     | `D3` |
| 6   | `lesson-paragraph-fake-support-repetition`           | 뒷받침을 흉내 낸 반복 문장  | `D4` |

### 유닛 3. 문단과 문단 잇기

통과: 다리가 없는 지점을 찾아 이유를 댄다 · 레슨 6개

| #   | 레슨 ID                                     | 제목                                | 배정 |
| --- | ------------------------------------------- | ----------------------------------- | ---- |
| 1   | `lesson-paragraph-bridge-expressions`       | 문단 사이에 다리를 놓는 표현        | `D8` |
| 2   | `lesson-paragraph-so-what-test`             | '그래서 뭐?' 테스트로 다리 점검하기 | `D6` |
| 3   | `lesson-paragraph-known-to-unknown`         | 기지 정보에서 미지 정보로           | `E1` |
| 4   | `lesson-paragraph-reorder-signal`           | 문단 순서를 바꿔야 하는 신호        | `D3` |
| 5   | `lesson-paragraph-splitting-long-paragraph` | 긴 문단을 쪼개는 기준               | `B7` |
| 6   | `lesson-paragraph-one-claim-per-paragraph`  | 계단식 문단: 한 문단 한 주장        | `B3` |

### 유닛 4. 개요로 뼈대 세우기

통과: 완성 글에서 개요를 복원한다 · 레슨 6개

| #   | 레슨 ID                                            | 제목                             | 배정 |
| --- | -------------------------------------------------- | -------------------------------- | ---- |
| 1   | `lesson-paragraph-traces-without-outline`          | 개요 없이 쓴 글에 남는 흔적      | `B5` |
| 2   | `lesson-paragraph-keyword-versus-sentence-outline` | 키워드 개요와 문장 개요          | `H3` |
| 3   | `lesson-paragraph-time-logic-comparison-order`     | 시간순·논리순·비교순의 선택 기준 | `D3` |
| 4   | `lesson-paragraph-reader-question-order`           | 독자의 질문 순서로 정보 배치하기 | `I3` |
| 5   | `lesson-paragraph-reverse-outline`                 | 역개요로 완성 글의 구조 복원하기 | `D5` |
| 6   | `lesson-paragraph-outline-balance-check`           | 개요 항목 사이의 균형 점검       | `B7` |

### 유닛 5. 서론·결론과 전체 구조

통과: 서론의 약속과 결론의 회수를 대조한다 · 레슨 6개

| #   | 레슨 ID                                        | 제목                                  | 배정 |
| --- | ---------------------------------------------- | ------------------------------------- | ---- |
| 1   | `lesson-paragraph-four-jobs-of-introduction`   | 서론이 하는 네 가지 일                | `I3` |
| 2   | `lesson-paragraph-first-sentence-pulls-next`   | 첫 문장이 다음 문장을 끌어오는 방식   | `D6` |
| 3   | `lesson-paragraph-conclusion-three-functions`  | 결론의 요약·의의·전망 구별하기        | `G3` |
| 4   | `lesson-paragraph-promise-versus-payoff`       | 서론의 약속과 결론의 회수가 어긋날 때 | `D7` |
| 5   | `lesson-paragraph-title-subheading-preview`    | 제목과 소제목이 내용을 예고하는 방식  | `G2` |
| 6   | `lesson-paragraph-whole-structure-on-one-page` | 글 전체 구조를 한 장으로 그리기       | `D5` |

## 코스 5. 논리적 연결과 응집성

`course-logical-connection-cohesion` · 독자와 쓰기 과정 · 유닛 4개

### 유닛 1. 접속 표현

통과: 접속어를 넣을 자리와 뺄 자리를 가른다 · 레슨 6개

| #   | 레슨 ID                                             | 제목                             | 배정 |
| --- | --------------------------------------------------- | -------------------------------- | ---- |
| 1   | `lesson-cohesion-with-and-without-connective`       | 접속어가 있을 때와 없을 때       | `D8` |
| 2   | `lesson-cohesion-additive-versus-adversative`       | 순접과 역접의 경계               | `I4` |
| 3   | `lesson-cohesion-causal-connective-strength`        | 인과를 나타내는 접속 표현의 강도 | `E4` |
| 4   | `lesson-cohesion-coordination-addition-restatement` | 대등·첨가·환언·예시의 표시       | `C1` |
| 5   | `lesson-cohesion-logic-without-connective`          | 접속어 없이 논리가 이어지는 문장 | `B4` |
| 6   | `lesson-cohesion-connective-overuse`                | 접속어 남용이 논리를 가리는 자리 | `B5` |

### 유닛 2. 지시와 대용

통과: 지시 대상을 하나로 확정한다 · 레슨 5개

| #   | 레슨 ID                                              | 제목                             | 배정 |
| --- | ---------------------------------------------------- | -------------------------------- | ---- |
| 1   | `lesson-cohesion-fixing-referent`                    | 지시어가 가리키는 대상 확정하기  | `C2` |
| 2   | `lesson-cohesion-i-geu-jeo-distance`                 | '이·그·저'의 거리와 쓰임         | `C1` |
| 3   | `lesson-cohesion-referring-to-whole-sentence`        | 앞 문장 전체를 가리키는 표현     | `G2` |
| 4   | `lesson-cohesion-pronoun-overload`                   | 대명사가 늘어날 때 생기는 혼란   | `B5` |
| 5   | `lesson-cohesion-avoiding-repetition-shifts-concept` | 반복을 피하려다 개념이 흔들릴 때 | `C4` |

### 유닛 3. 문장 사이의 논리 관계

통과: 두 문장 사이에 생략된 연결을 복원한다 · 레슨 6개

| #   | 레슨 ID                                          | 제목                           | 배정 |
| --- | ------------------------------------------------ | ------------------------------ | ---- |
| 1   | `lesson-cohesion-omitted-premise`                | 두 문장 사이에 생략된 전제     | `E6` |
| 2   | `lesson-cohesion-list-versus-cause`              | 나열인가 인과인가: 관계 오표시 | `E8` |
| 3   | `lesson-cohesion-information-order-creates-flow` | 정보 배열이 흐름을 만드는 방식 | `E1` |
| 4   | `lesson-cohesion-subject-chain-paragraph`        | 주어 연쇄로 이어지는 문단      | `B6` |
| 5   | `lesson-cohesion-abrupt-topic-shift`             | 화제 전환이 갑작스러운 지점    | `D6` |
| 6   | `lesson-cohesion-mapping-logic-relations`        | 논리 관계를 도식으로 옮기기    | `D5` |

### 유닛 4. 흐름 판별 종합

통과: 응집성 문제와 일관성 문제를 구별한다 · 레슨 5개

| #   | 레슨 ID                                        | 제목                                 | 배정 |
| --- | ---------------------------------------------- | ------------------------------------ | ---- |
| 1   | `lesson-cohesion-reorder-to-check-flow`        | 문장 순서를 바꿔 흐름 확인하기       | `D3` |
| 2   | `lesson-cohesion-replacing-awkward-connective` | 어색한 연결어를 다른 말로 바꾸기     | `C3` |
| 3   | `lesson-cohesion-versus-consistency`           | 응집성과 일관성은 다른 문제다        | `D1` |
| 4   | `lesson-cohesion-cleaning-overlapping-markers` | 지시어와 접속어가 겹친 문단 정리하기 | `I5` |
| 5   | `lesson-cohesion-four-error-categories`        | 연결 오류 네 갈래로 분류하기         | `I1` |

## 코스 6. 설명하는 힘: 정의·분류·비교·인과

`course-explanatory-power` · 구성과 표현 · 유닛 5개

### 유닛 1. 설명의 조건

통과: 독자가 이미 아는 것과 모르는 것을 나눈다 · 레슨 5개

| #   | 레슨 ID                                       | 제목                                | 배정 |
| --- | --------------------------------------------- | ----------------------------------- | ---- |
| 1   | `lesson-explain-four-failure-reasons`         | 설명이 실패하는 네 가지 이유        | `E8` |
| 2   | `lesson-explain-versus-describe-versus-argue` | 설명·묘사·논증의 목적 차이          | `F4` |
| 3   | `lesson-explain-estimating-reader-knowledge`  | 독자의 기지 정보를 가늠하기         | `E1` |
| 4   | `lesson-explain-curse-of-knowledge`           | 지식의 저주: 아는 사람이 못 보는 것 | `D6` |
| 5   | `lesson-explain-descending-abstraction-order` | 추상도의 층위를 내려가는 순서       | `C5` |

### 유닛 2. 정의와 분류

통과: 정의의 결함 유형을 이름으로 지목한다 · 레슨 6개

| #   | 레슨 ID                                         | 제목                           | 배정 |
| --- | ----------------------------------------------- | ------------------------------ | ---- |
| 1   | `lesson-explain-genus-and-differentia`          | 좋은 정의의 조건: 유와 종차    | `C1` |
| 2   | `lesson-explain-circular-definition`            | 순환에 빠진 정의               | `G5` |
| 3   | `lesson-explain-too-broad-or-narrow-definition` | 범위가 넘치거나 모자란 정의    | `E2` |
| 4   | `lesson-explain-operational-definition`         | 조작적 정의가 필요한 자리      | `C5` |
| 5   | `lesson-explain-classification-consistency`     | 분류 기준의 일관성과 층위      | `E3` |
| 6   | `lesson-explain-definition-with-classification` | 정의와 분류를 결합한 설명 읽기 | `D5` |

### 유닛 3. 비교·대조와 예시

통과: 비교 층위와 예시 대표성을 검사한다 · 레슨 6개

| #   | 레슨 ID                                                | 제목                           | 배정 |
| --- | ------------------------------------------------------ | ------------------------------ | ---- |
| 1   | `lesson-explain-same-level-comparison`                 | 비교 대상이 같은 층위인가      | `E3` |
| 2   | `lesson-explain-unstated-comparison-criterion`         | 비교 기준을 밝히지 않은 대조   | `E6` |
| 3   | `lesson-explain-unfair-comparison-target`              | 불공정한 비교 대상 선정        | `E7` |
| 4   | `lesson-explain-representative-versus-extreme-example` | 대표성 있는 예시와 극단적 예시 | `G5` |
| 5   | `lesson-explain-example-outside-concept`               | 예시가 개념을 벗어난 경우      | `D2` |
| 6   | `lesson-explain-comparison-with-example`               | 비교와 예시를 결합한 설명 읽기 | `I4` |

### 유닛 4. 인과와 유추

통과: 인과 주장의 강도를 근거에 맞춘다 · 레슨 6개

| #   | 레슨 ID                                        | 제목                           | 배정 |
| --- | ---------------------------------------------- | ------------------------------ | ---- |
| 1   | `lesson-explain-multiple-causes`               | 원인이 여럿인 현상의 설명      | `I2` |
| 2   | `lesson-explain-correlation-swapped-for-cause` | 상관을 인과로 바꿔치기한 설명  | `E4` |
| 3   | `lesson-explain-necessary-versus-sufficient`   | 필요조건과 충분조건의 혼동     | `H5` |
| 4   | `lesson-explain-analogy-power-and-limit`       | 유추의 설명력과 그 한계        | `F3` |
| 5   | `lesson-explain-metaphor-causing-misreading`   | 비유가 오해를 부르는 지점      | `E6` |
| 6   | `lesson-explain-causation-with-analogy`        | 인과와 유추를 결합한 설명 읽기 | `I5` |

### 유닛 5. 설명문 판별 종합

통과: 실패 원인을 갈래로 분류한다 · 레슨 5개

| #   | 레슨 ID                                       | 제목                                | 배정 |
| --- | --------------------------------------------- | ----------------------------------- | ---- |
| 1   | `lesson-explain-key-term-shifts-meaning`      | 핵심 용어가 도중에 뜻이 바뀔 때     | `C2` |
| 2   | `lesson-explain-numbers-without-context`      | 숫자와 데이터에 맥락이 없을 때      | `D4` |
| 3   | `lesson-explain-jargon-to-plain-two-versions` | 전문 용어를 일상어로 바꾼 두 판본   | `I4` |
| 4   | `lesson-explain-five-methods-mixed`           | 다섯 가지 설명 방법이 섞인 글 분석  | `I6` |
| 5   | `lesson-explain-five-failure-categories`      | 설명 실패 원인 다섯 갈래로 분류하기 | `I1` |

## 코스 7. 논증의 기술

`course-argumentation-craft` · 사고와 발상 · 유닛 5개

### 유닛 1. 주장의 자격

통과: 반박 가능한 명제와 그렇지 않은 진술을 가른다 · 레슨 6개

| #   | 레슨 ID                                             | 제목                               | 배정 |
| --- | --------------------------------------------------- | ---------------------------------- | ---- |
| 1   | `lesson-argument-taste-versus-arguable-claim`       | 취향의 표현과 논증할 수 있는 주장  | `E5` |
| 2   | `lesson-argument-four-layers-of-statement`          | 사실·해석·가치판단·주장 네 층위    | `G3` |
| 3   | `lesson-argument-refutability-condition`            | 반박 가능성이 주장의 조건이다      | `H5` |
| 4   | `lesson-argument-overreaching-absolutes`            | '모두·항상·절대': 과도한 단정      | `B5` |
| 5   | `lesson-argument-non-contestable-claim`             | 논쟁적이지 않은 주장의 문제        | `H3` |
| 6   | `lesson-argument-compressing-claim-to-one-sentence` | 늘어진 주장을 한 문장으로 압축하기 | `G2` |

### 유닛 2. 주장·이유·근거·보증

통과: 숨은 보증을 문장으로 복원한다 · 레슨 7개

| #   | 레슨 ID                                        | 제목                                | 배정 |
| --- | ---------------------------------------------- | ----------------------------------- | ---- |
| 1   | `lesson-argument-why-between-claim-and-reason` | 주장과 이유 사이의 '왜?'            | `D6` |
| 2   | `lesson-argument-reason-is-not-ground`         | 이유와 근거는 같지 않다             | `G3` |
| 3   | `lesson-argument-four-kinds-of-ground`         | 근거의 네 종류: 사실·통계·견해·사례 | `D4` |
| 4   | `lesson-argument-surfacing-hidden-warrant`     | 숨은 전제(보증) 드러내기            | `E6` |
| 5   | `lesson-argument-collapsed-warrant`            | 보증이 무너지면 근거도 무너진다     | `E7` |
| 6   | `lesson-argument-qualifier-controls-strength`  | 한정어로 주장의 강도 조절하기       | `E4` |
| 7   | `lesson-argument-mapping-structure`            | 논증 구조를 도식으로 옮기기         | `D5` |

### 유닛 3. 근거의 질

통과: 근거를 탈락시킬 기준을 댄다 · 레슨 6개

| #   | 레슨 ID                                              | 제목                             | 배정 |
| --- | ---------------------------------------------------- | -------------------------------- | ---- |
| 1   | `lesson-argument-source-credibility-criteria`        | 출처의 신뢰도를 따지는 기준      | `G6` |
| 2   | `lesson-argument-sample-size-and-representativeness` | 표본의 수와 대표성               | `E7` |
| 3   | `lesson-argument-denominator-and-period`             | 통계 인용에서 분모와 기간        | `G5` |
| 4   | `lesson-argument-relevant-expert-authority`          | 전문가 견해의 적합한 권위        | `I3` |
| 5   | `lesson-argument-unrepresentative-case`              | 사례가 주장을 대표하지 못할 때   | `E3` |
| 6   | `lesson-argument-loose-ground-claim-link`            | 근거와 주장의 연결이 헐거운 지점 | `D6` |

### 유닛 4. 논리적 오류

통과: 오류를 이름으로 지목한다 · 레슨 7개

| #   | 레슨 ID                                       | 제목                           | 배정 |
| --- | --------------------------------------------- | ------------------------------ | ---- |
| 1   | `lesson-argument-hasty-generalization`        | 성급한 일반화                  | `E3` |
| 2   | `lesson-argument-false-dilemma`               | 흑백 논리                      | `E6` |
| 3   | `lesson-argument-false-cause`                 | 거짓 원인                      | `E4` |
| 4   | `lesson-argument-circular-reasoning`          | 순환 논증                      | `I4` |
| 5   | `lesson-argument-ad-hominem-and-straw-man`    | 인신공격과 허수아비 공격       | `E8` |
| 6   | `lesson-argument-appeal-to-emotion-authority` | 감정과 권위에 기댄 호소        | `I1` |
| 7   | `lesson-argument-mixed-fallacy-paragraph`     | 오류가 섞여 있는 문단 가려내기 | `I5` |

### 유닛 5. 반론과 논증 종합

통과: 반론 처리가 논증을 강화한 지점을 설명한다 · 레슨 6개

| #   | 레슨 ID                                        | 제목                                 | 배정 |
| --- | ---------------------------------------------- | ------------------------------------ | ---- |
| 1   | `lesson-argument-building-expected-objection`  | 예상 반론을 세우는 방법              | `H4` |
| 2   | `lesson-argument-conceding-and-limiting-scope` | 반론을 인정하고 범위를 제한하는 문장 | `H5` |
| 3   | `lesson-argument-concession-strengthens`       | 양보가 논증을 강화하는 조건          | `E9` |
| 4   | `lesson-argument-balanced-versus-biased-tone`  | 균형 잡힌 논조와 편향된 논조         | `C4` |
| 5   | `lesson-argument-choosing-added-ground`        | 허술한 논증에 보탤 근거 고르기       | `D4` |
| 6   | `lesson-argument-six-review-questions`         | 논증 점검 여섯 질문                  | `I3` |

## 코스 8. 관찰과 묘사

`course-observation-description` · 구성과 표현 · 유닛 4개

### 유닛 1. 설명과 묘사의 갈림

통과: 목적에 따라 문장이 달라지는 이유를 말한다 · 레슨 6개

| #   | 레슨 ID                                          | 제목                          | 배정 |
| --- | ------------------------------------------------ | ----------------------------- | ---- |
| 1   | `lesson-describe-different-purpose-from-explain` | 설명과 묘사는 목적이 다르다   | `I4` |
| 2   | `lesson-describe-which-sense-was-chosen`         | 오감 가운데 무엇을 골랐는가   | `F1` |
| 3   | `lesson-describe-touch-smell-taste`              | 촉감·냄새·맛이 들어간 문장    | `F2` |
| 4   | `lesson-describe-dominant-impression-first`      | 지배적 인상을 먼저 잡은 묘사  | `D2` |
| 5   | `lesson-describe-observation-versus-impression`  | 관찰과 인상 평가를 가르기     | `G3` |
| 6   | `lesson-describe-vague-to-concrete-stages`       | 막연한 표현이 구체화되는 단계 | `C5` |

### 유닛 2. 구체성의 층위

통과: 무엇으로 구체화했는지 수단을 지목한다 · 레슨 6개

| #   | 레슨 ID                                            | 제목                           | 배정 |
| --- | -------------------------------------------------- | ------------------------------ | ---- |
| 1   | `lesson-describe-precise-versus-vague-adjective`   | 정확한 형용사와 막연한 형용사  | `C1` |
| 2   | `lesson-describe-what-adverbs-cannot-do`           | 부사가 하는 일과 못 하는 일    | `B4` |
| 3   | `lesson-describe-descending-to-number-color-shape` | 수치·색·형태로 내려가기        | `C5` |
| 4   | `lesson-describe-action-verbs-build-scene`         | 동작 동사가 장면을 만드는 방식 | `F2` |
| 5   | `lesson-describe-gaze-movement-order`              | 시선의 이동 순서로 배치한 묘사 | `D3` |
| 6   | `lesson-describe-detail-excess-hides-message`      | 디테일 과잉이 메시지를 가릴 때 | `G1` |

### 유닛 3. 비유의 원리

통과: 비유의 근거를 말하고 진부·과잉을 가른다 · 레슨 6개

| #   | 레슨 ID                                        | 제목                         | 배정 |
| --- | ---------------------------------------------- | ---------------------------- | ---- |
| 1   | `lesson-describe-simile-versus-metaphor`       | 직유와 은유의 형식 차이      | `C1` |
| 2   | `lesson-describe-ground-of-comparison`         | 비유의 근거: 무엇이 닮았는가 | `F3` |
| 3   | `lesson-describe-awkward-personification`      | 의인법이 어색해지는 조건     | `C3` |
| 4   | `lesson-describe-hyperbole-and-understatement` | 과장과 축소의 효과와 한계    | `B5` |
| 5   | `lesson-describe-detecting-cliche-figures`     | 진부한 비유를 가려내는 기준  | `G1` |
| 6   | `lesson-describe-figure-distorts-meaning`      | 비유가 뜻을 왜곡하는 지점    | `E3` |

### 유닛 4. 보여주기 판별 종합

통과: 말한 문장과 보여준 문장을 가르고 균형을 판단한다 · 레슨 6개

| #   | 레슨 ID                                          | 제목                             | 배정 |
| --- | ------------------------------------------------ | -------------------------------- | ---- |
| 1   | `lesson-describe-telling-versus-showing-emotion` | 감정을 말한 문장과 보여준 문장   | `F4` |
| 2   | `lesson-describe-action-reveals-psychology`      | 행동으로 심리를 드러낸 문장      | `H2` |
| 3   | `lesson-describe-abstract-adjective-to-scene`    | 관념적 형용사를 장면으로 바꾼 예 | `F5` |
| 4   | `lesson-describe-showing-summarizing-balance`    | 보여주기와 요약하기의 균형       | `B7` |
| 5   | `lesson-describe-dialogue-carries-information`   | 대화문이 정보를 전달하는 방식    | `E1` |
| 6   | `lesson-describe-two-versions-trimmed-excess`    | 과잉 표현을 덜어낸 두 판본       | `I4` |

## 코스 9. 요약과 비판적 읽기

`course-summary-critical-reading` · 정보와 AI 문해 · 유닛 5개

### 유닛 1. 요약의 조건

통과: 버릴 정보의 기준을 진술한다 · 레슨 6개

| #   | 레슨 ID                                             | 제목                             | 배정 |
| --- | --------------------------------------------------- | -------------------------------- | ---- |
| 1   | `lesson-summary-versus-excerpt`                     | 요약과 발췌는 다르다             | `I4` |
| 2   | `lesson-summary-core-versus-elaboration`            | 핵심 문장과 부연 문장 가르기     | `B4` |
| 3   | `lesson-summary-criteria-for-deletable-information` | 삭제해도 되는 정보의 기준        | `G1` |
| 4   | `lesson-summary-filtering-repetition-and-example`   | 반복과 예시를 걸러내기           | `D2` |
| 5   | `lesson-summary-when-summary-changes-thesis`        | 요약이 원문의 논지를 바꾸는 순간 | `G2` |
| 6   | `lesson-summary-what-length-keeps`                  | 길이에 따라 남기는 정보          | `I2` |

### 유닛 2. 압축의 기술

통과: 판단 구조가 보존된 요약을 골라낸다 · 레슨 6개

| #   | 레슨 ID                                         | 제목                          | 배정 |
| --- | ----------------------------------------------- | ----------------------------- | ---- |
| 1   | `lesson-summary-bundling-sentences`             | 여러 문장을 한 문장으로 묶기  | `B7` |
| 2   | `lesson-summary-outline-versus-narrative-form`  | 개조식과 서술식의 선택        | `I4` |
| 3   | `lesson-summary-keyword-centered-restructuring` | 핵심어 중심으로 재구성한 요약 | `D5` |
| 4   | `lesson-summary-preserving-judgment-structure`  | 판단 구조를 보존하는 압축     | `G2` |
| 5   | `lesson-summary-one-line-and-three-sentence`    | 한 줄 요약과 세 문장 요약     | `I2` |
| 6   | `lesson-summary-checking-what-was-dropped`      | 요약문에서 빠진 내용 확인하기 | `D4` |

### 유닛 3. 비판적으로 읽기

통과: 숨은 전제와 근거의 결함을 지목한다 · 레슨 7개

| #   | 레슨 ID                                          | 제목                          | 배정 |
| --- | ------------------------------------------------ | ----------------------------- | ---- |
| 1   | `lesson-summary-fact-versus-opinion-statement`   | 사실 진술과 의견 진술 가르기  | `G3` |
| 2   | `lesson-summary-finding-central-claim`           | 글의 중심 주장 찾아내기       | `E5` |
| 3   | `lesson-summary-surfacing-author-premise`        | 저자의 숨은 전제 드러내기     | `E6` |
| 4   | `lesson-summary-ground-validity-and-sufficiency` | 근거의 타당성과 충분성        | `E7` |
| 5   | `lesson-summary-distorted-statistics`            | 왜곡되어 인용된 통계          | `E3` |
| 6   | `lesson-summary-context-time-and-position`       | 글의 맥락: 시점과 필자의 위치 | `I4` |
| 7   | `lesson-summary-rereading-from-opposing-view`    | 반대 입장에서 다시 읽기       | `E9` |

### 유닛 4. 출처와 인용

통과: 인용·바꿔 쓰기·표절의 경계를 판정한다 · 레슨 5개

| #   | 레슨 ID                                            | 제목                          | 배정 |
| --- | -------------------------------------------------- | ----------------------------- | ---- |
| 1   | `lesson-summary-direct-versus-indirect-quotation`  | 직접 인용과 간접 인용의 경계  | `I4` |
| 2   | `lesson-summary-paraphrase-versus-plagiarism`      | 바꿔 쓰기와 표절의 갈림       | `G4` |
| 3   | `lesson-summary-conditions-for-secondary-citation` | 재인용이 허용되는 조건        | `A1` |
| 4   | `lesson-summary-what-a-citation-contains`          | 출처 표기에 들어가는 정보     | `I3` |
| 5   | `lesson-summary-ranking-source-reliability`        | 자료의 신뢰도 우선순위 매기기 | `G6` |

### 유닛 5. AI 시대 정보 판별

통과: 그럴듯함과 검증 가능함을 가른다 · 레슨 6개

| #   | 레슨 ID                                          | 제목                               | 배정 |
| --- | ------------------------------------------------ | ---------------------------------- | ---- |
| 1   | `lesson-summary-clear-versus-unclear-provenance` | 출처가 분명한 정보와 불분명한 정보 | `E7` |
| 2   | `lesson-summary-plausible-versus-verifiable`     | 그럴듯함과 검증 가능함             | `G5` |
| 3   | `lesson-summary-repeated-form-signals`           | 생성된 문장에서 반복되는 형식 신호 | `B5` |
| 4   | `lesson-summary-detecting-nonexistent-grounds`   | 존재하지 않는 근거 가려내기        | `A7` |
| 5   | `lesson-summary-cross-checking-procedure`        | 여러 출처를 교차 확인하는 절차     | `I3` |
| 6   | `lesson-summary-five-judgment-categories`        | 정보 판별 다섯 갈래로 분류하기     | `I1` |

## 코스 10. 발상과 주제 잡기

`course-idea-topic-framing` · 사고와 발상 · 유닛 4개

### 유닛 1. 쓸 것이 없다는 착각

통과: 생성 단계와 평가 단계를 구분한다 · 레슨 6개

| #   | 레슨 ID                                            | 제목                                  | 배정 |
| --- | -------------------------------------------------- | ------------------------------------- | ---- |
| 1   | `lesson-idea-procedure-not-talent`                 | 착수를 막는 것은 재능이 아니라 절차다 | `G5` |
| 2   | `lesson-idea-separating-generation-and-evaluation` | 생성과 평가를 분리하기                | `H1` |
| 3   | `lesson-idea-keyword-matrix`                       | 키워드 매트릭스로 재료 벌리기         | `D4` |
| 4   | `lesson-idea-layering-to-expand-thought`           | 계층을 나눠 생각 늘리기               | `C5` |
| 5   | `lesson-idea-traces-of-spoken-draft`               | 말로 먼저 풀어낸 초안의 흔적          | `C4` |
| 6   | `lesson-idea-criteria-for-discarding-material`     | 재료가 많아졌을 때 버리는 기준        | `G1` |

### 유닛 2. 관찰에서 해석으로

통과: 사실과 해석을 문장 단위로 가른다 · 레슨 7개

| #   | 레슨 ID                                           | 제목                               | 배정 |
| --- | ------------------------------------------------- | ---------------------------------- | ---- |
| 1   | `lesson-idea-observation-versus-interpretation`   | 관찰 진술과 해석 진술 가르기       | `G3` |
| 2   | `lesson-idea-observe-compare-reason-judge`        | 관찰→비교→이유→판단의 순서         | `H2` |
| 3   | `lesson-idea-changing-comparison-changes-reading` | 비교 대상을 바꾸면 해석이 달라진다 | `E3` |
| 4   | `lesson-idea-multiple-readings-of-one-fact`       | 하나의 사실에 붙은 여러 해석       | `C2` |
| 5   | `lesson-idea-naming-an-interpretation`            | 해석에 이름 붙이기: 개념화         | `E2` |
| 6   | `lesson-idea-interpretation-with-falsifier`       | 반증 조건을 붙인 해석              | `H5` |
| 7   | `lesson-idea-hasty-versus-suspended-conclusion`   | 성급한 결론과 유보된 결론          | `E4` |

### 유닛 3. 주제를 좁히고 벼리기

통과: 화제를 논쟁 가능한 주제문으로 좁힌다 · 레슨 7개

| #   | 레슨 ID                                             | 제목                                 | 배정 |
| --- | --------------------------------------------------- | ------------------------------------ | ---- |
| 1   | `lesson-idea-topic-versus-thesis`                   | 화제와 주제는 다르다                 | `E5` |
| 2   | `lesson-idea-two-requirements-of-good-topic`        | 좋은 주제의 두 요건: 구체성과 논쟁성 | `D1` |
| 3   | `lesson-idea-narrowing-by-time-space-target-method` | 시간·공간·대상·방법으로 좁히기       | `F2` |
| 4   | `lesson-idea-connecting-narrow-topic-to-context`    | 좁힌 주제를 넓은 맥락에 잇기         | `D6` |
| 5   | `lesson-idea-three-topic-types`                     | 문제 해결형·쟁점형·설명형 주제       | `F1` |
| 6   | `lesson-idea-stating-thesis-in-one-sentence`        | 주제문 한 문장으로 세우기            | `H3` |
| 7   | `lesson-idea-signals-of-drifting-topic`             | 주제가 흔들린 글의 신호              | `D2` |

### 유닛 4. 발상 판별 종합

통과: 답할 수 있는 질문과 공허한 질문을 가른다 · 레슨 6개

| #   | 레슨 ID                                              | 제목                                      | 배정 |
| --- | ---------------------------------------------------- | ----------------------------------------- | ---- |
| 1   | `lesson-idea-answerable-versus-empty-question`       | 답할 수 있는 질문과 공허한 질문           | `H4` |
| 2   | `lesson-idea-question-that-unsettles-convention`     | 통념을 흔드는 질문                        | `E6` |
| 3   | `lesson-idea-introduction-showing-problem-awareness` | 문제의식이 드러난 서론과 그렇지 않은 서론 | `I4` |
| 4   | `lesson-idea-three-topics-from-one-subject`          | 같은 소재에서 갈라진 세 가지 주제         | `C1` |
| 5   | `lesson-idea-matching-topic-and-material`            | 주제와 자료의 아귀 맞추기                 | `E7` |
| 6   | `lesson-idea-five-review-questions`                  | 발상 단계 점검 다섯 질문                  | `I3` |

---

## 신설 템플릿

신설한 템플릿은 없다. 배정과 교차 검토에서 판별 지점을 확인할 컨셉이 60개 안에 아예 없는 레슨을 찾지 못했다.

신설 문턱은 컨셉의 부재다. 유닛 내 중복이나 컨셉군 편중 때문에 최적 템플릿을 쓸 수 없는 자리에서는 차선을 골랐고, 그 자리를 신설 사유로 세지 않았다.

아래 다섯 자리는 컨셉이 다른 영역을 가리키는데도 확인 방식이 옮겨 와서 통과했다. 문턱에 가장 가까웠던 자리다. 스텝을 집필할 때 이 자리의 예문이 레슨 주제에서 벗어나지 않는지 다시 본다.

| 레슨 ID                                              | 배정 | 60개에 없는 컨셉              |
| ---------------------------------------------------- | ---- | ----------------------------- |
| `lesson-sentence-itda-replacing-predicate`           | `B6` | 뭉개진 서술어를 되살린다      |
| `lesson-word-synonym-intensity`                      | `C5` | 정도의 세기를 계단으로 세운다 |
| `lesson-cohesion-fixing-referent`                    | `C2` | 지시 대상을 하나로 확정한다   |
| `lesson-cohesion-avoiding-repetition-shifts-concept` | `C4` | 개념어의 동일성을 유지한다    |
| `lesson-idea-three-topic-types`                      | `F1` | 주제 유형을 갈래에서 골라낸다 |

## 규모

코스 10개, 유닛 52개, 레슨 308개. 템플릿 60개를 배정하므로 템플릿당 평균 5.1개 레슨을 맡는다.

배정 결과 60개가 모두 쓰였다. `I4`가 18개로 가장 많고 `A6`·`C6`·`D7`·`H1`·`I6`이 각각 1개로 가장 적다. `I4`가 몰린 이유는 두 판본 대조가 여러 코스의 종합 유닛에서 통과 기준이기 때문이다.
