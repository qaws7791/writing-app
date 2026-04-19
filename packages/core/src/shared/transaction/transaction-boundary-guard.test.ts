import ts from "typescript"
import { describe, expect, it } from "vitest"

const MUTATING_REPOSITORY_METHODS = new Set([
  "bookmark",
  "create",
  "delete",
  "enrollJourney",
  "initSessionProgressForJourney",
  "saveSessionStepAiState",
  "startSession",
  "unbookmark",
  "update",
  "updateJourneyProgress",
  "updateSessionProgress",
  "updateStep",
  "updateSession",
])

function collectUseCaseFiles(directory: string): string[] {
  const entries = ts.sys.readDirectory(directory, [".ts"], undefined, undefined)
  const files: string[] = []

  for (const entry of entries) {
    if (entry.endsWith("/index.ts") || entry.endsWith("\\index.ts")) {
      continue
    }

    files.push(entry)
  }

  return files
}

function getReceiverName(expression: ts.Expression): string | null {
  if (ts.isIdentifier(expression)) {
    return expression.text
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return expression.name.text
  }

  return null
}

function isInsideTransactionManagerRun(node: ts.Node): boolean {
  let current: ts.Node | undefined = node

  while (current) {
    if (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
      const parent: ts.Node = current.parent

      if (
        ts.isCallExpression(parent) &&
        parent.arguments[0] === current &&
        ts.isPropertyAccessExpression(parent.expression) &&
        parent.expression.name.text === "run" &&
        getReceiverName(parent.expression.expression) === "transactionManager"
      ) {
        return true
      }
    }

    current = current.parent
  }

  return false
}
function isFunctionLike(node: ts.Node): node is ts.FunctionLikeDeclaration {
  return (
    ts.isArrowFunction(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isMethodDeclaration(node)
  )
}

function collectUnsafeMutatingCallsInFunction(
  node: ts.FunctionLikeDeclaration,
  sourceFile: ts.SourceFile
): string[] {
  const findings: string[] = []

  function visit(current: ts.Node) {
    if (current !== node && isFunctionLike(current)) {
      return
    }

    if (
      ts.isCallExpression(current) &&
      ts.isPropertyAccessExpression(current.expression)
    ) {
      const methodName = current.expression.name.text
      const receiverName = getReceiverName(current.expression.expression)

      if (
        receiverName?.endsWith("Repository") &&
        MUTATING_REPOSITORY_METHODS.has(methodName) &&
        !isInsideTransactionManagerRun(current)
      ) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(
          current.getStart()
        )
        findings.push(
          `${sourceFile.fileName}:${line + 1} ${receiverName}.${methodName}`
        )
      }
    }

    ts.forEachChild(current, visit)
  }

  visit(node)
  return findings
}

function collectViolations(filePath: string): string[] {
  const source = ts.sys.readFile(filePath)

  if (!source) {
    return []
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
  const violations: string[] = []

  function visit(node: ts.Node) {
    if (isFunctionLike(node)) {
      const findings = collectUnsafeMutatingCallsInFunction(node, sourceFile)

      if (findings.length > 1) {
        violations.push(
          `${filePath}\n${findings.map((finding) => `- ${finding}`).join("\n")}`
        )
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

describe("transaction boundary guard", () => {
  it("does not allow multiple mutating repository calls outside transactionManager.run", () => {
    const modulesDirectory = new globalThis.URL(
      "../../modules",
      import.meta.url
    ).pathname
      .replace(/^\/([A-Za-z]:)/, "$1")
      .replace(/\//g, "\\")
    const useCaseFiles = collectUseCaseFiles(modulesDirectory)
      .filter((filePath) => filePath.includes("\\use-cases\\"))
      .filter((filePath) => filePath.endsWith(".ts"))
    const violations = useCaseFiles.flatMap(collectViolations)

    expect(
      violations,
      violations.length === 0
        ? undefined
        : `트랜잭션 밖 다중 쓰기 금지 위반:\n${violations.join("\n\n")}`
    ).toHaveLength(0)
  })
})
