import { createHash, createHmac, randomBytes, randomInt, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { vivaFormDogrula, vivaIcRolMu, vivaUuidMu } from "./sozlesme";
import { vivaDavetEpostalariDogrula } from "./eposta";

export class VivaHatasi extends Error {
  status: number;
  constructor(mesaj: string, status = 400) { super(mesaj); this.status = status; }
}
export const vivaHash = (deger: string) => createHash("sha256").update(deger).digest("hex");
export const vivaToken = () => randomBytes(32).toString("base64url");
export const vivaTokenGecerli = (v: string) => /^[A-Za-z0-9_-]{43}$/.test(v);
/** Gönderim sırasında tekrar üretilebilir; veritabanına yalnız SHA-256 özeti yazılır. */
export function vivaEpostaDavetToken(davetId: string): string {
  if (!vivaUuidMu(davetId)) throw new VivaHatasi("Geçersiz davet.");
  const gizli = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!gizli) throw new VivaHatasi("Davet bağlantısı şu anda oluşturulamıyor.", 503);
  return createHmac("sha256", gizli).update(`viva-eposta-davet-v1:${davetId}`).digest("base64url");
}
export const vivaCookieAdi = (token: string) => `viva_${vivaHash(token).slice(0, 16)}`;
export function vivaKodHash(token: string, kod: string): string {
  const gizli = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!gizli) throw new VivaHatasi("Viva şu anda kullanılamıyor.", 503);
  return createHmac("sha256", gizli).update(`viva-otp:${token}:${kod}`).digest("hex");
}
export function vivaYanit(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
export function vivaHata(err: unknown) {
  if (err instanceof VivaHatasi) return vivaYanit({ hata: err.message }, err.status);
  const e = err as { code?: string; message?: string };
  if (e.code === "42501") return vivaYanit({ hata: "Bu etkinlik veya işlem için erişiminiz yok." }, 403);
  if (e.code === "40001") return vivaYanit({ hata: "Etkinlik değişti. Güncel halini açıp yeniden deneyin." }, 409);
  if (["22023", "22007", "22008", "22P02", "23514", "23505", "23503"].includes(e.code ?? "")) return vivaYanit({ hata: "Bilgiler geçersiz veya güncelliğini yitirmiş. Kontrol edip yeniden deneyin." }, 400);
  console.error("[Viva] işlem tamamlanamadı", e.code ?? "beklenmeyen hata");
  return vivaYanit({ hata: ["PGRST202", "42P01", "42883"].includes(e.code ?? "") ? "Viva henüz kullanıma açılmadı." : "İşlem tamamlanamadı. Yeniden deneyin." }, 503);
}
export async function vivaGirdi(req: Request, maksimum = 65_536): Promise<Record<string, unknown>> {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) throw new VivaHatasi("İstek doğrulanamadı.", 403);
  if (!req.headers.get("content-type")?.startsWith("application/json")) throw new VivaHatasi("Geçersiz istek biçimi.");
  const raw = await req.text();
  if (Buffer.byteLength(raw) > maksimum) throw new VivaHatasi("İstek çok büyük.", 413);
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new VivaHatasi("İstek okunamadı."); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new VivaHatasi("Geçersiz istek.");
  return value as Record<string, unknown>;
}
export async function vivaKullanici() {
  const auth = await createClient();
  const { data: { user }, error } = await auth.auth.getUser();
  if (error || !user) throw new VivaHatasi("Oturum açmanız gerekiyor.", 401);
  const db = createAdminClient();
  const rol = await rolCozucu(db, user.id);
  if (!vivaIcRolMu(rol) && !ECLUB_TUKETICI_ROLLERI.includes(rol)) throw new VivaHatasi("Viva erişiminiz yok.", 403);
  return { db, user, rol };
}
export async function vivaOku(islem: string, veri: Record<string, unknown>) {
  const { db, user } = await vivaKullanici();
  const { data, error } = islem === "baglam"
    ? await db.rpc("viva_davet_baglami", { p_auth: user.id })
    : islem === "detay"
      ? await db.rpc("viva_eposta_detay", { p_auth: user.id, p_id: veri.etkinlik_id })
      : await db.rpc("viva_islem", { p_auth: user.id, p_islem: islem, p_veri: veri });
  if (error) throw error;
  return data;
}

