export type PartnerTuru = "kisisel" | "kurumsal";

export interface PartnerKayitGirdisi {
  tur: PartnerTuru;
  ad_soyad: string;
  eposta: string;
  cep_telefonu: string;
  banka_adi: string;
  iban: string;
  hesap_adi: string;
  tc_no?: string;
  uzmanliklar?: string[];
  kendini_tanitma?: string;
  firma_adi?: string;
  web_adresi?: string;
  vergi_no?: string;
  vergi_dairesi?: string;
  adres?: string;
}

export type PartnerKayitKontrolu =
  | { ok: true; veri: PartnerKayitGirdisi }
  | { ok: false; hata: string };

export interface PartnerOzgecmisDosyasi {
  adi: string;
  mime: string;
  bytes: Uint8Array;
}

const KONTROL_KARAKTERI = /[\u0000-\u001f\u007f]/u;
const COK_SATIR_KONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

function temizSatir(deger: unknown, azamiUzunluk: number): string | null {
  if (typeof deger !== "string" || KONTROL_KARAKTERI.test(deger)) return null;
  const s = deger.trim().replace(/\s+/gu, " ");
  return s.length <= azamiUzunluk ? s : null;
}

function temizMetin(deger: unknown, azamiUzunluk: number): string | null {
  if (typeof deger !== "string" || COK_SATIR_KONTROL.test(deger)) return null;
  const s = deger.trim();
  return s.length <= azamiUzunluk ? s : null;
}

function kelimeSayisi(metin: string): number {
  const s = metin.trim();
  return s ? s.split(/\s+/u).length : 0;
}

function ibanBicimGecerli(iban: string): boolean {
  return /^TR\d{24}$/.test(iban);
}

