"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Handshake, Building2, ChevronDown, ChevronRight, Factory, ImageIcon, Plus, Settings2, Store, Ticket, Trash2, X, LogOut } from "lucide-react";
import { PARTNER_SAYFALARI, type PartnerSayfasi, type PartnerFirmaOzeti } from "@/lib/agora/partnerFirmaYonetimi";
import type { Firma } from "../_types";
import type { GlobalBolumId, ModulSekmeId } from "../_constants";
import { platformBannerFirmasi } from "@/lib/eclub/banner";
import styles from "../admin.module.css";
import { Dialog } from "radix-ui";

const mobilSorgu = "(max-width: 767px)";
const mobilDinle = (bildir: () => void) => { const sorgu = window.matchMedia(mobilSorgu); sorgu.addEventListener("change", bildir); return () => sorgu.removeEventListener("change", bildir); };
const mobilOku = () => window.matchMedia(mobilSorgu).matches;
const sunucuMobilOku = () => false;

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
  partnerFirmalar?: PartnerFirmaOzeti[];
  partnerYukleniyor?: boolean;
  partnerHata?: string;
  seciliPartnerId?: string | null;
  seciliPartnerSayfa?: PartnerSayfasi;
  onPartnerSec?: (partnerId:string,sayfa:PartnerSayfasi) => void;
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
  onKapat: () => void;
  onCikis: () => void;
  hedefGrup?: string | null;
}

