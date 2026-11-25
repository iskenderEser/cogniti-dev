"use client";

import { useEffect, useState } from "react";
import { partnerRaporListesiGecerli, type PartnerRaporListesi } from "@/lib/agora/rapor";
import styles from "./partner-ozet.module.css";

const BASLIKLAR: Array<[string, string]> = [
  ["ID", ""],
  ["Yayın Adı", ""],
  ["Beğeni Sayısı", ""],
  ["Favori Sayısı", ""],
  ["Satılan Adet", ""],
  ["Satış Fiyatı", ""],
  ["Toplam Satış (KDV Hariç)", ""],
];
const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const adet = new Intl.NumberFormat("tr-TR");
type Sonuc = { anahtar: string; veri: PartnerRaporListesi | null; hata: string };

export default function PartnerRaporTablosu({
  partnerId,
  endpoint,
  anaBaslik = false,
}: {
  partnerId: string;
  endpoint: string;
  anaBaslik?: boolean;
}) {
  const [sayfa, setSayfa] = useState(1);
  const [surum, setSurum] = useState(0);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const anahtar = `${partnerId}:${endpoint}:${sayfa}:${surum}`;
  const yukleniyor = sonuc?.anahtar !== anahtar;
  const veri = yukleniyor ? null : sonuc?.veri;
  const hata = yukleniyor ? "" : sonuc?.hata;
  const Baslik = anaBaslik ? "h1" : "h2";

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const yanit = await fetch(`${endpoint}?sayfa=${sayfa}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data: unknown = await yanit.json();
        if (!yanit.ok) {
          const mesaj =
            data && typeof data === "object" && "hata" in data && typeof data.hata === "string"
              ? data.hata
              : "Raporlar okunamadı.";
          throw new Error(mesaj);
        }
        if (!partnerRaporListesiGecerli(data, partnerId.toLowerCase(), sayfa)) {
          throw new Error("Rapor bilgileri doğrulanamadı.");
        }
        if (!controller.signal.aborted) setSonuc({ anahtar, veri: data, hata: "" });
      } catch (e) {
        if (!controller.signal.aborted) {
          setSonuc({
            anahtar,
            veri: null,
            hata: e instanceof Error ? e.message : "Raporlar okunamadı.",
          });
        }
      }
    })();
    return () => controller.abort();
  }, [anahtar, endpoint, partnerId, sayfa]);

  const toplamSayfa = veri ? Math.max(1, Math.ceil(veri.toplam / veri.sayfa_boyutu)) : 1;
  const kayitlar = veri?.kayitlar ?? [];
  const sayfaSatilanAdet = kayitlar.reduce((t, r) => t + r.satilan_adet, 0);
  const sayfaToplamSatis = kayitlar.reduce((t, r) => t + r.toplam_satis, 0);
  const sayfaBegeni = kayitlar.reduce((t, r) => t + r.begeni_sayisi, 0);
  const sayfaFavori = kayitlar.reduce((t, r) => t + r.favori_sayisi, 0);

  return (
    <section aria-label="Partner yayın raporları" aria-busy={yukleniyor}>
      <div className={styles.hakedisBaslik}>
        <div className={styles.hakedisBaslikMetni}>
          <Baslik>{anaBaslik ? "Raporlarım" : "Yayın Raporları"}</Baslik>
          <p className={styles.raporAciklama}>
            Satışlar tüm zamanları kapsar; beğeni ve favoriler güncel sayılardır.
          </p>
        </div>
        <button
          type="button"
          className={styles.yenileButonu}
          aria-label={yukleniyor ? "Yenileniyor…" : "Yenile"}
          aria-busy={yukleniyor}
          disabled={yukleniyor}
          onClick={() => setSurum((n) => n + 1)}
        >
          {yukleniyor ? "Yenileniyor…" : "Yenile"}
        </button>
      </div>

      {veri && !hata && (
        <div className={styles.ozetKartlari} aria-label="Yayın raporları özeti">
          <article className={styles.ozetKart}>
            <span className={styles.ozetEtiket}>Toplam Yayın</span>
            <strong className={styles.ozetDeger}>{adet.format(veri.toplam)}</strong>
            <span className={styles.ozetNot}>Katalogdaki yayın sayısı</span>
          </article>
          <article className={styles.ozetKart}>
            <span className={styles.ozetEtiket}>Satılan Adet</span>
            <strong className={styles.ozetDeger}>{adet.format(sayfaSatilanAdet)}</strong>
            <span className={styles.ozetNot}>Bu sayfadaki sipariş adedi</span>
          </article>
          <article className={styles.ozetKart}>
            <span className={styles.ozetEtiket}>Gerçekleşen Satış</span>
            <strong className={`${styles.ozetDeger} ${styles.ozetDegerVurgu}`}>
              {para.format(sayfaToplamSatis)}
            </strong>
            <span className={styles.ozetNot}>Bu sayfa · KDV hariç</span>
          </article>
          <article className={styles.ozetKart}>
            <span className={styles.ozetEtiket}>Beğeni / Favori</span>
            <strong className={styles.ozetDeger}>
              {adet.format(sayfaBegeni)} / {adet.format(sayfaFavori)}
            </strong>
            <span className={styles.ozetNot}>Güncel etkileşim</span>
          </article>
        </div>
      )}

      {hata && (
        <p role="alert" className={styles.hakedisHata}>
          {hata}
        </p>
      )}

      <div className={styles.tabloKarti}>
        <div className={styles.tabloAlani}>
          <table
            className={`${styles.hakedisTablo} ${styles.raporTablo}`}
            aria-label="Partner Yayın Raporları"
          >
            <thead>
              <tr>
                {BASLIKLAR.map(([baslik, aciklama], i) => {
                  const hizaSinifi =
                    i === 5 || i === 6
                      ? styles.hakedisPara
                      : i >= 2
                        ? styles.hakedisMerkez
                        : undefined;
                  return (
                    <th key={baslik} scope="col" className={hizaSinifi}>
                      {baslik}
                      {aciklama && <span className={styles.hakedisBaslikAciklama}>{aciklama}</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {yukleniyor ? (
                <tr>
                  <td colSpan={7} role="status" className={styles.durumSatiri}>
                    Raporlar yükleniyor…
                  </td>
                </tr>
              ) : hata ? (
                <tr>
                  <td colSpan={7} className={styles.durumSatiri}>
                    Yenile düğmesiyle tekrar deneyebilirsiniz.
                  </td>
                </tr>
              ) : !veri?.kayitlar.length ? (
                <tr>
                  <td colSpan={7} className={styles.durumSatiri}>
                    {veri?.toplam
                      ? "Bu sayfada kayıt bulunmuyor."
                      : "Henüz raporlanacak yayın bulunmuyor."}
                  </td>
                </tr>
              ) : (
                veri.kayitlar.map((r) => (
                  <tr key={r.egitim_id}>
                    <td className={styles.hakedisKimlik}>{r.partner_egitim_id}</td>
                    <td className={styles.hakedisEgitim}>{r.egitim_adi}</td>
                    <td className={styles.hakedisSayi}>{adet.format(r.begeni_sayisi)}</td>
                    <td className={styles.hakedisSayi}>{adet.format(r.favori_sayisi)}</td>
                    <td className={styles.hakedisSayi}>{adet.format(r.satilan_adet)}</td>
                    <td className={styles.hakedisPara}>
                      {r.satis_fiyati === null ? "—" : para.format(r.satis_fiyati)}
                    </td>
                    <td className={`${styles.hakedisPara} ${styles.hakedisToplam}`}>
                      {para.format(r.toplam_satis)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {veri && (
          <div className={styles.hakedisSayfalama}>
            <span>
              {veri.toplam.toLocaleString("tr-TR")} yayın · Sayfa {sayfa} / {toplamSayfa}
            </span>
            <div className={styles.sayfalamaButonlari}>
              <button type="button" disabled={sayfa <= 1} onClick={() => setSayfa((n) => n - 1)}>
                Önceki
              </button>
              <button
                type="button"
                disabled={sayfa >= toplamSayfa || sayfa >= 100000}
                onClick={() => setSayfa((n) => n + 1)}
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
