export const noUnsafeUnknownCastRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow double assertions through unknown.",
    },
    messages: {
      unsafeUnknownCast:
        "'as unknown as T' bypasses type safety. Use a validated constructor at the trust boundary.",
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

export const catchPreservesCauseRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require failures built inside a catch block to carry the caught cause.",
    },
    messages: {
      missingCause:
        "catch 블록에서 만드는 실패는 원인을 버리면 안 됩니다. err({ cause, kind: ... }) 형태로 cause를 담으세요.",
    },
  },
  create(context) {
    return {
      'CatchClause CallExpression[callee.name="err"]'(node) {
        const [argument] = node.arguments
        if (argument === undefined || argument.type !== "ObjectExpression") {
          return
        }
        const preservesCause = argument.properties.some(
          (property) =>
            property.type === "SpreadElement" ||
            (property.key !== undefined &&
              property.key !== null &&
              property.key.type === "Identifier" &&
              property.key.name === "cause")
        )
        if (preservesCause) return

        context.report({ node, messageId: "missingCause" })
      },
    }
  },
}

export const noDtoDomainAliasRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow aliasing wire DTO types as domain names in import declarations.",
    },
    messages: {
      dtoDomainAlias:
        "전송 DTO를 도메인 이름으로 별칭하지 마세요. lesson-view-model 또는 contracts 타입을 사용하세요.",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        if (!node.importKind?.includes("type") && node.importKind !== "type") {
          return
        }
        for (const specifier of node.specifiers) {
          if (
            specifier.type !== "ImportSpecifier" ||
            specifier.imported.type !== "Identifier" ||
            specifier.local.type !== "Identifier" ||
            specifier.imported.name === specifier.local.name
          ) {
            continue
          }
          if (!/Dto$/.test(specifier.imported.name)) continue
          if (!/^[A-Z]/.test(specifier.local.name)) continue
          context.report({ node: specifier, messageId: "dtoDomainAlias" })
        }
      },
    }
  },
}

export default {
  meta: {
    name: "workspace",
  },
  rules: {
    "catch-preserves-cause": catchPreservesCauseRule,
    "no-dto-domain-alias": noDtoDomainAliasRule,
    "no-unsafe-unknown-cast": noUnsafeUnknownCastRule,
  },
}
