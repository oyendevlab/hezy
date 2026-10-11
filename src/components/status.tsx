"use client";

/** Blok rangka semasa memuatkan. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-surface animate-pulse rounded-2xl motion-reduce:animate-none ${className}`}
    />
  );
}

export function Notice({
  tone = "neutral",
  children,
  action,
}: {
  tone?: "neutral" | "warning";
  children: React.ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
        tone === "warning"
          ? "bg-ipu-tidak-sihat-tint text-ipu-tidak-sihat-ink"
          : "bg-surface text-ink"
      }`}
    >
      <span>{children}</span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="bg-ink text-page min-h-11 rounded-xl px-4 text-sm font-semibold"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
