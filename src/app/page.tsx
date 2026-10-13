import { HomeScreen } from "@/components/screens/home-screen";
import { PageTransition } from "@/components/page-transition";
import { getStations } from "@/lib/data";
import { nationalSummary } from "@/lib/national";

export default async function HomePage() {
  // Jalur "Malaysia sekarang" di skrin alu-aluan (HTML statik, dijana semula bersama cache stesen).
  const national = await getStations()
    .then(nationalSummary)
    .catch(() => null);
  return (
    <PageTransition>
      <HomeScreen national={national} />
    </PageTransition>
  );
}
