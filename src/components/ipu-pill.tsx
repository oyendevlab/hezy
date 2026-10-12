import { CATEGORY_STYLE } from "@/lib/category-style";
import type { IpuCategoryKey } from "@/lib/ipu";

export function IpuPill({
  category,
  label,
  className = "",
}: {
  category: IpuCategoryKey;
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${CATEGORY_STYLE[category].tint} ${className}`}
    >
      {label}
    </span>
  );
}
