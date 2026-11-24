import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ogrenmeAraciMetinleri } from "@/lib/ogrenmeAraci/etiketler";
import { abonelikIlkDonem } from "@/lib/satinAlma/abonelikIlkDonem";
import { FIRMA_ADMIN_ROLU } from "@/lib/utils/roller";
import { talepBilgisiTalep } from "@/lib/utils/talepZinciri";

const kacir = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const sayiBicim = (n: number) => new Intl.NumberFormat("tr-TR").format(n);

function tlBicim(tl: number): string {
  const kurusMod = Math.abs(Math.round(tl * 100)) % 100;
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: kurusMod === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(tl);
}

function istanbulYili(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric" }).format(new Date());
}

interface AliciBilgisi {
  eposta: string;
  adSoyad: string;
  firmaAdi: string;
  ccEposta: string | null;
}

async function alicilariCoz(db: SupabaseClient, kullaniciId: string): Promise<AliciBilgisi | null> {
  const { data: kisi, error } = await db
    .from("kullanicilar")
    .select("ad,soyad,eposta,rol,firma_id")
    .eq("kullanici_id", kullaniciId)
    .maybeSingle();

  if (error || !kisi?.eposta || !kisi.firma_id) return null;

  const [firmaSonuc, adminSonuc] = await Promise.all([
    db.from("firmalar").select("firma_adi").eq("firma_id", kisi.firma_id).maybeSingle(),
    db
      .from("kullanicilar")
      .select("eposta")
      .eq("firma_id", kisi.firma_id)
      .eq("rol", FIRMA_ADMIN_ROLU)
      .eq("aktif_mi", true)
      .maybeSingle(),
  ]);

  const eposta = String(kisi.eposta).trim().toLowerCase();
  const rol = String(kisi.rol ?? "").trim().toLowerCase();
  const adminEposta = adminSonuc.data?.eposta ? String(adminSonuc.data.eposta).trim().toLowerCase() : null;
  const ccEposta = rol !== FIRMA_ADMIN_ROLU && adminEposta && adminEposta !== eposta ? adminEposta : null;

  return {
    eposta,
    adSoyad: [kisi.ad, kisi.soyad].filter(Boolean).join(" ").trim(),
    firmaAdi: firmaSonuc.data?.firma_adi || "Firmanız",
    ccEposta,
  };
}

async function resendSatinAlmaGonder(params: {
  to: string;
  cc: string | null;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  etiket: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error(`[satin-alma-eposta] Resend ayarları eksik (${params.etiket}).`);
    return;
  }
  try {
    const govde: Record<string, unknown> = {
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    };
    if (params.cc) govde.cc = [params.cc];
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify(govde),
    });
    if (!yanit.ok) {
      console.error(`[satin-alma-eposta] ${params.etiket} gönderilemedi:`, yanit.status);
    }
  } catch (err) {
    console.error(`[satin-alma-eposta] ${params.etiket} hatası:`, err);
  }
}

function hesapIfadesi(hesapTuru: "kisisel" | "firma_ortak", firmaAdi: string): string {
  return hesapTuru === "kisisel" ? "Kişisel hesabınız" : `${firmaAdi} ortak hesabı`;
}

