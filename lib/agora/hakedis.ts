import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

export interface PartnerHakEdisKaydi {
  siparis_id: string;
  partner_egitim_id: string;
  egitim_adi: string;
  siparis_tarihi: string;
  satin_alma_bedeli: number;
  hizmet_bedeli: number;
  hak_edis: number;
  kdv_tutari: number;
  kdvli_odenecek_tutar: number;
  planlanan_odeme_gunu: string | null;
  odenen_gun: string | null;
}

export interface PartnerHakEdisListesi {
  partner_id: string;
  toplam: number;
  sayfa: number;
  sayfa_boyutu: number;
  kayitlar: PartnerHakEdisKaydi[];
}

export function hakedisSayfasi(deger: string | null): number | null {
  if (deger === null) return 1;
  if (!/^[1-9]\d{0,5}$/.test(deger)) return null;
  const sayfa = Number(deger);
  return sayfa <= 100000 ? sayfa : null;
}

export const odemeGunuGecerli = (deger: unknown) => deger === null || (
  typeof deger === "string" && /^\d{4}-\d{2}-\d{2}$/.test(deger)
  && deger >= "0001-01-01" && deger <= "9999-12-31"
  && Number.isFinite(Date.parse(deger)) && new Date(deger).getUTCDate() === Number(deger.split("-")[2])
);

function hakedisKaydiGecerli(deger: unknown): deger is PartnerHakEdisKaydi {
  if (!deger || typeof deger !== "object" || Array.isArray(deger)) return false;
  const r = deger as Record<string, unknown>;
  const tutarlar = ["satin_alma_bedeli", "hizmet_bedeli", "hak_edis", "kdv_tutari", "kdvli_odenecek_tutar"];
  return uuidGecerliMi(r.siparis_id)
    && typeof r.partner_egitim_id === "string" && r.partner_egitim_id.length > 0
    && typeof r.egitim_adi === "string" && r.egitim_adi.length > 0
    && typeof r.siparis_tarihi === "string" && Number.isFinite(Date.parse(r.siparis_tarihi))
    && tutarlar.every(alan => { const tutar = r[alan]; return typeof tutar === "number" && Number.isFinite(tutar) && tutar >= 0; })
    && odemeGunuGecerli(r.planlanan_odeme_gunu) && odemeGunuGecerli(r.odenen_gun);
}

export function partnerHakEdisListesiGecerli(
  deger: unknown, partnerId: string, sayfa: number,
): deger is PartnerHakEdisListesi {
  if (!deger || typeof deger !== "object" || Array.isArray(deger)) return false;
  const r = deger as Record<string, unknown>;
  if (r.partner_id !== partnerId || !Number.isSafeInteger(r.toplam) || Number(r.toplam) < 0
    || r.sayfa !== sayfa || r.sayfa_boyutu !== 20 || !Array.isArray(r.kayitlar)
    || r.kayitlar.length > 20 || r.kayitlar.length > Number(r.toplam)) return false;
  const kayitlar: unknown[] = r.kayitlar;
  if (!kayitlar.every(hakedisKaydiGecerli)) return false;
  return new Set(kayitlar.map(r => r.siparis_id)).size === kayitlar.length;
}

export function hakedisOkumaHatasi(kod?: string): { status: number; mesaj: string } {
  if (["42P01", "42703", "42883", "PGRST202", "PGRST204", "PGRST205"].includes(kod ?? "")) {
    return { status: 503, mesaj: "Hak ediş veri okuma SQL kurulumu bekleniyor." };
  }
  if (kod === "42501") return { status: 403, mesaj: "Hak ediş bilgilerini görme yetkiniz bulunmuyor." };
  if (kod === "22023") return { status: 400, mesaj: "Geçersiz hak ediş sayfası." };
  return { status: 503, mesaj: "Hak edişler okunamadı. Yeniden deneyin." };
}
