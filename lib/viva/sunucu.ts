import { createHash, createHmac, randomBytes, randomInt, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { rolCozucu } from "@/lib/utils/rolCozucu";
import { ECLUB_TUKETICI_ROLLERI } from "@/lib/utils/roller";
import { vivaFormDogrula, vivaIcRolMu, vivaUuidMu, type VivaDetay, type VivaBaglam } from "./sozlesme";
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
  if (e.code === "P0001") {
    const tokenMesajlari: Record<string, string> = {
      "COGNITI_TOKEN:viva_baslangic_bakiye": "Firmanızın token bakiyesi yeni Viva yayını başlatmak için yetersiz. Yeni ayda tekrar deneyebilirsiniz.",
      "COGNITI_TOKEN:bakiye_yetersiz": "Firmanızın token bakiyesi seçilen Viva davetleri için yetersiz. İşlem kaydedilmedi, token düşülmedi.",
      "COGNITI_TOKEN:hesap_yok": "Firmanızın token hesabı henüz açılmamış. Viva davet işlemi kaydedilmedi.",
      "COGNITI_TOKEN:viva_kimlik_belirsiz": "Bu e-posta birden fazla davetliyle eşleşiyor. Davet listesini kontrol edin.",
      "COGNITI_TOKEN:viva_firma_yok": "Viva davetinin gönderici firma bilgisi doğrulanamadı. İşlem kaydedilmedi.",
    };
    const mesaj = tokenMesajlari[e.message ?? ""];
    if (mesaj) return vivaYanit({ hata: mesaj }, 422);
  }
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
async function vivaYayinZamanlariniEkle(db: ReturnType<typeof createAdminClient>, detay: VivaDetay): Promise<VivaDetay> {
  const e = detay?.etkinlik;
  if (!e || !vivaUuidMu(e.etkinlik_id) || !vivaUuidMu(e.sahip_id)) return detay;
  if (!["canli", "sona_erdi"].includes(e.durum)) return { ...detay, etkinlik: { ...e, yayin_basladi: false, yayin_baslangici: null } };
  const [yasam, oda] = await Promise.all([
    db.from("viva_daily_yasam").select("oturum_id").eq("etkinlik_id", e.etkinlik_id).maybeSingle(),
    db.from("viva_daily_odalar").select("domain, oda_adi").eq("etkinlik_id", e.etkinlik_id).maybeSingle(),
  ]);
  if (yasam.error) throw yasam.error;
  if (oda.error) throw oda.error;
  const basladi = e.durum === "canli" || Boolean(yasam.data?.oturum_id);
  let baslangic: string | null = null;
  if (basladi && oda.data && /^[a-zA-Z0-9_-]+$/.test(oda.data.oda_adi)) {
    // Katılım tokenındaki sunucu kimliğiyle eşleştirilir; misafirin odaya girişi yayın başlangıcı değildir.
    const sunucuKimligi = `vi_${vivaHash(`viva:uye:${e.sahip_id}`).slice(0, 32)}`;
    const { data: olaylar, error } = await db.from("viva_daily_olaylar").select("veri")
      .eq("domain", oda.data.domain).eq("tur", "participant.joined").eq("veri->>user_id", sunucuKimligi)
      .or(`veri->>room_name.eq.${oda.data.oda_adi},veri->>room.eq.${oda.data.oda_adi}`)
      .order("alindi", { ascending: true }).limit(100);
    if (error) throw error;
    const zamanlar = (olaylar ?? []).flatMap(olay => {
      const veri = olay.veri as Record<string, unknown> | null;
      const ham = veri?.joined_at ?? veri?.timestamp;
      const sayi = typeof ham === "number" || (typeof ham === "string" && /^\d+(?:\.\d+)?$/.test(ham)) ? Number(ham) : NaN;
      const zaman = Number.isFinite(sayi) ? sayi * (sayi < 1e12 ? 1000 : 1) : typeof ham === "string" ? Date.parse(ham) : NaN;
      return Number.isFinite(zaman) ? [zaman] : [];
    });
    if (zamanlar.length) baslangic = new Date(Math.min(...zamanlar)).toISOString();
  }
  return { ...detay, etkinlik: { ...e, yayin_basladi: basladi, yayin_baslangici: baslangic } };
}

async function vivaKatilimciBilgileriniEkle(db: ReturnType<typeof createAdminClient>, authId: string, detay: VivaDetay): Promise<VivaDetay> {
  if (!detay?.etkinlik || detay.etkinlik.sahip_id !== authId || detay.etkinlik.yonetebilir !== true
    || !Array.isArray(detay.katilimcilar) || !detay.katilimcilar.length) return detay;
  const epostalar = new Map<string, string | null>();
  const eczaneler = new Map<string, Set<string>>();
  const kisiFirmalari = new Map<string, string>();
  const firmaAdlari = new Map<string, string>();
  await Promise.all((["ic", "eclub"] as const).map(async tur => {
    const ids = [...new Set(detay.katilimcilar.filter(k => k.tur === tur && vivaUuidMu(k.id)).map(k => k.id))];
    for (let offset = 0; offset < ids.length; offset += 200) {
      const grup = ids.slice(offset, offset + 200);
      if (tur === "ic") {
        const { data, error } = await db.from("kullanicilar").select("kullanici_id, eposta, firma_id").in("kullanici_id", grup);
        if (error) throw error;
        for (const kisi of data ?? []) {
          epostalar.set(`ic:${kisi.kullanici_id}`, kisi.eposta);
          if (vivaUuidMu(kisi.firma_id)) kisiFirmalari.set(kisi.kullanici_id, kisi.firma_id);
        }
      } else {
        const { data, error } = await db.from("eclub_kisiler").select("kisi_id, eposta").in("kisi_id", grup);
        if (error) throw error;
        for (const kisi of data ?? []) epostalar.set(`eclub:${kisi.kisi_id}`, kisi.eposta);
        const { data: baglar, error: bagHatasi } = await db.from("eclub_kisi_eczane")
          .select("kisi_id, eclub_eczaneler ( eclub_eczane_master ( eczane_adi ) )").in("kisi_id", grup).eq("aktif_mi", true);
        if (bagHatasi) throw bagHatasi;
        type Master = { eczane_adi: string | null };
        type Eczane = { eclub_eczane_master?: Master | Master[] | null };
        type EczaneBagi = { kisi_id: string; eclub_eczaneler?: Eczane | Eczane[] | null };
        for (const bag of (baglar ?? []) as EczaneBagi[]) {
          const eczane = Array.isArray(bag.eclub_eczaneler) ? bag.eclub_eczaneler : [bag.eclub_eczaneler];
          for (const e of eczane) {
            const master = Array.isArray(e?.eclub_eczane_master) ? e.eclub_eczane_master : [e?.eclub_eczane_master];
            for (const m of master) if (m?.eczane_adi) {
              const adlar = eczaneler.get(bag.kisi_id) ?? new Set<string>();
              adlar.add(m.eczane_adi); eczaneler.set(bag.kisi_id, adlar);
            }
          }
        }
      }
    }
  }));
  const firmaIds = [...new Set(kisiFirmalari.values())];
  for (let offset = 0; offset < firmaIds.length; offset += 200) {
    const { data, error } = await db.from("firmalar").select("firma_id, firma_adi").in("firma_id", firmaIds.slice(offset, offset + 200));
    if (error) throw error;
    for (const firma of data ?? []) firmaAdlari.set(firma.firma_id, firma.firma_adi);
  }
  return { ...detay, katilimcilar: detay.katilimcilar.map(k => ({ ...k, eposta: epostalar.get(`${k.tur}:${k.id}`) ?? null,
    firma_adi: k.tur === "ic" ? firmaAdlari.get(kisiFirmalari.get(k.id) ?? "") ?? null : null,
    eczane_adi: k.tur === "eclub" ? [...(eczaneler.get(k.id) ?? [])].sort((a, b) => a.localeCompare(b, "tr")).join(", ") || null : null,
  })) };
}

/** Yalnız yetkili RPC listesindeki kimlikler zenginleştirilir; yeni davet adayı üretilmez. */
export async function vivaFirmaBolgeBilgileriniEkle(db: ReturnType<typeof createAdminClient>, baglam: VivaBaglam): Promise<VivaBaglam> {
  if (!baglam?.olusturabilir || !Array.isArray(baglam.kisiler)) return baglam;
  const ids = [...new Set(baglam.kisiler.filter(k => k.tur === "ic" && vivaUuidMu(k.id)).map(k => k.id))];
  if (!ids.length) return baglam;
  const kisiBolgeleri = new Map<string, string | null>();
  for (let offset = 0; offset < ids.length; offset += 200) {
    const { data, error } = await db.from("kullanicilar").select("kullanici_id, bolge_id")
      .in("kullanici_id", ids.slice(offset, offset + 200)).eq("aktif_mi", true);
    if (error) throw error;
    for (const k of data ?? []) kisiBolgeleri.set(k.kullanici_id, k.bolge_id);
  }
  const bolgeIds = [...new Set([...kisiBolgeleri.values()].filter((id): id is string => Boolean(id)))];
  const bolgeAdlari = new Map<string, string>();
  for (let offset = 0; offset < bolgeIds.length; offset += 200) {
    const { data, error } = await db.from("bolgeler").select("bolge_id, bolge_adi").in("bolge_id", bolgeIds.slice(offset, offset + 200));
    if (error) throw error;
    for (const b of data ?? []) bolgeAdlari.set(b.bolge_id, b.bolge_adi);
  }
  return { ...baglam, kisiler: baglam.kisiler.map(k => k.tur !== "ic" ? k : { ...k,
    bolge_id: kisiBolgeleri.get(k.id) ?? null, bolge_adi: bolgeAdlari.get(kisiBolgeleri.get(k.id) ?? "") ?? null,
  }) };
}

export async function vivaOku(islem: string, veri: Record<string, unknown>) {
  const { db, user } = await vivaKullanici();
  const { data, error } = islem === "baglam"
    ? await db.rpc("viva_davet_baglami", { p_auth: user.id })
    : islem === "detay"
      ? await db.rpc("viva_eposta_detay", { p_auth: user.id, p_id: veri.etkinlik_id })
      : await db.rpc("viva_islem", { p_auth: user.id, p_islem: islem, p_veri: veri });
  if (error) throw error;
  if (islem === "baglam") return vivaFirmaBolgeBilgileriniEkle(db, data);
  return islem === "detay" ? vivaKatilimciBilgileriniEkle(db, user.id, await vivaYayinZamanlariniEkle(db, data)) : data;
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
