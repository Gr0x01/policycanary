import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/auth";
import { getUserProducts, getMaxProducts, getUserProductStatuses } from "@/lib/products/queries";
import type { ProductSidebarItem } from "@/lib/mock/products-data";
import ProductsLayout from "@/components/app/products/ProductsLayout";

import { isDev, DEV_USER_ID } from "@/lib/dev";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ProductsPageProps {
  searchParams: Promise<{ product?: string; item?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const initialProductId = sp.product && UUID_RE.test(sp.product) ? sp.product : undefined;
  const initialItemId = sp.item && UUID_RE.test(sp.item) ? sp.item : undefined;
  let userId: string;
  if (isDev) {
    userId = DEV_USER_ID;
  } else {
    const user = await getAuthUser();
    if (!user) redirect("/login");
    userId = user.id;
  }

  const [products, maxProducts, productStatuses] = await Promise.all([
    getUserProducts(userId),
    getMaxProducts(userId).catch(() => 5),
    getUserProductStatuses(userId),
  ]);

  const sidebarItems: ProductSidebarItem[] = products.map((p) => {
    const summary = productStatuses.get(p.id);
    return {
      id: p.id,
      name: p.name,
      brand: p.brand,
      productType: p.product_type,
      status: summary?.status ?? "all_clear",
      activeMatchCount: summary?.activeCount ?? 0,
      lastScannedAt: summary?.lastEvaluatedAt ?? p.created_at,
    };
  });

  return (
    <ProductsLayout
      sidebarItems={sidebarItems}
      maxProducts={maxProducts}
      initialProductId={initialProductId}
      initialItemId={initialItemId}
    />
  );
}
