import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/registry/luma/lib/utils";

type ItemBankItemStatus = "draft" | "ready" | "retired";

const ITEM_BANK_ITEM_STATUS_LABELS: Record<ItemBankItemStatus, string> = {
  draft: "초안",
  ready: "사용 가능",
  retired: "퇴출",
};

function ItemBank({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="item-bank"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    />
  );
}

function ItemBankHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="item-bank-header"
      className={cn("flex items-baseline justify-between gap-3", className)}
      {...props}
    />
  );
}

function ItemBankTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-bank-title"
      className={cn("text-sm font-medium tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function ItemBankFilters({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-bank-filters"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function ItemBankList({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul data-slot="item-bank-list" className={cn("flex flex-col gap-1", className)} {...props} />
  );
}

const itemBankItemVariants = cva(
  "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 rounded-2xl border px-3.5 py-3",
  {
    variants: {
      status: {
        draft: "border-border/70 bg-card hover:bg-muted/30",
        ready: "border-border/70 bg-card",
        retired: "border-border/50 bg-muted/30 opacity-70",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  },
);

function ItemBankItem({
  className,
  status = "draft",
  children,
  ...props
}: React.ComponentProps<"li"> &
  VariantProps<typeof itemBankItemVariants> & {
    status?: ItemBankItemStatus;
  }) {
  return (
    <li
      data-slot="item-bank-item"
      data-status={status}
      className={cn(itemBankItemVariants({ status }), className)}
      {...props}
    >
      {children}
    </li>
  );
}

function ItemBankItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-bank-item-title"
      className={cn(
        "col-start-1 row-start-1 text-sm font-medium tracking-[-0.01em] text-pretty",
        className,
      )}
      {...props}
    />
  );
}

function ItemBankItemMeta({
  className,
  status,
  children,
  ...props
}: React.ComponentProps<"p"> & {
  status?: ItemBankItemStatus;
}) {
  return (
    <p
      data-slot="item-bank-item-meta"
      data-status={status}
      className={cn(
        "col-start-1 row-start-2 text-[11px] tabular-nums text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children ?? (status ? ITEM_BANK_ITEM_STATUS_LABELS[status] : undefined)}
    </p>
  );
}

function ItemBankItemTags({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="item-bank-item-tags"
      className={cn("col-start-1 row-start-3 flex flex-wrap gap-1.5", className)}
      {...props}
    />
  );
}

function ItemBankItemTag({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="item-bank-item-tag"
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ItemBankItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-bank-item-actions"
      className={cn("col-start-2 row-span-3 flex shrink-0 items-start gap-1", className)}
      {...props}
    />
  );
}

export {
  ItemBank,
  ItemBankHeader,
  ItemBankTitle,
  ItemBankFilters,
  ItemBankList,
  ItemBankItem,
  ItemBankItemTitle,
  ItemBankItemMeta,
  ItemBankItemTags,
  ItemBankItemTag,
  ItemBankItemActions,
  itemBankItemVariants,
  ITEM_BANK_ITEM_STATUS_LABELS,
  type ItemBankItemStatus,
};
