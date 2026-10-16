"use client";

import { TarihPill } from "@/components/ui/tarih-pill";
import EclubHediyeCekiGunleriPill from "@/components/eclub/EclubHediyeCekiGunleriPill";
import EclubAnaSayfaSkeleton from "@/components/eclub/EclubAnaSayfaSkeleton";
import { anaSayfaBannerlariniIste } from "@/lib/eclub/anaSayfaBannerOnbellek";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Sparkles, Trophy, Video } from "lucide-react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  EclubKisiBaslik,
  EclubKisiBosDurum,
  EclubKisiSayfa,
  EclubKisiStat,
  EclubKisiYukleniyor,
} from "@/components/eclub/EclubKisiSayfa";
import { useEclubPanel, type PanelOneri } from "../panel/_hooks/useEclubPanel";
import EclubVideoOynatici from "../panel/_components/EclubVideoOynatici";
import EclubFirmaVideoKatalogu from "../panel/_components/EclubFirmaVideoKatalogu";
import { useEclubFirmaSecimi } from "@/components/eclub/EclubFirmaSecimi";
import { eclubUrunIcerigi } from "@/lib/eclub/firmaGezinme";
import { eclubFirmaYolu } from "@/lib/eclub/firmaGezinme";
import { hbstoreBakiyesiDegistiBildir } from "@/lib/tclub/store/olay";
import { eclubYeniYayinMi } from "@/lib/eclub/firmaYayinSayilari";

function firmaYonelme(firmaAdi: string): string {
  const kucukAd = firmaAdi.toLocaleLowerCase("tr-TR");
  const sonUnlu = [...kucukAd].reverse().find((harf) => "aeıioöuü".includes(harf));
  const inceMi = !!sonUnlu && "eiöü".includes(sonUnlu);
  const kaynastirma = "aeıioöuü".includes(kucukAd.at(-1) ?? "") ? "y" : "";
  return `${firmaAdi}'${kaynastirma}${inceMi ? "e" : "a"}`;
}

