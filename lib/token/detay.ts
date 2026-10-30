import { vivaDetaySunumu } from "./vivaDetay";
import { ROL_ADLARI } from "@/lib/utils/roller";
import { YAYIN_TURU_SUNUMU } from "@/lib/ogrenmeAraci/turSunumu";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";
import { yayin_kodu } from "@/lib/utils/yayinKodu";

export type TokenDetayHamSatir = { id: string; tarih: string; yayin_id?: string | null; yayin_adi?: string | null; davetli_turleri?: string[] | null; davetli_sayisi?: number | null; katilim_sayisi?: number | null; eczane_sayisi?: number; firma_adi?: string | null; talep_no?: number | null; urun: string | null; arac: string | null; rol: string; gonderilen: number | null; token: number };
export type TokenKullanimSatiri = { id: string; gonderimTarihi: string; yayinKodu: string; yayinId: string | null; yayinAdi: string; davetliler?: string; davetliSayisi?: number | null; katilimSayisi?: number | null; eczaneSayisi?: number; urun: string; yayinAraci: string; gonderilenRol: string; gonderilenSayi: number | null; toplamToken: number };
export type TokenDetayYaniti = { satirlar: TokenKullanimSatiri[]; devamiVar: boolean; genelToplam?: number; ayToplami?: number | null };
const digerRoller: Record<string, string> = { viva_katilim: "Viva katılımı", firma_kullanicisi: "Firma kullanıcısı", eclub_uyesi: "E-Club üyesi", ozel_davetli: "Özel davetli" };

export function tokenDetaySunumu(satir: TokenDetayHamSatir): TokenKullanimSatiri {
  if (satir.arac === "viva") return vivaDetaySunumu(satir);
  return {
    id: satir.id,
    gonderimTarihi: new Date(`${satir.tarih}T12:00:00+03:00`).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }),
    yayinKodu: satir.firma_adi && satir.talep_no != null ? yayin_kodu(satir.firma_adi, satir.talep_no) : "—",
    yayinAdi: "—",
    yayinId: satir.yayin_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(satir.yayin_id) ? satir.yayin_id : null,
    urun: satir.urun || "—",
    yayinAraci: YAYIN_TURU_SUNUMU[satir.arac as OgrenmeAraciTuru]?.etiket ?? "—",
    gonderilenRol: ROL_ADLARI[satir.rol] ?? digerRoller[satir.rol] ?? satir.rol,
    gonderilenSayi: satir.gonderilen,
    toplamToken: satir.token,
    ...(satir.eczane_sayisi != null ? { eczaneSayisi: satir.eczane_sayisi } : {}),
  };
}
