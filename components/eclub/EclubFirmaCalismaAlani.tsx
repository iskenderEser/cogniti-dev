"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle2, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useHataMesaji, HataMesajiContainer } from "@/components/HataMesaji";
import { EclubKisiSayfa, EclubKisiBaslik, EclubKisiStat, EclubKisiYukleniyor, EclubKisiBosDurum } from "./EclubKisiSayfa";
import { EclubFirmaSecimi } from "./EclubFirmaSecimi";
import { SadeKontrolGrubu, SadeKontrolButonu } from "@/components/kontrol/SadeKontroller";
import { eclubFirmaYolu, eclubSeciliUrun, type EclubFirmaSayfasi, type EclubFirmaUrunu, type EclubGezinmeFirmasi } from "@/lib/eclub/firmaGezinme";
import { eclubFirmaUrunSecimineAboneOl, eclubFirmaUrunSeciminiOku, eclubFirmaUrunSeciminiYaz } from "@/lib/eclub/firmaUrunSecimi";
import { useEclubPanel } from "@/app/(panel)/eclub/panel/_hooks/useEclubPanel";
import Yayinlar from "@/app/(panel)/eclub/ana-sayfa/page";
import { sayfaOkumaOnbellegiOlustur } from "@/lib/panel/sayfaOkumaOnbellegi";
import { firmaBannerlariniIste } from "@/lib/eclub/firmaBannerOnbellek";
import { eclubFirmaYayinSayilari } from "@/lib/eclub/firmaYayinSayilari";
import YayinPerformansi from "./EclubYayinPerformansi";
import EclubFirmaCekTakibiSkeleton from "./EclubFirmaCekTakibiSkeleton";
import EclubFirmaCekTalebiSkeleton from "./EclubFirmaCekTalebiSkeleton";
import EclubFirmaPerformansSkeleton from "./EclubFirmaPerformansSkeleton";
import EclubFirmaYayinlarSkeleton from "./EclubFirmaYayinlarSkeleton";


const HediyeCekiTalebi = dynamic(() => import("@/app/(panel)/eclub/store/page"));
const HediyeCekiTakibi = dynamic(() => import("@/app/(panel)/eclub/cek-taleplerim/page"));
type FirmaVerisi = { firmaId: string; firma: EclubGezinmeFirmasi; urunler: EclubFirmaUrunu[] };
const firmaOnbellegi = sayfaOkumaOnbellegiOlustur<FirmaVerisi>("firma_yayinlar");

const SEKMELER: { deger: EclubFirmaSayfasi; etiket: string }[] = [
  { deger: "yayinlar", etiket: "Yayınlar" },
  { deger: "performans", etiket: "Yayın Tamamlama Performansı" },
  { deger: "hediye-cekleri", etiket: "Hediye Çeki Talebi" },
  { deger: "cek-talepleri", etiket: "Hediye Çeki Takibi" },
];

export default function EclubFirmaCalismaAlani({ sekme }: { sekme: EclubFirmaSayfasi }) {
  const { firma_id: firmaRotasi } = useParams<{ firma_id: string }>();
  const { kullanici, yukleniyor } = useAuth();
  if (yukleniyor || !kullanici || kullanici.kimlik_turu !== "eclub_kisi") {
    return sekme === "cek-talepleri" ? <EclubFirmaCekTakibiSkeleton /> : sekme === "hediye-cekleri" ? <EclubFirmaCekTalebiSkeleton /> : sekme === "performans" ? <EclubFirmaPerformansSkeleton /> : sekme === "yayinlar" ? <EclubFirmaYayinlarSkeleton /> : <EclubKisiYukleniyor />;
  }
  return <FirmaCalismaAlaniIcerigi key={`${kullanici.id}:${firmaRotasi}`} sekme={sekme} firmaRotasi={firmaRotasi} kullaniciId={kullanici.id} />;
}

