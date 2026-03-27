"use client"

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"

type AISplitContextValue = {
  isSplitMode: boolean
  setIsSplitMode: Dispatch<SetStateAction<boolean>>
  panelContainer: HTMLDivElement | null
  setPanelContainer: (el: HTMLDivElement | null) => void
}

const AISplitContext = createContext<AISplitContextValue | null>(null)

/**
 * AI 분할 뷰 레이아웃 상태를 관리하는 Context Provider.
 * `isSplitMode`가 true이면 에디터와 AI 제안 패널이 분할 뷰로 렌더링된다.
 */
export function AISplitProvider({ children }: { children: ReactNode }) {
  const [isSplitMode, setIsSplitMode] = useState(false)
  const [panelContainer, setPanelContainer] = useState<HTMLDivElement | null>(
    null
  )

  return (
    <AISplitContext.Provider
      value={{ isSplitMode, setIsSplitMode, panelContainer, setPanelContainer }}
    >
      {children}
    </AISplitContext.Provider>
  )
}

export function useAISplit() {
  const ctx = useContext(AISplitContext)
  if (!ctx) throw new Error("useAISplit must be used within AISplitProvider")
  return ctx
}
