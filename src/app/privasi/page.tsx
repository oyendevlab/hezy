import type { Metadata } from "next";
import { PrivacyContent } from "@/components/privacy-content";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = {
  title: "Privasi",
  description:
    "Data yang disimpan oleh Hezy, berapa lama, dan cara memadamnya. Tiada akaun dan tiada kuki pengiklanan.",
  alternates: { canonical: "/privasi" },
};

export default function PrivasiPage() {
  return (
    <PageTransition>
      <PrivacyContent />
    </PageTransition>
  );
}
