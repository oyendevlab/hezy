"use client";

import { DotsSixVertical, Trash } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import {
  moveFavourite,
  removeFavourite,
  updatePrefs,
  type SavedLocation,
} from "@/lib/prefs";
import { useI18n } from "@/lib/use-i18n";

/** Leret ke kiri melebihi jarak ini (px) untuk membuang. */
const SWIPE_DELETE_PX = 96;

/**
 * Senarai kegemaran: leret ke kiri untuk buang (sentuh), seret pemegang untuk susun semula.
 * Alternatif tanpa gerak isyarat: butang buang dalam setiap baris, dan anak panah pada pemegang.
 */
export function FavouriteList({
  favourites,
  renderRow,
}: {
  favourites: SavedLocation[];
  renderRow: (location: SavedLocation) => React.ReactNode;
}) {
  const { t } = useI18n();
  const items = useRef(new Map<string, HTMLLIElement>());
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const [drag, setDrag] = useState<{
    id: string;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    over: number;
  } | null>(null);
  const [announce, setAnnounce] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const canReorder = favourites.length > 1;

  // Kekalkan fokus pada pemegang selepas baris berpindah (DOM disusun semula).
  useEffect(() => {
    if (focusId) handles.current.get(focusId)?.focus();
  }, [focusId, favourites]);

  const move = (location: SavedLocation, to: number) => {
    const target = Math.min(Math.max(to, 0), favourites.length - 1);
    if (target === favourites.indexOf(location)) return;
    updatePrefs((p) => moveFavourite(p, location.id, target));
    setFocusId(location.id);
    setAnnounce(
      t("{name} dipindah ke kedudukan {n} daripada {total}", {
        name: t(location.name),
        n: target + 1,
        total: favourites.length,
      }),
    );
  };

  /** Indeks baris yang paling hampir dengan pusat baris yang sedang diseret. */
  const nearest = (id: string, dx: number, dy: number) => {
    const dragged = items.current.get(id)?.getBoundingClientRect();
    if (!dragged) return favourites.findIndex((f) => f.id === id);
    // Kotak semasa sudah dianjak `dx/dy` (transform), jadi pusatnya ialah kedudukan seretan.
    const cx = dragged.left + dragged.width / 2;
    const cy = dragged.top + dragged.height / 2;
    let best = 0;
    let bestDistance = Infinity;
    favourites.forEach((f, i) => {
      const rect = items.current.get(f.id)?.getBoundingClientRect();
      if (!rect) return;
      const own = f.id === id;
      const x = rect.left + rect.width / 2 - (own ? dx : 0);
      const y = rect.top + rect.height / 2 - (own ? dy : 0);
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    return best;
  };

  return (
    <>
      <ul
        data-testid="favourite-list"
        className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {favourites.map((f, index) => {
          const dragging = drag?.id === f.id;
          const target = drag && !dragging && drag.over === index;
          return (
            <SwipeRow
              key={f.id}
              ref={(el) => {
                if (el) items.current.set(f.id, el);
                else items.current.delete(f.id);
              }}
              deleteLabel={t("Buang")}
              onDelete={() => {
                updatePrefs((p) => removeFavourite(p, f.id));
                setAnnounce(
                  t("{name} dibuang daripada kegemaran", { name: t(f.name) }),
                );
              }}
              className={`${dragging ? "z-10 shadow-[0_10px_30px_rgb(0_0_0/0.2)]" : ""} ${target ? "ring-ink ring-2" : ""}`}
              style={
                dragging
                  ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` }
                  : undefined
              }
            >
              {canReorder && (
                <button
                  ref={(el) => {
                    if (el) handles.current.set(f.id, el);
                    else handles.current.delete(f.id);
                  }}
                  type="button"
                  aria-label={t(
                    "Susun semula {name}, kedudukan {n} daripada {total}. Guna anak panah atas atau bawah.",
                    { name: t(f.name), n: index + 1, total: favourites.length },
                  )}
                  onKeyDown={(e) => {
                    const step =
                      e.key === "ArrowUp" || e.key === "ArrowLeft"
                        ? -1
                        : e.key === "ArrowDown" || e.key === "ArrowRight"
                          ? 1
                          : 0;
                    if (!step) return;
                    e.preventDefault();
                    move(f, index + step);
                  }}
                  onPointerDown={(e) => {
                    // Seret pemegang tidak memulakan leretan baris.
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    setDrag({
                      id: f.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      dx: 0,
                      dy: 0,
                      over: index,
                    });
                  }}
                  onPointerMove={(e) => {
                    if (!drag || drag.id !== f.id) return;
                    const dx = e.clientX - drag.startX;
                    const dy = e.clientY - drag.startY;
                    setDrag({ ...drag, dx, dy, over: nearest(f.id, dx, dy) });
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    if (drag?.id === f.id) move(f, drag.over);
                    setDrag(null);
                  }}
                  onPointerCancel={() => setDrag(null)}
                  data-testid="reorder-handle"
                  className="text-muted hover:bg-line flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-full active:cursor-grabbing"
                >
                  <DotsSixVertical aria-hidden="true" size={20} weight="bold" />
                </button>
              )}
              {renderRow(f)}
            </SwipeRow>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {announce}
      </p>
    </>
  );
}

/** Baris yang boleh dileret ke kiri (sentuh sahaja) untuk mendedahkan dan melaksanakan "Buang". */
function SwipeRow({
  ref,
  children,
  onDelete,
  deleteLabel,
  className = "",
  style,
}: {
  ref: React.Ref<HTMLLIElement>;
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [offset, setOffset] = useState(0);
  const [settling, setSettling] = useState(false);
  // Leretan mendatar berlaku: klik yang menyusul tidak membuka lokasi.
  const swiped = useRef(false);
  const gesture = useRef<{
    x: number;
    y: number;
    axis: "x" | "y" | null;
  } | null>(null);

  const release = () => {
    if (!gesture.current) return;
    gesture.current = null;
    setSettling(true);
    if (offset <= -SWIPE_DELETE_PX) {
      setOffset(-480);
      window.setTimeout(onDelete, 180);
    } else {
      setOffset(0);
    }
  };

  return (
    <li
      ref={ref}
      style={style}
      className={`relative overflow-hidden rounded-[18px] ${className}`}
    >
      {offset < 0 && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-end gap-2 bg-[#c2382f] pr-5 text-sm font-bold text-white"
        >
          <Trash size={20} weight="bold" />
          {deleteLabel}
        </div>
      )}
      <div
        data-testid="swipe-row"
        onPointerDown={(e) => {
          if (e.pointerType !== "touch") return;
          setSettling(false);
          swiped.current = false;
          gesture.current = { x: e.clientX, y: e.clientY, axis: null };
        }}
        onPointerMove={(e) => {
          const g = gesture.current;
          if (!g) return;
          const dx = e.clientX - g.x;
          const dy = e.clientY - g.y;
          if (!g.axis) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
          }
          if (g.axis === "x") {
            swiped.current = true;
            setOffset(Math.min(0, dx));
          }
        }}
        onClickCapture={(e) => {
          if (!swiped.current) return;
          swiped.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onTransitionEnd={() => setSettling(false)}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
        className={`bg-surface relative flex touch-pan-y items-center gap-2 p-3.5 ${
          settling
            ? "transition-transform duration-200 motion-reduce:transition-none"
            : ""
        }`}
      >
        {children}
      </div>
    </li>
  );
}
