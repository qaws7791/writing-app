# 2단계 입력: 레슨 스텝 배치 템플릿 60개

이 문서는 스텝 집필에 쓰는 배치 템플릿 목록이다. 현재 제품 사실의 권위 소스가 아니다. 스텝 유형의 계약은 [스텝 계약](../../../packages/shared/contracts/src/content/steps/index.ts)이 소유한다.

템플릿은 학습 컨셉에서 출발한다. 컨셉이 요구하는 확인 방식이 스텝 조합을 정한다. 유형별 사용량 목표는 두지 않는다. 어떤 컨셉에서 한 유형이 여덟 번 나오고 다른 유형이 한 번도 나오지 않는 것은 그 컨셉에 자연스럽다면 옳다.

템플릿은 스텝 유형의 순서만 고정한다. 예문, 선택지, 해설은 레슨의 판별 지점에서 나오므로 템플릿이 정하지 않는다.

## 스텝 유형 표기

| 표기 | 유형              | 채점 | 계약 |
| ---- | ----------------- | ---- | ---- |
| `Rd` | `reading`         | 확인 | 있음 |
| `Cp` | `compare`         | 확인 | 있음 |
| `MC` | `multiple_choice` | 서버 | 있음 |
| `Sl` | `select`          | 서버 | 있음 |
| `Cg` | `categorize`      | 서버 | 있음 |
| `Mt` | `match`           | 서버 | 있음 |
| `Or` | `order`           | 서버 | 있음 |
| `FB` | `fill_blank`      | 서버 | 있음 |
| `TF` | `true_false`      | 서버 | 있음 |
| `SB` | `sentence_build`  | 서버 | 있음 |
| `EC` | `error_correct`   | 서버 | 있음 |

## 배정 규칙

1. 레슨의 판별 지점과 컨셉이 맞는 템플릿을 고른다. 「자연스러운 자리」를 참고하되 그 코스에만 쓰라는 뜻은 아니다.
2. 한 유닛의 레슨에 같은 템플릿을 두 번 배정하지 않는다.
3. 한 유닛의 레슨을 한 컨셉군으로만 채우지 않는다. 유닛의 통과 기준이 하나라도 레슨마다 확인 방식은 달라야 한다.
4. 컨셉에 없는 유형을 다양성을 위해 끼워 넣지 않는다. 반대로 컨셉에 필요한 유형을 분포를 이유로 빼지 않는다.

## 배치를 읽는 방법

각 자리의 기능은 컨셉에 따라 달라진다. 대체로 다음 경향을 따르지만 규칙이 아니다.

- 첫 `Rd`는 판단 기준을 세운다. 소재를 설명하는 자리가 아니다.
- 중간 `Rd`는 새 사례나 예외를 들여온다.
- `Cp`는 두 판본을 나란히 보여 주기만 한다. 판정은 뒤따르는 채점 스텝이 받는다.
- 연속한 같은 유형은 사례를 바꿔 반복하는 자리다. 같은 문항을 복제하는 자리가 아니다.
- 대조가 컨셉의 축인 템플릿은 `Cp`로 시작할 수 있다.

---

## A 규범과 표기

| ID   | 컨셉                                          | 스텝 | 자연스러운 자리      | 배치                                                          |
| ---- | --------------------------------------------- | ---- | -------------------- | ------------------------------------------------------------- |
| `A1` | 조항을 사례에 적용해 근거를 댄다              | 19   | 코스 3 띄어쓰기      | `Rd Mt TF Mt MC TF Mt Rd TF Mt MC TF Mt Sl MC Mt TF Rd MC`    |
| `A2` | 규범·허용·취향을 세 층으로 가른다             | 18   | 코스 3 표준어        | `Rd MC Cg Rd Cg TF Cg MC Cg Rd TF Cg MC Cg TF Cg Rd MC`       |
| `A3` | 품사를 판정한 뒤 표기를 결정한다              | 19   | 코스 3 동형이의      | `Rd MC Sl Cg MC Sl Cg TF MC Sl Cg Rd MC Sl Cg TF MC Cg MC`    |
| `A4` | 원문 재현으로 표기를 굳힌다                   | 19   | 코스 3 표기 심화     | `Rd FB MC FB TF FB EC FB MC Rd FB TF FB EC FB MC FB Rd FB`    |
| `A5` | 소리와 표기가 어긋나는 조건과 예외를 진술한다 | 20   | 코스 3 사이시옷·두음 | `Rd MC TF Mt Rd FB TF Mt MC FB Cg TF Rd Mt FB MC TF Cg Rd MC` |
| `A6` | 부호가 바꾸는 뜻을 전후로 확인한다            | 18   | 코스 3 문장부호      | `Rd Cp MC Sl Cp MC Sl TF Cp MC Sl Rd Cp MC Sl TF Cg MC`       |
| `A7` | 검사기가 놓치는 오류를 스스로 잡는다          | 19   | 코스 3 종합          | `Rd MC Sl EC Sl EC MC TF Sl EC Rd Sl EC MC TF Sl EC Cg MC`    |
| `A8` | 원칙과 관용을 함께 적용한다                   | 19   | 코스 3 외래어·숫자   | `Rd MC Mt FB Cg MC FB TF Mt Cg Rd FB MC Cg Mt FB TF Cg MC`    |

