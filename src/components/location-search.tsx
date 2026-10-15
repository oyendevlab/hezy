"use client";

import { useId, useState } from "react";
import { searchAreas, type Area } from "@/lib/areas";
import { useI18n } from "@/lib/use-i18n";

type Result = Area & { state: string };

/** Medan carian kawasan dengan senarai hasil. */
export function LocationSearch({
  onPick,
  renderAction,
  autoFocus = false,
}: {
  onPick: (area: Result) => void;
  renderAction?: (area: Result) => React.ReactNode;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const results = searchAreas(query);
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        {t("Cari kawasan atau negeri")}
      </label>
      <div className="bg-surface flex min-h-12 items-center gap-2.5 rounded-2xl px-3.5">
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="text-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="20" y1="20" x2="16" y2="16" />
        </svg>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Cari kawasan atau negeri")}
          autoFocus={autoFocus}
          className="placeholder:text-muted min-w-0 flex-1 bg-transparent text-base font-medium outline-none"
        />
      </div>
      {query.trim() && (
        <ul className="divide-line border-line mt-2 divide-y overflow-hidden rounded-2xl border">
          {results.length === 0 && (
            <li className="text-muted px-4 py-3 text-sm">
              {t("Tiada kawasan sepadan.")}
            </li>
          )}
          {results.map((area) => (
            <li key={area.id} className="flex items-center gap-2 pr-2">
              <button
                type="button"
                onClick={() => {
                  onPick(area);
                  setQuery("");
                }}
                className="hover:bg-surface flex min-h-13 flex-1 flex-col justify-center px-4 text-left"
              >
                <span className="text-[15px] font-bold">{area.name}</span>
                <span className="text-muted text-xs font-medium">
                  {area.state}
                </span>
              </button>
              {renderAction?.(area)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
