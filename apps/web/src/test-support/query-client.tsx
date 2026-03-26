import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderHookResult,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"

export function createTestQueryClient() {
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

function createQueryClientWrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
): RenderResult & { queryClient: QueryClient } {
  const queryClient = createTestQueryClient()

  return {
    queryClient,
    ...render(ui, {
      wrapper: createQueryClientWrapper(queryClient),
      ...options,
    }),
  }
}

export function renderHookWithQueryClient<TResult, TProps>(
  renderCallback: (initialProps: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper">
): RenderHookResult<TResult, TProps> & { queryClient: QueryClient } {
  const queryClient = createTestQueryClient()

  return {
    queryClient,
    ...renderHook(renderCallback, {
      wrapper: createQueryClientWrapper(queryClient),
      ...options,
    }),
  }
}