async function vivaDavetYetkisiniDogrula(db: ReturnType<typeof createAdminClient>, authId: string, etkinlikId: string, yeni: boolean) {
  if (yeni) {
    const { data: baglam, error: baglamHatasi } = await db.rpc("viva_davet_baglami", { p_auth: authId });
    if (baglamHatasi) throw baglamHatasi;
    if (baglam?.olusturabilir !== true) throw new VivaHatasi("Etkinlik yönetme yetkiniz yok.", 403);
    // Aynı oluşturma kimliği başka yayıncıya aitse yeni davet eklenemez.
    const { data: mevcut, error } = await db.from("viva_etkinlikler").select("sahip_id").eq("etkinlik_id", etkinlikId).maybeSingle();
    if (error) throw error;
    if (mevcut && mevcut.sahip_id !== authId) throw new VivaHatasi("Bu yayının davetlerini yönetme yetkiniz yok.", 403);
    return;
  }
  // Doğrulanmış oturum kimliği kullanılır; formdaki sahip/rol bilgisine güvenilmez.
  const { data, error } = await db.rpc("viva_islem", {
    p_auth: authId, p_islem: "detay", p_veri: { etkinlik_id: etkinlikId },
  });
  if (error) throw error;
  if (data?.etkinlik?.sahip_id !== authId || data.etkinlik.yonetebilir !== true) {
    throw new VivaHatasi("Bu yayının davetlerini yönetme yetkiniz yok.", 403);
  }
}

