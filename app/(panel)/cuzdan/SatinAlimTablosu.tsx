import { useEffect, useState } from "react";
import { SadeKontrolButonu } from "@/components/kontrol/SadeKontroller";
import { DahaFazlaGoster } from "@/components/liste/DahaFazlaGoster";
import { siparisListesiGecerli, type SiparisKaydi, type SiparisListesi } from "@/lib/satinAlma/siparisListesi";
import styles from "../token/token.module.css";

const tarih = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short" });
const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const adet = new Intl.NumberFormat("tr-TR");
const SATIR_ADIMI = 10;
const tokenTipleri: Record<SiparisKaydi["paket_turu"], string> = {
  kko: "KKÖ",
  esnek: "Esnek Paket",
  abonelik_baslangic: "Abonelik",
  abonelik_devam: "Abonelik",
};

export default function SatinAlimTablosu({ hesap, baslik }: {
  hesap: SiparisKaydi["bakiye_turu"];
  baslik: string;
}) {
  const [sayfa, setSayfa] = useState(0);
  const [deneme, setDeneme] = useState(0);
  const [gorunenLimit, setGorunenLimit] = useState(SATIR_ADIMI);
  const [yuklenenSayfalar, setYuklenenSayfalar] = useState<SiparisListesi[]>([]);
  const [sonuc, setSonuc] = useState<{ anahtar: string; liste?: SiparisListesi; hata?: string }>();
  const anahtar = `${hesap}:${sayfa}:${deneme}`;
  const guncel = sonuc?.anahtar === anahtar ? sonuc : undefined;

  useEffect(() => {
    const controller = new AbortController();
    async function yukle() {
      try {
        const sorgu = new URLSearchParams({ hesap, sayfa: String(sayfa) });
        const yanit = await fetch(`/cuzdan/api/satin-alimlar?${sorgu}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const veri = await yanit.json();
        if (!yanit.ok) throw new Error(typeof veri?.hata === "string" ? veri.hata : "Satın alım geçmişi alınamadı.");
        if (!siparisListesiGecerli(veri)) throw new Error("Satın alım geçmişi alınamadı.");
        if (!controller.signal.aborted) {
          setYuklenenSayfalar(sayfalar => [...sayfalar.slice(0, sayfa), veri]);
          setSonuc({ anahtar, liste: veri });
        }
      } catch (hata) {
        if (!controller.signal.aborted) {
          setSonuc({ anahtar, hata: hata instanceof Error ? hata.message : "Satın alım geçmişi alınamadı." });
        }
      }
    }

    void yukle();
    return () => controller.abort();
  }, [anahtar, hesap, sayfa]);

  const satirlar = yuklenenSayfalar.flatMap(liste => liste.siparisler);
  const gorunenSatirlar = satirlar.slice(0, gorunenLimit);
  const toplam = yuklenenSayfalar.at(-1)?.toplam ?? 0;

  function dahaFazlaGoster() {
    const sonrakiLimit = gorunenLimit + SATIR_ADIMI;
    setGorunenLimit(sonrakiLimit);
    if (sonrakiLimit > satirlar.length && satirlar.length < toplam) {
      setSayfa(sayfa + 1);
    }
  }

  return <section aria-label={baslik} aria-busy={!guncel}>
    <div className={styles.heading}><h2>{baslik}</h2></div>
    <div className={styles.cuzdanSatinAlimTablosu}>
      <table className={styles.detayTablosu}>
        <thead><tr>
          <th scope="col">Tarih</th>
          <th scope="col">Satın Alan</th>
          <th scope="col">Token Tipi</th>
          <th scope="col">Birim Fiyat (KDV hariç)</th>
          <th scope="col">Toplam Adet</th>
          <th scope="col">Toplam Fiyat (KDV dahil)</th>
        </tr></thead>
        <tbody>
          {gorunenSatirlar.map(siparis => <tr key={siparis.kayit_id}>
            <td>{tarih.format(new Date(siparis.siparis_tarihi))}</td>
            <td>{siparis.satin_alan_ad_soyad || "—"}</td>
            <td>{tokenTipleri[siparis.paket_turu]}</td>
            <td>{para.format(siparis.birim_fiyat)}</td>
            <td>{adet.format(siparis.token_adedi)}</td>
            <td>{para.format(siparis.toplam_tutar + siparis.kdv)}</td>
          </tr>)}
          {!guncel && <tr><td colSpan={6} role="status">Satın alımlar yükleniyor…</td></tr>}
          {guncel?.hata && <tr><td colSpan={6}>
            <span role="alert">{guncel.hata}</span>{" "}
            <SadeKontrolButonu onClick={() => setDeneme(deger => deger + 1)}>Tekrar dene</SadeKontrolButonu>
          </td></tr>}
          {guncel?.liste && satirlar.length === 0 && <tr><td colSpan={6}>Satın alım kaydı bulunamadı.</td></tr>}
        </tbody>
      </table>
    </div>
    <DahaFazlaGoster
      dahaVar={!!guncel?.liste && gorunenSatirlar.length < toplam}
      gorunenSayi={gorunenSatirlar.length}
      toplam={toplam}
      onGoster={dahaFazlaGoster}
    />
  </section>;
}
