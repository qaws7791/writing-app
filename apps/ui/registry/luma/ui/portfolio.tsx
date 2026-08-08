import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type PortfolioVisibility = "private" | "cohort" | "public";

const PORTFOLIO_VISIBILITY_LABELS: Record<PortfolioVisibility, string> = {
  private: "비공개",
  cohort: "코호트",
  public: "공개",
};

function Portfolio({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="portfolio"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  );
}

function PortfolioHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="portfolio-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function PortfolioTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="portfolio-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function PortfolioMeta({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="portfolio-meta"
      className={cn("text-xs tabular-nums text-muted-foreground", className)}
      {...props}
    />
  );
}

function PortfolioList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul data-slot="portfolio-list" className={cn("flex flex-col gap-2", className)} {...props} />
  );
}

const portfolioPieceVariants = cva(
  "flex flex-col gap-2 rounded-2xl border px-3.5 py-3.5 transition-colors duration-150",
  {
    variants: {
      visibility: {
        private: "border-border/70 bg-card",
        cohort: "border-border/80 bg-card",
        public: "border-foreground/10 bg-foreground/[0.02]",
      },
    },
    defaultVariants: {
      visibility: "private",
    },
  },
);

function PortfolioPiece({
  className,
  visibility = "private",
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof portfolioPieceVariants> & {
    visibility?: PortfolioVisibility;
  }) {
  return (
    <li
      data-slot="portfolio-piece"
      data-visibility={visibility}
      className={cn(portfolioPieceVariants({ visibility }), className)}
      {...props}
    />
  );
}

function PortfolioPieceTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="portfolio-piece-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function PortfolioPieceMeta({
  className,
  visibility,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  visibility?: PortfolioVisibility;
}) {
  return (
    <div
      data-slot="portfolio-piece-meta"
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    >
      {visibility !== undefined && (
        <span className="font-medium tracking-[0.02em]">
          {PORTFOLIO_VISIBILITY_LABELS[visibility]}
        </span>
      )}
      {children}
    </div>
  );
}

function PortfolioPieceExcerpt({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="portfolio-piece-excerpt"
      className={cn("line-clamp-3 text-xs leading-5 text-pretty text-muted-foreground", className)}
      {...props}
    />
  );
}

function PortfolioPieceFeedback({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="portfolio-piece-feedback"
      className={cn(
        "rounded-xl border border-border/60 bg-surface/50 px-3 py-2 text-xs leading-5 text-pretty text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function PortfolioPieceActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="portfolio-piece-actions"
      className={cn("flex flex-wrap items-center gap-2 pt-0.5", className)}
      {...props}
    />
  );
}

export {
  Portfolio,
  PortfolioHeader,
  PortfolioTitle,
  PortfolioMeta,
  PortfolioList,
  PortfolioPiece,
  PortfolioPieceTitle,
  PortfolioPieceMeta,
  PortfolioPieceExcerpt,
  PortfolioPieceFeedback,
  PortfolioPieceActions,
  portfolioPieceVariants,
  PORTFOLIO_VISIBILITY_LABELS,
  type PortfolioVisibility,
};