export async function vivaYaz(islem: string, veri: Record<string, unknown>) {
  const { db, user, rol } = await vivaKullanici();
  if (!vivaIcRolMu(rol)) throw new VivaHatasi("Etkinlik yönetme yetkiniz yok.", 403);
  if (!["olustur", "kaydet", "iptal", "davet_ekle", "davet_iptal", "davet_yeniden_dene"].includes(islem) || !vivaUuidMu(veri.etkinlik_id)) throw new VivaHatasi("Geçersiz işlem.");
  if (islem !== "olustur" && (!Number.isInteger(veri.surum) || Number(veri.surum) < 1)) throw new VivaHatasi("Etkinliğin güncel halini açın.", 409);
  const girdi = { ...veri };
  let epostaAdresleri: string[] = [];
  if (["olustur", "kaydet"].includes(islem)) {
    if (veri.yayin_turu === "anlik" && islem !== "olustur") throw new VivaHatasi("Anlık yayın yalnız yeni oluşturulabilir.");
    const hata = vivaFormDogrula(veri);
    if (hata) throw new VivaHatasi(hata);
    const epostalar = vivaDavetEpostalariDogrula(veri.davet_epostalari);
    if (epostalar.hata) throw new VivaHatasi(epostalar.hata);
    epostaAdresleri = epostalar.adresler;
    if (veri.davet_epostalari !== undefined) girdi.davet_epostalari = epostaAdresleri;
  }
  let token: string | undefined;
  if (islem === "davet_ekle") {
    const epostalar = vivaDavetEpostalariDogrula([veri.eposta]);
    if (typeof veri.ad !== "string" || !veri.ad.trim() || veri.ad.trim().length > 120
      || epostalar.hata) throw new VivaHatasi("Misafir adı ve geçerli e-posta adresi gerekli.");
    girdi.ad = veri.ad.trim();
    girdi.eposta = epostalar.adresler[0];
  }
  if (["davet_iptal", "davet_yeniden_dene"].includes(islem) && !vivaUuidMu(veri.davet_id)) throw new VivaHatasi("Geçersiz davet.");
  if (["davet_ekle", "davet_iptal", "davet_yeniden_dene"].includes(islem)
    || (islem === "kaydet" && veri.davet_epostalari !== undefined) || epostaAdresleri.length > 0) {
    await vivaDavetYetkisiniDogrula(db, user.id, veri.etkinlik_id, islem === "olustur");
  }
  if (["olustur", "kaydet"].includes(islem) && veri.davet_epostalari !== undefined) {
    // Adaylar ayrı parametredir: aynı oluşturma isteği yeniden denendiğinde form özeti değişmez.
    // SQL mevcut adresin kimliğini/bağlantısını korur; adayı yalnız yeni adres için kullanır.
    const adaylar = epostaAdresleri.map(eposta => {
      const davetId = randomUUID();
      return { eposta, davet_id: davetId, token_hash: vivaHash(vivaEpostaDavetToken(davetId)) };
    });
    const { data, error } = await db.rpc("viva_eposta_kaydet", {
      p_auth: user.id, p_islem: islem, p_veri: girdi, p_davetler: adaylar,
    });
    if (error) throw error;
    return { ...data };
  }
  if (islem === "davet_yeniden_dene") {
    const { data, error } = await db.rpc("viva_eposta_yeniden_dene", {
      p_auth: user.id, p_etkinlik: veri.etkinlik_id, p_davet: veri.davet_id, p_surum: veri.surum,
    });
    if (error) throw error;
    return { ...data };
  }
  // Eski istemcilerin e-posta alanı içermeyen istekleri mevcut akışta kalır.
  delete girdi.davet_epostalari;
  if (islem === "davet_ekle") { token = vivaToken(); girdi.hash = vivaHash(token); }
  const { data, error } = await db.rpc("viva_islem", { p_auth: user.id, p_islem: islem, p_veri: girdi });
  if (error) throw error;
  return { ...data, ...(token ? { davet_yolu: `/viva/davet/${token}` } : {}) };
}
export async function vivaMisafirRpc(token: string, islem: string, veri: Record<string, unknown> = {}) {
  if (!vivaTokenGecerli(token)) throw new VivaHatasi("Davet geçersiz.", 403);
  const db = createAdminClient();
  const { data, error } = await db.rpc("viva_misafir_islem", { p_hash: vivaHash(token), p_islem: islem, p_veri: veri });
  if (error) throw error;
  if (data?.hata) throw new VivaHatasi(data.hata, data.status ?? 403);
  return data;
}
export async function vivaKodGonder(token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.VIVA_DAVET_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) throw new VivaHatasi("Doğrulama e-postası şu anda gönderilemiyor.", 503);
  const kod = String(randomInt(100000, 1000000));
  const kodHash = vivaKodHash(token, kod);
  const kisi = await vivaMisafirRpc(token, "kod_ayir", { kod_hash: kodHash });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `viva/${kisi.davet_id}/${kodHash}` },
      body: JSON.stringify({ from, to: [kisi.eposta], subject: "Viva katılım doğrulama kodunuz",
        text: `Merhaba ${kisi.ad},\n\n${kisi.baslik} etkinliği için doğrulama kodunuz: ${kod}\n\nKod 10 dakika boyunca, etkinlik erişim süresini aşmadan geçerlidir. Bu işlemi siz başlatmadıysanız kodu paylaşmayın.\n\nCogniti · Viva` }),
    });
    if (!res.ok) throw new Error("eposta");
    const gonderim: unknown = await res.json();
    if (!gonderim || typeof gonderim !== "object" || !("id" in gonderim)) throw new Error("eposta");
  } catch {
    await vivaMisafirRpc(token, "kod_iptal", { kod_hash: kodHash }).catch(() => undefined);
    throw new VivaHatasi("Kod gönderilemedi. Bir dakika sonra yeniden deneyin.", 503);
  }
  return { mesaj: "Doğrulama kodu davetteki e-posta adresine gönderildi." };
}
