"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ProductSidebarItem } from "@/lib/mock/products-data";
import { StatusDot, STATUS_TEXT_COLORS, type ProductStatusType } from "./ProductsLayout";

interface ProductSidebarProps {
  items: ProductSidebarItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  maxProducts: number;
}

const STATUS_FILTER_OPTIONS: { value: ProductStatusType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "action_required", label: "Action Required" },
  { value: "under_review", label: "Under Review" },
  { value: "watch", label: "Watch" },
  { value: "all_clear", label: "All Clear" },
];

export default function ProductSidebar({ items, selectedId, onSelect, onAdd, maxProducts }: ProductSidebarProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatusType | "all">("all");

  const atLimit = items.length >= maxProducts;

  const filtered = useMemo(() => {
    let result = items;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.brand?.toLowerCase().includes(q) ?? false)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    return result;
  }, [items, search, statusFilter]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-sans text-[11px] font-semibold text-text-secondary uppercase tracking-widest">
            Monitored Products
          </h2>
          <span className="font-mono text-[11px] text-text-secondary">{items.length}/{maxProducts}</span>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="px-3 pb-2 space-y-1.5">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-amber/40 focus:border-amber/40 placeholder:text-text-secondary/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProductStatusType | "all")}
          className="w-full px-2.5 py-1.5 text-[13px] bg-white border border-border rounded focus:outline-none focus:ring-1 focus:ring-amber/40 text-text-body appearance-none cursor-pointer"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Status: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Product list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-text-secondary">No products match</p>
            {(search || statusFilter !== "all") && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("all"); }}
                className="text-xs text-amber hover:underline mt-1"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filtered.map((item) => (
              <SidebarProductRow
                key={item.id}
                item={item}
                isSelected={item.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Product button — pinned bottom */}
      <div className="px-3 py-3 border-t border-border">
        {atLimit ? (
          <AtLimitAction maxProducts={maxProducts} />
        ) : (
          <button
            onClick={onAdd}
            className="w-full py-2 text-[13px] font-medium border border-dashed rounded transition-colors text-text-secondary border-border-strong hover:border-amber hover:text-amber"
          >
            + Add Product
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// At-limit action — free tier upgrades; paid tier buys a $10/mo slot
// ---------------------------------------------------------------------------

function AtLimitAction({ maxProducts }: { maxProducts: number }) {
  const isPaid = maxProducts >= 5;
  const [step, setStep] = useState<"idle" | "confirm" | "pending" | "error">("idle");

  if (!isPaid) {
    return (
      <a
        href="/app/feed?checkout=start"
        className="block w-full py-2 text-center text-[13px] font-semibold border rounded bg-canary/10 border-canary/30 text-amber-action hover:bg-canary/20 transition-colors"
      >
        Upgrade to add more products
      </a>
    );
  }

  async function handleAddSlot() {
    setStep("pending");
    try {
      const res = await fetch("/api/stripe/add-product-slot", { method: "POST" });
      if (!res.ok) {
        setStep("error");
        return;
      }
      // max_products changed server-side — reload picks up the new limit
      window.location.reload();
    } catch {
      setStep("error");
    }
  }

  return (
    <div>
      {step === "confirm" || step === "pending" ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddSlot}
            disabled={step === "pending"}
            className="flex-1 py-2 text-[13px] font-semibold border rounded bg-canary/10 border-canary/30 text-amber-action hover:bg-canary/20 transition-colors disabled:opacity-60"
          >
            {step === "pending" ? "Adding…" : "Confirm +$10/mo"}
          </button>
          <button
            onClick={() => setStep("idle")}
            disabled={step === "pending"}
            className="px-3 py-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setStep("confirm")}
          className="w-full py-2 text-[13px] font-medium border border-dashed rounded transition-colors text-text-secondary border-border-strong hover:border-amber hover:text-amber"
        >
          + Add product slot · $10/mo
        </button>
      )}
      {step === "error" && (
        <p className="text-[11px] text-urgent mt-1.5 text-center">
          Couldn&apos;t add a slot — check billing in Settings.
        </p>
      )}
      <p className="text-[11px] text-text-secondary/70 mt-1.5 text-center">
        Your plan currently covers {maxProducts} products
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar product row
// ---------------------------------------------------------------------------

function SidebarProductRow({
  item,
  isSelected,
  onSelect,
}: {
  item: ProductSidebarItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const statusColor = STATUS_TEXT_COLORS[item.status];

  const countLabel =
    item.status === "all_clear"
      ? null
      : item.status === "watch"
        ? `${item.activeMatchCount} watching`
        : `${item.activeMatchCount} active`;

  return (
    <motion.button
      onClick={() => onSelect(item.id)}
      whileHover={shouldReduceMotion || isSelected ? undefined : { x: 2 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 ${
        isSelected
          ? "bg-white shadow-sm ring-1 ring-slate-200/50"
          : "hover:bg-white/60"
      }`}
    >
      <StatusDot status={item.status} />
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] font-medium leading-snug truncate ${
            isSelected ? "text-slate-900" : "text-slate-700"
          }`}
        >
          {item.name}
        </p>
        <p className="text-[11px] text-text-secondary mt-0.5 truncate">
          {item.brand && <>{item.brand}</>}
          {countLabel && <>{item.brand && " · "}<span className={statusColor}>{countLabel}</span></>}
        </p>
      </div>
    </motion.button>
  );
}
