import type { SupabaseClient } from "@supabase/supabase-js";
import type { PartnerKayitGirdisi } from "./partnerKaydi";

const kacir = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const paraBicim = (deger: unknown) =>
  `${Number(deger ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

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

export function partnerEpostaGonderici(): string {
  return (
    process.env.AGORA_PARTNER_EMAIL_FROM ||
    process.env.COGNITI_UYELIK_EMAIL_FROM ||
    process.env.ECLUB_DAVET_EMAIL_FROM ||
    ""
  );
}

async function resendEpostaGonder(params: {
  to: string;
  replyTo?: string;
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
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    if (!yanit.ok) {
      console.error(`[agora-partner-eposta:${params.etiket}] Gönderilemedi:`, yanit.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[agora-partner-eposta:${params.etiket}] Hata:`, err);
    return false;
  }
}

export async function partnerBasvuruAlindiEpostalariGonder(
  partnerId: string,
  veri: PartnerKayitGirdisi,
): Promise<void> {
  const adSoyad = veri.ad_soyad.trim();
  const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın İş Partneri Adayımız,";
  const basvuruEtiketi = veri.tur === "kurumsal" ? "Kurumsal" : "Kişisel";
  const baslikKisi = veri.tur === "kurumsal" && veri.firma_adi ? veri.firma_adi.trim() : adSoyad;

  const isler: Promise<unknown>[] = [
    resendEpostaGonder({
      to: veri.eposta,
      subject: "Cogniti İş Partnerliği Başvurunuz Alındı",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">Cogniti İş Partnerliği başvurunuz alınmıştır. Başvurunuz ekibimiz tarafından incelendikten sonra değerlendirme sonucu e-posta adresinize bildirilecektir.</p>` +
        `<p style="margin: 0 0 16px 0;">İlginiz için teşekkür ederiz.</p>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `Cogniti İş Partnerliği başvurunuz alınmıştır. Başvurunuz ekibimiz tarafından incelendikten sonra değerlendirme sonucu e-posta adresinize bildirilecektir.\n\n` +
        `İlginiz için teşekkür ederiz.\n\n` +
        `Cogniti · bilgi taşır`,
      idempotencyKey: `agora-partner-basvuru-aday/${partnerId}`,
      etiket: "basvuru-aday",
    }),
  ];

  const adminEposta = process.env.COGNITI_ADMIN_EMAIL?.trim();
  if (adminEposta) {
    const maddeler: Array<{ etiket: string; deger: string }> = [
      { etiket: "Başvuru Türü", deger: basvuruEtiketi },
      { etiket: "Ad Soyad", deger: adSoyad },
      ...(veri.tur === "kurumsal" && veri.firma_adi ? [{ etiket: "Firma", deger: veri.firma_adi }] : []),
      { etiket: "E-posta", deger: veri.eposta },
      { etiket: "Telefon", deger: veri.cep_telefonu },
      ...(veri.tur === "kisisel" && veri.uzmanliklar?.length
        ? [{ etiket: "Uzmanlıklar", deger: veri.uzmanliklar.join(", ") }]
        : []),
    ];

    isler.push(
      resendEpostaGonder({
        to: adminEposta,
        replyTo: veri.eposta,
        subject: `Yeni İş Partnerliği Başvurusu - ${baslikKisi}`,
        html:
          `<p style="margin: 0 0 16px 0;">Yeni bir Cogniti İş Partnerliği başvurusu alındı:</p>` +
          `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
          maddeler
            .map(
              (m, i) =>
                `<li style="margin: 0 0 ${i === maddeler.length - 1 ? 0 : 6}px 0;"><strong>${kacir(m.etiket)}:</strong> ${kacir(m.deger)}</li>`,
            )
            .join("") +
          `</ul>` +
          `<p style="margin: 0;">Başvuruyu Cogniti Yönetimi &gt; İş Partnerleri ekranından inceleyebilirsiniz.</p>`,
        text:
          `Yeni bir Cogniti İş Partnerliği başvurusu alındı:\n\n` +
          maddeler.map((m) => `- ${m.etiket}: ${m.deger}`).join("\n") +
          `\n\nBaşvuruyu Cogniti Yönetimi > İş Partnerleri ekranından inceleyebilirsiniz.`,
        idempotencyKey: `agora-partner-basvuru-admin/${partnerId}`,
        etiket: "basvuru-admin",
      }),
    );
  }

  await Promise.allSettled(isler);
}

