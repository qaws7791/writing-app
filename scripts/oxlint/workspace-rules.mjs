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

export default {
  meta: {
    name: "workspace",
  },
  rules: {
    "no-unsafe-unknown-cast": noUnsafeUnknownCastRule,
  },
}
