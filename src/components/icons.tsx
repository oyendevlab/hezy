import {
  ChartLineUp,
  House,
  MapPin,
  SlidersHorizontal,
  type Icon,
} from "@phosphor-icons/react";
import type { NavIconName } from "@/lib/nav";

const ICONS: Record<NavIconName, Icon> = {
  home: House,
  trend: ChartLineUp,
  pin: MapPin,
  settings: SlidersHorizontal,
};

/** Ikon navigasi (Phosphor): terisi bila aktif, garis biasa bila tidak. */
export function NavIcon({
  name,
  active = false,
  size = 24,
}: {
  name: NavIconName;
  active?: boolean;
  size?: number;
}) {
  const Glyph = ICONS[name];
  return (
    <Glyph
      aria-hidden="true"
      size={size}
      weight={active ? "fill" : "regular"}
      data-active={active ? "true" : "false"}
    />
  );
}
