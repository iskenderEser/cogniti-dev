import VivaEntegrasyonOnizleme from "@/components/viva/VivaEntegrasyonOnizleme";
import { vivaUuidMu } from "@/lib/viva/sozlesme";
export const metadata = { title: "Cogniti · Viva önizleme", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ searchParams }: { searchParams: Promise<{ etkinlik_id?: string | string[] }> }) {
  const p = await searchParams;
  return <VivaEntegrasyonOnizleme etkinlikId={vivaUuidMu(p.etkinlik_id) ? p.etkinlik_id : undefined} />;
}
