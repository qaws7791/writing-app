export function shadcnParameters(component: string) {
  const docsUrl = `https://ui.shadcn.com/docs/components/base/${component}`
  const exampleUrl = `https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases/base/examples/${component}-example.tsx`

  return {
    docs: {
      description: {
        component: [
          `Official docs: [${component}](${docsUrl})`,
          `Registry example: [${component}-example.tsx](${exampleUrl})`,
          "This story adapts the official guidance to the local `@workspace/ui` package.",
        ].join("\n\n"),
      },
    },
  } as const
}
