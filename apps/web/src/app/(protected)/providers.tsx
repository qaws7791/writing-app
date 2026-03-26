"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useMemo } from "react"

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
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
      }),
    []
  )
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
