"use client";

import { FirmaYonetimYetkisi } from "./_components/FirmaYonetimYetkisi";
import { Suspense, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { FIRMA_ADMIN_ROLU } from "@/lib/utils/roller";
import { useSearchParams } from "next/navigation";
import { Building2, ChevronRight, Settings2 } from "lucide-react";
import styles from "./admin.module.css";
import FirmaGezinme, { FIRMA_SAYFALARI, yonetimSayfasiBilgisi, type FirmaSayfasi } from "./_components/FirmaGezinme";
import KullaniciYonetimi from "./_components/KullaniciYonetimi";
import FirmaBilgileri from "./_components/FirmaBilgileri";
import YeniFirmaFormu from "./_components/YeniFirmaFormu";
import FirmaAdminYonetimi from "./_components/FirmaAdminYonetimi";
import FirmaYonetimIslemleri from "./_components/FirmaYonetimIslemleri";
import { HataMesajiContainer } from "@/components/HataMesaji";
import { platformBannerFirmasi } from "@/lib/eclub/banner";
import { useAdminPanel } from "./_hooks/useAdminPanel";
import { useTakimBolgeForm } from "./_hooks/useTakimBolgeForm";

import AdminUstBar from "./_components/AdminUstBar";
import TopluTekilSilPaneli from "./_components/TopluTekilSilPaneli";
import TokenYonetimi from "./_components/TokenYonetimi";
import TClubYonetimi from "./_components/TClubYonetimi";
import CClubYonetimi from "./_components/CClubYonetimi";
import PuanYonetimi from "./_components/PuanYonetimi";
import FirmaStoreErisimi from "./_components/FirmaStoreErisimi";
import FirmaStoreCekTanimlari from "./_components/FirmaStoreCekTanimlari";
import TakimBolgeFormu from "./_components/TakimBolgeFormu";
import UrunTeknikYonetimi from "./_components/UrunTeknikYonetimi";
import LogoKimlikYonetimi from "./_components/LogoKimlikYonetimi";
import CognitiBannerlari from "./_components/CognitiBannerlari";
import SistemAyarlari from "./_components/SistemAyarlari";
import HbStorePaneli from "./_components/global/HbStorePaneli";
import EczanemFirmaCekTanimlari from "./eczanem/_components/EczanemFirmaCekTanimlari";
import EclubFirmaCekTanimlari from "./eclub-cek-teslimat/_components/EclubFirmaCekTanimlari";
import EclubStorePaneli from "./_components/global/EclubStorePaneli";
import EclubYonetimPaneli from "./eclub/_components/EclubYonetimPaneli";
import EclubErisim from "./eclub/_components/EclubErisim";
import EczanemUyeYonetimi from "./eczanem/_components/EczanemUyeYonetimi";
import EczanemErisim from "./eczanem/_components/EczanemErisim";
import EczanemBannerYonetimi from "./eczanem/_components/EczanemBannerYonetimi";
import EclubBannerYonetimi from "./eclub/_components/EclubBannerYonetimi";
import UretimAtamaPaneli from "./_components/global/UretimAtamaPaneli";

import type { GlobalBolumId } from "./_constants";
import type { Firma } from "./_types";

export default function AdminPanel() {
  const { yukleniyor } = useAuth();
  if (yukleniyor) return null;
  return <Suspense fallback={null}><AdminPanelIcerigi /></Suspense>;
}

function AdminPanelIcerigi() {
  const aramaParametreleri = useSearchParams();
  const { kullanici: oturumKullanicisi } = useAuth();
  const firmaAdmin = oturumKullanicisi?.rol === FIRMA_ADMIN_ROLU;
  const firmaId = firmaAdmin ? oturumKullanicisi?.firma_id ?? null : aramaParametreleri.get("firma");
  const sayfaParametresi = aramaParametreleri.get("sayfa") ?? "firmabilgileri";
  const seciliSekme: FirmaSayfasi = Object.hasOwn(FIRMA_SAYFALARI, sayfaParametresi) ? sayfaParametresi as FirmaSayfasi : "firmabilgileri";
  const bolumParametresi = aramaParametreleri.get("bolum");
  const globalBolum = bolumParametresi && ["bannerlar", "sistem", "hbstore", "eclubstore", "veri-sil", "uretim", "yeni-firma"].includes(bolumParametresi)
    ? bolumParametresi as GlobalBolumId | "yeni-firma" : null;
  const admin = useAdminPanel(firmaId);
  const [menuAcik, setMenuAcik] = useState(false);

  const takimBolge = useTakimBolgeForm({
    seciliFirma: admin.seciliFirma,
    refreshTakimlar: admin.refreshTakimlar,
    hata: admin.hata,
    basari: admin.basari,
  });

  const konumuGuncelle = (sekme: FirmaSayfasi, firma: Firma | null, bolum: GlobalBolumId | "yeni-firma" | null = null) => {
    const params = new URLSearchParams(aramaParametreleri.toString());
    if (firma) params.set("firma", firma.firma_id); else params.delete("firma");
    params.set("sayfa", sekme);
    if (bolum) params.set("bolum", bolum); else params.delete("bolum");
    window.history.pushState(null, "", `?${params.toString()}`);
    document.getElementById("admin-icerik")?.scrollTo({ top:0 });
    setMenuAcik(false);
  };
  const handleFirmaSecildi = (firma: Firma) => {
    konumuGuncelle("firmabilgileri", firma);
  };
  const handleSekmeSec = (sekme: FirmaSayfasi, firma?: Firma) => {
    konumuGuncelle(sekme, firma ?? admin.seciliFirma);
  };
  const handleGlobalSec = (bolum: GlobalBolumId | "yeni-firma") => {
    konumuGuncelle(seciliSekme, admin.seciliFirma, bolum);
  };

  if (admin.yukleniyor || !admin.kullanici) return null;

  // URL'deki firma yüklenirken önceki firmanın ekranını göstermeyin.
  const f = firmaId && admin.seciliFirma?.firma_id !== firmaId ? null : admin.seciliFirma;
  const saltOkunur = !globalBolum && seciliSekme !== "firma-admin-yonetimi" && !firmaAdmin && f?.firma_admin_aktif === true;
  const platformSecili = !!f && platformBannerFirmasi(f.firma_id);
  const sayfa = yonetimSayfasiBilgisi(seciliSekme, platformSecili);
  const globalBaslik = globalBolum ? ({ bannerlar:"Cogniti Bannerları", sistem:"Sistem Ayarları", hbstore:"FirmaStore Çek Yönetimi", eclubstore:"E-Club Çek Teslimatı", "veri-sil":"Yayın Toplu/Tekil Silme", uretim:"İçerik Üretimi", "yeni-firma":"Yeni Firma Kayıt" }[globalBolum]) : null;

  return (
    <FirmaYonetimYetkisi value={saltOkunur}><div className={styles.shell}>
      <AdminUstBar
        kullaniciAd={`${admin.kullanici.ad} ${admin.kullanici.soyad}`}
        onAnaSayfa={() => konumuGuncelle("kullanicilar", admin.seciliFirma)}
        menuAcik={menuAcik}
        onMenu={() => setMenuAcik(v => !v)}
        onCikis={admin.cikisYap} firmaAdmin={firmaAdmin}
      />

      <HataMesajiContainer mesajlar={admin.mesajlar} />

      <div className={styles.body}>
        <FirmaGezinme firmalar={admin.firmalar} seciliFirma={f} seciliSayfa={seciliSekme}
          globalBolum={globalBolum} onFirmaSec={handleFirmaSecildi} onSayfaSec={handleSekmeSec}
          onGlobalSec={handleGlobalSec} firmaAdmin={firmaAdmin} loading={admin.loading} acik={menuAcik} />
        <main className={styles.main} id="admin-icerik"><div className={styles.content}>
          <div className={styles.breadcrumb} aria-label="Sayfa konumu">
            {(globalBolum || !f) && <><span>Cogniti Yönetimi</span><ChevronRight /></>}
            {globalBolum ? <span>{globalBaslik}</span> : f ? <><span>{platformSecili ? "Cogniti Yönetimi" : f.firma_adi}</span>{sayfa.grup && <><ChevronRight /><span>{sayfa.grup}</span></>}{(seciliSekme === "eclub-bannerlar" || seciliSekme === "eclub-uyeler" || seciliSekme === "eclub-puan-tl") && <><ChevronRight /><span>E-Club</span></>}{(seciliSekme === "eczanem-cek-yonetimi" || seciliSekme === "eczanem-bannerlar") && <><ChevronRight /><span>Eczanem</span></>}<ChevronRight /><span>{sayfa.baslik}</span></> : <span>Firmalar</span>}
          </div>
          <div className={styles.heading}><div><h1>{globalBaslik ?? (f ? sayfa.baslik : "Firma Yönetimi")}</h1>
            {!globalBolum && f && <p>{f.firma_adi} · {seciliSekme === "kullanicilar" ? "Kullanıcı kayıtları, roller ve erişim yetkileri" : seciliSekme === "firma-admin-yonetimi" ? "Yönetim erişimi ve sorumluluk" : sayfa.baslik}</p>}
            {(globalBolum === "hbstore" || globalBolum === "eclubstore") && <p>Mevcut ortak ekran · Tüm firmalar</p>}
          </div>{!globalBolum && f && <span className={styles.badge}>{platformSecili ? <Settings2 /> : <Building2 />}{f.firma_adi}</span>}</div>
          {!globalBolum && saltOkunur && <p role="status" className={styles.notice}>Firma admini açık · Cogniti bu firma alanında yalnız görüntüleme yapabilir.</p>}
          {globalBolum === "yeni-firma" ? (
            <YeniFirmaFormu onKaydet={admin.handleFirmaEkle} />
          ) : globalBolum === "bannerlar" ? (
            <CognitiBannerlari firmalar={admin.firmalar} />
          ) : globalBolum === "sistem" ? (
            <SistemAyarlari hata={admin.hata} basari={admin.basari} />
          ) : globalBolum === "hbstore" ? (
            <HbStorePaneli hata={admin.hata} basari={admin.basari} />
          ) : globalBolum === "eclubstore" ? (
            <EclubStorePaneli hata={admin.hata} basari={admin.basari} />
          ) : globalBolum === "veri-sil" ? (
            <TopluTekilSilPaneli hata={admin.hata} basari={admin.basari} />
          ) : globalBolum === "uretim" ? (
            <UretimAtamaPaneli hata={admin.hata} basari={admin.basari} />
          ) : !f ? (
            <p style={{ fontSize: "13px", color: "var(--tema-yerel-yonetim-yardimci-metin-01)" }}>Soldan bir firma seçin.</p>
          ) : (
            <>
              {seciliSekme === "firmabilgileri" && <FirmaBilgileri key={f.firma_id} firmaId={f.firma_id} onGuncellendi={admin.firmaBilgileriniYansit} />}
              {seciliSekme === "kullanicilar" && (admin.firmaVerileriYukleniyor ? <p role="status" className={styles.empty}>{f.firma_adi} kullanıcıları yükleniyor…</p> : admin.firmaVeriHatasi ? <div role="alert" className={styles.notice}>Firma bilgileri yüklenemedi. Yeniden denemek için firmayı tekrar seçin.</div> : (
                <KullaniciYonetimi key={f.firma_id} firma={f} kullanicilar={admin.kullanicilar} takimlar={admin.takimlar}
                  refreshKullanicilar={admin.refreshKullanicilar} refreshTakimlar={admin.refreshTakimlar} hata={admin.hata} basari={admin.basari} />
              ))}
              {seciliSekme === "firma-admin-yonetimi" && !firmaAdmin && !platformSecili && <FirmaAdminYonetimi key={f.firma_id} firmaId={f.firma_id} onDegisti={aktif => admin.firmaBilgileriniYansit({ ...f, firma_admin_aktif: aktif })} />}
              {(seciliSekme === "firmaayarlar" || seciliSekme === "firmaislemler") && <FirmaYonetimIslemleri key={`${f.firma_id}-${seciliSekme}`} firma={f} admin={admin} firmaAdmin={firmaAdmin} islemler={seciliSekme === "firmaislemler"} />}

              {(seciliSekme === "token" || seciliSekme === "abonelik-paketleri") && <TokenYonetimi key={`${f.firma_id}-${seciliSekme}`} firmaId={f.firma_id} gorunum={seciliSekme === "abonelik-paketleri" ? "paketler" : "kullanim"} />}

              {seciliSekme === "organizasyon" && <TakimBolgeFormu {...takimBolge} firmaAdi={f.firma_adi} takimlar={admin.takimlar} yukleniyor={admin.firmaVerileriYukleniyor} veriHatasi={admin.firmaVeriHatasi} />}

              {seciliSekme === "urunteknik" && (
                <UrunTeknikYonetimi key={f.firma_id} firma={f} takimlar={admin.takimlar} organizasyonYukleniyor={admin.firmaVerileriYukleniyor} organizasyonHatasi={admin.firmaVeriHatasi} hata={admin.hata} basari={admin.basari} />
              )}

              {seciliSekme === "puan-yonetimi" && <PuanYonetimi key={f.firma_id} firmaId={f.firma_id} />}

              {seciliSekme === "logokimlik" && (
                <LogoKimlikYonetimi
                  key={f.firma_id}
                  firma={f}
                  onGuncelle={admin.handleLogoGuncelle}
                />
              )}

              {seciliSekme === "tclub" && <TClubYonetimi />}

              {seciliSekme === "firmastore" && <div key={f.firma_id} className={styles.stack}>
                <FirmaStoreErisimi acik={f.hbstore_aktif} onToggle={() => admin.handleStoreToggle(f)} />
                <FirmaStoreCekTanimlari firmaId={f.firma_id} />
              </div>}

              {seciliSekme === "eczanem-cek-yonetimi" && <EczanemFirmaCekTanimlari key={f.firma_id} firmaId={f.firma_id} />}

              {seciliSekme === "eclub-puan-tl" && <EclubFirmaCekTanimlari key={f.firma_id} firmaId={f.firma_id} />}

              {seciliSekme === "cclub" && <CClubYonetimi key={f.firma_id} acik={f.cc_aktif} onToggle={() => admin.handleCcToggle(f)} />}

              {(seciliSekme === "eclub" || seciliSekme === "eclub-uyeler") && (
                <div className={styles.stack}>
                  <EclubErisim key={`${f.firma_id}-erisim`} acik={f.eclub_aktif} onToggle={() => admin.handleEclubToggle(f)} />
                  <EclubYonetimPaneli key={f.firma_id} firmaId={f.firma_id} firmaAdi={f.firma_adi} hata={admin.hata} basari={admin.basari} />
                </div>
              )}

              {seciliSekme === "eclub-bannerlar" && (
                <div className={styles.stack}>
                  <EclubBannerYonetimi key={f.firma_id} firmaId={f.firma_id} firmaAdi={f.firma_adi} modern konumGoster />
                  {!platformBannerFirmasi(f.firma_id) && <>
                    <EclubBannerYonetimi key={`${f.firma_id}-uyeler`} firmaId={f.firma_id} firmaAdi={f.firma_adi} modern konumGoster alan="uyeler" />
                    <EclubBannerYonetimi key={`${f.firma_id}-uye-yayinlari`} firmaId={f.firma_id} firmaAdi={f.firma_adi} modern konumGoster alan="uye-yayinlari" />
                    <EclubBannerYonetimi key={`${f.firma_id}-indirim-onayi`} firmaId={f.firma_id} firmaAdi={f.firma_adi} modern konumGoster alan="indirim-onayi" />
                  </>}
                </div>
              )}

              {seciliSekme === "eczanem-bannerlar" && (
                <EczanemBannerYonetimi key={`${f.firma_id}-uye-bannerlari`} firmaId={f.firma_id} firmaAdi={f.firma_adi} />
              )}

              {seciliSekme === "eczanem" && (
                <div className={styles.stack}>
                  <EczanemErisim key={`${f.firma_id}-erisim`} acik={f.eczanem_aktif} eclubAcik={f.eclub_aktif} onToggle={() => admin.handleEczanemToggle(f)} />
                  <EczanemUyeYonetimi key={f.firma_id} firmaId={f.firma_id} firmaAdi={f.firma_adi} />
                </div>
              )}
            </>
          )}
        </div></main>
      </div>
    </div></FirmaYonetimYetkisi>
  );
}