export async function partnerBasvuruRetEpostasiGonder(params: {
  partnerId: string;
  eposta: string;
  adSoyad: string;
  surum: number;
}): Promise<void> {
  const adTemiz = params.adSoyad.trim();
  const hitap = adTemiz ? `Sayın ${adTemiz},` : "Sayın İş Partneri Adayımız,";

  await resendEpostaGonder({
    to: params.eposta,
    subject: "Cogniti İş Partnerliği Başvurunuz Hakkında",
    html:
      `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
      `<p style="margin: 0 0 16px 0;">Cogniti İş Partnerliği başvurunuz değerlendirilmiş olup şu aşamada olumlu sonuçlandırılamamıştır.</p>` +
      `<p style="margin: 0 0 16px 0;">İlginiz için teşekkür ederiz.</p>` +
      `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
    text:
      `${hitap}\n\n` +
      `Cogniti İş Partnerliği başvurunuz değerlendirilmiş olup şu aşamada olumlu sonuçlandırılamamıştır.\n\n` +
      `İlginiz için teşekkür ederiz.\n\n` +
      `Cogniti · bilgi taşır`,
    idempotencyKey: `agora-partner-basvuru-ret/${params.partnerId}/v${params.surum}`,
    etiket: "basvuru-ret",
  });
}

export async function partnerErisimDurumEpostasiGonder(
  db: SupabaseClient,
  adminId: string,
  partnerId: string,
  acik: boolean,
  surum: number,
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !partnerEpostaGonderici()) return;

  const { data: erisimBilgi } = await db.rpc("agora_partner_erisim_bilgileri", {
    p_admin_id: adminId,
    p_partner_id: partnerId,
  });

  const kayit =
    erisimBilgi && typeof erisimBilgi === "object" && typeof erisimBilgi.eposta === "string"
      ? (erisimBilgi as { ad_soyad?: string; eposta: string })
      : null;

  const yedek = !kayit
    ? await db.rpc("agora_eposta_bildirim_oku", { p_tur: "partner", p_id: partnerId })
    : { data: null };
  const hedef = (kayit ?? yedek.data) as { ad_soyad?: string; eposta?: string } | null;
  if (!hedef?.eposta) return;

  const adTemiz = String(hedef.ad_soyad ?? "").trim();
  const hitap = adTemiz ? `Sayın ${adTemiz},` : "Sayın İş Partnerimiz,";

  if (acik) {
    await resendEpostaGonder({
      to: hedef.eposta,
      subject: "Cogniti Partner Erişiminiz Aktif Edildi",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">Cogniti İş Partneri paneli erişiminiz yeniden aktif edilmiştir. Kayıtlı e-posta adresiniz ve şifrenizle partner panelinize giriş yapabilirsiniz.</p>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `Cogniti İş Partneri paneli erişiminiz yeniden aktif edilmiştir. Kayıtlı e-posta adresiniz ve şifrenizle partner panelinize giriş yapabilirsiniz.\n\n` +
        `Cogniti · bilgi taşır`,
      idempotencyKey: `agora-partner-erisim/${partnerId}/acik/v${surum}`,
      etiket: "erisim-aktif",
    });
  } else {
    await resendEpostaGonder({
      to: hedef.eposta,
      subject: "Cogniti Partner Erişiminiz Pasife Alındı",
      html:
        `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
        `<p style="margin: 0 0 16px 0;">Cogniti İş Partneri paneli erişiminiz pasife alınmıştır.</p>` +
        `<p style="margin: 0 0 16px 0;">Sorularınız için Cogniti yönetimiyle iletişime geçebilirsiniz.</p>` +
        `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
      text:
        `${hitap}\n\n` +
        `Cogniti İş Partneri paneli erişiminiz pasife alınmıştır.\n\n` +
        `Sorularınız için Cogniti yönetimiyle iletişime geçebilirsiniz.\n\n` +
        `Cogniti · bilgi taşır`,
      idempotencyKey: `agora-partner-erisim/${partnerId}/kapali/v${surum}`,
      etiket: "erisim-pasif",
    });
  }
}