## B 문장 성분과 구조

| ID   | 컨셉                                      | 스텝 | 자연스러운 자리        | 배치                                                          |
| ---- | ----------------------------------------- | ---- | ---------------------- | ------------------------------------------------------------- |
| `B1` | 어긋난 성분을 찾아 고친다                 | 20   | 코스 1 호응            | `Rd Sl MC EC Sl MC EC TF Rd Sl EC MC Sl EC TF MC Sl EC Cg MC` |
| `B2` | 어절을 조립해 성분 관계를 체득한다        | 18   | 코스 1 골격            | `Rd SB MC SB Or SB MC SB TF Rd SB Or SB MC SB TF MC SB`       |
| `B3` | 나눌 문장과 유지할 문장을 가른다          | 20   | 코스 1 한 문장 한 판단 | `Rd MC Cg Cp MC Cg TF Cp Cg MC Rd Cg Cp MC Cg TF Cg MC Cg MC` |
| `B4` | 지워도 뜻이 남는지 검증한다               | 20   | 코스 1 군더더기        | `Rd Sl MC Cp Sl TF EC Sl MC Cp Sl TF Rd Sl EC MC Cp Sl TF MC` |
| `B5` | 위험 신호를 금칙어가 아니라 지표로 다룬다 | 20   | 코스 1 번역투          | `Rd MC TF Cg TF Sl MC TF Cg TF Rd Sl TF Cg MC TF Sl Cg TF MC` |
| `B6` | 사라진 행위자를 되살린다                  | 20   | 코스 1 태와 주체       | `Rd MC Sl FB MC Sl FB TF EC Rd Sl FB MC EC Sl FB TF MC Cg MC` |
| `B7` | 길이와 구조로 정보 무게를 조절한다        | 20   | 코스 1 리듬            | `Rd Cp MC SB Cp MC Or SB TF Rd Cp SB MC Or SB TF Cp MC SB MC` |

## C 어휘 선택

| ID   | 컨셉                                       | 스텝 | 자연스러운 자리   | 배치                                                             |
| ---- | ------------------------------------------ | ---- | ----------------- | ---------------------------------------------------------------- |
| `C1` | 비슷한 말이 갈리는 축을 지목한다           | 19   | 코스 2 유의어     | `Rd Cp MC Sl Cp Mt MC Sl Cp TF Mt MC Rd Cp Sl Mt MC Cg MC`       |
| `C2` | 문맥으로 뜻을 확정한다                     | 19   | 코스 2 다의어     | `Rd MC Sl FB MC Sl FB MC TF Rd Sl FB MC FB Sl TF MC Cg MC`       |
| `C3` | 문법은 맞지만 안 어울리는 결합을 잡는다    | 19   | 코스 2 연어       | `Rd MC Mt TF FB Mt MC TF FB Mt Rd TF Mt FB MC TF Mt Cg MC`       |
| `C4` | 한 편의 글에서 톤이 흔들린 자리를 찾는다   | 21   | 코스 2 격과 톤    | `Rd MC Sl Cg Cp Sl MC Cg TF Sl Cp Cg MC Rd Sl Cg TF Sl MC Cg MC` |
| `C5` | 추상어를 검증 가능한 말로 내린다           | 19   | 코스 2·6·8 추상도 | `Rd MC Or FB MC SB Or TF FB MC Rd Or SB FB MC Or TF SB MC`       |
| `C6` | 관용구와 고사성어를 정확한 형태로 조립한다 | 19   | 코스 2 관용 표현  | `Rd MC Or SB MC SB Or SB TF MC Rd Or SB SB MC Or TF MC SB`       |

