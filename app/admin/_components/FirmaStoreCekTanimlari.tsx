"use client";
import { saltOkunurAlan } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Ticket, Save } from "lucide-react";
import { bazPuanGecerliMi, minimumSiparisTlGecerliMi } from "@/lib/tclub/store/katalog";
import styles from "../admin.module.css";
import local from "./firmastore-cek-tanimlari.module.css";

interface Cek {
  urun_id: string;
  ad: string;
  gorsel_url: string | null;
  minimum_siparis_tl: number | null;
  aktif_mi: boolean;
  secili: boolean;
  baz_puan: number | null;
}
interface CekSatiri extends Omit<Cek, "baz_puan"> { bazPuan: string }

function FirmaStoreCekTanimlari({ firmaId }: { firmaId: string }) {
  const [cekler, setCekler] = useState<CekSatiri[] | null>(null);
  const [yuklemeHatasi, setYuklemeHatasi] = useState("");
  const [hata, setHata] = useState("");
  const [hataliCek, setHataliCek] = useState<string | null>(null);
  const [deneme, setDeneme] = useState(0);
  const [kirli, setKirli] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [kaydedildi, setKaydedildi] = useState(false);
  const kilit = useRef(false);
  const canli = useRef(false);

  useEffect(() => {
    canli.current = true;
    return () => { canli.current = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/admin/api/firmalar/${firmaId}/firmastore`, { cache: "no-store", signal: controller.signal })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.hata ?? "Çekler yüklenemedi.");
        if (data.firma?.firma_id !== firmaId || !Array.isArray(data.cekler)) throw new Error("Firma çek bilgileri alınamadı.");
        if (!controller.signal.aborted) {
          setCekler(data.cekler.map((cek: Cek) => ({ ...cek, bazPuan: cek.baz_puan == null ? "" : String(cek.baz_puan) })));
        }
      })
      .catch(error => {
        if (!controller.signal.aborted) setYuklemeHatasi(error instanceof Error ? error.message : "Çekler yüklenemedi.");
      });
    return () => controller.abort();
  }, [firmaId, deneme]);

  function degistir(id: string, deger: Partial<Pick<CekSatiri, "secili" | "bazPuan">>) {
    if (kilit.current) return;
    setCekler(mevcut => mevcut?.map(cek => cek.urun_id === id ? { ...cek, ...deger } : cek) ?? null);
    setKirli(true);
    setKaydedildi(false);
    setHata("");
    setHataliCek(null);
  }

  async function kaydet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kilit.current || !cekler || !kirli) return;
    const secilenler = cekler.filter(cek => cek.secili);
    const gecersiz = secilenler.find(cek => !cek.aktif_mi || !minimumSiparisTlGecerliMi(cek.minimum_siparis_tl) || !bazPuanGecerliMi(Number(cek.bazPuan)));
    if (gecersiz) {
      setHataliCek(gecersiz.urun_id);
      setHata(!gecersiz.aktif_mi || !minimumSiparisTlGecerliMi(gecersiz.minimum_siparis_tl)
        ? `${gecersiz.ad}: Aktif ve minimum TL tutarı tanımlanmış bir çek seçin.`
        : `${gecersiz.ad}: Baz Puan alanına pozitif tam sayı girin.`);
      return;
    }
    kilit.current = true;
    setKaydediliyor(true);
    setKaydedildi(false);
    setHata("");
    try {
      const res = await fetch(`/admin/api/firmalar/${firmaId}/firmastore`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cekler: secilenler.map(cek => ({ urun_id: cek.urun_id, baz_puan: Number(cek.bazPuan) })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.hata ?? "Çek tanımları kaydedilemedi.");
      if (canli.current) {
        setCekler(mevcut => mevcut?.map(cek => cek.secili ? cek : { ...cek, bazPuan: "" }) ?? null);
        setKirli(false);
        setKaydedildi(true);
      }
    } catch (error) {
      if (canli.current) setHata(error instanceof Error ? error.message : "Çek tanımları kaydedilemedi.");
    } finally {
      kilit.current = false;
      if (canli.current) setKaydediliyor(false);
    }
  }

  return <section className={`${styles.card} ${local.card}`} aria-labelledby="firma-cek-tanimlari-baslik">
    <div className={styles.cardHeader}>
      <div><h2 id="firma-cek-tanimlari-baslik"><Ticket />FirmaStore Çek Yönetimi</h2>
        <p>Kullanılacak hediye çeklerini seçin ve minimum TL tutarına karşılık gelen Baz Puan değerini girin.</p>
      </div>
    </div>
    {yuklemeHatasi ? <div className={styles.cardBody}>
      <p role="alert" className={local.message}>{yuklemeHatasi}</p>
      <button type="button" className={styles.button} onClick={() => { setYuklemeHatasi(""); setDeneme(n => n + 1); }}>Tekrar Dene</button>
    </div> : cekler === null ? <p role="status" className={styles.cardBody}>Çekler yükleniyor…</p>
      : <form onSubmit={kaydet} noValidate aria-busy={kaydediliyor}>
        {cekler.length === 0 ? <p className={styles.cardBody}>Henüz hediye çeki tanımlanmamış.</p> : <ul className={local.list}>
          {cekler.map(cek => {
            const uygun = cek.aktif_mi && minimumSiparisTlGecerliMi(cek.minimum_siparis_tl);
            return <li key={cek.urun_id} className={local.row} data-selected={cek.secili}>
              <label className={local.choice}>
                <input type="checkbox" checked={cek.secili} disabled={kaydediliyor || (!uygun && !cek.secili)}
                  aria-label={`${cek.ad} çekini seç`} onChange={e => degistir(cek.urun_id, { secili: e.target.checked })} />
              </label>
              <div className={local.product}>
                <div className={local.image}>
                  {cek.gorsel_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={cek.gorsel_url} alt={cek.ad} />
                    : <Ticket aria-label="Görsel yok" />}
                </div>
                <div className={local.name}><span>{cek.ad}</span>
                  {!cek.aktif_mi ? <small>Pasif</small> : !uygun && <small>Minimum TL tutarı tanımlanmamış</small>}
                </div>
              </div>
              <label className={local.field}>
                <span>Minimum Sipariş Tutarı</span>
                <div className={local.amount}>
                  <input type="text" readOnly aria-label={`${cek.ad} minimum sipariş tutarı`}
                    value={cek.minimum_siparis_tl == null ? "—" : cek.minimum_siparis_tl.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} />
                  <span aria-hidden="true">TL</span>
                </div>
              </label>
              <label className={local.field}>
                <span>Baz Puan</span>
                <input type="number" inputMode="numeric" min={1} max={2147483647} step={1}
                  value={cek.bazPuan} disabled={kaydediliyor || !cek.secili || !uygun} required={cek.secili}
                  aria-label={`${cek.ad} baz puan`} aria-invalid={hataliCek === cek.urun_id || undefined}
                  aria-describedby={hataliCek === cek.urun_id ? "firma-cek-tanim-hatasi" : undefined}
                  onChange={e => degistir(cek.urun_id, { bazPuan: e.target.value })} />
              </label>
            </li>;
          })}
        </ul>}
        <div className={local.footer}>
          <div className={local.feedback}>
            {hata && <p id="firma-cek-tanim-hatasi" role="alert" className={local.message}>{hata}</p>}
            {kaydedildi && <span role="status">Kaydedildi.</span>}
          </div>
          <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={kaydediliyor || !kirli}>
            <Save />{kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>}
  </section>;
}

export default saltOkunurAlan(FirmaStoreCekTanimlari);
