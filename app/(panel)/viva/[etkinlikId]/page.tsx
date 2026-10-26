import VivaEkrani from "@/components/viva/VivaEkrani";
import { vivaDetayBolumu, vivaListeKaynagi } from "@/lib/viva/detay";
export default async function Page({ params, searchParams }: { params: Promise<{ etkinlikId: string }>; searchParams: Promise<{ bolum?: string | string[]; kaynak?: string | string[] }> }) {
  const [{ etkinlikId }, { bolum, kaynak }] = await Promise.all([params, searchParams]);
  return <VivaEkrani key={etkinlikId} gorunum="detay" etkinlikId={etkinlikId} ilkBolum={vivaDetayBolumu(bolum)} listeKaynagi={vivaListeKaynagi(kaynak)} />;
}
