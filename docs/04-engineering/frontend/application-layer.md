# 프론트엔드 컴포넌트의 관심사 분리: 유즈케이스와 애플리케이션 레이어

> UI는 세부 구현이다. 비즈니스 규칙은 그렇지 않다.
> — Robert C. Martin, _Clean Architecture_

---

## 문제: 컴포넌트가 너무 많은 것을 알고 있다

프론트엔드 개발에서 가장 흔하게 마주치는 구조적 문제 중 하나는, 컴포넌트가 점점 두꺼워지는 현상이다. 처음에는 단순한 버튼 하나, 폼 하나였지만 시간이 지나면서 컴포넌트 안에 API 호출, 상태 관리, 유효성 검사, 조건 분기, 에러 처리까지 모두 뒤섞이게 된다.

아래는 흔히 볼 수 있는 전형적인 예시다.

```typescript
function OrderFormComponent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (items.length === 0) return;

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (total > 1_000_000) {
      alert("1회 주문 한도를 초과했습니다.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({ items, total }),
      });
      // ...
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

이 코드에서 `handleSubmit` 하나만 봐도, 최소 세 가지 다른 성격의 로직이 공존하고 있다.

- **UI 로직**: `loading` 상태 관리, 버튼 비활성화
- **도메인 규칙**: 주문 한도 검사, 총액 계산
- **인프라 관심사**: fetch API 호출, 엔드포인트 주소

이 구조가 당장은 동작하지만, 이런 컴포넌트는 세 가지 뚜렷한 문제를 안고 있다.

**첫째, 테스트하기 어렵다.** 주문 한도 검사 로직을 테스트하려면 React 컴포넌트를 렌더링하고, 폼을 조작하고, 네트워크 요청을 모킹해야 한다. 순수한 비즈니스 규칙 하나를 검증하기 위해 너무 많은 부대비용이 든다.

**둘째, 재사용할 수 없다.** 같은 주문 로직이 다른 화면(예: 빠른 주문 모달)에서도 필요하다면, 코드를 복사하거나 컴포넌트를 억지로 재사용하게 된다.

**셋째, 변경 비용이 크다.** 주문 한도 금액이 바뀌거나 API 경로가 변경될 때, 어느 컴포넌트를 고쳐야 하는지 파악하는 일이 점점 어려워진다.

---

## 해결의 실마리: 레이어 구분

이 문제를 해결하는 핵심 아이디어는 간단하다. **"무엇을 할 것인가(what)"와 "어떻게 보여줄 것인가(how)"를 분리하는 것이다.**

클린 아키텍처나 헥사고날 아키텍처에서 오랫동안 논의해온 이 원칙을 프론트엔드에 적용할 수 있다. 그 핵심 구성 요소가 바로 **유즈케이스(Use Case)** 와 **애플리케이션 레이어(Application Layer)** 다.

### 애플리케이션 레이어란

애플리케이션 레이어는 컴포넌트(UI 레이어)와 서버/외부 시스템(인프라 레이어) 사이에 위치하는 중간 계층이다. 이 레이어의 역할은 두 가지다.

1. **오케스트레이션**: 비즈니스 흐름의 단계를 조율한다. "데이터를 가져와서, 검증하고, 변환한 뒤 저장한다"는 흐름 자체를 관리한다.
2. **격리**: UI가 어떻게 생겼는지, 데이터가 어디서 오는지를 알지 못한다. 순수하게 "무엇을 해야 하는가"에만 집중한다.

### 유즈케이스란

유즈케이스는 애플리케이션 레이어를 구성하는 단위다. 하나의 유즈케이스는 하나의 사용자 의도(user intent)를 표현한다.

- `PlaceOrderUseCase` — 주문을 접수한다
- `CancelOrderUseCase` — 주문을 취소한다
- `AddItemToCartUseCase` — 장바구니에 상품을 추가한다

유즈케이스는 함수일 수도 있고, 클래스일 수도 있다. 형식보다 중요한 것은 **단일 책임**이다. 하나의 유즈케이스는 하나의 시나리오만 담당한다.

---

## 구조: 레이어가 나뉘면 무엇이 달라지는가

아래는 애플리케이션 레이어를 도입했을 때의 디렉터리 구조 예시다.

```
src/
├── features/
│   └── order/
│       ├── ui/                        # UI 레이어
│       │   ├── OrderForm.tsx
│       │   └── useOrderForm.ts        # UI 상태 훅
│       ├── application/               # 애플리케이션 레이어
│       │   ├── PlaceOrderUseCase.ts
│       │   └── CancelOrderUseCase.ts
│       ├── domain/                    # 도메인 레이어
│       │   ├── Order.ts
│       │   └── OrderValidator.ts
│       └── infrastructure/            # 인프라 레이어
│           └── OrderRepository.ts
```

각 레이어의 의존 방향은 단방향이다.

```
UI → Application → Domain
              ↑
        Infrastructure
