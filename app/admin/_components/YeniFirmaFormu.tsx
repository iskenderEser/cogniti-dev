"use client";

import { ilSecenekleri, ilinIlceleri } from "@/lib/firma/konumReferansi";
import { ilinVergiDaireleri } from "@/lib/firma/vergiDairesiReferansi";
import { SadeSecim } from "@/components/kontrol/SadeKontroller";
import { useRef, useState } from "react";
import { logoGorseliniOptimizeEt } from "@/lib/firma/logoOptimizasyonIstemci";
import type { YeniFirmaBilgileri } from "../_types";
import styles from "../admin.module.css";
import local from "./yeni-firma-formu.module.css";

const BOS_FORM: YeniFirmaBilgileri = {
  il_id:null, ilce_id:null, vergi_dairesi_kodu:"",
  firma_adi: "", adres: "", vergi_dairesi: "", vergi_numarasi: "",
  sorumlu_ad_soyad: "", sorumlu_telefon: "", sorumlu_eposta: "", logo_url: "",
};

export default function YeniFirmaFormu({ onKaydet, ilkBilgiler, duzenleme = false, firmaId }: { onKaydet: (bilgiler: YeniFirmaBilgileri) => Promise<boolean>; ilkBilgiler?: YeniFirmaBilgileri; duzenleme?: boolean; firmaId?: string }) {
  const [bilgiler, setBilgiler] = useState({...BOS_FORM,...ilkBilgiler});
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [logoYukleniyor, setLogoYukleniyor] = useState(false);
  const [logoDosyaAdi, setLogoDosyaAdi] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const dosyaRef = useRef<HTMLInputElement>(null);
  const kilit = useRef(false);
  const mesgul = kaydediliyor || logoYukleniyor;
  const tumAlanlarDolu = Object.values(bilgiler).every(deger => typeof deger === "string" ? deger.trim().length > 0 : deger !== null);

  function alanDegistir(alan: Exclude<keyof YeniFirmaBilgileri,"il_id"|"ilce_id">, deger: string) {
    setBilgiler(onceki => ({ ...onceki, [alan]: deger }));
  }

  async function logoYukle(dosya?: File) {
    if (!dosya || kilit.current) return;
    setHata(null);
    if (dosya.size > 5 * 1024 * 1024 || !["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(dosya.type)) {
      setHata("Logo PNG, JPEG, SVG veya WebP biçiminde ve en fazla 5 MB olmalıdır.");
      if (dosyaRef.current) dosyaRef.current.value = "";
      return;
    }
    kilit.current = true;
    setLogoYukleniyor(true);
    try {
      const formData = new FormData();
      if (firmaId) formData.append("firma_id", firmaId);
      formData.append("dosya", await logoGorseliniOptimizeEt(dosya));
      const res = await fetch("/admin/api/firmalar/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || typeof data.url !== "string" || !data.url.trim()) {
        setHata(data.hata ?? "Logo yüklenemedi.");
        return;
      }
      alanDegistir("logo_url", data.url);
      setLogoDosyaAdi(dosya.name);
    } catch {
      setHata("Logo yüklenemedi. Bağlantınızı kontrol ederek tekrar deneyin.");
    } finally {
      kilit.current = false;
      setLogoYukleniyor(false);
      if (dosyaRef.current) dosyaRef.current.value = "";
    }
  }

  return <section className={styles.card}>
    <div className={`${styles.cardHeader} ${local.compactHeader}`}><h2>Firma Bilgileri</h2></div>
    <form className={`${styles.cardBody} ${local.compactBody}`} onSubmit={async e => {
      e.preventDefault();
      if (kilit.current) return;
      if (!tumAlanlarDolu) { setHata("Logo dahil tüm alanları doldurun."); return; }
      kilit.current = true;
      setKaydediliyor(true);
      setHata(null);
      try {
        if (await onKaydet(bilgiler)) {
          if (!duzenleme) {
            setBilgiler({ ...BOS_FORM });
            setLogoDosyaAdi("");
          }
        }
      } finally {
        kilit.current = false;
        setKaydediliyor(false);
      }
    }}>
      {hata && <p role="alert" className={styles.notice}>{hata}</p>}
      <div className={local.formLayout}>
        <label className={`${styles.field} ${local.field}`}>Firma Adı *
          <input className={styles.input} autoComplete="organization" value={bilgiler.firma_adi} onChange={e => alanDegistir("firma_adi", e.target.value)} required disabled={mesgul} />
        </label>
        <div className={local.detailsGrid}>
          <div className={local.column}>
            <label className={`${styles.field} ${local.field}`}>Sorumlu Kişi Adı Soyadı *
              <input className={styles.input} autoComplete="name" maxLength={200} value={bilgiler.sorumlu_ad_soyad} onChange={e => alanDegistir("sorumlu_ad_soyad", e.target.value)} required disabled={mesgul} />
            </label>
            <label className={`${styles.field} ${local.field}`}>E-posta Adresi *
              <input className={styles.input} type="email" autoComplete="email" maxLength={254} value={bilgiler.sorumlu_eposta} onChange={e => alanDegistir("sorumlu_eposta", e.target.value)} required disabled={mesgul} />
            </label>
            <label className={`${styles.field} ${local.field}`}>Cep Telefon Numarası *
              <input className={styles.input} type="tel" autoComplete="tel" maxLength={25} value={bilgiler.sorumlu_telefon} onChange={e => alanDegistir("sorumlu_telefon", e.target.value)} required disabled={mesgul} />
            </label>
            <div className={`${styles.field} ${local.field} ${local.logoField}`} role="group" aria-labelledby="yeni-firma-logo-baslik">
              <span id="yeni-firma-logo-baslik">Logo *</span>
              <input ref={dosyaRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden aria-label="Firma logosu dosyası" disabled={mesgul} onChange={e => void logoYukle(e.target.files?.[0])} />
              <div className={bilgiler.logo_url ? local.logoCard : undefined}>
                {bilgiler.logo_url && <div className={local.logoPreview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bilgiler.logo_url} alt="Firma logosu önizlemesi" />
                </div>}
                <div className={bilgiler.logo_url ? local.logoControls : undefined}>
                  {bilgiler.logo_url && <span className={local.fileName}>{logoDosyaAdi}</span>}
                  <div className={local.logoActions}>
                    <button type="button" className={`${styles.button} ${bilgiler.logo_url ? local.logoAction : local.uploadButton}`} disabled={mesgul} aria-describedby="yeni-firma-logo-yardim" onClick={() => dosyaRef.current?.click()}>{logoYukleniyor ? "Yükleniyor…" : bilgiler.logo_url ? "Değiştir" : "Logo Yükle"}</button>
                    {bilgiler.logo_url && <button type="button" className={`${styles.button} ${local.logoAction} ${local.removeAction}`} disabled={mesgul} onClick={() => { alanDegistir("logo_url", ""); setLogoDosyaAdi(""); setHata(null); }}>Kaldır</button>}
                  </div>
                </div>
              </div>
              <span id="yeni-firma-logo-yardim" className={local.fileHint}>PNG, JPEG, SVG veya WebP · En fazla 5 MB</span>
            </div>
          </div>
          <div className={local.column}>
            <div className={local.locationGrid} role="group" aria-label="Firmanın bulunduğu yer">
              <div className={`${styles.field} ${local.field}`}><span>Bulunduğu İl *</span>
                <SadeSecim etiket="Firmanın bulunduğu il" placeholder="İl seçin" deger={bilgiler.il_id===null ? "" : String(bilgiler.il_id)} secenekler={ilSecenekleri}
                  onDegistir={deger=>setBilgiler(onceki=>({...onceki,il_id:Number(deger),ilce_id:null,vergi_dairesi_kodu:"",vergi_dairesi:""}))}
                  disabled={mesgul} className={local.locationSelect} triggerProps={{"aria-required":true}} />
              </div>
              <div className={`${styles.field} ${local.field}`}><span>İlçe *</span>
                <SadeSecim etiket="Firmanın bulunduğu ilçe" placeholder="İlçe seçin" deger={bilgiler.ilce_id===null ? "" : String(bilgiler.ilce_id)} secenekler={ilinIlceleri(bilgiler.il_id)}
                  onDegistir={deger=>setBilgiler(onceki=>({...onceki,ilce_id:Number(deger)}))}
                  disabled={mesgul || bilgiler.il_id===null} className={local.locationSelect} triggerProps={{"aria-required":true}} />
              </div>
            </div>
            <div className={`${styles.field} ${local.field}`}><span>Vergi Dairesi *</span>
              <SadeSecim etiket="Vergi dairesi" placeholder="Vergi dairesi seçin" deger={bilgiler.vergi_dairesi_kodu} secenekler={ilinVergiDaireleri(bilgiler.il_id)}
                onDegistir={deger=>setBilgiler(onceki=>({...onceki,vergi_dairesi_kodu:deger,vergi_dairesi:ilinVergiDaireleri(onceki.il_id).find(daire=>daire.deger===deger)?.etiket ?? ""}))}
                disabled={mesgul || bilgiler.il_id===null} className={local.locationSelect} triggerProps={{"aria-required":true}} />
              {duzenleme && !bilgiler.vergi_dairesi_kodu && bilgiler.vergi_dairesi && <span className={local.fileHint}>Mevcut kayıt: {bilgiler.vergi_dairesi}</span>}
            </div>
            <label className={`${styles.field} ${local.field}`}>Vergi Numarası *
              <input className={styles.input} inputMode="numeric" pattern="[0-9]{10}" minLength={10} maxLength={10} value={bilgiler.vergi_numarasi} onChange={e => alanDegistir("vergi_numarasi", e.target.value.replace(/\D/g, ""))} required disabled={mesgul} />
            </label>
            <label className={`${styles.field} ${local.field}`}>Adresi *
              <textarea className={`${styles.input} ${local.addressInput}`} autoComplete="street-address" rows={2} maxLength={2000} value={bilgiler.adres} onChange={e => alanDegistir("adres", e.target.value)} required disabled={mesgul} />
            </label>
          </div>
        </div>

      </div>
      <div className={styles.formActions} style={{ justifyContent: "flex-end" }}><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={mesgul || !tumAlanlarDolu}>{kaydediliyor ? (duzenleme ? "Kaydediliyor…" : "Tanımlanıyor…") : duzenleme ? "Kaydet" : "Firmayı Tanımla"}</button></div>
    </form>
  </section>;
}
