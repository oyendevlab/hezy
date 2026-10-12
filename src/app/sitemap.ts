import type { MetadataRoute } from "next";
import { STATES } from "@/lib/areas";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/trend", "/lokasi", "/negeri"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "hourly" as const,
    priority: path === "/" ? 1 : 0.6,
  }));
  const states = STATES.map((s) => ({
    url: `${SITE_URL}/negeri/${s.id}`,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));
  return [...pages, ...states];
}
