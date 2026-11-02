"use client";
import { useFirmaSaltOkunur } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Search, Users, X } from "lucide-react";
import { SadeTabloSecimi } from "@/components/kontrol/SadeKontroller";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { eclubKisiRolEtiketi } from "@/lib/utils/roller";
import { ECLUB_UYE_SUTUNLARI } from "@/lib/admin/eclubUyeleri";
import type { EclubUyeSutunu, AdminEclubUye, AdminEclubUyeVerisi, AdminEclubSorumlu } from "@/lib/admin/eclubUyeleri";
import styles from "../../admin.module.css";
import local from "./eclub-yonetimi.module.css";

interface Props { firmaId: string; firmaAdi: string; hata: (mesaj: string, adim?: string, detay?: string) => void; basari: (mesaj: string) => void }

function SorumluHucresi({ uye, alan }: { uye: AdminEclubUye; alan: keyof Omit<AdminEclubSorumlu, "temsilci_id"> }) {
  return uye.sorumlular.length ? <div className={local.organization}>{uye.sorumlular.map(s => <span key={s.temsilci_id}>{s[alan] || "—"}</span>)}</div> : <>—</>;
}

export default function EclubUyeler({ firmaId, firmaAdi, hata, basari }: Props) {
  const saltOkunur = useFirmaSaltOkunur();
  const [veri, setVeri] = useState<AdminEclubUyeVerisi | null>(null);
  const [filtre, setFiltre] = useState({ q: "", sayfa: 1, ...Object.fromEntries(ECLUB_UYE_SUTUNLARI.map(s => [s.anahtar, ""])) as Record<EclubUyeSutunu, string> });
  const [arama, setArama] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediyor, setKaydediyor] = useState(false);
  const [listeHatasi, setListeHatasi] = useState("");
  const [secili, setSecili] = useState<AdminEclubUye | null>(null);
  const [onay, setOnay] = useState(false);
  const canli = useRef(true);
  const kilit = useRef(false);
  const istek = useRef<AbortController | null>(null);
  const api = `/admin/api/firmalar/${encodeURIComponent(firmaId)}/eclub/uyeler`;

  const yenile = useCallback(async () => {
    istek.current?.abort();
    const kontrol = new AbortController();
    istek.current = kontrol;
    setYukleniyor(true); setListeHatasi("");
    try {
      const params = new URLSearchParams({ ...filtre, sayfa: String(filtre.sayfa) });
      const res = await fetch(`${api}?${params}`, { signal: kontrol.signal, cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.hata ?? "Üyeler yüklenemedi.");
      if (!kontrol.signal.aborted) setVeri(d);
    } catch (e) { if (!kontrol.signal.aborted) setListeHatasi(e instanceof Error ? e.message : "Üyeler yüklenemedi."); }
    finally { if (!kontrol.signal.aborted) setYukleniyor(false); }
  }, [api, filtre]);

  useEffect(() => {
    canli.current = true; void yenile();
    return () => { canli.current = false; istek.current?.abort(); };
  }, [yenile]);

  function detayKapat() { setSecili(null); setOnay(false); }
  function filtreDegistir(yeni: Partial<typeof filtre>) {
    if (kilit.current) return;
    detayKapat(); setFiltre(f => ({ ...f, ...yeni }));
  }

  async function pasifeAl() {
    if (kilit.current || !secili || !onay || !secili.aktif_mi) return;
    kilit.current = true; setKaydediyor(true); setListeHatasi("");
    try {
      const res = await fetch("/admin/api/eclub/kayitli", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kisi_id: secili.kisi_id, eczane_id: secili.eczane_id, firma_id: firmaId }),
      });
      const d = await res.json();
      if (!canli.current) return;
      if (!res.ok) { setListeHatasi(d.hata ?? "Kişi pasife alınamadı."); hata(d.hata ?? "Kişi pasife alınamadı.", d.adim, d.detay); return; }
      basari(d.mesaj ?? "Kişi bu eczanede pasife alındı."); detayKapat();
      await yenile();
    } catch { if (canli.current) setListeHatasi("İşlem sonucu alınamadı. Güncel listeyi yenileyin."); }
    finally { kilit.current = false; if (canli.current) setKaydediyor(false); }
  }

  return <div className={styles.stack}>
    <section className={styles.card} aria-labelledby="admin-eclub-uyeler-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-eclub-uyeler-baslik"><Users />Üye Eczacılar ve Eczane Teknisyenleri</h2><p>{firmaAdi} firmasına bağlı eczaneler, eczacılar ve eczane teknisyenleri</p></div><button type="button" className={styles.button} disabled={yukleniyor || kaydediyor} onClick={() => { detayKapat(); void yenile(); }}><RefreshCw />Yenile</button></div>
      {listeHatasi && <p className={`${styles.notice} ${local.message} ${local.error}`} role="alert">{listeHatasi}</p>}
      <div className={`${styles.toolbar} ${local.memberToolbar}`}>
        <form className={local.memberSearch} onSubmit={e => { e.preventDefault(); filtreDegistir({ q: arama.trim(), sayfa: 1 }); }}>
          <Input aria-label="Üye, telefon, e-posta, eczane veya GLN ara" placeholder="Üye, eczane veya GLN ara…" maxLength={80} value={arama} disabled={kaydediyor} onChange={e => setArama(e.target.value)} />
          <Button type="submit" disabled={kaydediyor}><Search />Ara</Button>
        </form>
      </div>
      <div className={styles.tableWrap}><table className={`${local.table} ${local.memberTable}`} aria-label="E-Club üye listesi" aria-busy={yukleniyor}>
        <thead><tr>{ECLUB_UYE_SUTUNLARI.map(s => <th key={s.anahtar}><div className={local.columnHeading}><SadeTabloSecimi etiket={`${s.baslik} filtresi`} className={local.columnSelect} menuClassName={local.columnMenu} deger={filtre[s.anahtar]} disabled={kaydediyor || yukleniyor} secenekler={[{ deger: "", etiket: s.tumu }, ...(veri?.secenekler?.[s.anahtar] ?? []).map(o => ({ ...o, etiket: s.anahtar === "rol" && o.deger !== "__bos__" ? eclubKisiRolEtiketi(o.deger) : o.etiket }))]} onDegistir={deger => filtreDegistir({ [s.anahtar]: deger, sayfa: 1 })} /></div></th>)}<th>İşlem</th></tr></thead>
        <tbody>{yukleniyor ? <tr><td colSpan={13} className={styles.empty}>Üyeler yükleniyor…</td></tr> : listeHatasi ? <tr><td colSpan={13} className={styles.empty}>Güncel liste alınamadı.</td></tr> : !veri?.uyeler.length ? <tr><td colSpan={13} className={styles.empty}>Bu kapsamda üye bulunamadı.</td></tr> : veri.uyeler.map(u => <tr key={u.uyelik_id} data-selected={secili?.uyelik_id === u.uyelik_id}>
          <td><SorumluHucresi uye={u} alan="takim_adi" /></td><td><SorumluHucresi uye={u} alan="bolge_adi" /></td><td><SorumluHucresi uye={u} alan="temsilci_adi" /></td>
          <td>{u.il || "—"}</td><td>{u.ilce || "—"}</td><td>{u.gln}</td><td>{u.eczane_adi}</td><td>{eclubKisiRolEtiketi(u.rol)}</td><td className={styles.name}>{u.ad} {u.soyad}</td><td>{u.telefon || "—"}</td><td>{u.eposta || "—"}</td><td><span className={`${styles.status} ${u.aktif_mi ? styles.statusActive : ""}`}>{u.aktif_mi ? "Aktif" : "Pasif"}</span></td><td><a className={styles.button} href="#admin-eclub-uye-detay" aria-disabled={kaydediyor} onClick={e => { if (kilit.current) { e.preventDefault(); return; } setSecili(u); setOnay(false); }}>Detay</a></td>
        </tr>)}</tbody>
      </table></div>
      {veri && !listeHatasi && <div className={local.memberPagination}><span>{veri.sayfalama.toplam} üyelik · Sayfa {veri.sayfalama.sayfa} / {veri.sayfalama.toplam_sayfa}</span><div className={styles.actions}><button type="button" className={styles.button} disabled={yukleniyor || kaydediyor || veri.sayfalama.sayfa <= 1} onClick={() => filtreDegistir({ sayfa: veri.sayfalama.sayfa - 1 })}>Önceki</button><button type="button" className={styles.button} disabled={yukleniyor || kaydediyor || veri.sayfalama.sayfa >= veri.sayfalama.toplam_sayfa} onClick={() => filtreDegistir({ sayfa: veri.sayfalama.sayfa + 1 })}>Sonraki</button></div></div>}
    </section>

    <section className={styles.card} id="admin-eclub-uye-detay" aria-labelledby="admin-eclub-detay-baslik">
      <div className={styles.cardHeader}><h2 id="admin-eclub-detay-baslik">Üye Detayı</h2>{secili && <button type="button" className={styles.button} disabled={kaydediyor} onClick={detayKapat}><X />Kapat</button>}</div>
      {!secili ? <p className={styles.empty}>Üye detayını görmek için listeden bir üye seçin.</p> : <div className={styles.cardBody}>
        <dl className={local.memberDetail}>{[
          ["Ad Soyad", `${secili.ad} ${secili.soyad}`], ["Unvan (Rol)", eclubKisiRolEtiketi(secili.rol)],
          ["Eczane", secili.eczane_adi], ["GLN", secili.gln], ["Eczanenin İli", secili.il || "—"], ["Eczanenin İlçesi", secili.ilce || "—"],
          ["Cep Telefonu", secili.telefon || "—"], ["E-posta", secili.eposta || "—"], ["Durum", secili.aktif_mi ? "Aktif" : "Pasif"],
        ].map(([ad, deger]) => <div key={ad}><dt>{ad}</dt><dd>{deger}</dd></div>)}</dl>
        {!saltOkunur && secili.aktif_mi && (onay ? <div className={local.confirm} role="group" aria-label="Üyeliği pasife alma onayı"><p>{secili.ad} {secili.soyad} kişinin {secili.eczane_adi} üyeliği pasife alınsın mı?</p><div className={styles.actions}><button type="button" className={`${styles.button} ${styles.danger}`} disabled={kaydediyor} onClick={() => void pasifeAl()}>{kaydediyor ? "Kaydediliyor…" : "Onayla, pasife al"}</button><button type="button" className={styles.button} disabled={kaydediyor} onClick={() => setOnay(false)}>Vazgeç</button></div></div> : <div className={local.memberDetailActions}><button type="button" className={`${styles.button} ${styles.danger}`} disabled={kaydediyor || yukleniyor} onClick={() => setOnay(true)}>Üyeliği pasife al</button></div>)}
      </div>}
    </section>
  </div>;
}
