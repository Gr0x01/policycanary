"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

/** Opens the Stripe customer portal (update card, view invoices, cancel). */
export default function BillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error?.message ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePortal}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-sm text-amber font-medium hover:text-amber-action transition-colors duration-150 disabled:opacity-70"
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        Manage billing
      </button>
      {error && <p className="text-xs text-urgent mt-1">{error}</p>}
    </div>
  );
}
