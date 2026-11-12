"use client";

import { ChevronRight } from "lucide-react";
import { CEK_ALIMI_SAYFALARI, PAKET_ALIMI_SAYFALARI, SATIN_ALIM_SAYFALARI, yonetimSayfasiBilgisi, type FirmaSayfasi } from "./FirmaGezinme";
import type { Firma } from "../_types";
import styles from "../admin.module.css";
import { faturaSayfasiBilgisi } from "@/lib/admin/faturaSayfalari";

type Props = {
  firma: Firma | null;
  sayfa: FirmaSayfasi;
  platform: boolean;
  globalBaslik: string | null;
  onSayfaSec: (sayfa: FirmaSayfasi) => void;
  onGrupAc: (grup: string) => void;
};

export default function AdminBreadcrumb(p: Props) {
  const bilgi = yonetimSayfasiBilgisi(p.sayfa, p.platform);
  const fatura = faturaSayfasiBilgisi(p.sayfa);
  const eclub = ["eclub", "eclub-uyeler", "eclub-bannerlar", "eclub-puan-tl"].includes(p.sayfa);
  const eczanem = ["eczanem", "eczanem-cek-yonetimi", "eczanem-bannerlar"].includes(p.sayfa);
  return <nav className={styles.breadcrumb} aria-label="Sayfa konumu">
    {p.globalBaslik === "Cogniti Partner Yönetimi" ? <span aria-current="page">Cogniti Partner Yönetimi</span> : p.globalBaslik || !p.firma ? <>
      <button type="button" onClick={() => p.onGrupAc("Cogniti Firma Yönetimi")}>Cogniti Firma Yönetimi</button>
      <ChevronRight aria-hidden="true" /><span aria-current="page">{p.globalBaslik ?? "Firmalar"}</span>
    </> : <>
      {p.sayfa === "firmabilgileri" ? <span aria-current="page">{p.platform ? "Cogniti Firma Yönetimi" : p.firma.firma_adi}</span> : <button type="button" onClick={() => p.onSayfaSec("firmabilgileri")}>{p.platform ? "Cogniti Firma Yönetimi" : p.firma.firma_adi}</button>}
      {bilgi.grup && <><ChevronRight aria-hidden="true" /><button type="button" onClick={() => p.onGrupAc(bilgi.grup!)}>{bilgi.grup}</button></>}
      {(p.sayfa === "proforma-fatura" || p.sayfa === "faturalar" || fatura) && <><ChevronRight aria-hidden="true" /><button type="button" onClick={() => p.onGrupAc("Faturalar")}>Faturalar</button></>}
      {fatura && <>
        <ChevronRight aria-hidden="true" /><button type="button" onClick={() => p.onGrupAc(fatura.bolum.baslik)}>{fatura.bolum.baslik}</button>
        {fatura.kalem.grup !== "diger" && <>
          <ChevronRight aria-hidden="true" /><button type="button" onClick={() => p.onGrupAc(`${fatura.bolum.baslik} · ${fatura.kalem.grup === "paket" ? "Paket Alımları" : "Çek Alımları"}`)}>{fatura.kalem.grup === "paket" ? "Paket Alımları" : "Çek Alımları"}</button>
        </>}
      </>}
      {SATIN_ALIM_SAYFALARI.some(sayfa => sayfa === p.sayfa) && <><ChevronRight aria-hidden="true" /><button type="button" onClick={() => p.onGrupAc("Satın Alımlar")}>Satın Alımlar</button></>}
      {PAKET_ALIMI_SAYFALARI.some(sayfa => sayfa === p.sayfa) && <><ChevronRight aria-hidden="true" /><button type="button" onClick={() => p.onSayfaSec("abonelik-paketleri")}>Paket Alımları</button></>}
      {CEK_ALIMI_SAYFALARI.some(sayfa => sayfa === p.sayfa) && <><ChevronRight aria-hidden="true" /><button type="button" onClick={() => p.onGrupAc("Çek Alımları")}>Çek Alımları</button></>}
      {eclub && <><ChevronRight aria-hidden="true" /><button type="button" onClick={() => p.onSayfaSec("eclub-uyeler")}>E-Club</button></>}
      {eczanem && <><ChevronRight aria-hidden="true" /><button type="button" onClick={() => p.onSayfaSec("eczanem")}>Eczanem</button></>}
      <ChevronRight aria-hidden="true" /><span aria-current="page">{bilgi.baslik}</span>
    </>}
  </nav>;
}