## D 문단과 글 구조

| ID   | 컨셉                                           | 스텝 | 자연스러운 자리    | 배치                                                          |
| ---- | ---------------------------------------------- | ---- | ------------------ | ------------------------------------------------------------- |
| `D1` | 통일성·충분성·긴밀성 중 무엇이 깨졌는지 말한다 | 19   | 코스 4 문단 요건   | `Rd MC Cg Sl MC Cg TF Sl Cg MC Rd Cg Sl TF Cg MC Sl Cg MC`    |
| `D2` | 문단에서 무관한 문장을 걸러낸다                | 19   | 코스 4·9 통일성    | `Rd MC Sl Cg MC Cg Sl TF Cg MC Rd Sl Cg MC Cg TF Sl Cg MC`    |
| `D3` | 논리 전개에 맞게 문단을 배열한다               | 19   | 코스 4·5 조직      | `Rd MC Or FB MC Or Cg TF Or FB MC Rd Or Cg MC Or TF MC Or`    |
| `D4` | 빠진 뒷받침의 종류를 지목한다                  | 20   | 코스 4 뒷받침      | `Rd MC Cg Mt MC Cg Sl TF Mt Cg MC Rd Cg Mt Sl TF Cg MC Cg MC` |
| `D5` | 완성 글에서 개요를 복원한다                    | 19   | 코스 4 개요        | `Rd MC Or FB MC Or Or TF Or FB MC Rd Or Or FB MC TF MC Or`    |
| `D6` | 다리가 없는 지점을 찾아 이유를 댄다            | 20   | 코스 4·5 문단 잇기 | `Rd MC Sl FB Cp MC Sl FB TF Cp Sl MC Rd FB Sl Cp MC TF Cg MC` |
| `D7` | 서론의 약속과 결론의 회수를 대조한다           | 20   | 코스 4 전체 구조   | `Rd Cp MC Sl Cp Mt MC Cp Sl TF Cp MC Rd Cp Sl Mt Cp MC Cg MC` |
| `D8` | 접속어를 넣을 자리와 뺄 자리를 가른다          | 20   | 코스 5 접속 표현   | `Rd MC FB Sl TF Cg FB MC Sl TF FB Cg Rd MC FB Sl TF Cg FB MC` |

## E 설명과 논증

| ID   | 컨셉                                         | 스텝 | 자연스러운 자리    | 배치                                                          |
| ---- | -------------------------------------------- | ---- | ------------------ | ------------------------------------------------------------- |
| `E1` | 독자가 이미 아는 것과 모르는 것을 나눈다     | 20   | 코스 6 설명의 조건 | `Rd MC Cg Sl Cp MC Cg TF Sl Cg Cp MC Rd Cg Sl TF Cg MC Cg MC` |
| `E2` | 정의의 결함 유형을 이름으로 지목한다         | 19   | 코스 6 정의        | `Rd MC Mt Cg MC Sl Mt Cg TF MC Rd Mt Cg Sl MC Mt TF Cg MC`    |
| `E3` | 비교 층위와 예시 대표성을 검사한다           | 20   | 코스 6 비교·예시   | `Rd Cp MC Cg Cp TF MC Cg Cp Sl TF Cg MC Rd Cp Cg TF MC Cg MC` |
| `E4` | 인과 주장의 강도를 근거에 맞춘다             | 19   | 코스 6 인과·유추   | `Rd MC Cg TF Mt FB MC Cg TF Mt FB Rd MC Cg TF Mt FB Cg MC`    |
| `E5` | 반박 가능한 명제와 그렇지 않은 진술을 가른다 | 20   | 코스 7 주장의 자격 | `Rd MC Cg TF Cg MC TF Cg Sl MC Rd Cg TF Cg MC TF Cg MC Cg MC` |
| `E6` | 숨은 보증을 문장으로 복원한다                | 20   | 코스 7 논증 구조   | `Rd MC FB Or MC Mt FB Or TF MC Rd FB Or Mt FB MC Or TF FB MC` |
| `E7` | 근거를 탈락시킬 기준을 댄다                  | 19   | 코스 7 근거의 질   | `Rd MC Cg Sl TF Mt Cg MC Sl TF Cg Mt Rd MC Cg Sl TF Cg MC`    |
| `E8` | 오류를 이름으로 지목한다                     | 20   | 코스 7 논리적 오류 | `Rd MC Mt Cg MC Mt Sl Cg TF Mt MC Cg Rd Mt Sl Cg TF Mt Cg MC` |
| `E9` | 반론 처리가 논증을 강화한 지점을 설명한다    | 20   | 코스 7 반론        | `Rd MC Cp Sl MC SB Cp TF Sl MC SB Cp Rd Sl MC SB TF Cp Cg MC` |

