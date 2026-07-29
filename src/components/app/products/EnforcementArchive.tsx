"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { EnforcementHistoryItem } from "@/lib/products/queries";
import { formatDateShort } from "@/lib/utils/format";

const TYPE_LABELS: Record<string, string> = {
  warning_letter: "Warning Letter",
  recall: "Recall",
  safety_alert: "Safety Alert",
  import_alert: "Import Alert",
};

/**
 * Historical WLs/recalls touching this product's ingredients or naming its
 * brand — context, not alerts, so everything here is deliberately muted.
 */
export default function EnforcementArchive({ items }: { items: EnforcementHistoryItem[] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="mt-8">
      <h2 className="font-mono text-[10px] uppercase tracking-wider text-text-secondary mb-1">
        Enforcement Archive ({items.length})
      </h2>
      <p className="text-[11px] text-text-secondary/80 mb-3">
        Past FDA enforcement mentioning this product&apos;s brand or ingredients.
        Archive covers warning letters from 2021 and recalls from 2024.
      </p>

      <motion.div
        className="space-y-1.5"
        variants={shouldReduceMotion ? undefined : { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        initial="hidden"
        animate="show"
      >
        {items.map((item) => (
          <motion.a
            key={item.id}
            href={`/app/items/${item.id}?from=products`}
            variants={shouldReduceMotion ? undefined : { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
            whileHover={shouldReduceMotion ? undefined : { y: -1, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="block border border-border border-l-2 border-l-slate-300 rounded bg-white px-3 py-2.5"
          >
            <div className="flex items-start gap-3">
              <span className="font-mono text-[11px] text-text-secondary shrink-0 w-16">
                {formatDateShort(item.published_date)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-serif font-semibold text-slate-700 leading-snug truncate">
                  {item.title}
                </p>
                <p className="font-mono text-[10px] text-text-secondary mt-0.5">
                  {TYPE_LABELS[item.item_type] ?? item.item_type}
                  {" · "}
                  {item.matched_on === "name" ? "brand mention" : "ingredient match"}
                </p>
              </div>
            </div>
          </motion.a>
        ))}
      </motion.div>
    </section>
  );
}