/** Agora kendi kimlik alanını kullanır; diğer kullanıcı türlerine kayıt yazmaz. */
export function partnerKaydiniDogrula(girdi: unknown): PartnerKayitKontrolu {
  if (!girdi || typeof girdi !== "object" || Array.isArray(girdi)) {
    return { ok: false, hata: "Lütfen üyelik bilgilerinizi doldurun." };
  }
  const d = girdi as Record<string, unknown>;
  const tur: PartnerTuru = d.tur === "kurumsal" ? "kurumsal" : "kisisel";
  if (d.tur !== undefined && d.tur !== "kisisel" && d.tur !== "kurumsal") {
    return { ok: false, hata: "Geçersiz başvuru türü." };
  }

  const ad_soyad = temizSatir(d.ad_soyad, 150);
  if (!ad_soyad || ad_soyad.length < 3 || !/^\p{L}[\p{L}\p{M}.'’ -]* \p{L}[\p{L}\p{M}.'’ -]*$/u.test(ad_soyad)) {
    return { ok: false, hata: "Lütfen adınızı ve soyadınızı birlikte yazın (en fazla 150 karakter)." };
  }

  const eposta = typeof d.eposta === "string" && !KONTROL_KARAKTERI.test(d.eposta) ? d.eposta.trim().toLowerCase() : "";
  if (!eposta || eposta.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(eposta)) {
    return { ok: false, hata: "Lütfen geçerli bir e-posta adresi yazın." };
  }

  const hamTelefon = typeof d.cep_telefonu === "string" && !KONTROL_KARAKTERI.test(d.cep_telefonu) ? d.cep_telefonu.trim() : "";
  if (!hamTelefon || hamTelefon.length > 30 || !/^\+?[\d ().-]+$/u.test(hamTelefon)) {
    return { ok: false, hata: "Lütfen geçerli bir cep telefonu numarası yazın." };
  }
  let cep_telefonu = hamTelefon.replace(/\D/g, "");
  if (cep_telefonu.length === 12 && cep_telefonu.startsWith("90")) cep_telefonu = cep_telefonu.slice(2);
  if (cep_telefonu.length === 11 && cep_telefonu.startsWith("0")) cep_telefonu = cep_telefonu.slice(1);
  if (!/^5\d{9}$/.test(cep_telefonu)) {
    return { ok: false, hata: "Lütfen 5 ile başlayan 10 haneli cep telefonunuzu yazın." };
  }

  const banka_adi = temizSatir(d.banka_adi, 120);
  if (!banka_adi || banka_adi.length < 2) {
    return { ok: false, hata: "Lütfen banka adını girin." };
  }
  const iban = typeof d.iban === "string" ? d.iban.replace(/\s+/g, "").toUpperCase() : "";
  if (!ibanBicimGecerli(iban)) {
    return { ok: false, hata: "IBAN için TR’den sonra 24 rakam girin." };
  }
  const hesap_adi = temizSatir(d.hesap_adi, 150);
  if (!hesap_adi || hesap_adi.length < 2) {
    return { ok: false, hata: "Lütfen banka hesap adını girin." };
  }

  if (tur === "kisisel") {
    const tc_no = typeof d.tc_no === "string" ? d.tc_no.replace(/\D/g, "") : "";
    if (!/^[1-9]\d{10}$/.test(tc_no)) {
      return { ok: false, hata: "Geçerli bir 11 haneli TC Kimlik Numarası girin." };
    }
    const hamUzmanliklar = Array.isArray(d.uzmanliklar) ? d.uzmanliklar : [];
    const uzmanliklar: string[] = [];
    for (const u of hamUzmanliklar) {
      const temiz = temizSatir(u, 80);
      if (temiz && !uzmanliklar.some(x => x.toLocaleLowerCase("tr-TR") === temiz.toLocaleLowerCase("tr-TR"))) {
        uzmanliklar.push(temiz);
      }
    }
    if (uzmanliklar.length === 0 || uzmanliklar.length > 12) {
      return { ok: false, hata: "En az 1, en fazla 12 uzmanlık alanı girin." };
    }
    const kendini_tanitma = d.kendini_tanitma === undefined ? "" : temizMetin(d.kendini_tanitma, 4000);
    if (kendini_tanitma === null || kelimeSayisi(kendini_tanitma) > 250) {
      return { ok: false, hata: "Kendini tanıtma alanı en fazla 250 kelime olabilir." };
    }
    return {
      ok: true,
      veri: {
        tur,
        ad_soyad,
        eposta,
        cep_telefonu,
        tc_no,
        uzmanliklar,
        ...(kendini_tanitma ? { kendini_tanitma } : {}),
        banka_adi,
        iban,
        hesap_adi,
      },
    };
  }

  const firma_adi = temizSatir(d.firma_adi, 160);
  if (!firma_adi || firma_adi.length < 2) {
    return { ok: false, hata: "Lütfen firma adını girin." };
  }
  const web_adresi = temizSatir(d.web_adresi, 255);
  if (!web_adresi || web_adresi.length < 4 || !web_adresi.includes(".")) {
    return { ok: false, hata: "Lütfen geçerli bir web adresi girin." };
  }
  const vergi_no = typeof d.vergi_no === "string" ? d.vergi_no.replace(/\D/g, "") : "";
  if (!/^\d{10}$/.test(vergi_no)) {
    return { ok: false, hata: "10 haneli vergi numarası girin." };
  }
  const vergi_dairesi = temizSatir(d.vergi_dairesi, 120);
  if (!vergi_dairesi || vergi_dairesi.length < 2) {
    return { ok: false, hata: "Lütfen vergi dairesini girin." };
  }
  const adres = temizMetin(d.adres, 500);
  if (!adres || adres.length < 5) {
    return { ok: false, hata: "Lütfen şirket adresini girin." };
  }

  return {
    ok: true,
    veri: {
      tur,
      ad_soyad,
      eposta,
      cep_telefonu,
      firma_adi,
      web_adresi,
      vergi_no,
      vergi_dairesi,
      adres,
      banka_adi,
      iban,
      hesap_adi,
    },
  };
}

export function partnerOzgecmisDogrula(
  dosya: { name: string; type: string; size: number },
  bytes: Uint8Array,
): { ok: true; dosya: PartnerOzgecmisDosyasi } | { ok: false; hata: string } {
  const AZAMI_CV_BAYT = 10 * 1024 * 1024;
  if (dosya.size <= 0 || dosya.size > AZAMI_CV_BAYT || bytes.byteLength !== dosya.size) {
    return { ok: false, hata: "Özgeçmiş dosyası en fazla 10 MB olabilir." };
  }
  const ad = dosya.name.trim().slice(0, 160);
  const alt = ad.toLowerCase();
  const pdfMi = bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
  const docxMi = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  const docMi = bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;

  if (alt.endsWith(".pdf") && pdfMi) {
    return { ok: true, dosya: { adi: ad, mime: "application/pdf", bytes } };
  }
  if (alt.endsWith(".docx") && docxMi) {
    return { ok: true, dosya: { adi: ad, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes } };
  }
  if (alt.endsWith(".doc") && docMi) {
    return { ok: true, dosya: { adi: ad, mime: "application/msword", bytes } };
  }
  return { ok: false, hata: "Özgeçmiş dosyası geçerli bir PDF veya Word (.doc, .docx) belgesi olmalıdır." };
}
