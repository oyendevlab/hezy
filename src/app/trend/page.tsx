import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Trend" };

export default function TrendPage() {
  return (
    <ComingSoon title="Trend">
      Graf 24 jam, masa terbaik untuk keluar dan purata pagi, petang dan malam
      akan dibina dalam Fasa 3.
    </ComingSoon>
  );
}
