import type { SupabaseClient } from "@supabase/supabase-js";
import { partnerEpostaGonderici } from "./partnerEposta";

const kacir = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const paraBicim = (deger: unknown) =>
  `${Number(deger ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

const sayiBicim = (deger: unknown) => Number(deger ?? 0).toLocaleString("tr-TR");

function trTarihSaatFormatla(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

async function resendAliciEpostaGonder(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  etiket: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = partnerEpostaGonderici();
  const alici = String(params.to ?? "").trim().toLowerCase();
  if (!apiKey || !from || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alici)) {
    return false;
  }

  try {
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify({
        from,
        to: [alici],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    if (!yanit.ok) {
      console.error(`[agora-alici-eposta:${params.etiket}] Gönderilemedi:`, yanit.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[agora-alici-eposta:${params.etiket}] Hata:`, err);
    return false;
  }
}

async function aktifFirmaAdminiOku(
  db: SupabaseClient,
  aliciId: string,
  aliciEposta: string,
): Promise<{ adSoyad: string; eposta: string } | null> {
  try {
    const { data: alici } = await db
      .from("kullanicilar")
      .select("firma_id")
      .eq("kullanici_id", aliciId)
      .maybeSingle();
    if (!alici?.firma_id) return null;

    const { data: firma } = await db
      .from("firmalar")
      .select("aktif, firma_admin_aktif")
      .eq("firma_id", alici.firma_id)
      .maybeSingle();
    if (!firma?.aktif || !firma?.firma_admin_aktif) return null;

    const { data: admin } = await db
      .from("kullanicilar")
      .select("kullanici_id, ad, soyad, eposta")
      .eq("firma_id", alici.firma_id)
      .eq("rol", "firma_admin")
      .eq("aktif_mi", true)
      .maybeSingle();

    if (!admin?.eposta || admin.kullanici_id === aliciId) return null;
    if (admin.eposta.trim().toLowerCase() === aliciEposta.trim().toLowerCase()) return null;

    const adSoyad = [admin.ad, admin.soyad].filter(Boolean).join(" ").trim();
    return { adSoyad, eposta: admin.eposta.trim() };
  } catch {
    return null;
  }
}

