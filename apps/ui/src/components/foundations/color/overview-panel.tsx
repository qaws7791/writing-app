import { ColorSwatch } from "./color-swatch";
import { colorRules, semanticTokens, tokenGroups, tokensByGroup } from "./token-data";

export function OverviewPanel() {
  return (
    <div className="grid max-w-5xl gap-10">
      <section className="grid gap-4">
        <h2 className="font-heading text-2xl font-semibold text-foreground">제품 색상 규칙</h2>
        <ul className="grid gap-2">
          {colorRules.map((rule) => (
            <li className="flex gap-3 text-base font-normal text-muted-foreground" key={rule}>
              <span aria-hidden className="text-muted-foreground/70">
                —
              </span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4">
        <h2 className="font-heading text-2xl font-semibold text-foreground">역할 그룹</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {tokenGroups.map((group) => (
            <div
              className="grid gap-1 rounded-4xl border border-border/80 bg-card p-5 shadow-xs"
              key={group.id}
            >
              <h3 className="font-heading text-lg font-semibold text-foreground">{group.title}</h3>
              <p className="text-sm font-normal text-muted-foreground">{group.description}</p>
              <p className="font-mono text-xs font-medium text-muted-foreground">
                {tokensByGroup(group.id)
                  .map((token) => token.token)
                  .join(", ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="font-heading text-2xl font-semibold text-foreground">토큰 미리보기</h2>
        <p className="text-sm font-normal text-muted-foreground">
          전체 인벤토리와 hex, 복사 UX는 Semantic Tokens 섹션에서 확인한다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {semanticTokens.slice(0, 4).map((token) => (
            <ColorSwatch key={token.token} token={token} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function SemanticTokenGroups() {
  return (
    <div className="grid gap-12">
      {tokenGroups.map((group) => {
        const tokens = tokensByGroup(group.id);

        return (
          <section className="grid gap-4" key={group.id}>
            <header className="grid gap-1 border-b border-border/50 pb-3">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{group.title}</h2>
              <p className="text-sm font-normal text-muted-foreground">{group.description}</p>
            </header>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tokens.map((token) => (
                <ColorSwatch key={token.token} token={token} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
