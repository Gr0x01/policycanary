"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VerdictResolution } from "@/lib/products/queries";

interface AffectedProduct {
  id: string;
  name: string;
  resolution?: string | null;
}

const RESOLUTIONS: Array<{ value: Exclude<VerdictResolution, null>; label: string; activeLabel: string }> = [
  { value: "resolved", label: "Resolve", activeLabel: "Resolved" },
  { value: "watching", label: "Watch", activeLabel: "Watching" },
  { value: "not_applicable", label: "Not Applicable", activeLabel: "Not Applicable" },
];

/** Per-product resolve actions on the item full-report page. */
export default function ItemVerdictActions({ itemId, products }: { itemId: string; products: AffectedProduct[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve(productId: string, current: string | null | undefined, resolution: Exclude<VerdictResolution, null>) {
    setPendingId(productId);
    setError(null);
    try {
      const res = await fetch("/api/products/verdicts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          product_id: productId,
          // Clicking the active resolution clears it, same as the products view
          resolution: current === resolution ? null : resolution,
        }),
      });
      if (!res.ok) {
        setError("Couldn't save — please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't save — please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-2">
      {products.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 border border-border rounded px-3 py-2.5 bg-white"
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary min-w-0">
            <span className="h-1.5 w-1.5 rounded-full bg-canary shrink-0" />
            <span className="truncate">{p.name}</span>
          </span>
          <span className="flex-1" />
          <div className="flex items-center gap-1.5">
            {RESOLUTIONS.map((r) => {
              const active = p.resolution === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => handleResolve(p.id, p.resolution, r.value)}
                  disabled={pendingId === p.id}
                  className={`text-[12px] font-medium rounded px-2.5 py-1.5 border transition-colors disabled:opacity-50 ${
                    active
                      ? r.value === "watching"
                        ? "text-watch bg-watch/10 border-watch/30"
                        : "text-clear bg-clear/10 border-clear/30"
                      : "text-text-secondary border-border hover:text-text-primary hover:bg-surface-muted"
                  }`}
                >
                  {active ? r.activeLabel : r.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {error && <p className="text-xs text-urgent">{error}</p>}
    </div>
  );
}
