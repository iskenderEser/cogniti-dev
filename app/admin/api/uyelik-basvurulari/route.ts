import { randomBytes } from "node:crypto";
import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { davetSiteAdresi } from "@/lib/eclub/uyelikDaveti";
import { ayniKaynaktan, davetOzeti, ON_BASVURU_TABLOSU } from "@/lib/firma/kurumsalBasvuru";

const hata = (mesaj: string, status: number) => Response.json({ hata: mesaj }, { status });

export async function GET() {
  const yetki = await adminGirisKontrol();
  if (!yetki.gecerli) return yetki.yanit;
  const { data, error } = await createAdminClient().from(ON_BASVURU_TABLOSU)
    .select("id,firma_adi,web_sitesi,ad_soyad,eposta,cep_tel,olusturuldu_at,davet_bitis_at,kabul_at")
    .order("olusturuldu_at", { ascending: false });
  if (error) return hata("Başvurular alınamadı.", 503);
  return Response.json(data, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(istek: Request) {
  if (!ayniKaynaktan(istek)) return hata("İstek doğrulanamadı.", 403);
  const yetki = await adminGirisKontrol();
  if (!yetki.gecerli) return yetki.yanit;

  const veri = await istek.json().catch(() => null);
  if (typeof veri?.id !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(veri.id)) {
    return hata("Başvuru geçersiz.", 400);
  }

  const { data, error } = await createAdminClient().from(ON_BASVURU_TABLOSU)
    .delete().eq("id", veri.id).select("id").maybeSingle();
  if (error) return hata("Başvuru silinemedi. Tekrar deneyin.", 503);
  if (!data) return hata("Başvuru bulunamadı.", 404);
  return Response.json({ ok: true });
}

export async function POST(istek: Request) {
  if (!ayniKaynaktan(istek)) return hata("İstek doğrulanamadı.", 403);
  const yetki = await adminGirisKontrol();
  if (!yetki.gecerli) return yetki.yanit;
  const veri = await istek.json().catch(() => null);
  if (typeof veri?.id !== "string" || !/^[0-9a-f-]{36}$/i.test(veri.id)) return hata("Başvuru geçersiz.", 400);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) return hata("Davet e-postası ayarları eksik.", 503);
  let adres: string;
  try { adres = davetSiteAdresi(new URL(istek.url).origin); }
  catch { return hata("Site adresi yapılandırması eksik.", 503); }

  const db = createAdminClient();
  const token = randomBytes(32).toString("base64url");
  const hash = davetOzeti(token);
  const simdi = new Date();
  const { data: aday, error } = await db.from(ON_BASVURU_TABLOSU)
    .update({ davet_hash: hash, davet_bitis_at: new Date(simdi.getTime() + 48 * 3600_000).toISOString() })
    .eq("id", veri.id).is("kabul_at", null)
    .or(`davet_bitis_at.is.null,davet_bitis_at.lte.${simdi.toISOString()}`)
    .select("eposta").maybeSingle();
  if (error) return hata("Davet oluşturulamadı.", 503);
  if (!aday) return hata("Başvuru bulunamadı veya geçerli bir daveti var.", 409);
  const link = new URL("/uyelik-basvurusu", adres);
  link.searchParams.set("davet", token);
  try {
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [aday.eposta], subject: "Cogniti kurumsal üyelik formu davetiniz",
        text: `Ön başvurunuz onaylandı. Kurumsal üyelik formuna erişmek için davetinizi 48 saat içinde kabul edin:\n${link}`,
      }),
    });
    if (!yanit.ok) throw new Error("E-posta gönderilemedi.");
    return Response.json({ ok: true });
  } catch {
    await db.from(ON_BASVURU_TABLOSU).update({ davet_hash: null, davet_bitis_at: null })
      .eq("id", veri.id).eq("davet_hash", hash).is("kabul_at", null);
    return hata("Davet gönderilemedi. Tekrar deneyin.", 502);
  }
}
