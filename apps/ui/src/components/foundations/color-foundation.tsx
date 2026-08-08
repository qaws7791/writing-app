"use client";

import { ContrastPairCard } from "@/src/components/foundations/color/contrast-pair-card";
import {
  OverviewPanel,
  SemanticTokenGroups,
} from "@/src/components/foundations/color/overview-panel";
import { contrastPairs } from "@/src/components/foundations/color/token-data";

type ColorFoundationProps = {
  section: "overview" | "semantic-tokens" | "contrast-pairs";
};

export default function ColorFoundation({ section }: ColorFoundationProps) {
  if (section === "overview") return <OverviewPanel />;
  if (section === "semantic-tokens") return <SemanticTokenGroups />;

  return (
    <div className="grid max-w-5xl gap-4">
      {contrastPairs.map((pair) => (
        <ContrastPairCard key={pair.role} pair={pair} />
      ))}
    </div>
  );
}
