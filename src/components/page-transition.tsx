import { ViewTransition } from "react";

/**
 * Peralihan antara skrin (View Transitions). Jenis ditetapkan pada `<Link transitionTypes>`:
 * `nav-forward` / `nav-back` (masuk lebih dalam / kembali: gelongsor). Tukar tab sengaja tanpa
 * animasi (seperti bar tab aplikasi asli; pudar silang bertindih di Safari iOS). Tanpa jenis
 * (tab, butang kembali pelayar, muat semula) tiada animasi.
 * Mesti dalam setiap page.tsx — layout kekal antara navigasi jadi enter/exit tidak berlaku di sana.
 */
const TYPES = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={TYPES} exit={TYPES} default="none">
      {children}
    </ViewTransition>
  );
}
