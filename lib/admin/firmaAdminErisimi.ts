import type { SupabaseClient } from "@supabase/supabase-js";
import { FIRMA_ADMIN_ROLU } from "@/lib/utils/roller";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { platformBannerFirmasi } from "@/lib/eclub/banner";

export type FirmaAdminKimligi = { rol: string | null; firma_id: string | null; aktif_mi: boolean | null };
export function firmaAdminBaslangicYolu(firmaId: string) {
  return `/admin?${new URLSearchParams({ firma: firmaId, sayfa: "firmabilgileri" })}`;
}
export async function firmaAdminErisiminiDogrula(db: SupabaseClient, kimlik: FirmaAdminKimligi) {
  if (kimlik.rol?.toLowerCase() !== FIRMA_ADMIN_ROLU || kimlik.aktif_mi !== true || !uuidGecerliMi(kimlik.firma_id) || platformBannerFirmasi(kimlik.firma_id)) {
    return { ok: false as const, status: 403, hata: "Firma yönetimine erişiminiz kapalıdır." };
  }
  const { data, error } = await db.from("firmalar").select("firma_id,firma_adi,aktif,firma_admin_aktif").eq("firma_id", kimlik.firma_id).maybeSingle();
  if (error) return { ok: false as const, status: 503, hata: "Firma yönetimi erişimi doğrulanamadı." };
  if (!data || data.aktif !== true || data.firma_admin_aktif !== true) return { ok: false as const, status: 403, hata: "Firma yönetimine erişiminiz kapalıdır. Cogniti ile iletişime geçin." };
  return { ok: true as const, firma: { firma_id: data.firma_id as string, firma_adi: data.firma_adi as string } };
}
const FIRMA_YONETIM_SAYFALARI = new Set([
  "firmabilgileri", "abonelik-paketleri", "token", "organizasyon", "kullanicilar", "urunteknik",
  "puan-yonetimi", "firmaislemler", "logokimlik", "firmaayarlar", "tclub", "cclub", "firmastore",
  "eclub", "eclub-uyeler", "eclub-bannerlar", "eclub-puan-tl", "eczanem", "eczanem-bannerlar", "eczanem-cek-yonetimi",
]);
// Firma admini yalnız firma yönetimi uçlarına ulaşır; hedef kayıtlar route'ta doğrulanır.
export function firmaAdminIstegiIzinliMi(pathname: string, method: string, params: URLSearchParams, firmaId: string) {
  if (pathname === "/tema/api" && ["GET", "PUT"].includes(method)) return true;
  const okuma = method === "GET" || method === "HEAD";
  // Public klasöründeki firma logosu sayfa yetkisi istemez.
  if (pathname === "/hepifarma_logo_dark.png") return okuma;
  if (pathname === "/admin/api/firma-oturum" || pathname === "/admin/api/firmalar") return okuma;
  if (pathname === "/admin") return okuma && params.getAll("firma").length === 1 && params.get("firma") === firmaId
    && !params.has("bolum") && params.getAll("sayfa").length === 1 && FIRMA_YONETIM_SAYFALARI.has(params.get("sayfa") ?? "");
  const firmaRotasi = pathname.match(/^\/admin\/api\/firmalar\/([^/]+)(?:\/(kullanicilar|takimlar|urunler|teknikler|puan-yonetimi|token|firmastore|export|toplu-yukle|eclub\/uyeler|eczanem\/uyeler|takimlar\/[^/]+(?:\/bolgeler(?:\/[^/]+)?)?))?$/);
  if (firmaRotasi) return firmaRotasi[1] === firmaId && !(method === "DELETE" && !firmaRotasi[2]) && ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(method);
  if (pathname === "/admin/api/eclub/banner-takvim") {
    if (method === "POST") return true; // FormData kapsamı route ve SQL'de doğrulanır.
    return ["GET", "HEAD", "DELETE"].includes(method) && params.getAll("firma_id").length === 1 && params.get("firma_id") === firmaId;
  }
  if (pathname === "/admin/api/firmalar/upload") return method === "POST";
  if (pathname === "/admin/api/veri-sil") return method === "POST";
  if (pathname === "/admin/api/eclub/kayitli") return method === "PUT";
  const parametre = pathname === "/admin/api/eclub/bannerlar" || pathname === "/admin/api/eclub/onaylar" ? "firma_id"
    : pathname === "/admin/eczanem/api/firma-tanimlari" || pathname === "/admin/eclub-cek-teslimat/api/firma-tanimlari" ? "firma" : null;
  if (parametre === null) return false;
  if (!okuma && method !== "DELETE") return ["POST", "PUT", "PATCH"].includes(method);
  return params.getAll(parametre).length === 1 && params.get(parametre) === firmaId;
}
