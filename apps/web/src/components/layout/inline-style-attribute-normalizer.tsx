"use client"

import { useEffect } from "react"

export function InlineStyleAttributeNormalizer() {
  useEffect(() => {
    const normalize = () => {
      for (const element of document.body.querySelectorAll<HTMLElement>(
        "[style]"
      )) {
        const style = element.getAttribute("style")

        if (style !== null) {
          element.setAttribute("style", normalizeStyleAttribute(style))
        }
      }
    }
    const frame = window.requestAnimationFrame(normalize)

    normalize()

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return null
}

function normalizeStyleAttribute(style: string): string {
  return style
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separator = declaration.indexOf(":")

      if (separator === -1) {
        return declaration
      }

      const property = declaration.slice(0, separator).trim()
      const value = declaration.slice(separator + 1).trim()

      return `${property}: ${value};`
    })
    .join(" ")
}
