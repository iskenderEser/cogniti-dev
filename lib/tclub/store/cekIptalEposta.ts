import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { firmaStoreGonderici } from "./cekEposta";

const kacir = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const sayiBicim = (deger: number) => new Intl.NumberFormat("tr-TR").format(deger);

export async function firmaStoreCekIptalEpostasiGonder(
  db: SupabaseClient,
  siparisId: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = firmaStoreGonderici() || process.env.COGNITI_UYELIK_EMAIL_FROM || "";
  if (!apiKey || !from) {
    console.error("[firmastore-cek-iptal-eposta] Resend ayarları eksik.");
    return;
  }

  try {
    const { data: siparis } = await db
      .from("store_siparisler")
      .select("siparis_id, firma_id, kullanici_id, urun_id, adet, toplam_puan, iptal_sebebi, durum")
      .eq("siparis_id", siparisId)
      .maybeSingle();

    if (!siparis || siparis.durum !== "iptal" || !siparis.kullanici_id) return;

    const [kullaniciSonuc, firmaSonuc, urunSonuc] = await Promise.all([
      db
        .from("kullanicilar")
        .select("ad, soyad, eposta")
        .eq("kullanici_id", siparis.kullanici_id)
        .maybeSingle(),
      siparis.firma_id
        ? db.from("firmalar").select("firma_adi").eq("firma_id", siparis.firma_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      siparis.urun_id
        ? db.from("store_urunler").select("ad").eq("urun_id", siparis.urun_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const eposta = String(kullaniciSonuc.data?.eposta ?? "").trim().toLowerCase();
    if (!eposta || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) return;

    const adSoyad = [kullaniciSonuc.data?.ad, kullaniciSonuc.data?.soyad]
      .filter(Boolean)
      .join(" ")
      .trim();
    const hitap = adSoyad ? `Sayın ${adSoyad},` : "Sayın Kullanıcımız,";
    const firmaAdi = String(firmaSonuc.data?.firma_adi ?? "").trim();
    const firmaOnEk = firmaAdi ? `${firmaAdi} FirmaStore` : "FirmaStore";
    const urunAdi = String(urunSonuc.data?.ad ?? "").trim() || "Hediye Çeki";
    const adetMetni = `${sayiBicim(Number(siparis.adet ?? 1))} adet`;
    const puanMetni = `${sayiBicim(Number(siparis.toplam_puan ?? 0))} puan`;
    const iptalNedeni = String(siparis.iptal_sebebi ?? "").trim();

    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `firmastore-cek-iptal/${siparis.siparis_id}`,
      },
      body: JSON.stringify({
        from,
        to: [eposta],
        subject: "FirmaStore Çek Talebiniz İptal Edildi",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(firmaOnEk)} kapsamındaki <strong>${kacir(urunAdi)}</strong> (<strong>${kacir(adetMetni)}</strong>) talebiniz iptal edilmiştir.</p>` +
          `<ul style="margin: 0 0 16px 0; padding-left: 20px;">` +
          (iptalNedeni
            ? `<li style="margin: 0 0 6px 0;"><strong>İptal nedeni:</strong> ${kacir(iptalNedeni)}</li>`
            : "") +
          `<li style="margin: 0;"><strong>Puan iadesi:</strong> Harcanan <strong>${kacir(puanMetni)}</strong> hesabınıza iade edilmiştir.</li>` +
          `</ul>` +
          `<p style="margin: 0 0 16px 0;">Güncel durumunuzu Cogniti içindeki <strong>Taleplerim</strong> ekranından inceleyebilirsiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${firmaOnEk} kapsamındaki ${urunAdi} (${adetMetni}) talebiniz iptal edilmiştir.\n\n` +
          (iptalNedeni ? `- İptal nedeni: ${iptalNedeni}\n` : "") +
          `- Puan iadesi: Harcanan ${puanMetni} hesabınıza iade edilmiştir.\n\n` +
          `Güncel durumunuzu Cogniti içindeki Taleplerim ekranından inceleyebilirsiniz.\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });

    if (!yanit.ok) {
      console.error("[firmastore-cek-iptal-eposta] Gönderilemedi:", yanit.status);
    }
  } catch (err) {
    console.error("[firmastore-cek-iptal-eposta] Hazırlık hatası:", err);
  }
}
