import type { SupabaseClient } from "@supabase/supabase-js";
import { ogrenmeAraciMetinleri } from "@/lib/ogrenmeAraci/etiketler";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";

export interface BmOneriEpostaKaydi {
  oneriId: string;
  yayinId: string;
  aliciId: string;
  urunAdi: string;
  aracTuru?: OgrenmeAraciTuru | string | null;
  oneriBaslangic: string;
  oneriBitis: string;
}

const kacir = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

function aracTuruCoz(deger?: string | null): OgrenmeAraciTuru {
  if (deger === "podcast" || deger === "gorsel" || deger === "flip_pdf") return deger;
  return "video";
}

function tarihSaatBicim(iso: string): string {
  const tarih = new Date(iso);
  if (Number.isNaN(tarih.getTime())) return iso;
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(tarih);
}

function temizSiteAdresi(adres: string): string {
  return adres.trim().replace(/\/+$/, "") || "https://cogniti.net";
}

export async function bmOneriEpostasiGonder(
  db: SupabaseClient,
  params: {
    onerenId: string;
    siteAdresi: string;
    kayitlar: BmOneriEpostaKaydi[];
  },
): Promise<void> {
  if (params.kayitlar.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("[bm-oneri-eposta] Resend ayarları eksik.");
    return;
  }

  try {
    const kisiIdleri = [...new Set([params.onerenId, ...params.kayitlar.map((k) => k.aliciId)])];
    const { data: kisiler, error: kisiHatasi } = await db
      .from("kullanicilar")
      .select("kullanici_id, ad, soyad, eposta")
      .in("kullanici_id", kisiIdleri);

    if (kisiHatasi || !kisiler) {
      console.error("[bm-oneri-eposta] Kullanıcı bilgileri okunamadı:", kisiHatasi?.message);
      return;
    }

    const kisiHaritasi = new Map<string, { adSoyad: string; eposta: string }>();
    for (const k of kisiler) {
      const adSoyad = [k.ad, k.soyad].filter(Boolean).join(" ").trim();
      const eposta = k.eposta ? String(k.eposta).trim().toLowerCase() : "";
      kisiHaritasi.set(k.kullanici_id, { adSoyad, eposta });
    }

    const bmAdSoyad = kisiHaritasi.get(params.onerenId)?.adSoyad || "";
    const bmIfadesi = bmAdSoyad ? `Bölge Müdürünüz ${bmAdSoyad}` : "Bölge Müdürünüz";
    const temelAdres = temizSiteAdresi(params.siteAdresi);

    const gruplar = new Map<string, BmOneriEpostaKaydi[]>();
    for (const kayit of params.kayitlar) {
      const liste = gruplar.get(kayit.aliciId) ?? [];
      liste.push(kayit);
      gruplar.set(kayit.aliciId, liste);
    }

    for (const [aliciId, aliciKayitlari] of gruplar) {
      const alici = kisiHaritasi.get(aliciId);
      if (!alici?.eposta) continue;

      const hitap = alici.adSoyad ? `Sayın ${alici.adSoyad},` : "Sayın Kullanıcı,";
      const coklu = aliciKayitlari.length > 1;
      const giris = coklu
        ? `${bmIfadesi} tarafından sizin için aşağıdaki yayınlar önerilmiştir. Önerilen yayınları belirtilen tarih aralığında Cogniti’deki Önerilen Yayınlar ekranından veya aşağıdaki bağlantılardan izleyebilirsiniz.`
        : `${bmIfadesi} tarafından sizin için aşağıdaki yayın önerilmiştir. Önerilen yayını belirtilen tarih aralığında Cogniti’deki Önerilen Yayınlar ekranından veya aşağıdaki bağlantıdan izleyebilirsiniz.`;
      const kapanis = coklu
        ? "Önerilen yayınları belirtilen tarih aralığında tamamladığınızda öneri puanı kazanırsınız."
        : "Önerilen yayını belirtilen tarih aralığında tamamladığınızda öneri puanı kazanırsınız.";

      const ogeler = aliciKayitlari.map((k) => {
        const aracAdi = ogrenmeAraciMetinleri(aracTuruCoz(k.aracTuru)).ad;
        const baslik = `${k.urunAdi || "Yayın"} (${aracAdi})`;
        const link = `${temelAdres}/ana-sayfa?yayin_id=${encodeURIComponent(k.yayinId)}&oneri_id=${encodeURIComponent(k.oneriId)}`;
        const baslangic = tarihSaatBicim(k.oneriBaslangic);
        const bitis = tarihSaatBicim(k.oneriBitis);
        return { baslik, link, baslangic, bitis };
      });

      const htmlListe = ogeler
        .map(
          (oge, i) =>
            `<li style="margin: 0 0 ${i === ogeler.length - 1 ? 0 : 12}px 0; line-height: 1.5;">` +
            `<a href="${kacir(oge.link)}" style="color: #0b63ce; font-weight: 700; text-decoration: underline;">${kacir(oge.baslik)}</a><br />` +
            `<span style="color: #475569; font-size: 13px;">Başlangıç tarihi: ${kacir(oge.baslangic)} · Bitiş tarihi: ${kacir(oge.bitis)}</span>` +
            `</li>`,
        )
        .join("");

      const metinListe = ogeler
        .map(
          (oge) =>
            `- ${oge.baslik}\n` +
            `  Bağlantı: ${oge.link}\n` +
            `  Başlangıç tarihi: ${oge.baslangic} · Bitiş tarihi: ${oge.bitis}`,
        )
        .join("\n\n");

      const siraliIdler = aliciKayitlari.map((k) => k.oneriId).sort();
      const idempotencyKey = `bm-oneri/${siraliIdler[0]}-${siraliIdler.length}`;

      try {
        const yanit = await fetch("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(10000),
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            from,
            to: [alici.eposta],
            subject: "Bölge Müdürünüz Önerisini İletti",
            html:
              `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
              `<p style="margin: 0 0 16px 0;">${kacir(giris)}</p>` +
              `<ul style="margin: 0 0 16px 0; padding-left: 20px;">${htmlListe}</ul>` +
              `<p style="margin: 0 0 16px 0;">${kacir(kapanis)}</p>` +
              `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
            text:
              `${hitap}\n\n` +
              `${giris}\n\n` +
              `${metinListe}\n\n` +
              `${kapanis}\n\n` +
              `Cogniti · bilgi taşır`,
          }),
        });
        if (!yanit.ok) {
          console.error("[bm-oneri-eposta] Gönderilemedi:", yanit.status);
        }
      } catch (err) {
        console.error("[bm-oneri-eposta] Gönderim hatası:", err);
      }
    }
  } catch (err) {
    console.error("[bm-oneri-eposta] Hazırlık hatası:", err);
  }
}
