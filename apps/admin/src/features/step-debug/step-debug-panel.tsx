"use client"

import { useState } from "react"

import type { ZodTypeAny } from "zod"

type DebugPanelProps = {
  readonly data: unknown
  readonly schema: ZodTypeAny
  readonly title?: string
}

type PanelTab = "schema" | "data"

export function StepDebugPanel({ data, schema, title }: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("schema")
  const [copied, setCopied] = useState(false)

  const schemaStr = zodToTypeStr(schema)
  const dataStr = JSON.stringify(data, null, 2)
  const content = activeTab === "schema" ? schemaStr : dataStr

  function handleCopy() {
    void navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      className="rounded-xl overflow-hidden border border-[#3c3c3c]"
      style={{ background: "#1e1e1e", fontFamily: "monospace" }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#3c3c3c]">
        <div className="flex gap-1">
          <TabButton
            active={activeTab === "schema"}
            onClick={() => setActiveTab("schema")}
          >
            스키마
          </TabButton>
          <TabButton
            active={activeTab === "data"}
            onClick={() => setActiveTab("data")}
          >
            데이터
          </TabButton>
        </div>
        <div className="flex items-center gap-3">
          {title ? (
            <span className="text-xs text-[#858585]">{title}</span>
          ) : null}
          <button
            aria-label={`${activeTab === "schema" ? "스키마" : "데이터"} 복사`}
            className="text-xs text-[#858585] hover:text-[#d4d4d4] transition-colors px-2 py-1 rounded hover:bg-[#2a2d2e] cursor-pointer"
            onClick={handleCopy}
            type="button"
          >
            <span role="status">{copied ? "✓ 복사됨" : "복사"}</span>
          </button>
        </div>
      </div>
      <pre
        className="overflow-auto p-4 text-xs leading-relaxed"
        style={{
          maxHeight: "320px",
          color: "#d4d4d4",
        }}
      >
        <code
          dangerouslySetInnerHTML={{
            __html: highlight(content, activeTab),
          }}
        />
      </pre>
    </div>
  )
}

function TabButton({
  active,
  children,
  onClick,
}: {
  readonly active: boolean
  readonly children: string
  readonly onClick: () => void
}) {
  return (
    <button
      className="px-3 py-1 text-xs rounded transition-colors cursor-pointer"
      onClick={onClick}
      style={{
        background: active ? "#2a2d2e" : "transparent",
        color: active ? "#d4d4d4" : "#858585",
      }}
      type="button"
    >
      {children}
    </button>
  )
}

function highlight(code: string, tab: PanelTab): string {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  if (tab === "data") {
    return highlightJson(escaped)
  }

  return escaped.split("\n").map(highlightSchemaLine).join("\n")
}

function highlightJson(code: string): string {
  const tokenPattern =
    /"(?:[^"\\]|\\.)*"(?=\s*:)|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?|true|false|null/g
  let highlighted = ""
  let lastIndex = 0

  for (const match of code.matchAll(tokenPattern)) {
    const token = match[0]
    const index = match.index ?? 0

    highlighted += code.slice(lastIndex, index)
    highlighted += renderJsonToken(token, code.slice(index + token.length))
    lastIndex = index + token.length
  }

  return highlighted + code.slice(lastIndex)
}

function renderJsonToken(token: string, afterToken: string): string {
  if (token.startsWith('"') && /^\s*:/.test(afterToken)) {
    return `<span style="color:#9cdcfe">${token}</span>`
  }

  if (token.startsWith('"')) {
    return `<span style="color:#ce9178">${token}</span>`
  }

  if (token === "true" || token === "false" || token === "null") {
    return `<span style="color:#569cd6">${token}</span>`
  }

  return `<span style="color:#b5cea8">${token}</span>`
}

function highlightSchemaLine(line: string): string {
  const fieldMatch = /^(\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\??:)(.*)$/.exec(line)

  if (fieldMatch === null) {
    return highlightSchemaType(line)
  }

  const leading = fieldMatch[1] ?? ""
  const key = fieldMatch[2] ?? ""
  const colon = fieldMatch[3] ?? ""
  const value = fieldMatch[4] ?? ""

  return `${leading}<span style="color:#9cdcfe">${key}</span>${colon}${highlightSchemaType(value)}`
}

function highlightSchemaType(value: string): string {
  const tokenPattern =
    /"[^"]*"|\b(?:string|number|boolean|null|undefined|any|unknown|never)\b|\||[{}[\]]/g
  let highlighted = ""
  let lastIndex = 0

  for (const match of value.matchAll(tokenPattern)) {
    const token = match[0]
    const index = match.index ?? 0

    highlighted += value.slice(lastIndex, index)
    highlighted += renderSchemaToken(token)
    lastIndex = index + token.length
  }

  return highlighted + value.slice(lastIndex)
}