export default function EclubPanelPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { kullanici, yukleniyor: authYukleniyor } = useAuth();
  const { mesajlar, hata, basari, uyari } = useHataMesaji();
  const eclubKisi = !!kullanici && kullanici.kimlik_turu === "eclub_kisi";
  const hazir = !authYukleniyor && eclubKisi;
  const secim = useEclubFirmaSecimi();
  const rotaFirmaId = secim.firmaId ?? null;
  const kendiPaneli = useEclubPanel({ hazir: hazir && !secim.gomulu, hata, firmaId: rotaFirmaId,
    acilistaArkaPlandaYenile: !secim.gomulu && pathname === "/eclub/ana-sayfa",
    onbellekKullaniciId: hazir && !secim.gomulu && pathname === "/eclub/ana-sayfa" ? kullanici?.id : undefined });
  const { kisi, oneriler, firmaOzetleri, ozet, loading, veriCek, etkilesimGuncelle } = secim.panel ?? kendiPaneli;
  const gorunenOneriler = secim.gomulu ? eclubUrunIcerigi(oneriler, secim.urunId) : oneriler;
  const seciliOneri = gorunenOneriler.find((o) => o.oneri_id === searchParams.get("oneri_id")) ?? null;
  const [yayinFiltresi, setYayinFiltresi] = useState<"yeni" | "tamamlanan" | null>(null);

  useEffect(() => {
    if (!hazir || !kullanici || secim.gomulu || pathname !== "/eclub/ana-sayfa") return;
    void anaSayfaBannerlariniIste(kullanici.id, true).catch(() => undefined);
  }, [hazir, kullanici, secim.gomulu, pathname]);

  useEffect(() => {
    if (authYukleniyor) return;
    if (!kullanici) { router.replace("/login"); return; }
    if (!eclubKisi) { router.replace("/ana-sayfa"); }
  }, [kullanici, authYukleniyor, eclubKisi, router]);

  useEffect(() => {
    if (loading) return;
    const hedefFirma = rotaFirmaId ?? seciliOneri?.firma_id;
    if (hedefFirma && !pathname.startsWith("/eclub/firma/")) {
      const sorgu = searchParams.toString();
      router.replace(`${eclubFirmaYolu(firmaOzetleri.find((firma) => firma.firma_id === hedefFirma)?.firma_adi ?? hedefFirma, "yayinlar")}${sorgu ? `?${sorgu}` : ""}`);
    }
  }, [loading, rotaFirmaId, seciliOneri?.firma_id, firmaOzetleri, pathname, searchParams, router]);

  if (authYukleniyor || !kullanici || loading) {
    return secim.gomulu ? <EclubKisiYukleniyor /> : <EclubAnaSayfaSkeleton />;
  }

  const aktifFirmaId = firmaOzetleri.some((firma) => firma.firma_id === rotaFirmaId)
    ? rotaFirmaId
    : null;
  const aktifFirmaAdi = firmaOzetleri.find((firma) => firma.firma_id === aktifFirmaId)?.firma_adi ?? null;
  const aktifFirmaOzeti = firmaOzetleri.find((firma) => firma.firma_id === aktifFirmaId) ?? null;
  const karsilamaBasligi = aktifFirmaAdi
    ? `${firmaYonelme(aktifFirmaAdi)} Hoş Geldin${kisi ? ` ${kisi.ad}` : ""}`
    : `Merhaba${kisi ? ` ${kisi.ad}` : ""}, 👋`;
  const statOnerileri = aktifFirmaId ? oneriler.filter((oneri) => oneri.firma_id === aktifFirmaId) : oneriler;
  const yeniYayinlar = statOnerileri.filter(eclubYeniYayinMi).length;
  const tamamlanan = statOnerileri.filter((oneri) => oneri.izlendi_mi).length;
  const katalogOnerileri = secim.gomulu || yayinFiltresi === null ? gorunenOneriler
    : gorunenOneriler.filter((oneri) => yayinFiltresi === "yeni" ? eclubYeniYayinMi(oneri) : oneri.izlendi_mi);
  const statOzeti = aktifFirmaOzeti
    ? {
        eclub_store_aktif: aktifFirmaOzeti.eclub_store_aktif,
        toplam_kazanilan_puan: aktifFirmaOzeti.kazanilan_puan,
        ileri_sarma_kaybi: aktifFirmaOzeti.kaybedilen_puan,
        dogru_cevap: aktifFirmaOzeti.dogru_cevap,
      }
    : ozet;

  const etkilesimDegistir = async (tur: "begeni" | "favori", yayinId: string) => {
    try {
      const res = await fetch(`/izle/api/${tur}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yayin_id: yayinId }),
      });
      const d = await res.json();
      if (!res.ok) {
        hata(d.hata ?? `${tur === "begeni" ? "Beğeni" : "Favori"} işlemi tamamlanamadı.`, d.adim, d.detay);
        return;
      }
      etkilesimGuncelle(tur, yayinId, tur === "begeni" ? d.begeni_mi === true : d.favori_mi === true);
    } catch (err) {
      hata("İçerik etkileşimi kaydedilemedi.", `POST /izle/api/${tur}`, err instanceof Error ? err.message : undefined);
    }
  };

  const handleVideoSec = (oneri: PanelOneri) => {
    // Adrese yaz — "Ana Sayfa" parametresiz adrese gidince video kapansın.
    const sorgu = new URLSearchParams(searchParams.toString());
    sorgu.set("oneri_id", oneri.oneri_id);
    if (oneri.urun_id) sorgu.set("urun_id", oneri.urun_id);
    router.push(`${pathname}?${sorgu}`, { scroll: false });
  };

  return (
    <EclubKisiSayfa>
      {seciliOneri ? (
        <EclubVideoOynatici
          oneri={{
            oneri_id: seciliOneri.oneri_id,
            yayin_id: seciliOneri.yayin_id,
            urun_adi: seciliOneri.urun_adi,
            teknik_adi: seciliOneri.teknik_adi,
            video_url: seciliOneri.video_url,
            arac_id: seciliOneri.arac_id,
            arac_turu: seciliOneri.arac_turu,
            oneri_durumu: seciliOneri.oneri_durumu,
            oneri_baslangic: seciliOneri.oneri_baslangic,
            oneri_bitis: seciliOneri.oneri_bitis,
            izlendi_mi: seciliOneri.izlendi_mi,
          }}
          onKapat={() => { const sorgu = new URLSearchParams(searchParams.toString()); sorgu.delete("oneri_id"); router.push(`${pathname}${sorgu.size ? `?${sorgu}` : ""}`, { scroll: false }); void veriCek(); }}
          onTamamlandi={() => { void veriCek(true); hbstoreBakiyesiDegistiBildir(); }}
          hata={hata}
          basari={basari}
          uyari={uyari}
        />
      ) : (
        <>
          {!secim.gomulu && <>
          <EclubKisiBaslik
            ikon={Sparkles}
            ustEtiket=""
            baslikClassName="text-lg md:text-xl font-extrabold text-gray-900 m-0"
            baslik={karsilamaBasligi}
            aksiyon={statOzeti.eclub_store_aktif ? <EclubHediyeCekiGunleriPill /> : undefined}
            altAksiyon={<TarihPill />}
            aciklama="Firmaların size ilettiği yayınları izleyin, soruları yanıtlayın ve puan kazanın."
          />

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <EclubKisiStat ikon={Sparkles} etiket="Yeni Yayınlar" deger={yeniYayinlar} detay="Üyesi olduğunuz firmaların yeni yayınları" detayKirilsin onClick={() => setYayinFiltresi((mevcut) => mevcut === "yeni" ? null : "yeni")} secili={yayinFiltresi === "yeni"} renk="#d78022" zemin="#fff6e8" />
            <EclubKisiStat ikon={CheckCircle2} etiket="Tamamlananlar" deger={tamamlanan} detay="Tamamladığınız yayınlar" onClick={() => setYayinFiltresi((mevcut) => mevcut === "tamamlanan" ? null : "tamamlanan")} secili={yayinFiltresi === "tamamlanan"} renk="#16865f" zemin="#ebf8f2" />
            <EclubKisiStat ikon={Trophy} etiket="Net Puan" deger={Math.max(0, statOzeti.toplam_kazanilan_puan - statOzeti.ileri_sarma_kaybi).toLocaleString("tr-TR")} detay={`${statOzeti.dogru_cevap} doğru · ${statOzeti.ileri_sarma_kaybi} ileri sarma kaybı`} renk="#7358c7" zemin="#f2efff" />
          </section>
          </>}

          {firmaOzetleri.length === 0 ? (
            <EclubKisiBosDurum ikon={Video} baslik="Firma içeriği bulunmuyor" aciklama="Firmanız size öğrenme içeriği gönderdiğinde burada görüntülenecek." />
          ) : (
            <>
            {!secim.gomulu && yayinFiltresi && <div className="flex justify-end">
              <button type="button" onClick={() => setYayinFiltresi(null)} className="rounded-full border border-[#cdddec] bg-white px-3 py-1.5 text-xs font-bold text-[#237ac8] transition hover:border-[#87bde8] hover:bg-[#f1f7fe] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#237ac8]">Tüm yayınları göster</button>
            </div>}
            <EclubFirmaVideoKatalogu
              playButonuGoster={kisi?.rol !== "eczaci"}
              firmaRozetiGoster={!secim.gomulu && pathname === "/eclub/ana-sayfa"}
              ilkRafRastgele={!secim.gomulu && pathname === "/eclub/ana-sayfa" && !yayinFiltresi}
              ilkKapakOncelikli={pathname === "/eclub/ana-sayfa" || (secim.gomulu && pathname.endsWith("/yayinlar"))}
              filtreBasligi={!secim.gomulu && yayinFiltresi ? yayinFiltresi === "yeni" ? "Yeni Yayınlar" : "Tamamlananlar" : undefined}
              key={aktifFirmaId}
              oneriler={katalogOnerileri}
              seciliUrunAdi={secim.urunAdi}
              seciliFirmaId={aktifFirmaId}
              seciliFirmaAdi={aktifFirmaAdi}
              onVideoSec={handleVideoSec}
              onBegeni={(yayinId) => void etkilesimDegistir("begeni", yayinId)}
              onFavori={(yayinId) => void etkilesimDegistir("favori", yayinId)}
            />
            </>
          )}
        </>
      )}
      <HataMesajiContainer mesajlar={mesajlar} />
    </EclubKisiSayfa>
  );
}
