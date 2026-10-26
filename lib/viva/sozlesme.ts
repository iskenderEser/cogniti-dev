import { trZamanParcalari, trZamanUtc, TR_SAAT_DILIMI } from "@/lib/zaman/turkiye";
import { TUM_ROLLER } from "@/lib/utils/roller";

export const VIVA_DURUMLARI = {
  taslak: "Taslak", planlandi: "Planlandı", canli: "Canlı", sona_erdi: "Sona erdi", iptal: "İptal",
} as const;
export type VivaDurum = keyof typeof VIVA_DURUMLARI;
export type VivaHedefTuru = "ic" | "eclub";
export interface VivaKisi { id: string; tur: VivaHedefTuru; ad: string; alt: string; eposta?: string | null; eczane_adi?: string | null; firma_adi?: string | null; bolge_id?: string | null; bolge_adi?: string | null }
export interface VivaEtkinlik {
  etkinlik_id: string; baslik: string; aciklama: string; baslangic: string; bitis: string;
  durum: VivaDurum; surum: number; sahip_id: string; sahip_adi: string; firma_adi: string;
  yonetebilir: boolean; oda_acik: boolean;
  yayin_turu?: "anlik" | "planli";
  yayin_basladi?: boolean;
  yayin_baslangici?: string | null;
}
export interface VivaDavet { davet_id: string; ad: string; eposta: string; iptal: boolean; kurum_adi?: string | null; unvan?: string | null }
export interface VivaDavetEpostaGirdisi { davet_epostalari: string[] }
export type VivaEpostaDavetDurumu = "taslak" | "bekliyor" | "gonderiliyor" | "gonderildi" | "hata" | "kontrol" | "iptal";
export interface VivaEpostaDaveti {
  davet_id: string; eposta: string; iptal: boolean; durum: VivaEpostaDavetDurumu;
  deneme_sayisi: number; son_deneme: string | null; gonderim_zamani: string | null; hata_kodu: string | null;
}
export interface VivaDetay { etkinlik: VivaEtkinlik; katilimcilar: VivaKisi[]; davetler: VivaDavet[]; eposta_davetleri?: VivaEpostaDaveti[] }
export interface VivaBaglam { olusturabilir: boolean; kapsam: string; kisiler: VivaKisi[]; eclub_davet_edebilir?: boolean; davet_kurali_surumu?: number }

export const vivaIcRolMu = (rol: string) => TUM_ROLLER.includes(rol);
export const vivaUuidMu = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

/** Ayrı seçilen tarih ve saat tarayıcının saat dilimine bırakılmaz; Türkiye saati kullanılır. */
export function vivaYerelZamaniUtc(deger: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(deger)) throw new Error("Geçerli bir tarih ve saat seçin.");
  const [yil, ay, gun, saat, dakika] = deger.split(/[-T:]/).map(Number);
  const d = trZamanUtc(yil, ay, gun, saat, dakika);
  if (!Number.isFinite(d.getTime()) || vivaTarihGirdisi(d.toISOString()) !== deger) throw new Error("Geçerli bir tarih ve saat seçin.");
  return d.toISOString();
}
export function vivaTarihGirdisi(utc: string): string {
  const p = trZamanParcalari(new Date(utc));
  const iki = (n: number) => String(n).padStart(2, "0");
  return `${p.yil}-${iki(p.ay)}-${iki(p.gun)}T${iki(p.saat)}:${iki(p.dakika)}`;
}
export const vivaTarih = (utc: string) => new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium", timeStyle: "short", timeZone: TR_SAAT_DILIMI,
}).format(new Date(utc));

