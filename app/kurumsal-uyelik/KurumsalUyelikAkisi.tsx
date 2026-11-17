"use client";

import { useState } from "react";
import { CheckCircle2, Lock } from "lucide-react";
import YeniFirmaFormu from "@/app/admin/_components/YeniFirmaFormu";
import adminStyles from "@/app/admin/admin.module.css";
import formStyles from "@/app/admin/_components/yeni-firma-formu.module.css";
import styles from "@/app/login/login.module.css";
import IsimListesiSablonu from "./IsimListesiSablonu";
import SozlesmeBelgeleri from "./SozlesmeBelgeleri";

export default function KurumsalUyelikAkisi({
  sozlesmeYolu,
  kullaniciSutunlari,
  urunSutunlari,
  secimMenuClassName,
}: {
  sozlesmeYolu: string | null;
  kullaniciSutunlari: string[];
  urunSutunlari: string[];
  secimMenuClassName: string;
}) {
  const [adim1Tamam, setAdim1Tamam] = useState(false);
  const [adim2Tamam, setAdim2Tamam] = useState(false);

  return (
    <>
      <section aria-labelledby="firma-bilgileri-baslik">
        <h2 id="firma-bilgileri-baslik" className={styles.kurumsalUyelikAdimBasligi}>
          <span className={styles.kurumsalUyelikAdimNumarasi}>1</span>
          <span>Firma Bilgileri</span>
          {adim1Tamam && (
            <span className={`${styles.kurumsalUyelikAdimTamam} inline-flex items-center gap-1`}>
              <CheckCircle2 size={15} aria-hidden="true" />
              Tamamlandı
            </span>
          )}
        </h2>
        <p className={styles.kurumsalUyelikAdimNotu}>
          Kurumsal hesabınızın tanımlanması ve sözleşme süreçleri için firmanıza ait resmi bilgileri ve kurumsal logonuzu eksiksiz doldurun. (Logo: PNG, JPEG, SVG veya WebP, en fazla 5 MB)
        </p>
        <YeniFirmaFormu
          kurumsalUyelik
          secimMenuClassName={secimMenuClassName}
          onDurumDegisimi={setAdim1Tamam}
        />
      </section>

      <section className={styles.kurumsalUyelikSozlesmeler} aria-labelledby="sozlesmeler-baslik">
        <h2 id="sozlesmeler-baslik" className={styles.kurumsalUyelikAdimBasligi}>
          <span className={styles.kurumsalUyelikAdimNumarasi}>2</span>
          <span>Sözleşmeler</span>
          {!adim1Tamam ? (
            <span className={`${styles.kurumsalUyelikAdimKilitNotu} inline-flex items-center gap-1`}>
              <Lock size={14} aria-hidden="true" />
              Önce 1. adımı tamamlayın
            </span>
          ) : adim2Tamam ? (
            <span className={`${styles.kurumsalUyelikAdimTamam} inline-flex items-center gap-1`}>
              <CheckCircle2 size={15} aria-hidden="true" />
              Tamamlandı
            </span>
          ) : null}
        </h2>
        <p className={styles.kurumsalUyelikAdimNotu}>
          Öncelikle <strong>Üyelik Sözleşmesi</strong>’ni indirip imzalayın. İmzalı sözleşmeyi, <strong>Ticaret Sicili Gazetesi</strong>’ni (.doc, .docx, .pdf) ve <strong>Vergi Levhası</strong>’nı (.png, .jpg, .webp, .pdf) ilgili alanlara yükleyin. Belge yükleme alanları sözleşme indirildikten sonra açılır.
        </p>
        <SozlesmeBelgeleri
          sozlesmeYolu={sozlesmeYolu}
          kilitli={!adim1Tamam}
          onDurumDegisimi={setAdim2Tamam}
        />
      </section>

      <section className="mt-6" aria-labelledby="kurumsal-listeler-baslik">
        <h2 id="kurumsal-listeler-baslik" className={styles.kurumsalUyelikAdimBasligi}>
          <span className={styles.kurumsalUyelikAdimNumarasi}>3</span>
          <span>Kurumsal Listeler</span>
          {!adim2Tamam && (
            <span className={`${styles.kurumsalUyelikAdimKilitNotu} inline-flex items-center gap-1`}>
              <Lock size={14} aria-hidden="true" />
              Önce 2. adımı tamamlayın
            </span>
          )}
        </h2>
        <p className={styles.kurumsalUyelikAdimNotu}>
          Kullanıcı ve ürün listelerinizi tablodan doğrudan doldurabilir ya da örnek Excel/Word şablonunu indirip hazırlayarak yükleyebilirsiniz. İşlemi bitirmeden önce <strong>Kaydet</strong> ile taslak olarak saklayabilir, hazır olduğunuzda <strong>Gönder</strong> ile iletebilirsiniz.
        </p>
        <div className={!adim2Tamam ? styles.kurumsalUyelikKilitli : undefined} aria-disabled={!adim2Tamam} inert={!adim2Tamam || undefined}>
          <div className={`${adminStyles.card} ${formStyles.kurumsalKart}`}>
            <div className={`${adminStyles.cardBody} ${formStyles.compactBody}`}>
              <IsimListesiSablonu sutunlar={kullaniciSutunlari} />
            </div>
          </div>
          <div className={`${adminStyles.card} ${formStyles.kurumsalKart} mt-4`}>
            <div className={`${adminStyles.cardBody} ${formStyles.compactBody}`}>
              <IsimListesiSablonu sutunlar={urunSutunlari} urunListesi />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
