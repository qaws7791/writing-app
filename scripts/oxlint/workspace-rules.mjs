import {
  isForbiddenCoreCapabilityContractSource,
  readCoreCapabilityImportViolation,
} from "../architecture/core-capability-policy.mjs"

const noUnsafeUnknownCastRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow double assertions through unknown.",
    },
    messages: {
      unsafeUnknownCast:
        "'as unknown as T' bypasses type safety. Use branded constructors (toUserId, etc.) or .$type<>() in the Drizzle schema.",
    },
  },
  create(context) {
    return {
      "TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']"(
        node
      ) {
        context.report({
          node,
          messageId: "unsafeUnknownCast",
        })
      },
    }
  },
}

const workspaceDependencyMessages = {
  apiTransportCannotImportDb:
    "API transport modules must not import packages/db. Inject an application port from the executable composition root.",
  apiTransportCannotImportDrizzle:
    "API transport modules must not import Drizzle. Keep persistence in an executable adapter.",
  browserCannotImportCore:
    "Browser apps must import request/response contracts from packages/contracts, not packages/core runtime modules.",
  browserCannotImportDb:
    "Browser apps must not import packages/db. Access data through an HTTP application boundary.",
  browserCannotImportDrizzle:
    "Browser apps must not import Drizzle. Access data through an HTTP application boundary.",
  contractsCannotImportCore:
    "packages/contracts must stay independent from packages/core runtime modules.",
  coreCannotImportUnapprovedCapability:
    "packages/core capability modules must not import another capability through an unapproved #core/modules path. Use canonical shared contracts or an exact reviewed public API/application port edge.",
  coreCannotImportNonCanonicalCapabilityContract:
    "packages/core must import learning and admin contracts only from canonical data entrypoints. Keep transport and legacy contract sources in executable HTTP adapters.",
  coreCannotUseComputedDynamicImport:
    "packages/core must not use computed dynamic imports. Use a static module specifier so dependency boundaries remain enforceable.",
  coreCannotImportDb:
    "packages/core must depend on application ports, not packages/db runtime primitives. Compose persistence in an executable app.",
  coreCannotImportRuntimeFramework:
    "packages/core must stay independent from runtime frameworks and SDKs. Keep concrete runtime adapters in an executable app.",
  dbCannotImportCore:
    "packages/db must stay a stable storage primitive and must not import packages/core business policy.",
}

export const noInvalidWorkspaceDependencyRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce browser, transport, application, and persistence dependency boundaries.",
    },
    messages: workspaceDependencyMessages,
  },
  create(context) {
    function reportInvalidDependency(node) {
      const source = readModuleSpecifier(node)

      if (source === null) {
        if (
          node.type === "ImportExpression" &&
          isInWorkspacePath(
            context.filename.replaceAll("\\", "/"),
            "packages/core/"
          )
        ) {
          context.report({
            node,
            messageId: "coreCannotUseComputedDynamicImport",
          })
        }

        return
      }

      const messageId = readWorkspaceDependencyMessageId({
        filename: context.filename,
        source,
      })

      if (messageId === null) {
        return
      }

      context.report({
        node,
        messageId,
      })
    }

    return {
      ExportAllDeclaration: reportInvalidDependency,
      ExportNamedDeclaration: reportInvalidDependency,
      ImportDeclaration: reportInvalidDependency,
      ImportExpression: reportInvalidDependency,
      TSImportEqualsDeclaration: reportInvalidDependency,
      TSImportType: reportInvalidDependency,
    }
  },
}

export function readWorkspaceDependencyMessageId({ filename, source }) {
  const normalizedFilename = filename.replaceAll("\\", "/")

  if (isApiTransportPath(normalizedFilename)) {
    if (isWorkspaceDbImport(source)) {
      return "apiTransportCannotImportDb"
    }

    if (isDrizzleImport(source)) {
      return "apiTransportCannotImportDrizzle"
    }
  }

  if (
    isInWorkspacePath(normalizedFilename, "apps/web/") ||
    isInWorkspacePath(normalizedFilename, "apps/admin/")
  ) {
    if (isWorkspaceCoreImport(source)) {
      return "browserCannotImportCore"
    }

    if (isWorkspaceDbImport(source)) {
      return "browserCannotImportDb"
    }

    if (isDrizzleImport(source)) {
      return "browserCannotImportDrizzle"
    }
  }

  if (
    isInWorkspacePath(normalizedFilename, "packages/contracts/") &&
    isWorkspaceCoreImport(source)
  ) {
    return "contractsCannotImportCore"
  }

  if (isInWorkspacePath(normalizedFilename, "packages/core/")) {
    if (
      readCoreCapabilityImportViolation({
        moduleSource: source,
        sourcePath: normalizedFilename,
      }) !== null
    ) {
      return "coreCannotImportUnapprovedCapability"
    }

    if (isForbiddenCoreCapabilityContractSource(source)) {
      return "coreCannotImportNonCanonicalCapabilityContract"
    }

    if (isWorkspaceDbImport(source)) {
      return "coreCannotImportDb"
    }

    if (isCoreRuntimeFrameworkImport(source)) {
      return "coreCannotImportRuntimeFramework"
    }
  }

  if (
    isInWorkspacePath(normalizedFilename, "packages/db/") &&
    isWorkspaceCoreImport(source)
  ) {
    return "dbCannotImportCore"
  }

  return null
}

function isApiTransportPath(filename) {
  const sourcePath = filename.match(/\/(?:apps\/)?api\/src\/(.+)$/u)?.[1]

  if (sourcePath === undefined) {
    return false
  }

  return (
    sourcePath === "app.ts" ||
    sourcePath.startsWith("admin/") ||
    sourcePath.startsWith("http/") ||
    sourcePath.startsWith("middleware/") ||
    sourcePath.startsWith("routes/") ||
    /^modules\/[^/]+\/[^/]+\.routes?\.ts$/u.test(sourcePath)
  )
}

function isInWorkspacePath(filename, workspacePath) {
  return (
    filename.includes(`/${workspacePath}`) || filename.startsWith(workspacePath)
  )
}

function isWorkspaceDbImport(source) {
  return source === "@workspace/db" || source.startsWith("@workspace/db/")
}

function isWorkspaceCoreImport(source) {
  return source === "@workspace/core" || source.startsWith("@workspace/core/")
}

function isDrizzleImport(source) {
  return source === "drizzle-orm" || source.startsWith("drizzle-orm/")
}

function isCoreRuntimeFrameworkImport(source) {
  return [
    "better-auth",
    "drizzle-orm",
    "hono",
    "@hono",
    "@mastra",
    "@workspace/ui",
    "next",
    "openai",
    "react",
  ].some(
    (packageName) =>
      source === packageName || source.startsWith(`${packageName}/`)
  )
}

function readModuleSpecifier(node) {
  const source =
    node.type === "TSImportEqualsDeclaration"
      ? node.moduleReference?.expression
      : node.source

  if (typeof source?.value === "string") {
    return source.value
  }

  if (
    source?.type === "TemplateLiteral" &&
    source.expressions.length === 0 &&
    source.quasis.length === 1
  ) {
    const value = source.quasis[0]?.value.cooked

    return typeof value === "string" ? value : null
  }

  if (typeof source?.raw === "string") {
    return source.raw.slice(1, -1)
  }

  return null
}

export default {
  meta: {
    name: "workspace",
  },
  rules: {
    "no-invalid-workspace-dependency": noInvalidWorkspaceDependencyRule,
    "no-unsafe-unknown-cast": noUnsafeUnknownCastRule,
  },
}
