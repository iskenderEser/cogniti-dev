export interface PartnerKayitGirdisi {
  ad_soyad: string;
  eposta: string;
  cep_telefonu: string;
}

export type PartnerKayitKontrolu =
  | { ok: true; veri: PartnerKayitGirdisi }
  | { ok: false; hata: string };

/** Agora kendi kimlik alanını kullanır; diğer kullanıcı türlerine kayıt yazmaz. */
export function partnerKaydiniDogrula(girdi: unknown): PartnerKayitKontrolu {
  if (!girdi || typeof girdi !== "object" || Array.isArray(girdi)) {
    return { ok: false, hata: "Lütfen üyelik bilgilerinizi doldurun." };
  }
  const d = girdi as Record<string, unknown>;
  if (typeof d.ad_soyad !== "string" || typeof d.eposta !== "string" || typeof d.cep_telefonu !== "string") {
    return { ok: false, hata: "Ad soyad, e-posta ve cep telefonu zorunludur." };
  }
  if (/[\u0000-\u001f\u007f]/u.test(d.ad_soyad + d.eposta + d.cep_telefonu)) {
    return { ok: false, hata: "Lütfen üyelik bilgilerinizi kontrol edin." };
  }
  const ad_soyad = d.ad_soyad.trim().replace(/\s+/gu, " ");
  if (ad_soyad.length < 3 || ad_soyad.length > 150 || !/^\p{L}[\p{L}\p{M}.'’ -]* \p{L}[\p{L}\p{M}.'’ -]*$/u.test(ad_soyad)) {
    return { ok: false, hata: "Lütfen adınızı ve soyadınızı birlikte yazın (en fazla 150 karakter)." };
  }
  const eposta = d.eposta.trim().toLowerCase();
  if (eposta.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(eposta)) {
    return { ok: false, hata: "Lütfen geçerli bir e-posta adresi yazın." };
  }
  const hamTelefon = d.cep_telefonu.trim();
  if (hamTelefon.length > 30 || !/^\+?[\d ().-]+$/u.test(hamTelefon)) {
    return { ok: false, hata: "Lütfen geçerli bir cep telefonu numarası yazın." };
  }
  let cep_telefonu = hamTelefon.replace(/\D/g, "");
  if (cep_telefonu.length === 12 && cep_telefonu.startsWith("90")) cep_telefonu = cep_telefonu.slice(2);
  if (cep_telefonu.length === 11 && cep_telefonu.startsWith("0")) cep_telefonu = cep_telefonu.slice(1);
  if (!/^5\d{9}$/.test(cep_telefonu)) {
    return { ok: false, hata: "Lütfen 5 ile başlayan 10 haneli cep telefonunuzu yazın." };
  }
  return { ok: true, veri: { ad_soyad, eposta, cep_telefonu } };
}
