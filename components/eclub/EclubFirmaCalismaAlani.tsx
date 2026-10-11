"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle2, Clock3, Trophy } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useHataMesaji, HataMesajiContainer } from "@/components/HataMesaji";
import { EclubKisiSayfa, EclubKisiBaslik, EclubKisiStat, EclubKisiYukleniyor, EclubKisiBosDurum } from "./EclubKisiSayfa";
import { EclubFirmaSecimi } from "./EclubFirmaSecimi";
import { SadeKontrolGrubu, SadeKontrolButonu } from "@/components/kontrol/SadeKontroller";
import { eclubSeciliUrun, eclubUrunYolu, type EclubFirmaSayfasi, type EclubFirmaUrunu, type EclubGezinmeFirmasi } from "@/lib/eclub/firmaGezinme";
import { useEclubPanel } from "@/app/(panel)/eclub/panel/_hooks/useEclubPanel";
import Yayinlar from "@/app/(panel)/eclub/ana-sayfa/page";
import HediyeCekiTalebi from "@/app/(panel)/eclub/store/page";
import HediyeCekiTakibi from "@/app/(panel)/eclub/cek-taleplerim/page";

const YayinPerformansi = dynamic(() => import("./EclubYayinPerformansi"));

const SEKMELER: { deger: EclubFirmaSayfasi; etiket: string }[] = [
  { deger: "yayinlar", etiket: "Yayınlar" },
  { deger: "performans", etiket: "Yayın Tamamlama Performansı" },
  { deger: "hediye-cekleri", etiket: "Hediye Çeki Talebi" },
  { deger: "cek-talepleri", etiket: "Hediye Çeki Takibi" },
];

