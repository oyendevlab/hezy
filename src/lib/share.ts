import { ipuCategory, type IpuCategoryKey } from "./ipu";

export type ShareData = {
  name: string;
  ipu: number;
  category: IpuCategoryKey;
  label: string;
  source: "apims" | "model";
};

const MAX_NAME = 40;

/** Laluan halaman kongsi, cth. `/kongsi?n=Shah+Alam&i=72&s=apims`. */
export function buildSharePath(data: {
  name: string;
  ipu: number;
  source: "apims" | "model";
}): string {
  const params = new URLSearchParams({
    n: data.name.slice(0, MAX_NAME),
    i: String(Math.round(data.ipu)),
    s: data.source,
  });
  return `/kongsi?${params}`;
}

/**
 * Sahkan parameter kongsi daripada URL. Kategori sentiasa dikira semula daripada IPU,
 * dan nama dibersihkan, supaya pautan tidak boleh memaparkan kandungan sewenang-wenangnya.
 */
export function parseShare(
  params: Record<string, string | string[] | undefined>,
): ShareData | null {
  const one = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) ?? "";
  const ipu = Number(one(params.i));
  if (!Number.isInteger(ipu) || ipu < 0 || ipu > 999) return null;
  const name = one(params.n)
    .replace(/[\u0000-\u001f\u007f<>]/g, "")
    .trim()
    .slice(0, MAX_NAME);
  if (!name) return null;
  const category = ipuCategory(ipu);
  return {
    name,
    ipu,
    category: category.key,
    label: category.label,
    source: one(params.s) === "apims" ? "apims" : "model",
  };
}
