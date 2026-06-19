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
  apiCannotImportDb:
    "apps/api must depend on packages/core, not packages/db. Move DB access behind the core interface.",
  apiCannotImportDrizzle:
    "apps/api must not import Drizzle directly. DB implementation belongs behind packages/core -> packages/db.",
  browserCannotImportCore:
    "Browser apps must import request/response contracts from packages/contracts, not packages/core runtime modules.",
  contractsCannotImportCore:
    "packages/contracts must stay independent from packages/core runtime modules.",
  dbCannotImportCore:
    "packages/db must not import packages/core when enforcing apps/api -> packages/core -> packages/db.",
}

export const noInvalidWorkspaceDependencyRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce the apps/api -> packages/core -> packages/db dependency direction.",
    },
    messages: workspaceDependencyMessages,
  },
  create(context) {
    function reportInvalidDependency(node) {
      const source = readModuleSpecifier(node)

      if (source === null) {
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
    }
  },
}

export function readWorkspaceDependencyMessageId({ filename, source }) {
  const normalizedFilename = filename.replaceAll("\\", "/")

  if (isInWorkspacePath(normalizedFilename, "apps/api/")) {
    if (isWorkspaceDbImport(source)) {
      return "apiCannotImportDb"
    }

    if (isDrizzleImport(source)) {
      return "apiCannotImportDrizzle"
    }
  }

  if (
    (isInWorkspacePath(normalizedFilename, "apps/web/") ||
      isInWorkspacePath(normalizedFilename, "apps/admin/")) &&
    isWorkspaceCoreImport(source)
  ) {
    return "browserCannotImportCore"
  }

  if (
    isInWorkspacePath(normalizedFilename, "packages/contracts/") &&
    isWorkspaceCoreImport(source)
  ) {
    return "contractsCannotImportCore"
  }

  if (
    isInWorkspacePath(normalizedFilename, "packages/db/") &&
    isWorkspaceCoreImport(source)
  ) {
    return "dbCannotImportCore"
  }

  return null
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

function readModuleSpecifier(node) {
  const source = node.source

  if (typeof source?.value === "string") {
    return source.value
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
