import { formatContrastRatio, getContrastResult, wcagLabel, wcagPasses } from "./color-utils";
import type { ContrastPair } from "./token-data";
import { useThemeRevision } from "./use-theme-revision";

type ContrastPairCardProps = {
  pair: ContrastPair;
};

function WcagBadge({
  label,
  level,
}: {
  label: string;
  level: ReturnType<typeof getContrastResult> extends infer T
    ? T extends { levelLarge: infer L }
      ? L
      : never
    : never;
}) {
  const passes = wcagPasses(level);

  return (
    <span
      className={
        passes
          ? "rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success"
          : "rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive"
      }
    >
      {label}: {wcagLabel(level)}
    </span>
  );
}

export function ContrastPairCard({ pair }: ContrastPairCardProps) {
  const themeRevision = useThemeRevision();

  void themeRevision;
  const contrast = getContrastResult(pair.foregroundCssVar, pair.backgroundCssVar);

  return (
    <article className="grid gap-4 rounded-4xl border border-border/80 bg-card p-6 shadow-xs">
      <header className="grid gap-1">
        <h3 className="font-heading text-lg font-semibold text-foreground">{pair.label}</h3>
        <p className="text-sm font-normal text-muted-foreground">{pair.usage}</p>
        <p className="font-mono text-xs font-medium text-muted-foreground">{pair.role}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
        <div
          className="grid gap-3 rounded-3xl border border-border/80 p-5"
          style={{
            background: `var(${pair.backgroundCssVar})`,
            color: `var(${pair.foregroundCssVar})`,
          }}
        >
          <span className="text-xs font-semibold">미리보기</span>
          <strong className="font-heading text-lg font-semibold">{pair.label}</strong>
          <p className="text-sm font-medium">전경과 배경을 함께 쓰는 semantic pair다.</p>
          <span className="inline-flex w-fit rounded-xl border border-current/20 px-3 py-1.5 text-sm font-semibold">
            샘플 버튼
          </span>
        </div>

        <div className="grid content-start gap-2 rounded-3xl border border-border/80 bg-surface p-4 text-foreground">
          <p className="text-sm font-semibold text-muted-foreground">대비</p>
          <p className="font-mono text-lg font-semibold">
            {contrast ? formatContrastRatio(contrast.ratio) : "—"}
          </p>
          {contrast ? (
            <div className="flex flex-wrap gap-2">
              <WcagBadge label="일반" level={contrast.levelNormal} />
              <WcagBadge label="큰 텍스트" level={contrast.levelLarge} />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
