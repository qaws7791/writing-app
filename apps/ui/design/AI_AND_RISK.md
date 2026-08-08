# Luma AI, Trust & Risk Contract

AI 생성 콘텐츠, 외부 source, 권한, 실행 환경, 비용 또는 되돌리기 어려운 행동을 다룰 때 `DESIGN.md`와 해당 구현 문서에 더해 이 문서를 읽는다.

## 1. Provenance

AI가 생성하거나 보강한 내용을 일반 콘텐츠처럼 숨기지 않는다. 생성 주체, 근거, 범위와 불확실성은 제품 상태의 일부다.

- 사람 작성, AI 생성과 외부 source에서 가져온 내용을 구분하되 색만을 유일한 단서로 사용하지 않는다.
- 요약과 답변에는 가능한 경우 근거 문서, 인용, record 또는 원문 위치로 가는 source affordance를 제공한다.
- 사용 범위, 기간, 검색 mode와 제외 범위가 해석에 중요하면 함께 표시한다.
- 근거가 부족하거나 일부만 확인한 결과는 `incomplete`, `limited`, `unverified`처럼 명시적으로 표현한다.
- 생성 흐름은 적용 가능한 `retrieving`, `generating`, `streaming`, `review`, `complete`, `cancelled`, `error` 상태를 구분한다.
- 사용자는 결과를 편집, 거절, 재생성하거나 원문과 비교할 수 있어야 하며 이 과정에서 기존 source가 사라지지 않게 한다.

## 2. Reviewable Changes

외부 사용자, 실서비스 데이터, 권한 또는 비용에 영향을 주는 작업을 실행 버튼 하나로 축약하지 않는다.

- 복잡하거나 생성된 변경은 가능한 경우 `draft → review → apply → publish`로 분리한다.
- 실행 전에 대상, 범위, 변경 요약, 영향받는 항목과 되돌릴 수 있는지를 확인할 수 있게 한다.
- AI는 고위험 행동을 제안할 수 있지만 사용자 검토 없이 권한 변경, 게시, 결제와 삭제를 실행하지 않는다.
- 되돌릴 수 있는 작업은 과도한 확인 modal보다 명확한 결과와 Undo를 우선한다.
- 되돌릴 수 없는 작업은 별도 확인과 구체적인 위험 문구를 사용한다.
- 권한이 없는 행동은 실패한 뒤가 아니라 실행 전에 제한과 필요한 역할을 설명한다.

## 3. Environment, Permission & Audit

- Sandbox, test, preview와 live 환경은 행동 직전뿐 아니라 작업하는 동안 지속적으로 보이게 한다.
- 권한은 `read`, `write`, `admin`처럼 실제 수행 가능 범위에 맞춰 표현한다.
- 같은 행동도 대상 환경이나 권한에 따라 영향이 달라지면 label, 설명과 확인 단계에 차이를 드러낸다.
- 중요한 변경은 누가 또는 무엇이, 언제, 어느 환경에서 무엇을 바꾸었는지 추적 가능한 history를 남긴다.
- 자동화와 AI가 만든 변경도 사람의 변경과 같은 review, permission과 audit 계약을 따른다.
- 자동 적용이나 예약 실행에는 취소, 중지, rollback 또는 history 중 위험도에 맞는 회복 경로를 제공한다.

## 4. Context & Long-running Work

- AI가 사용할 content, source, 기간, tool과 permission 범위를 사용자가 실행 전에 확인하고 가능한 범위에서 조정할 수 있게 한다.
- `retrieving`, tool execution, waiting, `generating`, streaming과 review를 하나의 모호한 loading state로 합치지 않는다.
- 장시간 작업에는 cancel과 안전한 resume를 제공한다. 화면을 떠나도 계속되는 작업은 background 실행 여부와 완료·실패 알림 경로를 명확히 한다.
- Cancel, retry와 resume 과정에서 사용자 prompt, 첨부 content와 이미 완료된 안전한 결과를 가능한 한 보존한다.
- AI 생성 content 비중이 큰 제품은 필요에 따라 표시, 흐림 또는 숨김 preference를 제공하되 provenance 자체를 제거하지 않는다.
- AI를 별도의 purple, gradient, gloss와 계속 움직이는 decoration으로 표현하지 않는다. 기존 작업 흐름의 action과 state hierarchy를 따른다.

## 5. Metadata Contract

해당 registry item은 실제 API와 preview가 지원하는 범위에서 다음 metadata를 선언한다.

```json
{
  "provenance": ["human", "ai", "external"],
  "risk": "reversible",
  "permissions": ["read", "write", "admin"],
  "environments": ["sandbox", "test", "live"]
}
```

`risk`는 `none`, `reversible`, `high`, `destructive` 중 실패 영향과 회복 가능성에 맞는 값을 쓴다. 지원하지 않는 기능을 metadata에 장식적으로 선언하지 않는다.

Preview에는 적용 가능한 경우 다음 상태를 포함한다.

- Human / AI / External source / Missing source
- Complete / Incomplete / Cancelled / Failed
- No access / Read only / Edit / Admin
- Draft / Review / Applied / Published / Rolled back
- Sandbox / Test / Preview / Live

## 6. Acceptance Questions

- 사용자가 생성 주체, source, 확인 범위와 불확실성을 구분할 수 있는가.
- 기존 source를 잃지 않고 결과를 거절하거나 원문과 비교할 수 있는가.
- 실행 전에 대상, 환경, 영향과 회복 방법을 이해할 수 있는가.
- 권한 부족이 실행 후 오류가 아니라 실행 전 제약으로 보이는가.
- 자동화와 AI 변경에도 사람과 같은 review와 audit trail이 남는가.
- 사용자가 AI에 제공되는 context와 tool 범위를 확인하고 조정할 수 있는가.
- 장시간 작업을 중단·재개하거나 background로 보낸 뒤 결과를 안전하게 회수할 수 있는가.
