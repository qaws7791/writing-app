"use client"

import { useCallback, useEffect, useRef } from "react"

/**
 * 화면이 사라질 때 진행 중인 요청을 취소하는 signal을 발급한다.
 * StrictMode의 mount → unmount → remount에서 재사용되지 않도록 cleanup이 ref를 비운다.
 */
export function useUnmountAbortSignal(): () => AbortSignal {
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [])

  return useCallback(() => {
    controllerRef.current ??= new AbortController()
    return controllerRef.current.signal
  }, [])
}