```

인프라는 도메인 인터페이스에 의존하고, UI는 애플리케이션 레이어의 유즈케이스만 호출한다. **UI는 API 경로를 알 필요가 없고, 유즈케이스는 컴포넌트가 어떻게 생겼는지 알 필요가 없다.**

---

## 유즈케이스의 구체적인 모습

유즈케이스를 클래스로 구현할 때는 외부 의존성을 생성자에서 주입받는 패턴을 자주 사용한다. 이를 통해 테스트 환경에서 실제 API 대신 가짜 구현체(stub)를 주입할 수 있다.

```typescript
// application/PlaceOrderUseCase.ts

interface OrderRepository {
  save(order: Order): Promise<void>
}

export class PlaceOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    // 1. 도메인 규칙 검증
    const validation = OrderValidator.validate(input)
    if (!validation.success) {
      return { success: false, error: validation.error }
    }

    // 2. 도메인 객체 생성
    const order = Order.create(input)

    // 3. 저장 (인프라 레이어에 위임)
    await this.orderRepository.save(order)

    return { success: true, orderId: order.id }
  }
}
```

컴포넌트의 커스텀 훅은 이 유즈케이스만 알면 된다.

```typescript
// ui/useOrderForm.ts

export function useOrderForm() {
  const [loading, setLoading] = useState(false)
  const useCase = new PlaceOrderUseCase(new HttpOrderRepository())

  const submit = async (input: PlaceOrderInput) => {
    setLoading(true)
    const result = await useCase.execute(input)
    setLoading(false)

    if (!result.success) {
      // UI 피드백 처리
    }
  }

  return { submit, loading }
}
```

컴포넌트 자체는 이제 진정한 의미의 UI만 담당한다.

```typescript
// ui/OrderForm.tsx

function OrderForm() {
  const { submit, loading } = useOrderForm();

  return (
    <form onSubmit={submit}>
      {/* 순수 UI */}
    </form>
  );
}
```

---

## 이 구조가 가져다주는 실질적인 이점

### 1. 테스트가 극적으로 단순해진다

유즈케이스는 React에 의존하지 않는 순수한 TypeScript 모듈이다. 테스트에서 가짜 저장소를 주입하면, 브라우저 환경이나 렌더링 없이도 비즈니스 규칙 전체를 검증할 수 있다.

```typescript
it("주문 한도를 초과하면 실패를 반환한다", async () => {
  const useCase = new PlaceOrderUseCase(new FakeOrderRepository())
  const result = await useCase.execute({ items: [{ price: 2_000_000 }] })

  expect(result.success).toBe(false)
  expect(result.error).toBe("ORDER_LIMIT_EXCEEDED")
})
```

### 2. 비즈니스 로직이 한 곳에 모인다

주문 한도가 100만 원에서 200만 원으로 바뀌어도, 수정해야 할 파일은 `PlaceOrderUseCase.ts` 하나다. 어느 컴포넌트에 그 로직이 흩어져 있는지 검색할 필요가 없다.

### 3. UI를 자유롭게 교체할 수 있다

웹 뷰에서 네이티브 앱으로 전환하거나, 동일한 기능을 다른 UI 패턴(모달, 페이지, 사이드패널)으로 제공해야 할 때, 유즈케이스는 그대로 두고 UI 레이어만 교체하면 된다.

### 4. 팀 협업 구조가 명확해진다

프론트엔드 팀이 "UI 전담"과 "기능 로직 전담"으로 역할을 나눌 때, 레이어 경계가 자연스러운 협업 경계가 된다. PR 리뷰 범위도 좁아지고, 충돌 가능성도 줄어든다.

---

## 흔한 오해와 주의점

### "작은 프로젝트에도 필요한가?"

모든 프로젝트에 이 구조가 적합하지는 않다. CRUD 중심의 단순한 관리 도구라면 오히려 불필요한 추상화가 될 수 있다. 이 패턴은 **복잡한 비즈니스 규칙이 존재하고, 그 규칙이 앞으로도 변화할 가능성이 높을 때** 비용 대비 효과가 극대화된다.

### "서버 상태 관리 라이브러리(React Query 등)와 어떻게 공존하는가?"

React Query나 SWR은 서버 상태의 캐싱과 동기화를 담당하는 도구이지, 비즈니스 규칙을 담는 그릇이 아니다. 이 도구들은 애플리케이션 레이어를 **호출하는 위치**에 놓이는 것이 자연스럽다. 유즈케이스를 `queryFn` 내부에서 실행하거나, `mutation`의 `onMutate` 핸들러로 연결하면 두 구조가 충돌 없이 공존할 수 있다.

### "유즈케이스가 도메인 서비스와 같은 것인가?"

유즈케이스는 흐름을 **조율(orchestrate)** 하고, 도메인 서비스는 핵심 비즈니스 규칙을 **캡슐화**한다. 유즈케이스는 도메인 서비스를 호출하는 상위 계층이다. 간단한 경우에는 두 역할을 유즈케이스 하나에서 처리해도 무방하지만, 복잡도가 올라가면 분리하는 것이 유리하다.
