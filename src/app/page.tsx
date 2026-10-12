import { HomeScreen } from "@/components/screens/home-screen";
import { PageTransition } from "@/components/page-transition";

export default function HomePage() {
  return (
    <PageTransition>
      <HomeScreen />
    </PageTransition>
  );
}