## F 관찰과 묘사

| ID   | 컨셉                                     | 스텝 | 자연스러운 자리 | 배치                                                          |
| ---- | ---------------------------------------- | ---- | --------------- | ------------------------------------------------------------- |
| `F1` | 오감 가운데 무엇을 골랐는지 확인한다     | 18   | 코스 8 갈림     | `Rd MC Cg Sl Cp MC Cg Sl TF Cg Cp MC Rd Cg Sl TF Cg MC`       |
| `F2` | 무엇으로 구체화했는지 수단을 지목한다    | 19   | 코스 8 구체성   | `Rd MC Sl Mt Or MC Sl Mt TF Or MC Rd Sl Mt Or MC Sl TF MC`    |
| `F3` | 비유의 근거를 말하고 진부·과잉을 가른다  | 20   | 코스 8 비유     | `Rd MC Mt Cg Cp MC TF Mt Cg Cp Sl TF MC Rd Mt Cg Cp TF Cg MC` |
| `F4` | 말한 문장과 보여준 문장을 가른다         | 20   | 코스 8 보여주기 | `Rd Cp MC Cg Cp SB MC Cg Cp TF SB MC Rd Cp Cg SB Cp TF Cg MC` |
| `F5` | 관념어를 장면으로 바꾸고 과잉을 덜어낸다 | 20   | 코스 8 종합     | `Rd MC Cp EC SB MC Cp EC TF SB Cp MC Rd EC SB Cp MC TF EC MC` |

## G 요약·비판·정보 판별

| ID   | 컨셉                                  | 스텝 | 자연스러운 자리       | 배치                                                             |
| ---- | ------------------------------------- | ---- | --------------------- | ---------------------------------------------------------------- |
| `G1` | 버릴 정보의 기준을 진술한다           | 20   | 코스 9 요약의 조건    | `Rd MC Sl Cg TF MC Sl Cg TF Sl Cg MC Rd Sl Cg TF Sl MC Cg MC`    |
| `G2` | 판단 구조가 보존된 요약을 골라낸다    | 20   | 코스 9 압축           | `Rd Cp MC Sl SB Cp MC Sl TF SB Cp MC Rd Sl SB Cp MC TF Cg MC`    |
| `G3` | 사실·의견·전제를 문장 단위로 가른다   | 21   | 코스 9·10 비판적 읽기 | `Rd MC Cg Sl MC Cg Sl TF Cg MC Sl Cg Rd MC Cg Sl TF Cg MC Cg MC` |
| `G4` | 인용·바꿔 쓰기·표절의 경계를 판정한다 | 19   | 코스 9 출처와 인용    | `Rd MC Cg Cp Sl MC Cg TF Cp Sl Cg MC Rd Cg Cp Sl TF Cg MC`       |
| `G5` | 그럴듯함과 검증 가능함을 가른다       | 19   | 코스 9 AI 정보 판별   | `Rd MC Cg TF Sl Mt MC Cg TF Sl Cg Mt Rd MC Cg TF Sl Cg MC`       |
| `G6` | 자료의 신뢰도에 우선순위를 매긴다     | 19   | 코스 9 출처           | `Rd MC Or Mt MC Cg Or TF Mt Or MC Cg Rd Or Mt TF Cg MC Or`       |

## H 발상과 주제