export async function partnerAdminYayinDurumEpostasiGonder(params: {
  db: SupabaseClient;
  adminId: string;
  partnerId: string;
  egitimId: string;
  egitimAdi: string;
  partnerEgitimId?: string | null;
  islem: "aktif" | "pasif" | "sil";
  surum: number;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY || !partnerEpostaGonderici()) return;

  const { data: erisimBilgi } = await params.db.rpc("agora_partner_erisim_bilgileri", {
    p_admin_id: params.adminId,
    p_partner_id: params.partnerId,
  });
  const yedek =
    !erisimBilgi || typeof erisimBilgi.eposta !== "string"
      ? await params.db.rpc("agora_eposta_bildirim_oku", {
          p_tur: "partner",
          p_id: params.partnerId,
        })
      : { data: null };

  const hedef = (erisimBilgi && typeof erisimBilgi.eposta === "string" ? erisimBilgi : yedek.data) as {
    ad_soyad?: string;
    eposta?: string;
  } | null;
  if (!hedef?.eposta) return;

  const adTemiz = String(hedef.ad_soyad ?? "").trim();
  const hitap = adTemiz ? `Sayın ${adTemiz},` : "Sayın İş Partnerimiz,";
  const kodParca = params.partnerEgitimId ? ` (${params.partnerEgitimId})` : "";
  const durumIfadesi =
    params.islem === "aktif"
      ? "aktife alınmıştır"
      : params.islem === "pasif"
        ? "pasife alınmıştır"
        : "kaldırılmıştır";

  await resendEpostaGonder({
    to: hedef.eposta,
    subject: "Cogniti Agora Yayın Durumunuz Güncellendi",
    html:
      `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
      `<p style="margin: 0 0 16px 0;">Agora'daki <strong>${kacir(params.egitimAdi)}</strong>${kacir(kodParca)} yayınınız Cogniti yönetimi tarafından <strong>${kacir(durumIfadesi)}</strong>.</p>` +
      `<p style="margin: 0 0 16px 0;">Güncel yayın listesini Partner Paneli içindeki <strong>Yayınlarım</strong> ekranından kontrol edebilirsiniz.</p>` +
      `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
    text:
      `${hitap}\n\n` +
      `Agora'daki ${params.egitimAdi}${kodParca} yayınınız Cogniti yönetimi tarafından ${durumIfadesi}.\n\n` +
      `Güncel yayın listesini Partner Paneli içindeki Yayınlarım ekranından kontrol edebilirsiniz.\n\n` +
      `Cogniti · bilgi taşır`,
    idempotencyKey: `agora-partner-yayin-durum/${params.egitimId}/${params.islem}/v${params.surum}`,
    etiket: "yayin-durum",
  });
}

export async function partnerYayinSiparisiEpostasiGonder(
  db: SupabaseClient,
  siparisId: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !partnerEpostaGonderici()) return;

  const { data } = await db.rpc("agora_eposta_bildirim_oku", {
    p_tur: "yayin_siparis",
    p_id: siparisId,
  });
  if (!data || typeof data !== "object" || typeof data.partner_eposta !== "string") return;

  const adTemiz = String(data.partner_ad_soyad ?? "").trim();
  const hitap = adTemiz ? `Sayın ${adTemiz},` : "Sayın İş Partnerimiz,";
  const yayinAdi = String(data.egitim_adi ?? "Agora Yayını").trim();
  const kodParca = data.partner_egitim_id ? ` (${String(data.partner_egitim_id)})` : "";
  const aliciFirma = String(data.alici_firma_adi ?? "Alıcı Firma").trim();
  const yayinTuru = String(data.yayin_araci ?? "video").toLowerCase() === "podcast" ? "Podcast" : "Video";
  const satisTutari = paraBicim(data.satin_alma_bedeli);
  const netHakedis = paraBicim(data.odenecek_tutar);

  await resendEpostaGonder({
    to: data.partner_eposta,
    subject: "Agora Yayınınız İçin Sipariş Alındı",
    html:
      `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
      `<p style="margin: 0 0 16px 0;">Agora'daki <strong>${kacir(yayinAdi)}</strong>${kacir(kodParca)} yayınınız <strong>${kacir(aliciFirma)}</strong> tarafından sipariş edilmiştir.</p>` +
      `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
      `<li style="margin: 0 0 6px 0;"><strong>Yayın türü:</strong> ${kacir(yayinTuru)}</li>` +
      `<li style="margin: 0 0 6px 0;"><strong>Satış tutarı:</strong> ${kacir(satisTutari)}</li>` +
      `<li style="margin: 0;"><strong>Net hak edişiniz:</strong> ${kacir(netHakedis)}</li>` +
      `</ul>` +
      `<p style="margin: 0 0 16px 0;">Satış ve ödeme detaylarını Partner Paneli içindeki <strong>Hak Edişlerim</strong> ekranından görüntüleyebilirsiniz.</p>` +
      `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
    text:
      `${hitap}\n\n` +
      `Agora'daki ${yayinAdi}${kodParca} yayınınız ${aliciFirma} tarafından sipariş edilmiştir.\n\n` +
      `- Yayın türü: ${yayinTuru}\n` +
      `- Satış tutarı: ${satisTutari}\n` +
      `- Net hak edişiniz: ${netHakedis}\n\n` +
      `Satış ve ödeme detaylarını Partner Paneli içindeki Hak Edişlerim ekranından görüntüleyebilirsiniz.\n\n` +
      `Cogniti · bilgi taşır`,
    idempotencyKey: `agora-partner-siparis/${siparisId}`,
    etiket: "yayin-siparis",
  });
}

