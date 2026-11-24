import type { SupabaseClient } from "@supabase/supabase-js";
import { pushYayinlaArkada } from "@/lib/push/orkestrasyon";

const kacir = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

async function yayinVideoHataEpostasiGonder(
  adminSupabase: SupabaseClient,
  params: { yayinId: string; ureticiId: string; urunAdi: string },
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) return;

  try {
    const { data: uretici } = await adminSupabase
      .from("kullanicilar")
      .select("ad, soyad, eposta")
      .eq("kullanici_id", params.ureticiId)
      .maybeSingle();

    const eposta = uretici?.eposta ? String(uretici.eposta).trim().toLowerCase() : "";
    if (!eposta) return;

    const adSoyad = [uretici?.ad, uretici?.soyad].filter(Boolean).join(" ").trim();
    const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın Kullanıcı,";

    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `yayin-video-hatasi/${params.yayinId}`,
      },
      body: JSON.stringify({
        from,
        to: [eposta],
        subject: "Yayınınız video işleme hatası nedeniyle durduruldu",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(`${params.urunAdi} adlı yayınınızın video dosyası işlenemediği için yayınınız otomatik olarak durdurulmuştur.`)}</p>` +
          `<p style="margin: 0 0 16px 0;">Yayın Yönetimi ekranından içeriği kontrol edip yeniden yükleyebilirsiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${params.urunAdi} adlı yayınınızın video dosyası işlenemediği için yayınınız otomatik olarak durdurulmuştur.\n\n` +
          `Yayın Yönetimi ekranından içeriği kontrol edip yeniden yükleyebilirsiniz.\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });
    if (!yanit.ok) {
      console.error("[yayin-video-eposta] video işleme hatası e-postası gönderilemedi:", yanit.status);
    }
  } catch (err) {
    console.error("[yayin-video-eposta] video işleme hatası e-posta istisnası:", err);
  }
}

/**
 * Video Bunny'de işlenirken oluşturulan yayınlar için,
 * kodlama tamamlandığında veya hata verdiğinde üreticiye bildirim oluşturur.
 */
export async function yayinVideoSonucunuBildir(
  adminSupabase: SupabaseClient,
  guid: string,
  durum: { hazir: boolean; hatali?: boolean; videoSuresiSaniye?: number | null },
) {
  if (!guid) return;

  // 1. Bu GUID'e bağlı videoları bul
  const { data: araclar, error: aracHata } = await adminSupabase
    .from("ogrenme_araclari")
    .select("arac_id, metadata_dogrulandi")
    .eq("arac_turu", "video")
    .ilike("dosya_yolu", `%${guid}%`);

  if (aracHata || !araclar || araclar.length === 0) return;

  // Sadece video henüz doğrulanmamışken (işleniyorken) açılmış yayınlar için bildirim üretilir
  const dogrulanmamisAracIdler = araclar
    .filter((a) => a.metadata_dogrulandi !== true)
    .map((a) => a.arac_id);

  if (dogrulanmamisAracIdler.length === 0) return;

  const { data: durumlar, error: durumHata } = await adminSupabase
    .from("ogrenme_araci_durumu")
    .select("arac_durum_id")
    .in("arac_id", dogrulanmamisAracIdler);

  if (durumHata || !durumlar || durumlar.length === 0) return;
  const aracDurumIdler = durumlar.map((d) => d.arac_durum_id);

  // Bu araç durumuna doğrudan veya soru seti üzerinden bağlı yayınları bul
  const [yayinlarDirectRes, soruSetleriRes] = await Promise.all([
    adminSupabase
      .from("yayin_yonetimi")
      .select("yayin_id, uretici_id, durum")
      .in("arac_durum_id", aracDurumIdler),
    adminSupabase
      .from("soru_setleri")
      .select("soru_seti_id")
      .in("arac_durum_id", aracDurumIdler),
  ]);

  const directYayinlar = (yayinlarDirectRes.data ?? []) as Array<{ yayin_id: string; uretici_id: string; durum: string }>;
  const soruSetiIdler = (soruSetleriRes.data ?? []).map((s) => s.soru_seti_id);

  let ssYayinlar: Array<{ yayin_id: string; uretici_id: string; durum: string }> = [];
  if (soruSetiIdler.length > 0) {
    const { data: ssdList } = await adminSupabase
      .from("soru_seti_durumu")
      .select("soru_seti_durum_id")
      .in("soru_seti_id", soruSetiIdler);
    const ssdIdler = (ssdList ?? []).map((ssd) => ssd.soru_seti_durum_id);
    if (ssdIdler.length > 0) {
      const { data: yayinlarSs } = await adminSupabase
        .from("yayin_yonetimi")
        .select("yayin_id, uretici_id, durum")
        .in("soru_seti_durum_id", ssdIdler);
      ssYayinlar = (yayinlarSs ?? []) as Array<{ yayin_id: string; uretici_id: string; durum: string }>;
    }
  }

  const tumYayinlarMap = new Map<string, { yayin_id: string; uretici_id: string; durum: string }>();
  for (const y of [...directYayinlar, ...ssYayinlar]) {
    tumYayinlarMap.set(y.yayin_id, y);
  }

  if (tumYayinlarMap.size === 0) return;

  for (const y of tumYayinlarMap.values()) {
    // İdempotency / mükerrer kayıt koruması: Bu yayın için daha önce sonuç bildirimi oluşturulmuşsa tekrar ekleme
    const { data: mevcutBildirim } = await adminSupabase
      .from("bildirimler")
      .select("bildirim_id")
      .eq("alici_id", y.uretici_id)
      .eq("kayit_turu", "yayin")
      .eq("kayit_id", y.yayin_id)
      .ilike("mesaj", "%nolu yayınız%")
      .limit(1)
      .maybeSingle();

    if (mevcutBildirim) continue;

    const { data: detay } = await adminSupabase
      .from("v_yayin_detay")
      .select("urun_adi")
      .eq("yayin_id", y.yayin_id)
      .maybeSingle();
    const urunAdi = detay?.urun_adi || "Yayın";

    if (durum.hatali) {
      await adminSupabase
        .from("yayin_yonetimi")
        .update({ durum: "Durduruldu" })
        .eq("yayin_id", y.yayin_id);

      await adminSupabase.from("bildirimler").upsert(
        {
          alici_id: y.uretici_id,
          kayit_turu: "yayin",
          kayit_id: y.yayin_id,
          mesaj: `${urunAdi} adlı ${y.yayin_id} nolu yayınız, yayınlanamamıştır.`,
          goruldu_mu: false,
        },
        { onConflict: "alici_id,kayit_turu,kayit_id" }
      );

      pushYayinlaArkada(adminSupabase, "video_yayini", [y.uretici_id], { yayinId: y.yayin_id });
      await yayinVideoHataEpostasiGonder(adminSupabase, {
        yayinId: y.yayin_id,
        ureticiId: y.uretici_id,
        urunAdi,
      });
    } else if (durum.hazir && (durum.videoSuresiSaniye ?? 0) > 0) {
      await adminSupabase.from("bildirimler").upsert(
        {
          alici_id: y.uretici_id,
          kayit_turu: "yayin",
          kayit_id: y.yayin_id,
          mesaj: `${urunAdi} adlı ${y.yayin_id} nolu yayınız, başarıyla yayınlanmıştır.`,
          goruldu_mu: false,
        },
        { onConflict: "alici_id,kayit_turu,kayit_id" }
      );

      pushYayinlaArkada(adminSupabase, "video_yayini", [y.uretici_id], { yayinId: y.yayin_id });
    }
  }
}
