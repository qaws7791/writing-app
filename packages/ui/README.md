앱 layout에서는 공통 primitive와 Next 통합 컴포넌트의 import 경계를 분리한다.
현재 앱의 필수 root provider는 `ThemeProvider`이며, toast UI가 필요한 앱은 같은
`@workspace/ui/next` 경계에서 `Toaster`를 함께 배치한다.

```tsx title="app/layout.tsx"
import { ThemeProvider, Toaster } from "@workspace/ui/next"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

`TooltipProvider`는 tooltip delay 같은 전역 기본값을 조정해야 할 때만 선택적으로
추가한다. 개별 `Tooltip` 사용 자체를 위해 앱 root layout에 항상 추가할 필요는 없다.
