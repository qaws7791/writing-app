"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}
const readHydrated = () => true
const readNotHydrated = () => false

export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, readHydrated, readNotHydrated)
}