| ID   | 컨셉                                     | 스텝 | 자연스러운 자리 | 배치                                                          |
| ---- | ---------------------------------------- | ---- | --------------- | ------------------------------------------------------------- |
| `H1` | 생성 단계와 평가 단계를 구분한다         | 19   | 코스 10 착수    | `Rd MC Cg Or TF MC Cg Or Cg TF MC Rd Cg Or TF Cg MC Or MC`    |
| `H2` | 관찰에서 판단까지 순서를 지킨다          | 20   | 코스 10 해석    | `Rd MC Cg Or Sl MC Cg Or TF Sl Cg MC Rd Or Cg Sl TF Or Cg MC` |
| `H3` | 화제를 논쟁 가능한 주제문으로 좁힌다     | 19   | 코스 10 주제    | `Rd MC FB SB MC Or FB SB TF MC Rd FB SB Or MC SB TF MC SB`    |
| `H4` | 답할 수 있는 질문과 공허한 질문을 가른다 | 20   | 코스 10 종합    | `Rd MC Cg TF MC Cg TF Cg MC Sl TF Cg Rd MC Cg TF Cg MC Cg MC` |
| `H5` | 해석에 반증 조건을 붙인다                | 19   | 코스 10 해석    | `Rd MC FB Mt TF SB MC FB Mt TF Rd SB FB Mt MC TF FB Cg MC`    |

## I 종합·판별

| ID   | 컨셉                             | 스텝 | 자연스러운 자리   | 배치                                                                      |
| ---- | -------------------------------- | ---- | ----------------- | ------------------------------------------------------------------------- |
| `I1` | 오류를 갈래로 분류한다           | 22   | 전 코스 종합 유닛 | `Rd MC Mt Cg Sl MC Cg Sl Cg TF Mt Cg MC Rd Cg Sl Cg TF Cg MC Cg MC`       |
| `I2` | 분류한 뒤 우선순위를 정한다      | 23   | 코스 1 종합       | `Rd MC Cg Or MC Cg Or Sl Cg TF Or Cg MC Rd Cg Or Sl Cg TF MC Cg MC Or`    |
| `I3` | 점검 질문을 목록으로 세운다      | 22   | 코스 7·10 종합    | `Rd MC Mt Or TF Mt MC Or Cg TF Mt Or MC Rd Mt Or TF Cg Mt MC Or MC`       |
| `I4` | 같은 내용 두 판본을 대조한다     | 22   | 코스 1·6·8 종합   | `Rd Cp MC Sl Cp MC Cg Cp Sl TF Cp MC Cg Rd Cp Sl MC Cp TF Cg Cp MC`       |
| `I5` | 오류가 섞인 문단을 해부한다      | 23   | 코스 4·7 종합     | `Rd MC Sl EC Cg MC Sl EC EC TF Cg Sl EC MC Rd EC Sl EC Cg TF MC Cg MC`    |
| `I6` | 여러 갈래를 한 자리에서 진단한다 | 24   | 코스 3·9 종합     | `Rd MC Sl Cg TF Mt FB Cp MC Or EC Sl EC Cg SB SB TF Mt MC Cg Rd Or MC MC` |

---

## 결과 관찰

컨셉에서 스텝을 도출한 결과 유형별 등장량은 고르지 않다. 이것은 교정 대상이 아니다.

`SB`는 조립이 확인 수단인 `B2`에서 여덟 번 나온다. `Cp`는 대조가 축인 `I4`에서 일곱 번, `D7`에서 여섯 번, `F4`에서 다섯 번 나온다. `FB`는 표기를 굳히는 `A4`에서 아홉 번 나온다.

마지막 자리는 컨셉의 마무리 행위가 무엇인지에 따라 갈린다. 52개는 `MC`로 통과 여부를 한 문항으로 확인한다. 나머지 8개는 마무리 행위 자체가 확인이므로 그 유형으로 닫는다. `A4`는 `FB`로 정확한 표기를 채워 닫고, `B2`·`H3`·`C6`은 `SB`로 조립해 닫고, `D3`·`D5`·`G6`·`I2`는 `Or`로 순서를 확정해 닫는다.

스텝 수는 18부터 24까지다. 19스텝 24개, 20스텝 24개가 가장 많고 18스텝 4개, 21스텝 2개, 22스텝 3개, 23스텝 2개, 24스텝 1개다.

