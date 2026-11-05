"use client";

import { useEffect, useState, type ComponentProps, type RefObject } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import styles from "../partner.module.css";

export default function PartnerLogoAlani({ dosya, kayitliLogo, inputRef, onChange }: {
  dosya: File | null;
  kayitliLogo: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: ComponentProps<"input">["onChange"];
}) {
  const [onizleme, setOnizleme] = useState<{ dosya: File; url: string } | null>(null);
  useEffect(() => {
    if (!dosya) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      if (typeof okuyucu.result === "string") setOnizleme({ dosya, url: okuyucu.result });
    };
    okuyucu.readAsDataURL(dosya);
    return () => { okuyucu.onload = null; if (okuyucu.readyState === FileReader.LOADING) okuyucu.abort(); };
  }, [dosya]);
  const kaynak = dosya ? (onizleme?.dosya === dosya ? onizleme.url : null) : kayitliLogo;
  return <>
    <div className={styles.logoYukleme}>
      {kaynak ? <Image unoptimized src={kaynak} alt="Şirket logosu önizlemesi" width={320} height={80} className={styles.logoGorseli} /> : <><Upload size={24} aria-hidden="true" /><span>{dosya ? "Logo önizlemesi hazırlanıyor…" : "Logo yüklemek için tıklayın"}</span></>}
      <Input className={styles.logoDosyasi} ref={inputRef} id="profil-logo" type="file" accept="image/png,image/jpeg,image/webp" required={!kayitliLogo} aria-describedby="profil-logo-bilgi profil-logo-durum" onChange={onChange} />
    </div>
    <p className={styles.description} id="profil-logo-durum" role="status">{dosya ? `${dosya.name} seçildi. Profili Kaydet ile kaydedilir.` : kayitliLogo ? "Logoyu değiştirmek için kutuya tıklayın." : "Logo seçtikten sonra önizlemesi burada görünür."}</p>
  </>;
}