export async function abonelikBaslatildiEpostasiGonder(
  db: SupabaseClient,
  params: {
    kullaniciId: string;
    siparisId: string;
    hesapTuru: "kisisel" | "firma_ortak";
    aylikToken: number;
    aylikKurus: number;
    baslangic: string;
  }
) {
  try {
    const alici = await alicilariCoz(db, params.kullaniciId);
    if (!alici) return;

    const ilk = abonelikIlkDonem(params.baslangic, params.aylikToken, params.aylikKurus);
    const hitap = alici.adSoyad ? `Sayın ${alici.adSoyad},` : "Sayın Kullanıcı,";
    const hesap = hesapIfadesi(params.hesapTuru, alici.firmaAdi);
    const aylikToken = sayiBicim(params.aylikToken);
    const aylikTutar = tlBicim(params.aylikKurus / 100);
    const ilkToken = sayiBicim(ilk.token);
    const ilkTutar = tlBicim(ilk.kurus / 100);

    await resendSatinAlmaGonder({
      to: alici.eposta,
      cc: alici.ccEposta,
      subject: "Cogniti abonelik paketiniz başlatıldı",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">${kacir(`${hesap} için abonelik paketiniz başlatılmış ve bu ayın token bakiyesi hesabınıza yüklenmiştir.`)}</p>` +
        `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
        `<li style="margin: 0 0 6px 0;"><strong>Paket Adı:</strong> Aylık Abonelik</li>` +
        `<li style="margin: 0 0 6px 0;"><strong>Seçiminiz:</strong> ${kacir(`${aylikToken} token / ay (${aylikTutar} TL + KDV)`)}</li>` +
        `<li style="margin: 0 0 6px 0;"><strong>Bu ay için yüklenen:</strong> ${kacir(`${ilkToken} token`)} (ay sonuna kadar geçerli)</li>` +
        `<li style="margin: 0;"><strong>Yüklenen token tutarı:</strong> ${kacir(`${ilkTutar} TL + KDV`)}</li>` +
        `</ul>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `${hesap} için abonelik paketiniz başlatılmış ve bu ayın token bakiyesi hesabınıza yüklenmiştir.\n\n` +
        `- Paket Adı: Aylık Abonelik\n` +
        `- Seçiminiz: ${aylikToken} token / ay (${aylikTutar} TL + KDV)\n` +
        `- Bu ay için yüklenen: ${ilkToken} token (ay sonuna kadar geçerli)\n` +
        `- Yüklenen token tutarı: ${ilkTutar} TL + KDV\n\n` +
        `Cogniti · bilgi taşır`,
      idempotencyKey: `abonelik-baslatildi/${params.siparisId}`,
      etiket: "abonelik",
    });
  } catch (err) {
    console.error("[satin-alma-eposta] abonelik hazırlık hatası:", err);
  }
}

export async function esnekPaketYuklendiEpostasiGonder(
  db: SupabaseClient,
  params: {
    kullaniciId: string;
    siparisId: string;
    hesapTuru: "kisisel" | "firma_ortak";
    tokenAdedi: number;
    birimFiyat: number;
  }
) {
  try {
    const alici = await alicilariCoz(db, params.kullaniciId);
    if (!alici) return;

    const hitap = alici.adSoyad ? `Sayın ${alici.adSoyad},` : "Sayın Kullanıcı,";
    const hesap = hesapIfadesi(params.hesapTuru, alici.firmaAdi);
    const tokenMetni = sayiBicim(params.tokenAdedi);
    const toplamTutar = tlBicim(params.tokenAdedi * params.birimFiyat);
    const yil = istanbulYili();

    await resendSatinAlmaGonder({
      to: alici.eposta,
      cc: alici.ccEposta,
      subject: "Cogniti esnek paketiniz hesabınıza yüklendi",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">${kacir(`${hesap} için esnek paket alımınız tamamlanmış ve token bakiyeniz hesabınıza yüklenmiştir.`)}</p>` +
        `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
        `<li style="margin: 0 0 6px 0;"><strong>Paket Adı:</strong> Esnek Paket</li>` +
        `<li style="margin: 0 0 6px 0;"><strong>Yüklenen token:</strong> ${kacir(`${tokenMetni} token`)} (31 Aralık ${kacir(yil)} sonuna kadar geçerli)</li>` +
        `<li style="margin: 0;"><strong>Yüklenen token tutarı:</strong> ${kacir(`${toplamTutar} TL + KDV`)}</li>` +
        `</ul>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `${hesap} için esnek paket alımınız tamamlanmış ve token bakiyeniz hesabınıza yüklenmiştir.\n\n` +
        `- Paket Adı: Esnek Paket\n` +
        `- Yüklenen token: ${tokenMetni} token (31 Aralık ${yil} sonuna kadar geçerli)\n` +
        `- Yüklenen token tutarı: ${toplamTutar} TL + KDV\n\n` +
        `Cogniti · bilgi taşır`,
      idempotencyKey: `esnek-yuklendi/${params.siparisId}`,
      etiket: "esnek-paket",
    });
  } catch (err) {
    console.error("[satin-alma-eposta] esnek-paket hazırlık hatası:", err);
  }
}

