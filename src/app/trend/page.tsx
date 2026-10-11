import type { Metadata } from "next";
import { TrendScreen } from "@/components/screens/trend-screen";

export const metadata: Metadata = { title: "Trend" };

export default function TrendPage() {
  return <TrendScreen />;
}