export default function FirmaGezinme(p: Props) {
  const mobil = useSyncExternalStore(mobilDinle, mobilOku, sunucuMobilOku);
  const [arama, setArama] = useState("");
  const [kapaliPartnerId, setKapaliPartnerId] = useState<string | null>(null);
  const [kapaliFirmaId, setKapaliFirmaId] = useState<string | null>(null);
  useEffect(() => {
    if (!p.acik || !p.hedefGrup) return;
    const id = requestAnimationFrame(() => {
      const hedef = Array.from(document.querySelectorAll<HTMLElement>('#admin-gezinme [data-nav-grup]')).find(el => el.dataset.navGrup === p.hedefGrup);
      if (!hedef) return;
      let ata = hedef.parentElement;
      while (ata && ata.id !== "admin-gezinme") { if (ata instanceof HTMLDetailsElement) ata.open = true; ata = ata.parentElement; }
      hedef.focus(); hedef.scrollIntoView({ block: "nearest" });
    });
    return () => cancelAnimationFrame(id);
  }, [p.acik, p.hedefGrup, mobil]);

  const musteriFirmalari = p.firmalar.filter(f => !platformBannerFirmasi(f.firma_id));
  const firmalar = musteriFirmalari.filter(f => f.firma_adi.toLocaleLowerCase("tr-TR").includes(arama.toLocaleLowerCase("tr-TR")));
  function sayfaButonu(sayfa: FirmaSayfasi, firma: Firma) {
    return <button type="button" key={`${firma.firma_id}-${sayfa}`} className={styles.navButton} aria-current={!p.globalBolum && p.seciliFirma?.firma_id === firma.firma_id && p.seciliSayfa === sayfa ? "page" : undefined} onClick={() => { p.onKapat(); p.onSayfaSec(sayfa, firma); }}>{FIRMA_SAYFALARI[sayfa].etiket ?? yonetimSayfasiBilgisi(sayfa, platformBannerFirmasi(firma.firma_id)).baslik}</button>;
  }
  function yonetimSayfalari(firma: Firma) {
    const platformSayfalari = platformBannerFirmasi(firma.firma_id);
    const secili = !p.globalBolum && p.seciliFirma?.firma_id === firma.firma_id;
    const buton = (sayfa: FirmaSayfasi) => sayfaButonu(sayfa, firma);
    return <>
      {buton("firmabilgileri")}
      <details className={styles.group} open={secili && FIRMA_SAYFALARI[p.seciliSayfa].grup === "Abonelik Yönetimi"}>
        <summary data-nav-grup="Abonelik Yönetimi" className={styles.groupSummary}>Abonelik Yönetimi</summary>
        <div className={styles.leaves}>
          {buton("abonelik-paketleri")}
          {buton("token")}
        </div>
      </details>
      <details className={styles.group} open={!platformSayfalari || secili}><summary data-nav-grup={platformSayfalari ? "Platform Yönetimi" : "Firma Yönetimi"} className={styles.groupSummary}>{platformSayfalari ? "Platform Yönetimi" : "Firma Yönetimi"}</summary><div className={styles.leaves}>
        {(["organizasyon", "kullanicilar", "urunteknik", "puan-yonetimi", "firmaislemler", "logokimlik", "firmaayarlar"] as const).map(buton)}
        {!p.firmaAdmin && !platformSayfalari && buton("firma-admin-yonetimi")}
      </div></details>
      <details className={styles.group} open={secili && FIRMA_SAYFALARI[p.seciliSayfa].grup === "Modüller"}><summary data-nav-grup="Modüller" className={styles.groupSummary}>Modüller</summary><div className={styles.leaves}>
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
  const gezinme = <aside className={styles.sidebar} data-open={p.acik} aria-label="Admin gezinmesi" id="admin-gezinme">
    {mobil && <div className={styles.drawerHeader}><Dialog.Title>Yönetim Menüsü</Dialog.Title><Dialog.Close asChild><button type="button" className={styles.button} aria-label="Yönetim menüsünü kapat"><X /></button></Dialog.Close></div>}
    <div className={styles.navScroll}>
    {!p.firmaAdmin && <div className={styles.navSection}>
      <button type="button" className={`${styles.navButton} ${styles.managementEntry}`} data-nav-grup="Cogniti Partner Yönetimi" aria-current={p.globalBolum === "partnerler" && !p.seciliPartnerId ? "page" : undefined} onClick={() => { p.onKapat(); p.onGlobalSec("partnerler"); }}><Handshake aria-hidden="true" />COGNITI PARTNER YÖNETİMİ</button>
      {p.partnerYukleniyor && <p role="status" className={styles.empty}>Partner firmalar yükleniyor…</p>}
      {p.partnerHata && <p role="alert" className={styles.empty}>{p.partnerHata}</p>}
      {(p.partnerFirmalar ?? []).map(partner => {
        const secili=p.globalBolum==="partnerler" && p.seciliPartnerId===partner.partner_id;
        const acik=secili && kapaliPartnerId!==partner.partner_id;
        return <div key={partner.partner_id}>
          <button type="button" className={styles.companyButton} aria-expanded={acik} aria-controls={`partner-nav-${partner.partner_id}`} onClick={()=>{
            if(acik){setKapaliPartnerId(partner.partner_id);return;}
            setKapaliPartnerId(null);p.onPartnerSec?.(partner.partner_id,"firma-bilgileri");
          }}><Building2 /><span className={styles.companyName}>{partner.sirket_adi}</span>{acik?<ChevronDown />:<ChevronRight />}</button>
          {acik && <div id={`partner-nav-${partner.partner_id}`} className={styles.companyPages}>
            {(Object.keys(PARTNER_SAYFALARI) as PartnerSayfasi[]).map(sayfa=><button key={sayfa} type="button" className={styles.navButton} aria-current={p.seciliPartnerSayfa===sayfa?"page":undefined} onClick={()=>{p.onKapat();p.onPartnerSec?.(partner.partner_id,sayfa);}}>{PARTNER_SAYFALARI[sayfa]}</button>)}
          </div>}
        </div>;
      })}

    </div>}
    {!p.firmaAdmin && <div className={styles.navSection}>
      <p className={styles.navTitle} data-nav-grup="Cogniti Firma Yönetimi" tabIndex={-1}>COGNITI FİRMA YÖNETİMİ</p>
      <div className={styles.navList}>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "yeni-firma" ? "page" : undefined} onClick={() => { p.onKapat(); p.onGlobalSec("yeni-firma"); }}><Plus />Yeni Firma Kaydı</button>
        <div role="separator" style={{ borderTop: "1px solid var(--tema-kontrol-cizgi)", margin: "6px 0" }} />
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "uretim" ? "page" : undefined} onClick={() => { p.onKapat(); p.onGlobalSec("uretim"); }}><Factory />İçerik Üretimi</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "sistem" ? "page" : undefined} onClick={() => { p.onKapat(); p.onGlobalSec("sistem"); }}><Settings2 />Sistem Ayarları</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "hbstore" ? "page" : undefined} onClick={() => { p.onKapat(); p.onGlobalSec("hbstore"); }}><Store />FirmaStore Çek Yönetimi</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "eclubstore" ? "page" : undefined} onClick={() => { p.onKapat(); p.onGlobalSec("eclubstore"); }}><Ticket />E-Club Çek Teslimatı</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "veri-sil" ? "page" : undefined} onClick={() => { p.onKapat(); p.onGlobalSec("veri-sil"); }}><Trash2 />Yayın Toplu/Tekil Silme</button>
        <button type="button" className={styles.navButton} aria-current={p.globalBolum === "bannerlar" ? "page" : undefined} onClick={() => { p.onKapat(); p.onGlobalSec("bannerlar"); }}><ImageIcon />Cogniti Bannerları</button>
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
      const acik = secili && (kapaliFirmaId !== f.firma_id || Boolean(p.acik && p.hedefGrup));
      return <div key={f.firma_id}>
        <button type="button" className={styles.companyButton} aria-expanded={acik} aria-controls={`firma-nav-${f.firma_id}`} data-nav-grup={platformBannerFirmasi(f.firma_id) ? "Cogniti Firma Yönetimi" : undefined} onClick={() => {
          if (secili && acik) { setKapaliFirmaId(f.firma_id); return; }
          setKapaliFirmaId(null);
          p.onFirmaSec(f);
        }}><Building2 /><span className={styles.companyName}>{f.firma_adi}{!f.aktif && <span className={styles.subtext}>Pasif</span>}</span>{acik ? <ChevronDown /> : <ChevronRight />}</button>
        {acik && <div id={`firma-nav-${f.firma_id}`} className={styles.companyPages}>
          {yonetimSayfalari(f)}
        </div>}
      </div>;
    })}
    </div>
    {mobil && <div className={styles.drawerFooter}><button type="button" onClick={() => { p.onKapat(); p.onCikis(); }}><LogOut size={15} aria-hidden="true" />Çıkış</button></div>}
  </aside>;
  if (!mobil) return gezinme;
  return <Dialog.Root open={p.acik} onOpenChange={acik => { if (!acik) p.onKapat(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.drawerOverlay} />
      <Dialog.Content asChild aria-describedby={undefined} onCloseAutoFocus={event => { event.preventDefault(); document.querySelector<HTMLButtonElement>('[aria-controls="admin-gezinme"]')?.focus(); }}>{gezinme}</Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