export function vivaFormDogrula(v: Record<string, unknown>, simdi = Date.now()): string | null {
  if (typeof v.baslik !== "string" || !v.baslik.trim() || v.baslik.trim().length > 160) return "Başlık 1–160 karakter olmalıdır.";
  if (typeof v.aciklama !== "string" || v.aciklama.length > 4000) return "Açıklama en fazla 4000 karakter olabilir.";
  if (v.yayin_turu !== undefined && !["anlik", "planli"].includes(String(v.yayin_turu))) return "Yayın türünü seçin.";
  if (v.yayin_turu === "anlik") {
    if (v.durum !== "planlandi" || v.baslangic !== undefined || v.bitis !== undefined) return "Anlık yayının başlangıcı sunucuda belirlenir.";
    if (!Number.isInteger(v.sure_dakika) || Number(v.sure_dakika) < 1 || Number(v.sure_dakika) > 1440) return "Yayın süresi 1–1440 dakika olmalıdır.";
  } else {
  const bas = typeof v.baslangic === "string" ? Date.parse(v.baslangic) : NaN;
  const bit = typeof v.bitis === "string" ? Date.parse(v.bitis) : NaN;
  if (!Number.isFinite(bas) || !Number.isFinite(bit) || bit <= bas) return "Bitiş, başlangıçtan sonra olmalıdır.";
  if (!['taslak', 'planlandi'].includes(String(v.durum))) return "Bu aşamada yalnız taslak veya planlanmış etkinlik kaydedilebilir.";
  if (v.durum === "planlandi" && bas <= simdi) return "Planlanan başlangıç gelecekte olmalıdır.";
  }
  if (!Array.isArray(v.katilimcilar) || v.katilimcilar.some(k => !k || typeof k !== "object" || !vivaUuidMu(k.id) || !['ic', 'eclub'].includes(k.tur))) return "Katılımcı seçimi geçersiz.";
  const anahtarlar = v.katilimcilar.map(k => `${k.tur}:${k.id}`);
  if (new Set(anahtarlar).size !== anahtarlar.length) return "Aynı katılımcı iki kez eklenemez.";
  return null;
}

/** Giriş sonrası yalnız Viva iç adreslerine dönülür. */
export function vivaDonusYolu(aranan: string): string | null {
  const adres = new URLSearchParams(aranan).get("viva");
  if (!adres || adres.split("?").length > 2) return null;
  const [yol, sorgu = ""] = adres.split("?");
  if (!/^\/viva(?:\/(?:yeni|yayinlar|kayitlar|[0-9a-f-]{36}(?:\/(?:oda|duzenle))?))?$/.test(yol)) return null;
  if (!sorgu) return yol;
  const p = new URLSearchParams(sorgu);
  const keys = [...p.keys()];
  if (keys.length !== new Set(keys).size || keys.length > 2) return null;
  const kaynak = p.get("kaynak");
  const [kaynakBolum, kaynakKapsam, kaynakEk] = kaynak?.split("-") ?? [];
  const kaynakGecerli = Boolean(kaynak && !kaynakEk
    && ["ileri", "canli", "gecmis", "taslak"].includes(kaynakBolum)
    && ["duzenlediklerim", "davetlerim"].includes(kaynakKapsam)
    && !(kaynakBolum === "taslak" && kaynakKapsam === "davetlerim"));
  if (keys.length === 1 && ["/viva", "/viva/yayinlar"].includes(yol) && kaynakGecerli) return `/viva/yayinlar?kaynak=${kaynak}`;
  if (keys.length === 1 && ["/viva", "/viva/yeni"].includes(yol) && ["anlik", "planli"].includes(p.get("tur") ?? "")) return `${yol}?tur=${p.get("tur")}`;
  if (/^\/viva\/[0-9a-f-]{36}$/.test(yol)) {
    const bolum = p.get("bolum");
    if (keys.some(k => k !== "bolum" && k !== "kaynak") || (bolum && !["katilimcilar", "kayitlar"].includes(bolum)) || (kaynak && !kaynakGecerli)) return null;
    if (keys.length === 1 && bolum) return `${yol}?bolum=${bolum}`;
    if (kaynakGecerli) return `${yol}?${bolum ? `bolum=${bolum}&` : ""}kaynak=${kaynak}`;
  }
  if (keys.length === 1 && /^\/viva\/[0-9a-f-]{36}\/oda$/.test(yol) && p.get("baslat") === "1") return `${yol}?baslat=1`;
  return null;
}
