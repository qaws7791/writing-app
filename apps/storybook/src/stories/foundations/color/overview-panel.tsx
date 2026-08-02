import { ColorSwatch } from "./color-swatch"
import {
  colorRules,
  semanticTokens,
  tokenGroups,
  tokensByGroup,
} from "./token-data"

export function OverviewPanel() {
  return (
    <div className="grid max-w-5xl gap-10">
      <section className="grid gap-4">
        <h2 className="text-heading-sm font-black text-fg-default">
          제품 색상 규칙
        </h2>
        <ul className="grid gap-2">
          {colorRules.map((rule) => (
            <li
              className="flex gap-3 text-body-md font-medium text-fg-muted"
              key={rule}
            >
              <span aria-hidden className="text-fg-subtle">
                —
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4">
        <h2 className="text-heading-sm font-black text-fg-default">
          역할 그룹
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {tokenGroups.map((group) => (
            <div
              className="grid gap-1 rounded-panel border border-border/50 bg-bg-surface p-4"
              key={group.id}
            >
              <h3 className="text-title-md font-black text-fg-default">
                {group.title}
              </h3>
              <p className="text-body-sm font-medium text-fg-muted">
                {group.description}
              </p>
              <p className="font-mono text-caption font-bold text-fg-muted">
                {tokensByGroup(group.id)
                  .map((token) => token.token)
                  .join(", ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-heading-sm font-black text-fg-default">
          토큰 미리보기
        </h2>
        <p className="text-body-sm font-medium text-fg-muted">
          전체 인벤토리와 hex, 복사 UX는 Semantic Tokens 스토리에서 확인한다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {semanticTokens.slice(0, 4).map((token) => (
            <ColorSwatch key={token.token} token={token} />
          ))}
        </div>
      </section>
    </div>
  )
}

export function SemanticTokenGroups() {
  return (
    <div className="grid gap-12">
      {tokenGroups.map((group) => {
        const tokens = tokensByGroup(group.id)

        return (
          <section className="grid gap-4" key={group.id}>
            <header className="grid gap-1 border-b border-border/50 pb-3">
              <h2 className="text-heading-sm font-black text-fg-default">
                {group.title}
              </h2>
              <p className="text-body-sm font-medium text-fg-muted">
                {group.description}
              </p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tokens.map((token) => (
                <ColorSwatch key={token.token} token={token} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
