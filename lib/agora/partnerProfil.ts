import { firmaKonumunuDogrula } from "@/lib/firma/konumReferansi";

export interface PartnerSirketBilgileri {
  sirket_adi: string; il_id: number; ilce_id: number; adres: string;
  vergi_dairesi_kodu: string; vergi_dairesi: string; vergi_no: string; iban: string;
}
export interface PartnerKayitliProfil extends PartnerSirketBilgileri { logo_yolu: string; surum: number }
export const PARTNER_LOGO_BOYUTU = 5 * 1024 * 1024;
export const PARTNER_LOGO_BUCKET = "agora-partner-logolari";

export function partnerIbanGecerli(iban: string) {
  // TEST ORTAMI: MOD 97 kontrolü kullanıcı kararıyla askıda.
  // CANLIYA GEÇİŞ: ISO 7064 MOD 97 kontrolünü istemci, sunucu ve SQL'de geri aç. AGENTS.md.
  return /^TR\d{24}$/.test(iban);
}
export function partnerProfilDogrula(body: Record<string, unknown>) {
  const konum = firmaKonumunuDogrula(body);
  if (!konum.gecerli) return { ok: false as const, hata: konum.hata };
  const temiz = (alan: string) => typeof body[alan] === "string" ? body[alan].trim() : "";
  const sirket_adi = temiz("sirket_adi"), adres = temiz("adres"), vergi_no = temiz("vergi_no");
  const iban = temiz("iban").replace(/\s/g, "").toUpperCase();
  if (sirket_adi.length < 2 || sirket_adi.length > 200 || /[\u0000-\u001f\u007f]/.test(sirket_adi)) return { ok: false as const, hata: "Şirket adı 2–200 karakter olmalıdır." };
  if (adres.length < 10 || adres.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(adres)) return { ok: false as const, hata: "Adres 10–1000 karakter olmalıdır." };
  if (!/^\d{10}$/.test(vergi_no)) return { ok: false as const, hata: "Vergi numarası 10 haneli olmalıdır." };
  if (!partnerIbanGecerli(iban)) return { ok: false as const, hata: "TR’den sonra 24 rakam girin." };
  return { ok: true as const, veri: { sirket_adi, adres, vergi_no, iban, ...konum.veri } satisfies PartnerSirketBilgileri };
}

export function partnerLogoTuru(bytes: Uint8Array): { mime: string; uzanti: string } | null {
  const b = (i: number) => bytes[i];
  if (bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((v,i) => b(i) === v)) return { mime: "image/png", uzanti: "png" };
  if (bytes.length >= 4 && b(0) === 255 && b(1) === 216 && b(2) === 255) return { mime: "image/jpeg", uzanti: "jpg" };
  if (bytes.length >= 16 && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP") return { mime: "image/webp", uzanti: "webp" };
  return null;
}
