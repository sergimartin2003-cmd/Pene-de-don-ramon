import type { MetadataRoute } from "next";

import { listProducts } from "@/lib/store";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts();

  return [
    { url: site.url, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/tienda`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/estudio`, changeFrequency: "monthly", priority: 0.5 },
    ...products.map((product) => ({
      url: `${site.url}/producto/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
