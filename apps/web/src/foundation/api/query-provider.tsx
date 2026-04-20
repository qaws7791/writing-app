"use client"

import { createContext, useContext, useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { createApiClient, type ApiClient } from "@workspace/api-client"

import { createQueryClient } from "./query-client"
import { env } from "@/foundation/config/env"

const ApiClientContext = createContext<ApiClient | null>(null)

export function useApiClient(): ApiClient {
  const apiClient = useContext(ApiClientContext)

  if (apiClient === null) {
    throw new Error("ApiClientProvider가 설정되지 않았습니다.")
  }

  return apiClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())
  const [apiClient] = useState(() =>
    createApiClient({
      baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
    })
  )

  return (
    <ApiClientContext.Provider value={apiClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiClientContext.Provider>
  )
}
