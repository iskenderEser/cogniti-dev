import type { Metadata } from "next";
import RenkKarsilastirma from "../renk-demo/RenkKarsilastirma";

export const metadata: Metadata = {
  title: "Navbar tema seçicisi demosu | HapBilgi",
  robots: { index: false, follow: false },
};

export default function TemaSeciciDemoSayfasi() {
  return <RenkKarsilastirma navbarDili />;
}
