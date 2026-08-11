# Luma UI documentation (internal)

- Astro Demo Site
- Consumes `@workspace/ui` React components

# Monorepo integration

- `packages/shared/ui` owns shared runtime design tokens, styles, UI, blocks, and hooks.
- `apps/ui` consumes `@workspace/ui` and owns only Astro documentation styles and demo theme presets.
- `apps/ui` owns the internal Astro documentation site only. It does not package or publish an external shadcn registry.
- The root `package.json` and root `bun.lock` own active workspace dependencies.
- `upstream-bun.lock.snapshot`, `upstream-oxfmtrc.snapshot`, and
  `upstream-package.snapshot` preserve upstream integration inputs.
- Product apps must not connect documentation block fixtures to production data.

# DESIGN

Always read `DESIGN.md` for design and component work.

Load only the additional contract required by the task:

- Components, blocks, previews, and component docs: `design/COMPONENTS.md`
- Public APIs, tokens, releases, or breaking changes: `design/GOVERNANCE.md`
- Learning paths, lessons, steps, and learning activities: `design/LEARNING.md`
- AI content, provenance, permissions, environments, or high-risk actions: `design/AI_AND_RISK.md`
- Final verification for new components or large changes: `design/QUALITY.md`
- External product or pattern research: `design/REFERENCES.md`
- Component documentation and examples: `DOCS_GUIDELINES.md`

When multiple conditions apply, read all matching documents. Do not load every design document by default.
