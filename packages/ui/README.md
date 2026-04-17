Remember to wrap your app with the `TooltipProvider` and `ThemeProvider` components.

```tsx title="app/layout.tsx"
import { TooltipProvider } from "@workspace/ui/components/ui/tooltip"
import { ThemeProvider } from "@workspace/ui/components/ui/theme-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```
