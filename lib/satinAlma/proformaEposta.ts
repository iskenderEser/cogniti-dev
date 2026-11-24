import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { FIRMA_ADMIN_ROLU } from "@/lib/utils/roller";

export type ProformaEpostaTuru =
  | "kko"
  | "esnek"
  | "abonelik"
  | "viva"
  | "banner"
  | "agora"
  | "icerik"
  | "firmastore"
  | "eczane";

const PROFORMA_SATIN_ALIM_ADLARI: Record<ProformaEpostaTuru, string> = {
  kko: "Kullandığın Kadar Öde",
  esnek: "Esnek Paket",
  abonelik: "Aylık Abonelik",
  viva: "Viva Kullanımı",
  banner: "Banner Alımı",
  agora: "Agora Yayını Alımı",
  icerik: "İçerik Üretimi Alımı",
  firmastore: "FirmaStore Çekleri",
  eczane: "Eczane Çekleri",
};

const kacir = (v: string) =>
  v
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const paraBicim = (n: number) =>
  `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;

function tarihBicim(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

type BelgeVerisi = {
  belge_no?: unknown;
  toplam_tutar?: unknown;
  kdv?: unknown;
  genel_tutar?: unknown;
  toplam_tl?: unknown;
};

function tutarSatiri(tur: ProformaEpostaTuru, belge: BelgeVerisi | null): { etiket: string; deger: string } | null {
  if (!belge) return null;
  if (tur === "firmastore" || tur === "eczane") {
    const toplamTl = Number(belge.toplam_tl);
    if (Number.isFinite(toplamTl) && toplamTl >= 0) {
      return { etiket: "Toplam Tutar", deger: paraBicim(toplamTl) };
    }
    return null;
  }
  const toplam = Number(belge.toplam_tutar);
  const kdv = Number(belge.kdv);
  const genel = Number.isFinite(Number(belge.genel_tutar))
    ? Number(belge.genel_tutar)
    : Number.isFinite(toplam) && Number.isFinite(kdv)
      ? toplam + kdv
      : NaN;
  if (Number.isFinite(toplam) && Number.isFinite(genel)) {
    return {
      etiket: "Tutar",
      deger: `${paraBicim(toplam)} + KDV (Genel Tutar: ${paraBicim(genel)})`,
    };
  }
  return null;
}

async function resendGonder(params: {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
  etiket: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error(`[proforma-eposta] Resend ayarları eksik (${params.etiket}).`);
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
    if (params.replyTo) govde.reply_to = params.replyTo;
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
      console.error(`[proforma-eposta] ${params.etiket} gönderilemedi:`, yanit.status);
    }
  } catch (err) {
    console.error(`[proforma-eposta] ${params.etiket} hatası:`, err);
  }
}

function maddeListesiHtml(maddeler: { etiket: string; deger: string }[], altBosluk = false): string {
  return (
    `<ul style="margin: ${altBosluk ? "0 0 16px 0" : "0"}; padding-left: 20px;">` +
    maddeler
      .map(
        (m, i) =>
          `<li style="margin: ${i === maddeler.length - 1 ? "0" : "0 0 6px 0"};"><strong>${kacir(m.etiket)}:</strong> ${kacir(m.deger)}</li>`
      )
      .join("") +
    `</ul>`
  );
}

function maddeListesiText(maddeler: { etiket: string; deger: string }[]): string {
  return maddeler.map((m) => `- ${m.etiket}: ${m.deger}`).join("\n");
}

export async function proformaOnayEpostasiGonder(
  db: SupabaseClient,
  params: {
    tur: ProformaEpostaTuru;
    firmaId: string;
    kayitAnahtari: string;
    onaylayanId: string;
    onay: {
      tur: "firma" | "admin";
      onaylayan: string;
      tarih: string;
      aciklama?: string;
    };
    belge?: BelgeVerisi | null;
  }
) {
  try {
    const [firmaSonuc, firmaAdminSonuc, onaylayanSonuc, belgeSonuc] = await Promise.all([
      db.from("firmalar").select("firma_adi").eq("firma_id", params.firmaId).maybeSingle(),
      db
        .from("kullanicilar")
        .select("ad,soyad,eposta")
        .eq("firma_id", params.firmaId)
        .eq("rol", FIRMA_ADMIN_ROLU)
        .eq("aktif_mi", true)
        .maybeSingle(),
      params.onay.tur === "firma"
        ? db.from("kullanicilar").select("ad,soyad,eposta").eq("kullanici_id", params.onaylayanId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      params.belge
        ? Promise.resolve({ data: params.belge, error: null })
        : db.rpc("cogniti_proforma_onay_belge_oku", {
            p_tur: params.tur,
            p_firma: params.firmaId,
            p_anahtar: params.kayitAnahtari,
          }),
    ]);

    const firmaAdi = firmaSonuc.data?.firma_adi || "Firma";
    const satinAlimAdi = PROFORMA_SATIN_ALIM_ADLARI[params.tur];
    const belge = (belgeSonuc.data && typeof belgeSonuc.data === "object"
      ? (belgeSonuc.data as BelgeVerisi)
      : null);
    const belgeNo = typeof belge?.belge_no === "string" && belge.belge_no.trim() ? belge.belge_no.trim() : null;
    const tutar = tutarSatiri(params.tur, belge);
    const onayTarihi = tarihBicim(params.onay.tarih);
    const onaylayanAd =
      params.onay.onaylayan.trim() ||
      [onaylayanSonuc.data?.ad, onaylayanSonuc.data?.soyad].filter(Boolean).join(" ").trim() ||
      "Firma Admini";

    const firmaAdminKaydi = params.onay.tur === "firma" && onaylayanSonuc.data?.eposta
      ? onaylayanSonuc.data
      : firmaAdminSonuc.data;
    const firmaAdminEposta = firmaAdminKaydi?.eposta
      ? String(firmaAdminKaydi.eposta).trim().toLowerCase()
      : null;
    const firmaAdminAdSoyad = [firmaAdminKaydi?.ad, firmaAdminKaydi?.soyad].filter(Boolean).join(" ").trim();
    const hitap = firmaAdminAdSoyad ? `Sayın ${firmaAdminAdSoyad},` : "Sayın Firma Yöneticisi,";
    const anahtarParcasi = `${params.tur}/${params.firmaId}/${params.kayitAnahtari}`;

    const gonderimler: Promise<void>[] = [];

    if (params.onay.tur === "firma") {
      // 4.2a — Cogniti Admin'e iç bildirim (hitap ve müşteri imzası olmadan)
      const adminEposta = process.env.COGNITI_ADMIN_EMAIL?.trim();
      if (adminEposta) {
        const adminMaddeler: { etiket: string; deger: string }[] = [
          { etiket: "Firma", deger: firmaAdi },
          { etiket: "Satın Alım", deger: satinAlimAdi },
          ...(belgeNo ? [{ etiket: "Proforma No", deger: belgeNo }] : []),
          ...(tutar ? [tutar] : []),
          { etiket: "Onaylayan", deger: `${onaylayanAd} (Firma Admini)` },
          { etiket: "Onay tarihi", deger: onayTarihi },
        ];
        gonderimler.push(
          resendGonder({
            to: adminEposta,
            replyTo: firmaAdminEposta ?? undefined,
            subject: `Proforma fatura onayı — ${firmaAdi} (${satinAlimAdi})`,
            html:
              `<p style="margin: 0 0 16px 0;">${kacir(firmaAdi)} proforma faturayı onayladı:</p>` +
              maddeListesiHtml(adminMaddeler, false),
            text:
              `${firmaAdi} proforma faturayı onayladı:\n\n` +
              maddeListesiText(adminMaddeler),
            idempotencyKey: `proforma-onay-admin/${anahtarParcasi}`,
            etiket: `${params.tur}-admin`,
          })
        );
      }

      // 4.2b — Onaylayan Firma Admini'ne teyit
      if (firmaAdminEposta) {
        const firmaMaddeler: { etiket: string; deger: string }[] = [
          { etiket: "Satın Alım", deger: satinAlimAdi },
          ...(belgeNo ? [{ etiket: "Proforma No", deger: belgeNo }] : []),
          ...(tutar ? [tutar] : []),
          { etiket: "Onay tarihi", deger: onayTarihi },
        ];
        gonderimler.push(
          resendGonder({
            to: firmaAdminEposta,
            subject: `${satinAlimAdi} proforma fatura onayınız alındı`,
            html:
              `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
              `<p style="margin: 0 0 16px 0;">${kacir(firmaAdi)} için aşağıdaki proforma fatura onayınız kaydedilmiştir. Resmi faturanız düzenlenecektir.</p>` +
              maddeListesiHtml(firmaMaddeler, true) +
              `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
            text:
              `${hitap}\n\n` +
              `${firmaAdi} için aşağıdaki proforma fatura onayınız kaydedilmiştir. Resmi faturanız düzenlenecektir.\n\n` +
              `${maddeListesiText(firmaMaddeler)}\n\n` +
              `Cogniti · bilgi taşır`,
            idempotencyKey: `proforma-onay-firma/${anahtarParcasi}`,
            etiket: `${params.tur}-firma-teyit`,
          })
        );
      }
    } else if (params.onay.tur === "admin" && firmaAdminEposta) {
      // 4.3 — Cogniti Admin firma adına onayladığında Firma Admini'ne bilgilendirme
      const aciklama = (params.onay.aciklama ?? "").trim();
      const maddeler: { etiket: string; deger: string }[] = [
        { etiket: "Satın Alım", deger: satinAlimAdi },
        ...(belgeNo ? [{ etiket: "Proforma No", deger: belgeNo }] : []),
        ...(tutar ? [tutar] : []),
        { etiket: "Onay tarihi", deger: onayTarihi },
        ...(aciklama ? [{ etiket: "Açıklama", deger: aciklama }] : []),
      ];
      gonderimler.push(
        resendGonder({
          to: firmaAdminEposta,
          subject: `${satinAlimAdi} proforma faturanız onaylandı`,
          html:
            `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
            `<p style="margin: 0 0 16px 0;">${kacir(firmaAdi)} için aşağıdaki proforma faturanız Cogniti tarafından firma adına onaylanmıştır. Resmi faturanız düzenlenecektir.</p>` +
            maddeListesiHtml(maddeler, true) +
            `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
          text:
            `${hitap}\n\n` +
            `${firmaAdi} için aşağıdaki proforma faturanız Cogniti tarafından firma adına onaylanmıştır. Resmi faturanız düzenlenecektir.\n\n` +
            `${maddeListesiText(maddeler)}\n\n` +
            `Cogniti · bilgi taşır`,
          idempotencyKey: `proforma-onay-admin-bildirim/${anahtarParcasi}`,
          etiket: `${params.tur}-admin-bildirim`,
        })
      );
    }

    if (gonderimler.length > 0) {
      await Promise.allSettled(gonderimler);
    }
  } catch (err) {
    console.error("[proforma-eposta] hazırlık hatası:", err);
  }
}
