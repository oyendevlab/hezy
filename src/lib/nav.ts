export type NavIconName = "home" | "trend" | "pin" | "settings";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Utama", icon: "home" },
  { href: "/trend", label: "Trend", icon: "trend" },
  { href: "/lokasi", label: "Lokasi", icon: "pin" },
  { href: "/tetapan", label: "Tetapan", icon: "settings" },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