export async function aliciYayinSiparisiEpostalariGonder(params: {
  db: SupabaseClient;
  siparisId: string;
  aliciId: string;
  borcaYazilanToken?: number;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || !partnerEpostaGonderici()) return;

  const { data } = await params.db.rpc("agora_eposta_bildirim_oku", {
    p_tur: "yayin_siparis",
    p_id: params.siparisId,
  });
  if (!data || typeof data !== "object") return;

  const aliciEposta = typeof data.alici_eposta === "string" ? data.alici_eposta.trim() : "";
  const aliciAd = String(data.alici_ad_soyad ?? "").trim();
  const yayinAdi = String(data.egitim_adi ?? "Agora Yayını").trim();
  const kodParca = data.partner_egitim_id ? ` (${String(data.partner_egitim_id)})` : "";
  const partnerSirket = String(data.partner_sirket_adi ?? "İş Partneri").trim();
  const yayinTuru = String(data.yayin_araci ?? "video").toLowerCase() === "podcast" ? "Podcast" : "Video";
  const tokenMetni = sayiBicim(data.token_tutari);
  const borc = Number(params.borcaYazilanToken ?? 0);
  const borcEk = borc > 0 ? ` (${sayiBicim(borc)} token borca yazıldı)` : "";
  const satisTutari = paraBicim(data.satin_alma_bedeli);

  const isler: Promise<unknown>[] = [];

  if (aliciEposta) {
    const hitap = aliciAd ? `Sayın ${aliciAd},` : "Sayın Kullanıcımız,";
    isler.push(
      resendAliciEpostaGonder({
        to: aliciEposta,
        subject: "Agora Yayın Siparişiniz Tamamlandı",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">Agora'dan verdiğiniz <strong>${kacir(yayinAdi)}</strong>${kacir(kodParca)} yayın siparişiniz tamamlanmış ve yayın havuzunuza eklenmiştir.</p>` +
          `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
          `<li style="margin: 0 0 6px 0;"><strong>İş partneri:</strong> ${kacir(partnerSirket)}</li>` +
          `<li style="margin: 0 0 6px 0;"><strong>Yayın türü:</strong> ${kacir(yayinTuru)}</li>` +
          `<li style="margin: 0;"><strong>Kullanılan token:</strong> ${kacir(tokenMetni)} Token${kacir(borcEk)}</li>` +
          `</ul>` +
          `<p style="margin: 0 0 16px 0;">Satın aldığınız yayını Cogniti panelinizdeki <strong>Agora Yayınları</strong> ekranından hedef kitle ve ürün ayarlarını yaparak yayına alabilirsiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `Agora'dan verdiğiniz ${yayinAdi}${kodParca} yayın siparişiniz tamamlanmış ve yayın havuzunuza eklenmiştir.\n\n` +
          `- İş partneri: ${partnerSirket}\n` +
          `- Yayın türü: ${yayinTuru}\n` +
          `- Kullanılan token: ${tokenMetni} Token${borcEk}\n\n` +
          `Satın aldığınız yayını Cogniti panelinizdeki Agora Yayınları ekranından hedef kitle ve ürün ayarlarını yaparak yayına alabilirsiniz.\n\n` +
          `Cogniti · bilgi taşır`,
        idempotencyKey: `agora-alici-siparis/${params.siparisId}`,
        etiket: "alici-yayin-siparis",
      }),
    );
  }

  const firmaAdmin = await aktifFirmaAdminiOku(params.db, params.aliciId, aliciEposta);
  if (firmaAdmin) {
    const adminHitap = firmaAdmin.adSoyad ? `Sayın ${firmaAdmin.adSoyad},` : "Sayın Firma Yöneticisi,";
    const aliciGosterim = aliciAd || "Üretici Kullanıcı";
    isler.push(
      resendAliciEpostaGonder({
        to: firmaAdmin.eposta,
        subject: "Firmanızda Yeni Agora Yayın Siparişi",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(adminHitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">Firmanız adına <strong>${kacir(aliciGosterim)}</strong> tarafından Agora üzerinden yeni bir yayın siparişi oluşturulmuştur.</p>` +
          `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
          `<li style="margin: 0 0 6px 0;"><strong>Yayın:</strong> ${kacir(yayinAdi)}${kacir(kodParca)}</li>` +
          `<li style="margin: 0 0 6px 0;"><strong>İş partneri:</strong> ${kacir(partnerSirket)}</li>` +
          `<li style="margin: 0 0 6px 0;"><strong>Yayın türü:</strong> ${kacir(yayinTuru)}</li>` +
          `<li style="margin: 0;"><strong>Sipariş tutarı:</strong> ${kacir(satisTutari)} (${kacir(tokenMetni)} Token)</li>` +
          `</ul>` +
          `<p style="margin: 0 0 16px 0;">Siparişe ait aylık proforma belgesini <strong>Firma Yönetimi &gt; Agora Proformaları</strong> ekranından takip edebilirsiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${adminHitap}\n\n` +
          `Firmanız adına ${aliciGosterim} tarafından Agora üzerinden yeni bir yayın siparişi oluşturulmuştur.\n\n` +
          `- Yayın: ${yayinAdi}${kodParca}\n` +
          `- İş partneri: ${partnerSirket}\n` +
          `- Yayın türü: ${yayinTuru}\n` +
          `- Sipariş tutarı: ${satisTutari} (${tokenMetni} Token)\n\n` +
          `Siparişe ait aylık proforma belgesini Firma Yönetimi > Agora Proformaları ekranından takip edebilirsiniz.\n\n` +
          `Cogniti · bilgi taşır`,
        idempotencyKey: `agora-firma-admin-siparis/${params.siparisId}`,
        etiket: "firma-admin-yayin-siparis",
      }),
    );
  }

  await Promise.allSettled(isler);
}

export async function aliciCanliSiparisiEpostalariGonder(params: {
  db: SupabaseClient;
  siparisId: string;
  aliciId: string;
  borcaYazilanToken?: number;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || !partnerEpostaGonderici()) return;

  const { data } = await params.db.rpc("agora_eposta_bildirim_oku", {
    p_tur: "canli_siparis",
    p_id: params.siparisId,
  });
  if (!data || typeof data !== "object") return;

  const aliciEposta = typeof data.alici_eposta === "string" ? data.alici_eposta.trim() : "";
  const aliciAd = String(data.alici_ad_soyad ?? "").trim();
  const yayinAdi = String(data.egitim_adi ?? "Canlı Yayın").trim();
  const kodParca = data.partner_egitim_id ? ` (${String(data.partner_egitim_id)})` : "";
  const partnerSirket = String(data.partner_sirket_adi ?? "İş Partneri").trim();
  const zamanMetni = trTarihSaatFormatla(String(data.baslangic_at));
  const sureDakika = Number(data.sure_dakika ?? 60);
  const kapasite = Number(data.kapasite ?? 0);
  const tokenMetni = sayiBicim(data.token_tutari);
  const borc = Number(params.borcaYazilanToken ?? 0);
  const borcEk = borc > 0 ? ` (${sayiBicim(borc)} token borca yazıldı)` : "";
  const satisTutari = paraBicim(data.satin_alma_bedeli);

  const isler: Promise<unknown>[] = [];

  if (aliciEposta) {
    const hitap = aliciAd ? `Sayın ${aliciAd},` : "Sayın Kullanıcımız,";
    isler.push(
      resendAliciEpostaGonder({
        to: aliciEposta,
        subject: "Agora Canlı Yayın Siparişiniz Oluşturuldu",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">Agora'dan verdiğiniz <strong>${kacir(yayinAdi)}</strong>${kacir(kodParca)} canlı yayın oturumu siparişiniz oluşturulmuştur.</p>` +
          `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
          `<li style="margin: 0 0 6px 0;"><strong>İş partneri:</strong> ${kacir(partnerSirket)}</li>` +
          `<li style="margin: 0 0 6px 0;"><strong>Yayın zamanı:</strong> ${kacir(zamanMetni)} (Türkiye saati)</li>` +
          `<li style="margin: 0 0 6px 0;"><strong>Süre ve kontenjan:</strong> ${kacir(sureDakika)} dakika · ${kacir(kapasite)} katılımcı</li>` +
          `<li style="margin: 0;"><strong>Kullanılan token:</strong> ${kacir(tokenMetni)} Token${kacir(borcEk)}</li>` +
          `</ul>` +
          `<p style="margin: 0 0 16px 0;">Katılımcı davetlerini Cogniti panelinizdeki <strong>Agora Canlı Yayınlar</strong> ekranından oluşturabilir, yayın saatinden 15 dakika önce yayın odasına katılabilirsiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `Agora'dan verdiğiniz ${yayinAdi}${kodParca} canlı yayın oturumu siparişiniz oluşturulmuştur.\n\n` +
          `- İş partneri: ${partnerSirket}\n` +
          `- Yayın zamanı: ${zamanMetni} (Türkiye saati)\n` +
          `- Süre ve kontenjan: ${sureDakika} dakika · ${kapasite} katılımcı\n` +
          `- Kullanılan token: ${tokenMetni} Token${borcEk}\n\n` +
          `Katılımcı davetlerini Cogniti panelinizdeki Agora Canlı Yayınlar ekranından oluşturabilir, yayın saatinden 15 dakika önce yayın odasına katılabilirsiniz.\n\n` +
          `Cogniti · bilgi taşır`,
        idempotencyKey: `agora-alici-canli-siparis/${params.siparisId}`,
        etiket: "alici-canli-siparis",
      }),
    );
  }

  const firmaAdmin = await aktifFirmaAdminiOku(params.db, params.aliciId, aliciEposta);
  if (firmaAdmin) {
    const adminHitap = firmaAdmin.adSoyad ? `Sayın ${firmaAdmin.adSoyad},` : "Sayın Firma Yöneticisi,";
    const aliciGosterim = aliciAd || "Üretici Kullanıcı";
    isler.push(
      resendAliciEpostaGonder({
        to: firmaAdmin.eposta,
        subject: "Firmanızda Yeni Canlı Yayın Siparişi",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(adminHitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">Firmanız adına <strong>${kacir(aliciGosterim)}</strong> tarafından Agora üzerinden yeni bir canlı yayın oturumu siparişi oluşturulmuştur.</p>` +
          `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
          `<li style="margin: 0 0 6px 0;"><strong>Canlı yayın:</strong> ${kacir(yayinAdi)}${kacir(kodParca)}</li>` +
          `<li style="margin: 0 0 6px 0;"><strong>İş partneri:</strong> ${kacir(partnerSirket)}</li>` +
          `<li style="margin: 0 0 6px 0;"><strong>Yayın zamanı:</strong> ${kacir(zamanMetni)} (Türkiye saati)</li>` +
          `<li style="margin: 0 0 6px 0;"><strong>Süre ve kontenjan:</strong> ${kacir(sureDakika)} dakika · ${kacir(kapasite)} katılımcı</li>` +
          `<li style="margin: 0;"><strong>Sipariş tutarı:</strong> ${kacir(satisTutari)} (${kacir(tokenMetni)} Token)</li>` +
          `</ul>` +
          `<p style="margin: 0 0 16px 0;">Token kullanım detaylarını <strong>Firma Yönetimi &gt; Token Yönetimi</strong> ekranından görüntüleyebilirsiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${adminHitap}\n\n` +
          `Firmanız adına ${aliciGosterim} tarafından Agora üzerinden yeni bir canlı yayın oturumu siparişi oluşturulmuştur.\n\n` +
          `- Canlı yayın: ${yayinAdi}${kodParca}\n` +
          `- İş partneri: ${partnerSirket}\n` +
          `- Yayın zamanı: ${zamanMetni} (Türkiye saati)\n` +
          `- Süre ve kontenjan: ${sureDakika} dakika · ${kapasite} katılımcı\n` +
          `- Sipariş tutarı: ${satisTutari} (${tokenMetni} Token)\n\n` +
          `Token kullanım detaylarını Firma Yönetimi > Token Yönetimi ekranından görüntüleyebilirsiniz.\n\n` +
          `Cogniti · bilgi taşır`,
        idempotencyKey: `agora-firma-admin-canli-siparis/${params.siparisId}`,
        etiket: "firma-admin-canli-siparis",
      }),
    );
  }

  await Promise.allSettled(isler);
}
