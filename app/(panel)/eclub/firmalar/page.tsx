"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Building2, ChartNoAxesColumnIncreasing, FileText } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useHataMesaji, HataMesajiContainer } from "@/components/HataMesaji";
import { EclubKisiSayfa, EclubKisiBaslik, EclubKisiBosDurum } from "@/components/eclub/EclubKisiSayfa";
import { eclubFirmaYolu, type EclubGezinmeFirmasi } from "@/lib/eclub/firmaGezinme";
import EclubFirmalarSkeleton from "@/components/eclub/EclubFirmalarSkeleton";
import { sayfaOkumaOnbellegiOlustur } from "@/lib/panel/sayfaOkumaOnbellegi";
import { useEclubPanel } from "../panel/_hooks/useEclubPanel";
import { eclubFirmaYayinSayilari } from "@/lib/eclub/firmaYayinSayilari";
import baykusGorseli from "@/public/eclub/sizin-yeriniz.png";

const firmaOnbellegi = sayfaOkumaOnbellegiOlustur<EclubGezinmeFirmasi[]>("eclub_firmalar");

export default function EclubFirmalarPage() {
  const { kullanici, yukleniyor } = useAuth();
  if (yukleniyor || !kullanici || kullanici.kimlik_turu !== "eclub_kisi") return <EclubFirmalarSkeleton />;
  return <EclubFirmalarIcerigi key={kullanici.id} kullaniciId={kullanici.id} />;
}

