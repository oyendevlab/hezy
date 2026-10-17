/**
 * `fetch` dengan satu cubaan semula (v0.8.10) untuk ralat sementara sumber luar: rangkaian, tamat
 * masa, HTTP 429 dan 5xx (cth. APIMS memulangkan 502 pada 17 Okt 2026, 8 pagi). Ralat lain
 * (cth. 404) dipulangkan terus tanpa cubaan semula.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit & { timeoutMs: number },
  retryDelayMs = 600,
): Promise<Response> {
  const { timeoutMs, ...rest } = init;
  const attempt = () =>
    fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
  try {
    const res = await attempt();
    if (res.status !== 429 && res.status < 500) return res;
  } catch {
    // Rangkaian atau tamat masa: cuba sekali lagi di bawah.
  }
  await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  return attempt();
}
