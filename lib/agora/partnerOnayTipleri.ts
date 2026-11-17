export type PartnerIlkGirisDurumu = "bekliyor" | "onaylandi" | "reddedildi";
export type PartnerBasvuruTuru = "kisisel" | "kurumsal";

export interface PartnerBasvurusu {
  partner_id: string;
  basvuru_turu: PartnerBasvuruTuru;
  ad_soyad: string;
  eposta: string;
  cep_telefonu: string;
  tc_no: string | null;
  uzmanliklar: string[];
  kendini_tanitma: string | null;
  ozgecmis_adi: string | null;
  ozgecmis_var: boolean;
  banka_adi: string | null;
  iban: string | null;
  hesap_adi: string | null;
  firma_adi: string | null;
  web_adresi: string | null;
  vergi_no: string | null;
  vergi_dairesi: string | null;
  adres: string | null;
  olusturuldu_at: string;
  ilk_giris_durumu: PartnerIlkGirisDurumu;
  uyelik_durumu: string;
  karar_at: string | null;
  giris_surum: number;
  davet_bitis_at: string | null;
  sifre_tanimli: boolean;
}

export interface PartnerBasvuruListesi {
  kayitlar: PartnerBasvurusu[];
  toplam: number;
}

export const PARTNER_DURUM_ETIKETLERI: Record<PartnerIlkGirisDurumu, string> = {
  bekliyor: "Onay bekliyor",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
};

const metinVeyaNull = (v: unknown) => v === null || typeof v === "string";

export function partnerListesiGecerli(data: unknown): data is PartnerBasvuruListesi {
  if (
    !data ||
    typeof data !== "object" ||
    !("kayitlar" in data) ||
    !("toplam" in data) ||
    !Array.isArray(data.kayitlar) ||
    !Number.isInteger(data.toplam) ||
    Number(data.toplam) < 0
  ) {
    return false;
  }
  return data.kayitlar.every((r: unknown) => {
    if (!r || typeof r !== "object") return false;
    const d = r as Record<string, unknown>;
    return (
      ["partner_id", "ad_soyad", "eposta", "cep_telefonu", "olusturuldu_at", "uyelik_durumu"].every(
        k => typeof d[k] === "string",
      ) &&
      (d.basvuru_turu === "kisisel" || d.basvuru_turu === "kurumsal") &&
      typeof d.ilk_giris_durumu === "string" &&
      Object.hasOwn(PARTNER_DURUM_ETIKETLERI, d.ilk_giris_durumu) &&
      Number.isSafeInteger(d.giris_surum) &&
      Number(d.giris_surum) > 0 &&
      (d.karar_at === null || typeof d.karar_at === "string") &&
      (d.davet_bitis_at === null || typeof d.davet_bitis_at === "string") &&
      typeof d.ozgecmis_var === "boolean" &&
      typeof d.sifre_tanimli === "boolean" &&
      Array.isArray(d.uzmanliklar) &&
      d.uzmanliklar.every(u => typeof u === "string") &&
      [
        "tc_no",
        "kendini_tanitma",
        "ozgecmis_adi",
        "banka_adi",
        "iban",
        "hesap_adi",
        "firma_adi",
        "web_adresi",
        "vergi_no",
        "vergi_dairesi",
        "adres",
      ].every(k => metinVeyaNull(d[k]))
    );
  });
}
