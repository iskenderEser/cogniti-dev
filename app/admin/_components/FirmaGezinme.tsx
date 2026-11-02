"use client";

import { useState } from "react";
import { Building2, ChevronDown, ChevronRight, Factory, ImageIcon, Plus, Settings2, Store, Ticket, Trash2 } from "lucide-react";
import type { Firma } from "../_types";
import type { GlobalBolumId, ModulSekmeId } from "../_constants";
import { platformBannerFirmasi } from "@/lib/eclub/banner";
import styles from "../admin.module.css";

export type FirmaSayfasi = ModulSekmeId | "abonelik-paketleri" | "firmabilgileri" | "firmaayarlar" | "firma-admin-yonetimi" | "firmaislemler" | "eclub-bannerlar" | "eclub-uyeler" | "eclub-puan-tl" | "eczanem-cek-yonetimi" | "eczanem-bannerlar";
export const FIRMA_SAYFALARI: Record<FirmaSayfasi, { baslik: string; etiket?: string; grup?: string }> = {
  firmabilgileri: { baslik:"Firma Bilgileri" },
  kullanicilar: { baslik: "Kullanıcılar", grup: "Firma Yönetimi" },
  organizasyon: { baslik: "Organizasyon", grup: "Firma Yönetimi" },
  urunteknik: { baslik: "Ürün ve Teknik", grup: "Firma Yönetimi" },
  "puan-yonetimi": { baslik: "Yayın Puan Yönetimi", grup: "Firma Yönetimi" },
  logokimlik: { baslik: "Navbar Logo Ayarları", grup: "Firma Yönetimi" },
  "firma-admin-yonetimi": { baslik: "Firma Admin Yönetimi", grup: "Firma Yönetimi" },
  firmaayarlar: { baslik: "Firma Durumu", grup: "Firma Yönetimi" },
  firmaislemler: { baslik: "Firma Verileri İşlemleri", grup: "Firma Yönetimi" },
  tclub: { baslik: "T-Club", grup: "Modüller" },
  cclub: { baslik: "C-Club", grup: "Modüller" },
  eclub: { baslik: "E-Club", grup: "Modüller" },
  "eclub-bannerlar": { baslik: "Eclub Banner", grup: "Modüller" },
  "eclub-uyeler": { baslik: "Erişim ve Üye Yönetimi", grup: "Modüller" },
  "eclub-puan-tl": { baslik: "Eclub Çek Yönetimi", grup: "Modüller" },
  "eczanem-bannerlar": { baslik: "Eczanem Bannerlar", grup: "Modüller" },
  "eczanem-cek-yonetimi": { baslik: "Eczanem Çek Yönetimi", grup: "Modüller" },
  eczanem: { baslik: "Erişim ve Üye Yönetimi", grup: "Modüller" },
  firmastore: { baslik: "FirmaStore Çek Yönetimi", grup: "Modüller" },
  "abonelik-paketleri": { baslik:"Abonelik Paketleri", grup:"Abonelik Yönetimi" },
  token: { baslik:"Token Kullanım Listesi", etiket:"Token Kullanımı", grup:"Abonelik Yönetimi" },
};

export function yonetimSayfasiBilgisi(sayfa: FirmaSayfasi, platform = false) {
  const bilgi = FIRMA_SAYFALARI[sayfa];
  if (!platform) return bilgi;
  return {
    ...bilgi,
    baslik: sayfa === "firmaayarlar" ? "Platform Ayarları" : sayfa === "firmaislemler" ? "Platform İşlemleri" : bilgi.baslik,
    grup: bilgi.grup === "Firma Yönetimi" ? "Platform Yönetimi" : bilgi.grup,
  };
}

interface Props {
  firmaAdmin?: boolean;
  firmalar: Firma[];
  seciliFirma: Firma | null;
  seciliSayfa: FirmaSayfasi;
  globalBolum: GlobalBolumId | "yeni-firma" | null;
  onFirmaSec: (firma: Firma) => void;
  onSayfaSec: (sayfa: FirmaSayfasi, firma?: Firma) => void;
  onGlobalSec: (bolum: GlobalBolumId | "yeni-firma") => void;
  loading: boolean;
  acik: boolean;
}

