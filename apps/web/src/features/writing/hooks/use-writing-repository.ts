"use client"

import { useMemo } from "react"

import {
  createWritingRepository,
  type WritingRepository,
} from "@/features/writing/repositories/writing-repository"

export function useWritingRepository(repository?: WritingRepository) {
  return useMemo(() => repository ?? createWritingRepository(), [repository])
}