function renderSchemaToken(token: string): string {
  if (token.startsWith('"')) {
    return `<span style="color:#ce9178">${token}</span>`
  }

  if (token === "|") {
    return '<span style="color:#569cd6">|</span>'
  }

  if (/^[{}[\]]$/.test(token)) {
    return `<span style="color:#da70d6">${token}</span>`
  }

  return `<span style="color:#4ec9b0">${token}</span>`
}

// --- Zod → TypeScript 타입 문자열 변환 (Kwep zodUtils.ts 기반) ---

function unwrapEffects(schema: ZodTypeAny): ZodTypeAny {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (schema as any)._def
  const inner = def?.schema ?? def?.in ?? def?.innerType

  if (inner && getZodKind(def) === "effects") {
    return unwrapEffects(inner as ZodTypeAny)
  }

  return schema
}

function getZodKind(def: unknown): string {
  if (typeof def !== "object" || def === null) {
    return ""
  }

  const zodDef = def as {
    readonly type?: string
    readonly typeName?: string
  }
  const rawKind = zodDef.typeName ?? zodDef.type ?? ""

  return rawKind.replace(/^Zod/, "").toLowerCase()
}

function zodToTypeStr(schema: ZodTypeAny, depth = 0): string {
  const unwrapped = unwrapEffects(schema)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (unwrapped as any)._def
  const kind = getZodKind(def)
  const indent = "  ".repeat(depth)
  const childIndent = "  ".repeat(depth + 1)

  switch (kind) {
    case "string":
      return "string"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "any":
      return "any"
    case "unknown":
      return "unknown"
    case "never":
      return "never"
    case "null":
      return "null"
    case "undefined":
      return "undefined"
    case "literal": {
      const values = def.values ?? [def.value]

      return (values as unknown[])
        .map((value) => JSON.stringify(value))
        .join(" | ")
    }
    case "enum": {
      const values =
        def.values ??
        (def.entries === undefined
          ? []
          : Object.values(def.entries as Record<string, string>))

      return (values as string[]).map((v) => JSON.stringify(v)).join(" | ")
    }
    case "optional":
      return zodToTypeStr(def.innerType as ZodTypeAny, depth)
    case "nullable": {
      const inner = zodToTypeStr(def.innerType as ZodTypeAny, depth)

      return `${inner} | null`
    }
    case "default":
      return zodToTypeStr(def.innerType as ZodTypeAny, depth)
    case "array": {
      const el = zodToTypeStr((def.element ?? def.type) as ZodTypeAny, depth)

      return el.includes(" | ") ? `(${el})[]` : `${el}[]`
    }
    case "tuple": {
      const items = (def.items as ZodTypeAny[]).map((i) =>
        zodToTypeStr(i, depth)
      )

      return `[${items.join(", ")}]`
    }
    case "union":
    case "discriminatedunion": {
      const opts = (def.options as ZodTypeAny[]).map((o) =>
        zodToTypeStr(o, depth)
      )

      return opts.join(" | ")
    }
    case "intersection": {
      const l = zodToTypeStr(def.left as ZodTypeAny, depth)
      const r = zodToTypeStr(def.right as ZodTypeAny, depth)

      return `${l} & ${r}`
    }
    case "record": {
      const val = zodToTypeStr(
        (def.valueType ?? def.value) as ZodTypeAny,
        depth
      )

      return `Record<string, ${val}>`
    }
    case "object": {
      const rawShape = def.shape
      const shape: Record<string, ZodTypeAny> =
        typeof rawShape === "function"
          ? (rawShape() as Record<string, ZodTypeAny>)
          : ((rawShape ?? {}) as Record<string, ZodTypeAny>)

      if (Object.keys(shape).length === 0) {
        return "{}"
      }

      const fields = Object.entries(shape).map(([key, val]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vDef = (val as any)._def
        const isOpt = getZodKind(vDef) === "optional"
        const inner = isOpt ? (vDef.innerType as ZodTypeAny) : val
        const typeStr = zodToTypeStr(inner, depth + 1)

        return `${childIndent}${key}${isOpt ? "?" : ""}: ${typeStr};`
      })

      return `{\n${fields.join("\n")}\n${indent}}`
    }
    default: {
      const fallbackInner =
        def?.schema ?? def?.in ?? def?.innerType ?? def?.type

      if (fallbackInner && fallbackInner !== schema) {
        return zodToTypeStr(fallbackInner as ZodTypeAny, depth)
      }

      return kind ? `/* ${kind} */` : "?"
    }
  }
}
