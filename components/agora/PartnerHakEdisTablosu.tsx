"use client";

import { useEffect, useState } from "react";
import { partnerHakEdisListesiGecerli, type PartnerHakEdisListesi } from "@/lib/agora/hakedis";
import PartnerOdemeGunu from "./PartnerOdemeGunu";
import styles from "./partner-ozet.module.css";

const BASLIKLAR: Array<[string, string]> = [
  ["ID", ""],
  ["Yayın Adı", ""],
  ["Sipariş Tarihi", ""],
  ["Satış Bedeli", "KDV hariç"],
  ["Hizmet Değeri", ""],
  ["Hak Ediş", "KDV hariç"],
  ["KDV", "%20"],
  ["Ödenecek Tutar", "KDV dahil"],
  ["Planlanan Ödeme", ""],
];
const para = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const tarih = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul" });
const gun = (deger: string | null) =>
  deger ? tarih.format(new Date(deger.length === 10 ? `${deger}T12:00:00+03:00` : deger)) : "—";
type Sonuc = { anahtar: string; veri: PartnerHakEdisListesi | null; hata: string };

export default function PartnerHakEdisTablosu({
  partnerId,
  endpoint,
  anaBaslik = false,
  odemeDuzenlenebilir = false,
}: {
  partnerId: string;
  endpoint: string;
  anaBaslik?: boolean;
  odemeDuzenlenebilir?: boolean;
}) {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");
  const [arama, setArama] = useState("");
  const [aranan, setAranan] = useState("");
  const [sayfa, setSayfa] = useState(1);
  const [surum, setSurum] = useState(0);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const anahtar = `${partnerId}:${endpoint}:${sayfa}:${surum}:${aranan}:${baslangic}:${bitis}`;
  const yukleniyor = sonuc?.anahtar !== anahtar;
  const veri = yukleniyor ? null : sonuc?.veri;
  const hata = yukleniyor ? "" : sonuc?.hata;
  const Baslik = anaBaslik ? "h1" : "h2";
  const filtreAktif = Boolean(aranan || baslangic || bitis);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const yanit = await fetch(
          `${endpoint}?${new URLSearchParams({
            sayfa: String(sayfa),
            ...(anaBaslik ? { arama: aranan, baslangic, bitis } : {}),
          })}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data: unknown = await yanit.json();
        if (!yanit.ok) {
          const mesaj =
            data && typeof data === "object" && "hata" in data && typeof data.hata === "string"
              ? data.hata
              : "Hak edişler okunamadı.";
          throw new Error(mesaj);
        }
        if (!partnerHakEdisListesiGecerli(data, partnerId.toLowerCase(), sayfa)) {
          throw new Error("Hak ediş bilgileri doğrulanamadı.");
        }
        if (!controller.signal.aborted) setSonuc({ anahtar, veri: data, hata: "" });
      } catch (e) {
        if (!controller.signal.aborted) {
          setSonuc({
            anahtar,
            veri: null,
            hata: e instanceof Error ? e.message : "Hak edişler okunamadı.",
          });
        }
      }
    })();
    return () => controller.abort();
  }, [anahtar, endpoint, partnerId, sayfa, anaBaslik, aranan, baslangic, bitis]);

  const toplamSayfa = veri ? Math.max(1, Math.ceil(veri.toplam / veri.sayfa_boyutu)) : 1;
  const ozetToplam = veri ? (filtreAktif ? veri.filtre_toplam : veri.genel_toplam) : null;
  const altToplamGoster = Boolean(
    veri && !hata && (veri.kayitlar.length > 0 || veri.genel_toplam.satin_alma_bedeli > 0),
  );
  const altToplamSatirlari = veri
    ? filtreAktif
      ? ([
          ["Seçilen Filtrelerin Toplamı", veri.filtre_toplam],
          ["Genel Toplam", veri.genel_toplam],
        ] as const)
      : ([["Genel Toplam", veri.genel_toplam]] as const)
    : [];

  return (
    <section aria-label="Partner hak ediş kayıtları" aria-busy={yukleniyor}>
      <div className={styles.hakedisBaslik}>
        <Baslik>{anaBaslik ? "Hak Edişlerim" : "Hak Ediş Kayıtları"}</Baslik>
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

      {veri && ozetToplam && !hata && (
        <div className={styles.ozetKartlari} aria-label="Hak ediş özeti">
          <article className={styles.ozetKart}>
            <span className={styles.ozetEtiket}>Toplam Satış Bedeli</span>
            <strong className={styles.ozetDeger}>{para.format(ozetToplam.satin_alma_bedeli)}</strong>
            <span className={styles.ozetNot}>KDV hariç</span>
          </article>
          <article className={styles.ozetKart}>
            <span className={styles.ozetEtiket}>Net Hak Ediş</span>
            <strong className={styles.ozetDeger}>{para.format(ozetToplam.hak_edis)}</strong>
            <span className={styles.ozetNot}>KDV hariç</span>
          </article>
          <article className={styles.ozetKart}>
            <span className={styles.ozetEtiket}>Ödenecek Toplam Tutar</span>
            <strong className={`${styles.ozetDeger} ${styles.ozetDegerVurgu}`}>
              {para.format(ozetToplam.kdvli_odenecek_tutar)}
            </strong>
            <span className={styles.ozetNot}>%20 KDV dahil</span>
          </article>
          <article className={styles.ozetKart}>
            <span className={styles.ozetEtiket}>Sipariş Sayısı</span>
            <strong className={styles.ozetDeger}>{veri.toplam.toLocaleString("tr-TR")}</strong>
            <span className={styles.ozetNot}>{filtreAktif ? "Seçili filtre sonucu" : "Tüm zamanlar"}</span>
          </article>
        </div>
      )}

      {hata && (
        <p role="alert" className={styles.hakedisHata}>
          {hata}
        </p>
      )}

      <div className={styles.tabloKarti}>
        {anaBaslik && (
          <div className={styles.hakedisAraclar}>
            <form
              role="search"
              aria-label="Hak Ediş Arama"
              className={styles.hakedisArama}
              onSubmit={(e) => {
                e.preventDefault();
                setAranan(arama.trim());
                setSayfa(1);
                setSurum((n) => n + 1);
              }}
            >
              <label htmlFor="partner-hakedis-arama" className="sr-only">
                ID veya Yayın Adı
              </label>
              <input
                id="partner-hakedis-arama"
                type="search"
                placeholder="ID veya yayın adı"
                maxLength={200}
                value={arama}
                onChange={(e) => setArama(e.target.value)}
              />
              <button type="submit" className={styles.hakedisAraButonu}>
                Ara
              </button>
            </form>
            <div className={styles.hakedisTarihler} role="group" aria-label="Sipariş Tarihi Filtresi">
              <label>
                Sipariş Tarihi · Başlangıç
                <input
                  type="date"
                  aria-label="Sipariş Tarihi Başlangıç"
                  value={baslangic}
                  max={bitis || undefined}
                  onChange={(e) => {
                    setBaslangic(e.target.value);
                    setSayfa(1);
                  }}
                />
              </label>
              <label>
                Bitiş
                <input
                  type="date"
                  aria-label="Sipariş Tarihi Bitiş"
                  value={bitis}
                  min={baslangic || undefined}
                  onChange={(e) => {
                    setBitis(e.target.value);
                    setSayfa(1);
                  }}
                />
              </label>
              {(baslangic || bitis) && (
                <button
                  type="button"
                  className={styles.ikincilButon}
                  onClick={() => {
                    setBaslangic("");
                    setBitis("");
                    setSayfa(1);
                  }}
                >
                  Tarihleri Temizle
                </button>
              )}
            </div>
          </div>
        )}

        <div className={styles.tabloAlani}>
          <table className={styles.hakedisTablo} aria-label="Partner Hak Edişleri">
            <thead>
              <tr>
                {BASLIKLAR.map(([baslik, varsayilanAciklama], i) => {
                  const aciklama =
                    baslik === "Hizmet Değeri" && veri?.komisyon_orani !== undefined
                      ? `(%${veri.komisyon_orani.toLocaleString("tr-TR")})`
                      : varsayilanAciklama;
                  const hizaSinifi =
                    i >= 3 && i <= 7
                      ? styles.hakedisPara
                      : i === 2 || i >= 8
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
                  <td colSpan={9} role="status" className={styles.durumSatiri}>
                    Hak edişler yükleniyor…
                  </td>
                </tr>
              ) : hata ? (
                <tr>
                  <td colSpan={9} className={styles.durumSatiri}>
                    Yenile düğmesiyle tekrar deneyebilirsiniz.
                  </td>
                </tr>
              ) : !veri?.kayitlar.length ? (
                <tr>
                  <td colSpan={9} className={styles.durumSatiri}>
                    {veri?.toplam
                      ? "Bu sayfada kayıt bulunmuyor."
                      : filtreAktif
                        ? "Arama ve tarihlere uygun hak ediş bulunmuyor."
                        : "Henüz hak ediş kaydı bulunmuyor."}
                  </td>
                </tr>
              ) : (
                veri.kayitlar.map((r) => (
                  <tr key={r.siparis_id}>
                    <td className={styles.hakedisKimlik}>{r.partner_egitim_id}</td>
                    <td className={styles.hakedisEgitim}>{r.egitim_adi}</td>
                    <td className={styles.hakedisTarih}>{gun(r.siparis_tarihi)}</td>
                    <td className={styles.hakedisPara}>{para.format(r.satin_alma_bedeli)}</td>
                    <td className={styles.hakedisPara}>{para.format(r.hizmet_bedeli)}</td>
                    <td className={`${styles.hakedisPara} ${styles.hakedisNet}`}>
                      {para.format(r.hak_edis)}
                    </td>
                    <td className={styles.hakedisPara}>{para.format(r.kdv_tutari)}</td>
                    <td className={`${styles.hakedisPara} ${styles.hakedisToplam}`}>
                      {para.format(r.kdvli_odenecek_tutar)}
                    </td>
                    <td className={styles.hakedisTarih}>
                      {odemeDuzenlenebilir ? (
                        <PartnerOdemeGunu
                          key={`${r.siparis_id}:${r.planlanan_odeme_gunu ?? ""}`}
                          endpoint={endpoint}
                          siparisId={r.siparis_id}
                          egitimId={r.partner_egitim_id}
                          deger={r.planlanan_odeme_gunu}
                        />
                      ) : r.planlanan_odeme_gunu ? (
                        gun(r.planlanan_odeme_gunu)
                      ) : (
                        <span className={styles.bosTarih}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {altToplamGoster && (
              <tfoot>
                {altToplamSatirlari.map(([etiket, toplam]) => (
                  <tr key={etiket}>
                    <th scope="row" colSpan={3}>
                      {etiket}
                    </th>
                    <td className={styles.hakedisPara}>{para.format(toplam.satin_alma_bedeli)}</td>
                    <td className={styles.hakedisPara}>{para.format(toplam.hizmet_bedeli)}</td>
                    <td className={`${styles.hakedisPara} ${styles.hakedisNet}`}>
                      {para.format(toplam.hak_edis)}
                    </td>
                    <td className={styles.hakedisPara}>{para.format(toplam.kdv_tutari)}</td>
                    <td className={`${styles.hakedisPara} ${styles.hakedisToplam}`}>
                      {para.format(toplam.kdvli_odenecek_tutar)}
                    </td>
                    <td />
                  </tr>
                ))}
              </tfoot>
            )}
          </table>
        </div>

        {veri && (
          <div className={styles.hakedisSayfalama}>
            <span>
              {veri.toplam.toLocaleString("tr-TR")} kayıt · Sayfa {sayfa} / {toplamSayfa}
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