export async function partnerCanliSiparisiEpostasiGonder(
  db: SupabaseClient,
  siparisId: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !partnerEpostaGonderici()) return;

  const { data } = await db.rpc("agora_eposta_bildirim_oku", {
    p_tur: "canli_siparis",
    p_id: siparisId,
  });
  if (!data || typeof data !== "object" || typeof data.partner_eposta !== "string") return;

  const adTemiz = String(data.partner_ad_soyad ?? "").trim();
  const hitap = adTemiz ? `Sayın ${adTemiz},` : "Sayın İş Partnerimiz,";
  const yayinAdi = String(data.egitim_adi ?? "Canlı Yayın").trim();
  const kodParca = data.partner_egitim_id ? ` (${String(data.partner_egitim_id)})` : "";
  const aliciFirma = String(data.alici_firma_adi ?? "Alıcı Firma").trim();
  const zamanMetni = trTarihSaatFormatla(String(data.baslangic_at));
  const sureDakika = Number(data.sure_dakika ?? 60);
  const kapasite = Number(data.kapasite ?? 0);
  const satisTutari = paraBicim(data.satin_alma_bedeli);
  const netHakedis = paraBicim(data.odenecek_tutar);

  await resendEpostaGonder({
    to: data.partner_eposta,
    subject: "Agora Canlı Yayın Oturumunuz Sipariş Edildi",
    html:
      `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
      `<p style="margin: 0 0 16px 0;">Agora'daki <strong>${kacir(yayinAdi)}</strong>${kacir(kodParca)} canlı yayınınızın aşağıdaki oturumu <strong>${kacir(aliciFirma)}</strong> tarafından sipariş edilmiştir.</p>` +
      `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
      `<li style="margin: 0 0 6px 0;"><strong>Yayın zamanı:</strong> ${kacir(zamanMetni)} (Türkiye saati)</li>` +
      `<li style="margin: 0 0 6px 0;"><strong>Süre ve kontenjan:</strong> ${kacir(sureDakika)} dakika · ${kacir(kapasite)} katılımcı</li>` +
      `<li style="margin: 0 0 6px 0;"><strong>Satış tutarı:</strong> ${kacir(satisTutari)}</li>` +
      `<li style="margin: 0;"><strong>Net hak edişiniz:</strong> ${kacir(netHakedis)}</li>` +
      `</ul>` +
      `<p style="margin: 0 0 16px 0;">Yayın saatinde Partner Paneli içindeki <strong>Viva Canlı Yayınlar</strong> ekranından yayın odasına katılabilirsiniz.</p>` +
      `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
    text:
      `${hitap}\n\n` +
      `Agora'daki ${yayinAdi}${kodParca} canlı yayınınızın aşağıdaki oturumu ${aliciFirma} tarafından sipariş edilmiştir.\n\n` +
      `- Yayın zamanı: ${zamanMetni} (Türkiye saati)\n` +
      `- Süre ve kontenjan: ${sureDakika} dakika · ${kapasite} katılımcı\n` +
      `- Satış tutarı: ${satisTutari}\n` +
      `- Net hak edişiniz: ${netHakedis}\n\n` +
      `Yayın saatinde Partner Paneli içindeki Viva Canlı Yayınlar ekranından yayın odasına katılabilirsiniz.\n\n` +
      `Cogniti · bilgi taşır`,
    idempotencyKey: `agora-partner-canli-siparis/${siparisId}`,
    etiket: "canli-siparis",
  });
}