export default function FirmaGezinme(p: Props) {
  const [arama, setArama] = useState("");
  const [kapaliFirmaId, setKapaliFirmaId] = useState<string | null>(null);
  const musteriFirmalari = p.firmalar.filter(f => !platformBannerFirmasi(f.firma_id));
  const firmalar = musteriFirmalari.filter(f => f.firma_adi.toLocaleLowerCase("tr-TR").includes(arama.toLocaleLowerCase("tr-TR")));
  function sayfaButonu(sayfa: FirmaSayfasi, firma: Firma) {
    return <button type="button" key={`${firma.firma_id}-${sayfa}`} className={styles.navButton} aria-current={!p.globalBolum && p.seciliFirma?.firma_id === firma.firma_id && p.seciliSayfa === sayfa ? "page" : undefined} onClick={() => p.onSayfaSec(sayfa, firma)}>{FIRMA_SAYFALARI[sayfa].etiket ?? yonetimSayfasiBilgisi(sayfa, platformBannerFirmasi(firma.firma_id)).baslik}</button>;
  }
  function yonetimSayfalari(firma: Firma) {
    const platformSayfalari = platformBannerFirmasi(firma.firma_id);
    const secili = !p.globalBolum && p.seciliFirma?.firma_id === firma.firma_id;
    const buton = (sayfa: FirmaSayfasi) => sayfaButonu(sayfa, firma);
    return <>
      {buton("firmabilgileri")}
      <details className={styles.group} open={secili && FIRMA_SAYFALARI[p.seciliSayfa].grup === "Abonelik Yönetimi"}>
        <summary className={styles.groupSummary}>Abonelik Yönetimi</summary>
        <div className={styles.leaves}>
          {buton("abonelik-paketleri")}
          {buton("token")}
        </div>
      </details>
      <details className={styles.group} open={!platformSayfalari || secili}><summary className={styles.groupSummary}>{platformSayfalari ? "Platform Yönetimi" : "Firma Yönetimi"}</summary><div className={styles.leaves}>
        {(["organizasyon", "kullanicilar", "urunteknik", "puan-yonetimi", "firmaislemler", "logokimlik", "firmaayarlar"] as const).map(buton)}
        {!p.firmaAdmin && !platformSayfalari && buton("firma-admin-yonetimi")}
      </div></details>
      <details className={styles.group} open={secili && FIRMA_SAYFALARI[p.seciliSayfa].grup === "Modüller"}><summary className={styles.groupSummary}>Modüller</summary><div className={styles.leaves}>
        {(["tclub", "cclub"] as const).map(buton)}
        {buton("firmastore")}
        <details className={styles.group} open={secili && (p.seciliSayfa === "eclub" || p.seciliSayfa === "eclub-bannerlar" || p.seciliSayfa === "eclub-uyeler" || p.seciliSayfa === "eclub-puan-tl")}>
          <summary className={styles.groupSummary}>E-Club</summary>
          <div className={styles.leaves}>
            {buton("eclub-uyeler")}
            {buton("eclub-bannerlar")}
            {buton("eclub-puan-tl")}
          </div>
        </details>
        <details className={styles.group} open={secili && (p.seciliSayfa === "eczanem" || p.seciliSayfa === "eczanem-bannerlar" || p.seciliSayfa === "eczanem-cek-yonetimi")}>
          <summary className={styles.groupSummary}>Eczanem</summary>
          <div className={styles.leaves}>
            {buton("eczanem")}
            {buton("eczanem-bannerlar")}
            {buton("eczanem-cek-yonetimi")}
          </div>
        </details>
      </div></details>
    </>;
  }
  return <aside className={styles.sidebar} data-open={p.acik} aria-label="Admin gezinmesi" id="admin-gezinme">
    {!p.firmaAdmin && <div className={styles.navSection}>
      <p className={styles.navTitle}>Cogniti Yönetimi</p>
      <div className={styles.navList}>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "yeni-firma" ? "page" : undefined} onClick={() => p.onGlobalSec("yeni-firma")}><Plus />Yeni Firma Kaydı</button>
        <div role="separator" style={{ borderTop: "1px solid var(--tema-kontrol-cizgi)", margin: "6px 0" }} />
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "uretim" ? "page" : undefined} onClick={() => p.onGlobalSec("uretim")}><Factory />İçerik Üretimi</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "sistem" ? "page" : undefined} onClick={() => p.onGlobalSec("sistem")}><Settings2 />Sistem Ayarları</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "hbstore" ? "page" : undefined} onClick={() => p.onGlobalSec("hbstore")}><Store />FirmaStore Çek Yönetimi</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "eclubstore" ? "page" : undefined} onClick={() => p.onGlobalSec("eclubstore")}><Ticket />E-Club Çek Teslimatı</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "veri-sil" ? "page" : undefined} onClick={() => p.onGlobalSec("veri-sil")}><Trash2 />Yayın Toplu/Tekil Silme</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "bannerlar" ? "page" : undefined} onClick={() => p.onGlobalSec("bannerlar")}><ImageIcon />Cogniti Bannerları</button>
      </div>
    </div>
    }
    {!p.firmaAdmin && <><p className={styles.navTitle}>Firmalar</p>
    <input className={styles.search} type="search" aria-label="Firma ara" placeholder="Firma ara…" value={arama} onChange={e => setArama(e.target.value)} />
    </>}
    {p.loading && !musteriFirmalari.length && <p role="status" className={styles.empty}>Firmalar yükleniyor…</p>}
    {!p.loading && !firmalar.length && <p className={styles.empty}>Firma bulunamadı.</p>}
    {firmalar.map(f => {
      const secili = p.seciliFirma?.firma_id === f.firma_id;
      const acik = secili && kapaliFirmaId !== f.firma_id;
      return <div key={f.firma_id}>
        <button type="button" className={styles.companyButton} aria-expanded={acik} aria-controls={`firma-nav-${f.firma_id}`} onClick={() => {
          if (secili && acik) { setKapaliFirmaId(f.firma_id); return; }
          setKapaliFirmaId(null);
          p.onFirmaSec(f);
        }}><Building2 /><span className={styles.companyName}>{f.firma_adi}{!f.aktif && <span className={styles.subtext}>Pasif</span>}</span>{acik ? <ChevronDown /> : <ChevronRight />}</button>
        {acik && <div id={`firma-nav-${f.firma_id}`} className={styles.companyPages}>
          {yonetimSayfalari(f)}
        </div>}
      </div>;
    })}
  </aside>;
}
