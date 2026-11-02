"use client";
import { useFirmaSaltOkunur } from "@/app/admin/_components/FirmaYonetimYetkisi";

import { Upload, UserPlus, Save } from "lucide-react";
import { useTekilForm } from "../_hooks/useTekilForm";
import { useTopluForm } from "../_hooks/useTopluForm";
import { useKullaniciListesi } from "../_hooks/useKullaniciListesi";
import type { Firma, Kullanici, Takim } from "../_types";
import TopluGirisFormu from "./TopluGirisFormu";
import KullaniciListesi from "./KullaniciListesi";
import KullaniciDuzenleme from "./KullaniciDuzenleme";
import KullaniciFormAlanlari from "./KullaniciFormAlanlari";
import styles from "../admin.module.css";

interface Props {
  firma: Firma; kullanicilar: Kullanici[]; takimlar: Takim[];
  refreshKullanicilar: () => void; refreshTakimlar: () => void;
  hata: (mesaj:string, adim?:string, detay?:string) => void; basari: (mesaj:string) => void;
}
export default function KullaniciYonetimi(p:Props) {
  const saltOkunur = useFirmaSaltOkunur();
  const tekil = useTekilForm({ ...p, seciliFirma:p.firma });
  const toplu = useTopluForm({ ...p, seciliFirma:p.firma });
  const liste = useKullaniciListesi({ ...p, seciliFirma:p.firma });
  const duzenlenen = p.kullanicilar.find(k => k.kullanici_id === liste.duzenlenenId);
  return <div className={styles.stack}>
    {duzenlenen && <KullaniciDuzenleme key={duzenlenen.kullanici_id} kullanici={duzenlenen} takimlar={p.takimlar} firmaAdi={p.firma.firma_adi} loading={liste.duzenleLoading} onKapat={() => liste.setDuzenlenenId(null)} onKaydet={veri => liste.handleKullaniciGuncelle(duzenlenen.kullanici_id, veri)} />}
    <KullaniciListesi {...liste} takimlar={p.takimlar} toplam={p.kullanicilar.length} />
    <section className={styles.card} id="admin-kullanici-ekle" aria-label="Tekil kullanıcı ekleme">
      <div className={styles.cardHeader}><div><h2><UserPlus />Kullanıcı Ekleme</h2><p>{p.firma.firma_adi} için yeni kullanıcı kaydı</p></div></div>
      <form className={styles.cardBody} onSubmit={tekil.handleTekilKaydet}>
        <KullaniciFormAlanlari veri={{ ad:tekil.tekilAd, soyad:tekil.tekilSoyad, rol:tekil.tekilRol, eposta:tekil.tekilEposta, telefon:tekil.tekilTelefon, sifre:tekil.tekilSifre, takim_id:tekil.tekilTakimId, bolge_id:tekil.tekilBolgeId, yetki_kullanici_yonetim:tekil.tekilYetkiKullanici, yetki_aktif_pasif:tekil.tekilYetkiAktifPasif }} takimlar={p.takimlar} bolgeler={tekil.seciliTakimBolgeleri} disabled={saltOkunur || tekil.tekilLoading} degistir={v => {
          if(v.ad !== undefined)tekil.setTekilAd(v.ad);
          if(v.soyad !== undefined)tekil.setTekilSoyad(v.soyad);
          if(v.rol !== undefined)tekil.setTekilRol(v.rol);
          if(v.eposta !== undefined)tekil.setTekilEposta(v.eposta);
          if(v.telefon !== undefined)tekil.setTekilTelefon(v.telefon);
          if(v.sifre !== undefined)tekil.setTekilSifre(v.sifre);
          if(v.takim_id !== undefined)tekil.handleTakimSec(v.takim_id);
          else if(v.bolge_id !== undefined)tekil.handleBolgeSec(v.bolge_id);
          if(v.yetki_kullanici_yonetim !== undefined)tekil.setTekilYetkiKullanici(v.yetki_kullanici_yonetim);
          if(v.yetki_aktif_pasif !== undefined)tekil.setTekilYetkiAktifPasif(v.yetki_aktif_pasif);
        }} />
        <div className={styles.formActions}><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={saltOkunur || tekil.tekilLoading}><Save />{tekil.tekilLoading ? "Kaydediliyor…" : "Kullanıcıyı kaydet"}</button></div>
      </form>
    </section>
    <section className={styles.card} id="admin-toplu-yukle" aria-label="Toplu kullanıcı yükleme"><div className={styles.cardHeader}><div><h2><Upload />Toplu Kullanıcı Yükleme</h2><p>{p.firma.firma_adi} · CSV veya Excel dosyasıyla kayıt oluşturma ve güncelleme</p></div></div><div className={styles.bulk}><TopluGirisFormu {...toplu} /></div></section>
  </div>;
}
