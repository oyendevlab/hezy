import webpush, { WebPushError } from "web-push";

/**
 * web-push 3.6.7 (terkini) masih memanggil `url.parse()`, jadi Node 24 mengeluarkan amaran
 * DEP0169 pada hantaran pertama setiap instans dan Vercel melabelnya "error" (18 Okt 2026).
 * Amaran itu tidak berbahaya; hanya kod DEP0169 disenyapkan, amaran lain kekal.
 */
export function silenceUrlParseDeprecation(target: NodeJS.Process = process) {
  const marked = target as NodeJS.Process & { __hezyDep0169?: true };
  if (marked.__hezyDep0169) return;
  marked.__hezyDep0169 = true;
  const original = target.emitWarning.bind(target);
  target.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
    const [typeOrOptions, code] = rest;
    const warningCode =
      typeof typeOrOptions === "object" && typeOrOptions !== null
        ? (typeOrOptions as { code?: unknown }).code
        : code;
    if (warningCode === "DEP0169") return;
    (original as (...args: unknown[]) => void)(warning, ...rest);
  }) as NodeJS.Process["emitWarning"];
}

silenceUrlParseDeprecation();

export { webpush, WebPushError };
