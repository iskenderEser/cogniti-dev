import type { Metadata } from "next";
import RehberDemo from "./RehberDemo";

export const metadata: Metadata = {
  title: "Kity · Hareketli rehber | HapBilgi",
  robots: { index: false, follow: false },
};

export default function RehberDemoSayfasi() {
  return <RehberDemo />;
}
