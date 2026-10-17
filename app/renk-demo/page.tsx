import type { Metadata } from "next";
import RenkKarsilastirma from "./RenkKarsilastirma";

export const metadata: Metadata = {
  title: "HOYK renk karşılaştırması | HapBilgi",
  robots: { index: false, follow: false },
};

export default function RenkDemoSayfasi() {
  return <RenkKarsilastirma />;
}