export async function kkoBaslatildiEpostasiGonder(
  db: SupabaseClient,
  params: {
    kullaniciId: string;
    hesapTuru: "kisisel" | "firma_ortak";
    birimFiyat: number;
    islemAnahtari: string;
  }
) {
  try {
    const alici = await alicilariCoz(db, params.kullaniciId);
    if (!alici) return;

    const hitap = alici.adSoyad ? `Sayın ${alici.adSoyad},` : "Sayın Kullanıcı,";
    const hesap = hesapIfadesi(params.hesapTuru, alici.firmaAdi);
    const birimTutar = tlBicim(params.birimFiyat);

    await resendSatinAlmaGonder({
      to: alici.eposta,
      cc: alici.ccEposta,
      subject: "Cogniti Kullandığın Kadar Öde (KKÖ) kullanımınız başlatıldı",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">${kacir(`${hesap} için Kullandığın Kadar Öde (KKÖ) kullanımınız aktif edilmiştir.`)}</p>` +
        `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
        `<li style="margin: 0 0 6px 0;"><strong>Paket Adı:</strong> Kullandığın Kadar Öde (KKÖ)</li>` +
        `<li style="margin: 0 0 6px 0;"><strong>Birim token fiyatı:</strong> ${kacir(`${birimTutar} TL + KDV`)}</li>` +
        `<li style="margin: 0;"><strong>Aylık kullanım hakkı:</strong> 1.500 token</li>` +
        `</ul>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `${hesap} için Kullandığın Kadar Öde (KKÖ) kullanımınız aktif edilmiştir.\n\n` +
        `- Paket Adı: Kullandığın Kadar Öde (KKÖ)\n` +
        `- Birim token fiyatı: ${birimTutar} TL + KDV\n` +
        `- Aylık kullanım hakkı: 1.500 token\n\n` +
        `Cogniti · bilgi taşır`,
      idempotencyKey: `kko-baslatildi/${params.islemAnahtari}`,
      etiket: "kko",
    });
  } catch (err) {
    console.error("[satin-alma-eposta] kko hazırlık hatası:", err);
  }
}

function tarihSaatBicim(iso?: string | null): string {
  const tarih = iso ? new Date(iso) : new Date();
  const gecerli = Number.isNaN(tarih.getTime()) ? new Date() : tarih;
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(gecerli);
}

export async function icerikUretimiOnaylandiEpostasiGonder(
  db: SupabaseClient,
  params: {
    kullaniciId: string;
    talepId: string;
    hesapTuru: "kisisel" | "firma_ortak";
    tokenAdedi: number;
  }
) {
  try {
    const [alici, talep] = await Promise.all([
      alicilariCoz(db, params.kullaniciId),
      talepBilgisiTalep(db, params.talepId),
    ]);
    if (!alici) return;

    const icerikAdi = talep?.urun_adi && talep.urun_adi !== "-" ? talep.urun_adi : "İçerik";
    const aracAdi = ogrenmeAraciMetinleri(talep?.ogrenme_araci_turu).ad;

    const hitap = alici.adSoyad ? `Sayın ${alici.adSoyad},` : "Sayın Kullanıcı,";
    const hesap = hesapIfadesi(params.hesapTuru, alici.firmaAdi);
    const tokenMetni = `${sayiBicim(params.tokenAdedi)} token`;
    const islemTarihi = tarihSaatBicim();
    const icerikEtiketi = `${icerikAdi} (${aracAdi})`;

    await resendSatinAlmaGonder({
      to: alici.eposta,
      cc: alici.ccEposta,
      subject: "Cogniti içerik üretimi siparişiniz onaylandı",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">${kacir(`${hesap} üzerinden içerik üretimi siparişiniz onaylanmış ve ilgili token tutarı hesabınızdan tahsil edilmiştir.`)}</p>` +
        `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
        `<li style="margin: 0 0 6px 0;"><strong>İçerik:</strong> ${kacir(icerikEtiketi)}</li>` +
        `<li style="margin: 0 0 6px 0;"><strong>Tahsil edilen tutar:</strong> ${kacir(tokenMetni)}</li>` +
        `<li style="margin: 0 0 6px 0;"><strong>Kullanılan hesap:</strong> ${kacir(hesap)}</li>` +
        `<li style="margin: 0;"><strong>İşlem tarihi:</strong> ${kacir(islemTarihi)}</li>` +
        `</ul>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `${hesap} üzerinden içerik üretimi siparişiniz onaylanmış ve ilgili token tutarı hesabınızdan tahsil edilmiştir.\n\n` +
        `- İçerik: ${icerikEtiketi}\n` +
        `- Tahsil edilen tutar: ${tokenMetni}\n` +
        `- Kullanılan hesap: ${hesap}\n` +
        `- İşlem tarihi: ${islemTarihi}\n\n` +
        `Cogniti · bilgi taşır`,
      idempotencyKey: `icerik-uretimi-onaylandi/${params.talepId}`,
      etiket: "icerik-uretimi",
    });
  } catch (err) {
    console.error("[satin-alma-eposta] icerik-uretimi hazırlık hatası:", err);
  }
}