한 템플릿이 쓰는 서로 다른 유형은 평균 5.9종, 최소 4종, 최대 11종이다. 컨셉이 좁을수록 유형 수가 적다. `A2`는 규범·허용·취향 세 층을 가르는 일만 하므로 `Rd` `MC` `Cg` `TF` 네 종으로 끝나고, `I6`은 여러 갈래를 한 자리에서 진단하므로 11종을 모두 쓴다.

이전 판에서 `Or`이 문단·논리 순서에만 묶여 있었다. `B2`(어절 조립), `C6`(관용구 조립), `C5`(추상도 계단), `F2`(구체화 계단), `G6`(신뢰도 우선순위)로 `Or`의 자리를 넓혔다.

`TRANSCRIBE`(`Tr`)와 `PARAGRAPH_ORGANIZE`(`PO`)는 계약하지 않기로 확정했다(`content-model.md`의 제외 스텝 타입). 두 유형을 쓰던 `A4` `A8` `C6` `G4` `I6`(`Tr`)과 `D2` `D3` `D5` `I5` `I6`(`PO`)은 같은 판별 지점을 확정 유형으로 다시 확인하도록 배치를 바꿨다. `A4`·`A8`은 정확한 표기를 고르는 `FB`로, `C6`은 관용구를 조립하는 `SB`로, `G4`는 인용 구간을 고르는 `Sl`로, `I5`·`I6`은 `EC`로 옮겨 적기 대신 오류 교정으로 확인한다. `D2`는 무관한 문장을 분류하는 `Cg`로, `D3`·`D5`는 순서를 확정하는 `Or`로 문단 조립 대신 배열 판정을 쓴다.

## 유형 계약 현황

| 유형 | 쓰는 템플릿 | 계약 |
| ---- | ----------- | ---- |
| `TF` | 60          | 있음 |
| `SB` | 11          | 있음 |
| `EC` | 8           | 있음 |

11개 유형 모두 계약이 있으므로 어떤 템플릿도 시드 반영을 막지 않는다. `TRANSCRIBE`·`PARAGRAPH_ORGANIZE`는 `content-model.md`가 제외 스텝 타입으로 확정했으므로 이 저장소에서 계약을 추가하지 않는다.

## 레슨 time 산정

레슨 `time`은 배정받은 템플릿에서 나온다. 스텝 유형마다 소요를 두고 배치를 합산한다. `Rd`는 3분, `Cp`는 2분, 나머지 아홉 유형은 1분이다. `Rd`는 학습 문서 한 편을 읽는 자리이고, `Cp`는 두 판본을 견주는 자리이므로 짧은 판정 스텝보다 오래 걸린다.

| 분     | 템플릿                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------- |
| `22분` | `B2`                                                                                                |
| `23분` | `A3` `A7` `A8` `C2` `C3` `C5` `C6` `D1` `D2` `D3` `D5` `E2` `E4` `E7` `F2` `G5` `G6` `H1` `H3` `H5` |
| `24분` | `B1` `B5` `B6` `D4` `D8` `E5` `E6` `E8` `F1` `G1` `H2` `H4`                                         |
| `25분` | `A1` `A4` `G3`                                                                                      |
| `26분` | `A2` `A6` `E1` `G4` `I1` `I3`                                                                       |
| `27분` | `B3` `B4` `C1` `C4` `D6` `F3` `I2` `I5`                                                             |
| `28분` | `A5` `B7` `E3` `E9` `F5` `G2`                                                                       |
| `29분` | `F4` `I6`                                                                                           |
| `30분` | `D7`                                                                                                |
| `33분` | `I4`                                                                                                |

값은 22분부터 33분까지 열 가지다. `분`을 떼어 정수로 읽는 파싱과 양의 정수 불변식은 [시드 로더](../../../packages/modules/content/src/infrastructure/persistence/content-seed.ts)가 소유한다.

## 다음 결정

- 스텝 집필은 [배정표](./stage-3-template-assignment.md)가 정한 템플릿을 따른다.
- 11개 확정 유형만 쓰므로 어떤 레슨도 계약 대기 없이 시드에 스텝을 넣을 수 있다.