export default function EclubFirmaCalismaAlani({ sekme }: { sekme: EclubFirmaSayfasi }) {
  const { firma_id: firmaId } = useParams<{ firma_id: string }>();
  const router = useRouter();
  const sorgu = useSearchParams();
  const { kullanici, yukleniyor } = useAuth();
  const { mesajlar, hata } = useHataMesaji();
  const hazir = !yukleniyor && kullanici?.kimlik_turu === "eclub_kisi";
  const panel = useEclubPanel({ hazir, hata, firmaId });
  const [veri, setVeri] = useState<{ firmaId: string; firma: EclubGezinmeFirmasi; urunler: EclubFirmaUrunu[] } | null>(null);
  const [basarisizFirma, setBasarisizFirma] = useState<string | null>(null);
  const [aksiyonAlani, setAksiyonAlani] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hazir) return;
    const controller = new AbortController();
    void fetch(`/eclub/firmalar/api?firma_id=${encodeURIComponent(firmaId)}`, { signal: controller.signal }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.hata ?? "Firma yüklenemedi.");
      if (!controller.signal.aborted) setVeri({ firmaId, firma: data.firma, urunler: data.urunler ?? [] });
    }).catch((error) => {
      if (!controller.signal.aborted) { setBasarisizFirma(firmaId); hata(error instanceof Error ? error.message : "Firma yüklenemedi."); }
    });
    return () => controller.abort();
  }, [hazir, firmaId, hata]);
  const seciliOneri = panel.oneriler.find((oneri) => oneri.oneri_id === sorgu.get("oneri_id"));
  const seciliUrun = eclubSeciliUrun(veri?.firmaId === firmaId ? veri.urunler : [], sorgu.get("urun_id") ?? seciliOneri?.urun_id ?? null);
  const firma = veri?.firmaId === firmaId ? veri.firma : null;
  // Eski çek bildirimlerindeki talep_id, takip içeriği tarafından ürününe çözülür.
  if (basarisizFirma === firmaId && !firma) return <EclubKisiSayfa><Link href="/eclub/firmalar">Firmalara Dön</Link><HataMesajiContainer mesajlar={mesajlar} /></EclubKisiSayfa>;
  if (!firma || panel.loading) return <EclubKisiYukleniyor />;
  const firmaOzeti = panel.firmaOzetleri.find((ozet) => ozet.firma_id === firmaId);
  const tamamlanan = panel.oneriler.filter((oneri) => oneri.izlendi_mi).length;
  const bekleyen = panel.oneriler.filter((oneri) => !oneri.izlendi_mi && oneri.oneri_durumu !== "suresi_gecmis").length;
  const gorunenSekmeler = SEKMELER.filter((secenek) => ["yayinlar", "performans"].includes(secenek.deger) || firma.eclub_store_aktif);
  return <EclubKisiSayfa>
    <Link href="/eclub/firmalar" className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[#237ac8]"><ArrowLeft size={14} /> Firmalara Dön</Link>
    <EclubKisiBaslik ikon={Building2} ustEtiket="" baslik={firma.firma_adi} aciklama="Ürünü seçerek yayınları, tamamlama performansını, hediye çeki talebini ve takibini görüntüleyin."
      aksiyon={<div ref={setAksiyonAlani} className="ml-auto flex justify-end" />} />
    {sekme !== "performans" && <section aria-label="Firma özeti" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <EclubKisiStat ikon={Clock3} etiket="Bekleyen İçerik" deger={bekleyen} detay="Süresi devam eden" renk="#d78022" zemin="#fff6e8" />
      <EclubKisiStat ikon={CheckCircle2} etiket="Tamamlanan" deger={tamamlanan} detay="Tamamladığınız içerikler" renk="#16865f" zemin="#ebf8f2" />
      <EclubKisiStat ikon={Trophy} etiket="Net Puan" deger={Math.max(0, (firmaOzeti?.kazanilan_puan ?? 0) - (firmaOzeti?.kaybedilen_puan ?? 0)).toLocaleString("tr-TR")} detay={`${firmaOzeti?.dogru_cevap ?? 0} doğru · ${firmaOzeti?.kaybedilen_puan ?? 0} ileri sarma kaybı`} renk="#7358c7" zemin="#f2efff" />
    </section>}
    {veri?.urunler.length ? <>
      <SadeKontrolGrubu tur="sekme" role="tablist" aria-label="Ürünler" className="!flex-nowrap overflow-x-auto">
        {veri.urunler.map((urun) => <SadeKontrolButonu key={urun.urun_id} role="tab" aria-selected={seciliUrun?.urun_id === urun.urun_id} aria-controls="eclub-urun-icerigi" tabIndex={seciliUrun?.urun_id === urun.urun_id ? 0 : -1}
          onClick={() => router.push(eclubUrunYolu(firmaId, sekme, urun.urun_id), { scroll: false })}>{urun.urun_adi}</SadeKontrolButonu>)}
      </SadeKontrolGrubu>
      <SadeKontrolGrubu aria-label="İçerik türü" className="max-w-full self-start !flex-nowrap overflow-x-auto">
        {gorunenSekmeler.map((secenek) => <SadeKontrolButonu key={secenek.deger} aria-pressed={sekme === secenek.deger}
          onClick={() => router.push(eclubUrunYolu(firmaId, secenek.deger, seciliUrun?.urun_id ?? null), { scroll: false })}>{secenek.etiket}</SadeKontrolButonu>)}
      </SadeKontrolGrubu>
      <div id="eclub-urun-icerigi" role="tabpanel" aria-label={seciliUrun?.urun_adi}>
        <EclubFirmaSecimi.Provider value={{ gomulu: true, urunId: seciliUrun?.urun_id ?? null, urunAdi: seciliUrun?.urun_adi ?? null, panel, aksiyonAlani }}>
          {sekme === "yayinlar" ? <Yayinlar /> : sekme === "performans" ? <YayinPerformansi /> : firma.eclub_store_aktif ? (sekme === "hediye-cekleri" ? <HediyeCekiTalebi /> : <HediyeCekiTakibi />) :
            <EclubKisiBosDurum ikon={Building2} baslik="Hediye çeki alanı kapalı" aciklama="Bu firma hediye çeki özelliğini kullanmıyor." />}
        </EclubFirmaSecimi.Provider>
      </div>
    </> : <EclubKisiBosDurum ikon={Building2} baslik="Ürün bulunmuyor" aciklama="Firmanın ürünleri eklendiğinde burada görüntülenir." />}
    <HataMesajiContainer mesajlar={mesajlar} />
  </EclubKisiSayfa>;
}