function FirmaCalismaAlaniIcerigi({ sekme, firmaRotasi, kullaniciId }: { sekme: EclubFirmaSayfasi; firmaRotasi: string; kullaniciId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sorgu = useSearchParams();
  const { mesajlar, hata } = useHataMesaji();
  const hizliYayinlar = sekme === "yayinlar";
  const cacheKey = `${kullaniciId}:${firmaRotasi}`;
  const [veri, setVeri] = useState<FirmaVerisi | null>(() => {
    const kayit = firmaOnbellegi.oku(cacheKey, 300_000);
    return kayit?.firmaId === firmaRotasi && kayit.firma?.firma_id && Array.isArray(kayit.urunler) ? kayit : null;
  });
  const firmaId = veri?.firmaId === firmaRotasi ? veri.firma.firma_id : undefined;
  const panel = useEclubPanel({ hazir: true, hata, firmaRotasi,
    acilistaArkaPlandaYenile: true, onbellekKullaniciId: kullaniciId });
  const [basarisizFirma, setBasarisizFirma] = useState<string | null>(null);
  const [aksiyonAlani, setAksiyonAlani] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    let aktif = true;
    if (sekme === "cek-talepleri") void import("@/app/(panel)/eclub/cek-taleplerim/page").catch(() => undefined);
    if (sekme === "hediye-cekleri") void import("@/app/(panel)/eclub/store/page").catch(() => undefined);
    if (hizliYayinlar) void firmaBannerlariniIste(kullaniciId, firmaRotasi).catch(() => undefined);
    const yukle = async (): Promise<FirmaVerisi> => {
      const res = await fetch(`/eclub/firmalar/api?firma=${encodeURIComponent(firmaRotasi)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.hata ?? "Firma yüklenemedi.");
      if (!data.firma?.firma_id || !Array.isArray(data.urunler)) throw new Error("Firma bilgisi alınamadı.");
      return { firmaId: firmaRotasi, firma: data.firma, urunler: data.urunler ?? [] };
    };
    const istek = firmaOnbellegi.iste(cacheKey, yukle);
    void istek.then((sonuc) => {
      if (aktif) setVeri(sonuc);
    }).catch((error) => {
      if (aktif) { setVeri(null); setBasarisizFirma(firmaRotasi); hata(error instanceof Error ? error.message : "Firma yüklenemedi."); }
    });
    return () => { aktif = false; };
  }, [sekme, hizliYayinlar, firmaRotasi, hata, kullaniciId, cacheKey]);
  const firma = veri?.firmaId === firmaRotasi ? veri.firma : null;
  const secimAnahtari = firma && kullaniciId ? `eclub_firma_urun:${kullaniciId}:${firma.firma_id}` : null;
  const kayitliUrunId = useSyncExternalStore(eclubFirmaUrunSecimineAboneOl, useCallback(() => eclubFirmaUrunSeciminiOku(secimAnahtari), [secimAnahtari]), () => null);
  const seciliOneri = panel.oneriler.find((oneri) => oneri.oneri_id === sorgu.get("oneri_id"));
  const seciliUrun = eclubSeciliUrun(veri?.firmaId === firmaRotasi ? veri.urunler : [], sorgu.get("urun_id") ?? seciliOneri?.urun_id ?? kayitliUrunId);
  const urunSec = useCallback((urunId: string) => {
    if (!secimAnahtari) return;
    eclubFirmaUrunSeciminiYaz(secimAnahtari, urunId);
  }, [secimAnahtari]);
  useEffect(() => {
    if (!firma) return;
    const hedef = eclubFirmaYolu(firma.firma_adi, sekme);
    if (pathname !== hedef || sorgu.has("urun_id")) {
      if (seciliUrun) urunSec(seciliUrun.urun_id);
      const temizSorgu = new URLSearchParams(sorgu.toString());
      temizSorgu.delete("urun_id");
      const query = temizSorgu.toString();
      router.replace(`${hedef}${query ? `?${query}` : ""}`, { scroll: false });
    }
  }, [firma, sekme, pathname, sorgu, router, seciliUrun, urunSec]);
  // Eski çek bildirimlerindeki talep_id, takip içeriği tarafından ürününe çözülür.
  if (basarisizFirma === firmaRotasi && !firma) return <EclubKisiSayfa><Link href="/eclub/firmalar">Firmalara Dön</Link><HataMesajiContainer mesajlar={mesajlar} /></EclubKisiSayfa>;
  if (!firma || (sekme !== "performans" && sekme !== "hediye-cekleri" && sekme !== "cek-talepleri" && panel.loading)) return sekme === "cek-talepleri" ? <EclubFirmaCekTakibiSkeleton /> : sekme === "hediye-cekleri" ? <EclubFirmaCekTalebiSkeleton /> : sekme === "performans" ? <EclubFirmaPerformansSkeleton /> : hizliYayinlar ? <EclubFirmaYayinlarSkeleton /> : <EclubKisiYukleniyor />;
  const firmaOzeti = panel.firmaOzetleri.find((ozet) => ozet.firma_id === firmaId);
  const tamamlanan = panel.oneriler.filter((oneri) => oneri.izlendi_mi).length;
  const firmaYayinSayilari = eclubFirmaYayinSayilari(panel.oneriler).get(firma.firma_id) ?? { yeni: 0, toplam: 0 };
  const yeniYayinlar = firmaYayinSayilari.yeni;
  const gorunenSekmeler = SEKMELER.filter((secenek) => ["yayinlar", "performans"].includes(secenek.deger) || firma.eclub_store_aktif);
  return <EclubKisiSayfa>
    <Link href="/eclub/firmalar" className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[var(--tema-yerel-eclub-eylem-metin-01)]"><ArrowLeft size={14} /> Firmalara Dön</Link>
    <EclubKisiBaslik ikon={Building2} ustEtiket="" baslik={firma.firma_adi} aciklama="Ürünü seçerek yayınları, tamamlama performansını, hediye çeki talebini ve takibini görüntüleyin."
      baslikAlti={<div aria-busy={panel.loading} className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[var(--tema-yerel-eclub-ana-metin-02)]">
        <span>Yeni Yayın <strong className="text-[var(--tema-yerel-eclub-ana-metin-06)]">{panel.loading ? "…" : `${firmaYayinSayilari.yeni} adet`}</strong></span>
        <span>Toplam Yayın <strong className="text-[var(--tema-yerel-eclub-ana-metin-06)]">{panel.loading ? "…" : `${firmaYayinSayilari.toplam} adet`}</strong></span>
      </div>}
      aksiyon={<div ref={setAksiyonAlani} className="ml-auto flex justify-end" />} />
    {sekme !== "performans" && (panel.loading ? <section aria-label="Firma özeti yükleniyor" aria-busy="true" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[0, 1, 2].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--tema-yerel-eclub-secim-zemin-18)]" aria-hidden="true" />)}
    </section> : <section aria-label="Firma özeti" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <EclubKisiStat ikon={Sparkles} etiket="Yeni Yayınlar" deger={yeniYayinlar} detay="Tamamlanmayı bekleyenler" renk="var(--tema-yerel-eclub-islevsel-metin-43)" zemin="var(--tema-yerel-eclub-islevsel-zemin-01)" />
      <EclubKisiStat ikon={CheckCircle2} etiket="Tamamlananlar" deger={tamamlanan} detay="Tamamladığınız içerikler" renk="var(--tema-yerel-eclub-islevsel-metin-02)" zemin="var(--tema-yerel-eclub-islevsel-zemin-02)" />
      <EclubKisiStat ikon={Trophy} etiket="Net Puan" deger={Math.max(0, (firmaOzeti?.kazanilan_puan ?? 0) - (firmaOzeti?.kaybedilen_puan ?? 0)).toLocaleString("tr-TR")} detay={`${firmaOzeti?.dogru_cevap ?? 0} doğru · ${firmaOzeti?.kaybedilen_puan ?? 0} ileri sarma kaybı`} renk="var(--tema-yerel-eclub-islevsel-metin-44)" zemin="var(--tema-yerel-eclub-islevsel-zemin-29)" />
    </section>)}
    {veri?.urunler.length ? <>
      <SadeKontrolGrubu tur="sekme" role="tablist" aria-label="Ürünler" className="!flex-nowrap overflow-x-auto">
        {veri.urunler.map((urun) => <SadeKontrolButonu key={urun.urun_id} role="tab" aria-selected={seciliUrun?.urun_id === urun.urun_id} aria-controls="eclub-urun-icerigi" tabIndex={seciliUrun?.urun_id === urun.urun_id ? 0 : -1}
          onClick={() => urunSec(urun.urun_id)}>{urun.urun_adi}</SadeKontrolButonu>)}
      </SadeKontrolGrubu>
      <SadeKontrolGrubu aria-label="İçerik türü" className="max-w-full self-start !flex-nowrap overflow-x-auto">
        {gorunenSekmeler.map((secenek) => <SadeKontrolButonu key={secenek.deger} aria-pressed={sekme === secenek.deger}
          onClick={() => {
            if (seciliUrun) urunSec(seciliUrun.urun_id);
            router.push(eclubFirmaYolu(firma.firma_adi, secenek.deger), { scroll: false });
          }}>{secenek.etiket}</SadeKontrolButonu>)}
      </SadeKontrolGrubu>
      <div id="eclub-urun-icerigi" role="tabpanel" aria-label={seciliUrun?.urun_adi}>
        <EclubFirmaSecimi.Provider value={{ firmaId: firma.firma_id, gomulu: true, urunId: seciliUrun?.urun_id ?? null, urunAdi: seciliUrun?.urun_adi ?? null, panel, aksiyonAlani }}>
          {sekme === "yayinlar" ? <Yayinlar /> : sekme === "performans" ? <YayinPerformansi /> : firma.eclub_store_aktif ? (sekme === "hediye-cekleri" ? <HediyeCekiTalebi /> : <HediyeCekiTakibi />) :
            <EclubKisiBosDurum ikon={Building2} baslik="Hediye çeki alanı kapalı" aciklama="Bu firma hediye çeki özelliğini kullanmıyor." />}
        </EclubFirmaSecimi.Provider>
      </div>
    </> : <EclubKisiBosDurum ikon={Building2} baslik="Ürün bulunmuyor" aciklama="Firmanın ürünleri eklendiğinde burada görüntülenir." />}
    <HataMesajiContainer mesajlar={mesajlar} />
  </EclubKisiSayfa>;
}