function EclubFirmalarIcerigi({ kullaniciId }: { kullaniciId: string }) {
  const { mesajlar, hata } = useHataMesaji();
  const panel = useEclubPanel({ hazir: true, hata, onbellekKullaniciId: kullaniciId, acilistaArkaPlandaYenile: true });
  const yayinSayilari = useMemo(() => eclubFirmaYayinSayilari(panel.oneriler), [panel.oneriler]);
  const [{ firmalar, loading }, setDurum] = useState(() => {
    const kayit = firmaOnbellegi.oku(kullaniciId);
    return { firmalar: Array.isArray(kayit) ? kayit : [], loading: !Array.isArray(kayit) };
  });
  useEffect(() => {
    let aktif = true;
    // Önbellek açılsa da aktif eczane–firma erişimi sunucuda yeniden doğrulanır.
    void firmaOnbellegi.iste(kullaniciId, async () => {
      const res = await fetch("/eclub/firmalar/api", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.hata ?? "Firmalar yüklenemedi.");
      if (!Array.isArray(data.firmalar)) throw new Error("Firma listesi alınamadı.");
      return data.firmalar ?? [];
    }).then((data) => {
      if (aktif) setDurum({ firmalar: data, loading: false });
    }).catch((error) => {
      if (aktif) {
        setDurum({ firmalar: [], loading: false });
        hata(error instanceof Error ? error.message : "Firmalar yüklenemedi.");
      }
    });
    return () => { aktif = false; };
  }, [kullaniciId, hata]);
  if (loading) return <EclubFirmalarSkeleton />;
  const ilkLogoId = firmalar.find((firma) => firma.logo_url)?.firma_id;
  return <EclubKisiSayfa>
    <EclubKisiBaslik ikon={Building2} ustEtiket="" baslik="Firmalar ve Yayınları" rehberAnahtar="eclub-firmalar" aciklama="Üyesi olduğunuz firmaların yayınlarını takip edebilir, tamamlanan yayınlardan ödül kazanabilirsiniz." />
    {firmalar.length === 0 ? <EclubKisiBosDurum ikon={Building2} baslik="Firma bulunmuyor" aciklama="Eczanenize bağlı aktif firmalar burada görüntülenir." /> :
      <section aria-label="Firmalar" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {firmalar.map((firma) => <Link key={firma.firma_id} href={eclubFirmaYolu(firma.firma_adi, "yayinlar")}
          className="flex min-w-0 flex-col rounded-[26px] border border-[var(--tema-yerel-eclub-cizgi-13)] bg-[var(--tema-yerel-eclub-kart-01)] p-3.5 shadow-[0_10px_28px_var(--tema-yerel-eclub-golge-02)] transition hover:-translate-y-0.5 hover:border-[var(--tema-yerel-eclub-cizgi-14)] hover:shadow-[0_14px_32px_var(--tema-yerel-eclub-golge-03)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--tema-yerel-eclub-odak-03)]">
          <div className="flex aspect-[2.3/1] w-full items-center justify-center overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_center,var(--tema-yerel-eclub-kart-02)_20%,var(--tema-yerel-eclub-secim-zemin-06)_100%)] p-4">
            {firma.logo_url ? <Image src={firma.logo_url} alt="" width={180} height={90} unoptimized
              loading={firma.firma_id === ilkLogoId ? "eager" : "lazy"}
              fetchPriority={firma.firma_id === ilkLogoId ? "high" : undefined}
              className="h-full w-full object-contain" /> :
              <Building2 size={40} className="text-[var(--tema-yerel-eclub-yardimci-metin-13)]" aria-hidden="true" />}
          </div>
          <h2 className="my-3 text-center text-xl font-extrabold leading-tight text-[var(--tema-yerel-eclub-ana-metin-08)]">{firma.firma_adi}</h2>
          <div className="mt-auto grid grid-cols-2 gap-2 border-t border-[var(--tema-yerel-eclub-cizgi-15)] pt-3">
            <div className="flex min-w-0 flex-col items-start rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-16)] bg-[var(--tema-yerel-eclub-sayfa-zemini-07)] p-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--tema-yerel-eclub-secim-zemin-07)] text-[var(--tema-yerel-eclub-ana-metin-09)]">
                <FileText size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="mt-2 text-[11px] font-semibold leading-tight text-[var(--tema-yerel-eclub-yardimci-metin-14)]">Yeni Yayın</span>
              <span className="mt-0.5 text-lg font-extrabold leading-tight tabular-nums text-[var(--tema-yerel-eclub-ana-metin-08)]">{panel.loading ? "—" : `${yayinSayilari.get(firma.firma_id)?.yeni ?? 0} adet`}</span>
            </div>
            <div className="flex min-w-0 flex-col items-start rounded-2xl border border-[var(--tema-yerel-eclub-islevsel-cizgi-05)] bg-[var(--tema-yerel-eclub-islevsel-zemin-08)] p-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--tema-yerel-eclub-islevsel-zemin-09)] text-[var(--tema-yerel-eclub-islevsel-metin-11)]">
                <ChartNoAxesColumnIncreasing size={20} strokeWidth={2.8} aria-hidden="true" />
              </span>
              <span className="mt-2 text-[11px] font-semibold leading-tight text-[var(--tema-yerel-eclub-yardimci-metin-14)]">Toplam Yayın</span>
              <span className="mt-0.5 text-lg font-extrabold leading-tight tabular-nums text-[var(--tema-yerel-eclub-ana-metin-08)]">{panel.loading ? "—" : `${yayinSayilari.get(firma.firma_id)?.toplam ?? 0} adet`}</span>
            </div>
          </div>
        </Link>)}
        {Array.from({ length: 7 }, (_, index) => (
          <div key={`sizin-yeriniz-${index}`} className="flex min-w-0 flex-col items-center gap-4 rounded-2xl border border-[var(--tema-yerel-eclub-cizgi-03)] bg-[var(--tema-yerel-eclub-kart-01)] p-5 text-center shadow-sm">
            <div className="flex h-28 w-full items-center justify-center rounded-xl bg-[var(--tema-yerel-eclub-sayfa-zemini-03)] p-4">
              <Image src={baykusGorseli} alt="" width={180} height={90}
                sizes="180px" loading="lazy" className="h-full w-full object-contain" />
            </div>
            <h2 className="text-sm font-extrabold text-[var(--tema-yerel-eclub-ana-metin-06)]">Sizin yeriniz</h2>
          </div>
        ))}
      </section>}
    <HataMesajiContainer mesajlar={mesajlar} />
  </EclubKisiSayfa>;
}
