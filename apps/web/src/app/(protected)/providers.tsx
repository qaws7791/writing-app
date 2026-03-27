"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        gcTime: 10 * 60 * 1000,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
        structuralSharing: true,
        networkMode: "online",
      },
      mutations: {
        retry: 0,
        networkMode: "online",
      },
    },
  })
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
