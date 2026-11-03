"use client";
import MobilUyumluTablo from "../../_components/MobilUyumluTablo";
import { useFirmaSaltOkunur } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { SadeTabloSecimi } from "@/components/kontrol/SadeKontroller";
import { ECZANEM_UYE_SUTUNLARI, type EczanemUyeSutunu } from "@/lib/admin/eczanemUyeSutunlari";
import type { AdminEczanemUye, AdminEczanemUyeVerisi } from "@/lib/admin/eczanemUyeleri";
import { PASIFE_PUAN_KULLANIM_GUN } from "@/lib/eczanem/erisim";
import styles from "../../admin.module.css";
import local from "./eczanem-yonetimi.module.css";

const tarihYaz = (tarih: string | null) => tarih ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date(tarih)) : "—";

export default function EczanemUyeYonetimi({ firmaId, firmaAdi }: { firmaId: string; firmaAdi: string }) {
  const saltOkunur = useFirmaSaltOkunur();
  const [veri, setVeri] = useState<AdminEczanemUyeVerisi | null>(null);
  const [filtre, setFiltre] = useState({ q: "", sayfa: 1, sutunlar: Object.fromEntries(ECZANEM_UYE_SUTUNLARI.map(([alan]) => [alan, ""])) as Record<EczanemUyeSutunu, string> });
  const [arama, setArama] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState<string | null>(null);
  const [secili, setSecili] = useState<AdminEczanemUye | null>(null);
  const [onayAcik, setOnayAcik] = useState(false);
  const [kaydediyor, setKaydediyor] = useState(false);
  const istek = useRef<AbortController | null>(null);
  const kayitKilidi = useRef(false);
  const canli = useRef(true);
  const api = `/admin/api/firmalar/${encodeURIComponent(firmaId)}/eczanem/uyeler`;

  const yenile = useCallback(async () => {
    istek.current?.abort();
    const controller = new AbortController();
    istek.current = controller;
    setYukleniyor(true); setHata(null);
    try {
      const params = new URLSearchParams({ q: filtre.q, sayfa: String(filtre.sayfa), sutunlar: JSON.stringify(filtre.sutunlar) });
      const res = await fetch(`${api}?${params}`, { cache: "no-store", signal: controller.signal });
      const sonuc = await res.json();
      if (!res.ok) throw new Error(sonuc.hata ?? "Üyeler yüklenemedi.");
      if (!controller.signal.aborted) setVeri(sonuc);
    } catch (err) { if (!controller.signal.aborted) setHata(err instanceof Error ? err.message : "Üyeler yüklenemedi."); }
    finally { if (!controller.signal.aborted) setYukleniyor(false); }
  }, [api, filtre]);

  useEffect(() => { canli.current = true; void yenile(); return () => { canli.current = false; istek.current?.abort(); }; }, [yenile]);

  function detayKapat() { setSecili(null); setOnayAcik(false); }
  function filtreDegistir(yeni: Partial<typeof filtre>) {
    setMesaj(null); detayKapat(); setFiltre(f => ({ ...f, ...yeni }));
  }

  async function durumDegistir() {
    if (!secili || !onayAcik || kayitKilidi.current || (!secili.aktif_mi && !secili.hesap_aktif_mi)) return;
    kayitKilidi.current = true; setKaydediyor(true); setMesaj(null); setHata(null);
    try {
      const res = await fetch(api, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        musteri_id: secili.musteri_id, eczane_id: secili.eczane_id,
        aktif_mi: !secili.aktif_mi, mevcut_aktif_mi: secili.aktif_mi,
      }) });
      const sonuc = await res.json();
      if (!canli.current) return;
      if (!res.ok) {
        setOnayAcik(false);
        if (res.status === 409) { setSecili(null); await yenile(); }
        setHata(sonuc.hata ?? "Üyelik durumu güncellenemedi."); return;
      }
      detayKapat(); setMesaj(sonuc.mesaj); await yenile();
    } catch { if (canli.current) { setOnayAcik(false); setHata("İşlem sonucu alınamadı. Yenile ile güncel üyelik durumunu kontrol edin."); } }
    finally { kayitKilidi.current = false; if (canli.current) setKaydediyor(false); }
  }

  return <div className={styles.stack} aria-label={`${firmaAdi} Eczanem üyeleri`}>
    {mesaj && <p role="status" className={`${styles.notice} ${local.message}`}>{mesaj}</p>}
    {hata && <div role="alert" className={`${styles.notice} ${local.message} ${local.error}`}>{hata}<button type="button" className={styles.button} disabled={kaydediyor || yukleniyor} onClick={() => { detayKapat(); void yenile(); }}>Tekrar dene</button></div>}

    <section className={styles.card} aria-labelledby="admin-eczanem-liste-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-eczanem-liste-baslik"><Users />Üye Listesi</h2><p>Her satır bir üyenin bir eczanedeki üyeliğidir.</p></div></div>
      <div className={styles.toolbar}>
        <form className={local.searchForm} onSubmit={e => { e.preventDefault(); filtreDegistir({ q: arama.trim(), sayfa: 1 }); }}>
          <input className={styles.input} aria-label="Üye adı veya cep telefonu ara" placeholder="Ad veya cep telefonu ara" maxLength={80} value={arama} disabled={kaydediyor} onChange={e => setArama(e.target.value)} />
          <button type="submit" className={`${styles.button} ${styles.primary}`} disabled={kaydediyor}><Search />Ara</button>
        </form>
      </div>
      <div className={styles.tableWrap}><MobilUyumluTablo basliklar={["Üye", "Telefon", "E-posta", "Eczane", "GLN", "İl", "İlçe", "Durum", "Kayıt Tarihi", "İşlem"]} filtreli className={local.table} aria-label="Eczanem üye listesi" aria-busy={yukleniyor}>
        <thead><tr>{ECZANEM_UYE_SUTUNLARI.map(([alan, baslik]) => <th key={alan}><SadeTabloSecimi etiket={`${baslik} filtresi`} aramaEtiketi={`${baslik} ara…`} className={local.columnSelect} menuClassName={local.columnMenu} deger={filtre.sutunlar[alan]} disabled={kaydediyor || yukleniyor} secenekler={[{ deger:"", etiket:baslik }, ...(veri?.secenekler?.[alan] ?? [])]} onDegistir={deger => filtreDegistir({ sutunlar: { ...filtre.sutunlar, [alan]:deger }, sayfa:1 })} /></th>)}<th>İşlem</th></tr></thead>
        <tbody>{yukleniyor ? <tr><td colSpan={10} className={styles.empty}>Üyeler yükleniyor…</td></tr> : hata ? <tr><td colSpan={10} className={styles.empty}>Güncel liste alınamadı.</td></tr> : !veri?.uyeler.length ? <tr><td colSpan={10} className={styles.empty}>Bu kapsamda üye bulunamadı.</td></tr> : veri.uyeler.map(uye => <tr key={`${uye.musteri_id}:${uye.eczane_id}`} data-selected={secili?.musteri_id === uye.musteri_id && secili?.eczane_id === uye.eczane_id}>
          <td className={styles.name}>{uye.ad_soyad}</td><td>{uye.telefon}</td><td>{uye.eposta ?? "—"}</td><td>{uye.eczane_adi}</td><td>{uye.gln}</td><td>{uye.il ?? "—"}</td><td>{uye.ilce ?? "—"}</td><td><span className={`${styles.status} ${uye.aktif_mi ? styles.statusActive : ""}`}>{uye.aktif_mi ? "Aktif" : "Pasif"}</span></td><td>{tarihYaz(uye.created_at)}</td><td><a className={styles.button} href="#admin-eczanem-uye-detay" aria-disabled={kaydediyor} aria-label={`${uye.ad_soyad} · ${uye.eczane_adi} üyelik detayı`} onClick={e => { if (kaydediyor) { e.preventDefault(); return; } setSecili(uye); setOnayAcik(false); }}>Detay</a></td>
        </tr>)}</tbody>
      </MobilUyumluTablo></div>
      {veri && !hata && <div className={`${local.row} ${local.pagination}`}><span>{veri.sayfalama.toplam} üyelik · Sayfa {veri.sayfalama.sayfa} / {veri.sayfalama.toplam_sayfa}</span><div className={styles.actions}><button type="button" className={styles.button} disabled={yukleniyor || kaydediyor || veri.sayfalama.sayfa <= 1} onClick={() => filtreDegistir({ sayfa: veri.sayfalama.sayfa - 1 })}>Önceki</button><button type="button" className={styles.button} disabled={yukleniyor || kaydediyor || veri.sayfalama.sayfa >= veri.sayfalama.toplam_sayfa} onClick={() => filtreDegistir({ sayfa: veri.sayfalama.sayfa + 1 })}>Sonraki</button></div></div>}
    </section>

    <section className={styles.card} id="admin-eczanem-uye-detay" aria-labelledby="admin-eczanem-detay-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-eczanem-detay-baslik"><Users />Üyelik Detayı</h2>{secili && <p>{firmaAdi} · {secili.eczane_adi}</p>}</div>{secili && <button type="button" className={styles.button} disabled={kaydediyor} onClick={detayKapat}><X />Kapat</button>}</div>
      {!secili ? <p className={styles.empty}>Üyelik detayını görmek için listeden bir üye seçin.</p> : <div className={styles.cardBody}>
        <dl className={local.detail}>{[
          ["Üye", secili.ad_soyad], ["Cep telefonu", secili.telefon], ["E-posta", secili.eposta ?? "—"], ["Üye yapan eczane", secili.eczane_adi], ["GLN", secili.gln], ["İl", secili.il ?? "—"], ["İlçe", secili.ilce ?? "—"], ["Üyelik", secili.aktif_mi ? "Aktif" : "Pasif"], ["Hesap", secili.hesap_aktif_mi ? "Aktif" : "Kapalı"], ["Kayıt tarihi", tarihYaz(secili.created_at)], ["Son işlem", tarihYaz(secili.son_islem_tarihi)],
        ].map(([ad, deger]) => <div key={ad}><dt>{ad}</dt><dd>{deger}</dd></div>)}</dl>
        {!secili.hesap_aktif_mi && !secili.aktif_mi && <p className={`${styles.notice} ${local.note}`}>Hesabı kapalı üyenin üyeliği aktifleştirilemez.</p>}
        {!saltOkunur && (onayAcik ? <div className={local.confirm} role="group" aria-label="Üyelik durumu onayı"><h3>{secili.aktif_mi ? "Üyelik pasife alınsın mı?" : "Üyelik aktifleştirilsin mi?"}</h3><p>{secili.ad_soyad} · {secili.eczane_adi} · GLN: {secili.gln}. Bu eczanedeki üyelik {secili.aktif_mi ? "pasife alınacak" : "aktifleştirilecek"}.{secili.aktif_mi && ` Yeni yayın kazanımı kapanır; mevcut puanların ${PASIFE_PUAN_KULLANIM_GUN} günlük kullanım kuralı korunur.`}</p><div className={styles.actions}><button type="button" className={`${styles.button} ${styles.primary}`} disabled={kaydediyor} onClick={() => void durumDegistir()}>{kaydediyor ? "Kaydediliyor…" : "Onayla"}</button><button type="button" className={styles.button} disabled={kaydediyor} onClick={() => setOnayAcik(false)}>Vazgeç</button></div></div> : <div className={`${styles.actions} ${local.detailActions}`}><button type="button" className={`${styles.button} ${secili.aktif_mi ? styles.danger : styles.primary}`} disabled={kaydediyor || (!secili.aktif_mi && !secili.hesap_aktif_mi)} onClick={() => setOnayAcik(true)}>{secili.aktif_mi ? "Üyeliği pasife al" : "Üyeliği aktifleştir"}</button></div>)}
      </div>}
    </section>
  </div>;
}
