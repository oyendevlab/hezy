import { HomeScreen } from "@/components/screens/home-screen";
import { PageTransition } from "@/components/page-transition";
import { getStationsResult } from "@/lib/data";
import { nationalSummary } from "@/lib/national";

export default async function HomePage() {
  // Jalur "Malaysia sekarang" di skrin alu-aluan (HTML statik, dijana semula bersama cache stesen;
  // disembunyikan bila APIMS gagal, v0.8.13).
  const { stations } = await getStationsResult();
  const national = stations ? nationalSummary(stations) : null;
  return (
    <PageTransition>
      <HomeScreen national={national} />
    </PageTransition>
  );
}
