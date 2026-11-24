import "server-only";

import { BARKOD_DESENI } from "@/app/kurumsal-uyelik/barkod";
import { firmaKonumunuDogrula } from "@/lib/firma/konumReferansi";

export type KurumsalBasvuruDurumu = "taslak" | "incelemede" | "onaylandi" | "reddedildi";
export type KurumsalBelgeTuru = "logo" | "sozlesme" | "ticaret_sicil" | "vergi_levhasi";

export interface KurumsalFirmaBilgileriTaslak {
  firma_adi?: string;
  il_id?: number | null;
  ilce_id?: number | null;
  adres?: string;
  vergi_dairesi?: string;
  vergi_dairesi_kodu?: string;
  vergi_numarasi?: string;
  sorumlu_ad_soyad?: string;
  sorumlu_telefon?: string;
  sorumlu_eposta?: string;
}

export interface BelgeKurali {
  yolKolonu: "logo_yolu" | "sozlesme_yolu" | "ticaret_sicil_yolu" | "vergi_levhasi_yolu";
  adKolonu: "logo_dosya_adi" | "sozlesme_dosya_adi" | "ticaret_sicil_dosya_adi" | "vergi_levhasi_dosya_adi";
  etiket: string;
  maksBayt: number;
  izinliMimeler: readonly string[];
  izinliUzantilar: readonly string[];
}

export const KURUMSAL_BELGE_KURALLARI: Record<KurumsalBelgeTuru, BelgeKurali> = {
  logo: {
    yolKolonu: "logo_yolu",
    adKolonu: "logo_dosya_adi",
    etiket: "Firma Logosu",
    maksBayt: 5 * 1024 * 1024,
    izinliMimeler: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"],
    izinliUzantilar: ["png", "jpg", "jpeg", "webp", "svg"],
  },
  sozlesme: {
    yolKolonu: "sozlesme_yolu",
    adKolonu: "sozlesme_dosya_adi",
    etiket: "İmzalı Üyelik Sözleşmesi",
    maksBayt: 10 * 1024 * 1024,
    izinliMimeler: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    izinliUzantilar: ["pdf", "doc", "docx"],
  },
  ticaret_sicil: {
    yolKolonu: "ticaret_sicil_yolu",
    adKolonu: "ticaret_sicil_dosya_adi",
    etiket: "Ticaret Sicili Gazetesi",
    maksBayt: 10 * 1024 * 1024,
    izinliMimeler: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    izinliUzantilar: ["pdf", "doc", "docx"],
  },
  vergi_levhasi: {
    yolKolonu: "vergi_levhasi_yolu",
    adKolonu: "vergi_levhasi_dosya_adi",
    etiket: "Vergi Levhası",
    maksBayt: 10 * 1024 * 1024,
    izinliMimeler: ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"],
    izinliUzantilar: ["pdf", "png", "jpg", "jpeg", "webp"],
  },
};

export function belgeTuruGecerliMi(deger: unknown): deger is KurumsalBelgeTuru {
  return typeof deger === "string" && deger in KURUMSAL_BELGE_KURALLARI;
}

const UZANTI_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export function dosyaIcerikTuruCoz(tur: KurumsalBelgeTuru, dosya: File): { ok: true; uzanti: string; mime: string } | { ok: false; hata: string } {
  const kural = KURUMSAL_BELGE_KURALLARI[tur];
  if (dosya.size <= 0) return { ok: false, hata: "Boş dosya yüklenemez." };
  if (dosya.size > kural.maksBayt) {
    const mb = Math.round(kural.maksBayt / (1024 * 1024));
    return { ok: false, hata: `${kural.etiket} en fazla ${mb} MB olabilir.` };
  }
  const uzanti = dosya.name.includes(".") ? dosya.name.split(".").pop()?.toLowerCase() ?? "" : "";
  if (!kural.izinliUzantilar.includes(uzanti)) {
    return {
      ok: false,
      hata: `${kural.etiket} için geçerli biçimler: ${kural.izinliUzantilar.map(u => `.${u}`).join(", ")}.`,
    };
  }
  const hamMime = (dosya.type || "").toLowerCase();
  const mime = kural.izinliMimeler.includes(hamMime) ? hamMime : UZANTI_MIME[uzanti];
  if (!mime || !kural.izinliMimeler.includes(mime)) {
    return { ok: false, hata: `${kural.etiket} dosya biçimi geçersiz.` };
  }
  return { ok: true, uzanti, mime: mime === "image/jpg" ? "image/jpeg" : mime };
}

export function firmaBilgisiTaslakTemizle(girdi: unknown): KurumsalFirmaBilgileriTaslak {
  if (!girdi || typeof girdi !== "object" || Array.isArray(girdi)) return {};
  const d = girdi as Record<string, unknown>;
  const metin = (k: string, sinir: number) =>
    typeof d[k] === "string" ? d[k].trim().slice(0, sinir) : "";
  const sayi = (k: string) =>
    typeof d[k] === "number" && Number.isInteger(d[k]) && d[k] > 0 ? d[k] : null;
  return {
    firma_adi: metin("firma_adi", 200),
    il_id: sayi("il_id"),
    ilce_id: sayi("ilce_id"),
    adres: metin("adres", 2000),
    vergi_dairesi: metin("vergi_dairesi", 200),
    vergi_dairesi_kodu: metin("vergi_dairesi_kodu", 40),
    vergi_numarasi: metin("vergi_numarasi", 10).replace(/\D/g, ""),
    sorumlu_ad_soyad: metin("sorumlu_ad_soyad", 200),
    sorumlu_telefon: metin("sorumlu_telefon", 25),
    sorumlu_eposta: metin("sorumlu_eposta", 254).toLowerCase(),
  };
}

export function firmaBilgisiGonderimDogrula(bilgi: KurumsalFirmaBilgileriTaslak): { ok: true; veri: {
  firma_adi: string;
  il_id: number;
  ilce_id: number;
  adres: string;
  vergi_dairesi: string;
  vergi_dairesi_kodu: string;
  vergi_numarasi: string;
  sorumlu_ad_soyad: string;
  sorumlu_telefon: string;
  sorumlu_eposta: string;
} } | { ok: false; hata: string } {
  const firma_adi = (bilgi.firma_adi ?? "").trim();
  const adres = (bilgi.adres ?? "").trim();
  const vergi_numarasi = (bilgi.vergi_numarasi ?? "").trim();
  const sorumlu_ad_soyad = (bilgi.sorumlu_ad_soyad ?? "").trim();
  const sorumlu_telefon = (bilgi.sorumlu_telefon ?? "").trim();
  const sorumlu_eposta = (bilgi.sorumlu_eposta ?? "").trim().toLowerCase();

  if (!firma_adi || !adres || !sorumlu_ad_soyad || !sorumlu_telefon || !sorumlu_eposta) {
    return { ok: false, hata: "1. adımdaki tüm firma bilgilerini eksiksiz doldurun." };
  }
  if (!/^\d{10}$/.test(vergi_numarasi)) {
    return { ok: false, hata: "Vergi numarası 10 haneli sayı olmalıdır." };
  }
  const rakamlar = sorumlu_telefon.replace(/\D/g, "");
  if (!/^\+?[\d\s()-]+$/.test(sorumlu_telefon) || rakamlar.length < 10 || rakamlar.length > 15) {
    return { ok: false, hata: "Sorumlu kişi için geçerli bir cep telefonu numarası girin." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sorumlu_eposta)) {
    return { ok: false, hata: "Sorumlu kişi için geçerli bir e-posta adresi girin." };
  }
  const konum = firmaKonumunuDogrula({
    il_id: bilgi.il_id,
    ilce_id: bilgi.ilce_id,
    vergi_dairesi_kodu: bilgi.vergi_dairesi_kodu,
    vergi_dairesi: bilgi.vergi_dairesi,
  });
  if (!konum.gecerli) return { ok: false, hata: konum.hata };

  return {
    ok: true,
    veri: {
      firma_adi,
      il_id: konum.veri.il_id,
      ilce_id: konum.veri.ilce_id,
      adres,
      vergi_dairesi: konum.veri.vergi_dairesi,
      vergi_dairesi_kodu: konum.veri.vergi_dairesi_kodu,
      vergi_numarasi,
      sorumlu_ad_soyad,
      sorumlu_telefon,
      sorumlu_eposta,
    },
  };
}

export function listeSatirlariTemizle(veri: unknown, sutunSayisi: number): string[][] | null {
  if (!Array.isArray(veri) || veri.length > 2000) return null;
  const sonuc: string[][] = [];
  for (const satir of veri) {
    if (!Array.isArray(satir)) return null;
    const hucreler = sutunSayisi === 4 && satir.length === 3
      ? [satir[0], "", satir[1], satir[2]]
      : satir;
    if (hucreler.length !== sutunSayisi) return null;
    const temiz: string[] = [];
    for (const hucre of hucreler) {
      if (typeof hucre !== "string" || hucre.length > 254) return null;
      temiz.push(hucre);
    }
    sonuc.push(temiz);
  }
  return sonuc;
}

export function listeleriGonderimDogrula(isimListesi: string[][], urunListesi: string[][]): { ok: true } | { ok: false; hata: string } {
  if (isimListesi.length === 0) {
    return { ok: false, hata: "İsim listesinde en az bir kullanıcı satırı olmalıdır." };
  }
  if (isimListesi.some(satir =>
    satir.some(hucre => !hucre.trim())
    || !/^[^\s@]+@[^\s@]+$/.test(satir[4].trim())
    || !/^5[0-9]{9}$/.test(satir[5].trim())
  )) {
    return { ok: false, hata: "İsim listesindeki eksik veya hatalı alanları düzeltin." };
  }
  if (urunListesi.length === 0) {
    return { ok: false, hata: "Ürün listesinde en az bir ürün satırı olmalıdır." };
  }
  if (urunListesi.some(satir => satir.some(hucre => !hucre.trim()))) {
    return { ok: false, hata: "Ürün listesindeki eksik alanları doldurun." };
  }
  if (urunListesi.some(satir => !BARKOD_DESENI.test(satir[1].trim()))) {
    return { ok: false, hata: "Ürün listesindeki barkodlar 1–13 rakamdan oluşmalıdır." };
  }
  return { ok: true };
}

const kacir = (v: string) =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export async function kurumsalBasvuruGonderildiEpostalariGonder(params: {
  firmaAdi: string;
  adSoyad: string;
  eposta: string;
  telefon: string;
  kullaniciSayisi: number;
  urunSayisi: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("[kurumsal-uyelik] Resend ayarları eksik (RESEND_API_KEY / COGNITI_UYELIK_EMAIL_FROM).");
    return;
  }

  const gonder = async (govde: Record<string, unknown>, etiket: string) => {
    try {
      const yanit = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(govde),
      });
      if (!yanit.ok) {
        console.error(`[kurumsal-uyelik] ${etiket} e-postası gönderilemedi:`, yanit.status);
      }
    } catch (err) {
      console.error(`[kurumsal-uyelik] ${etiket} e-postası hatası:`, err);
    }
  };

  const hitap = params.adSoyad.trim() ? `Merhaba ${params.adSoyad.trim()},` : "Merhaba,";
  const istekler: Promise<void>[] = [
    gonder(
      {
        from,
        to: [params.eposta],
        subject: "Cogniti Kurumsal Üyelik Başvurunuz Alındı",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(`${params.firmaAdi} adına yaptığınız kurumsal üyelik başvurunuz alınmıştır.`)}</p>` +
          `<p style="margin: 0 0 16px 0;">Başvurunuz incelenip onaylandığında bilgilendirme bu e-posta adresine iletilecektir.</p>` +
          `<p style="margin: 0 0 16px 0;">Cogniti’ye ilginiz için teşekkür ederiz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${params.firmaAdi} adına yaptığınız kurumsal üyelik başvurunuz alınmıştır.\n\n` +
          `Başvurunuz incelenip onaylandığında bilgilendirme bu e-posta adresine iletilecektir.\n\n` +
          `Cogniti’ye ilginiz için teşekkür ederiz.\n\n` +
          `Cogniti · bilgi taşır`,
      },
      "basvuran-teyit"
    ),
  ];

  const adminEposta = process.env.COGNITI_ADMIN_EMAIL?.trim();
  if (adminEposta) {
    istekler.push(
      gonder(
        {
          from,
          to: [adminEposta],
          reply_to: params.eposta,
          subject: `Kurumsal Üyelik Başvurusu İncelemesi — ${params.firmaAdi}`,
          html:
            `<p style="margin: 0 0 16px 0;">Yeni bir kurumsal üyelik başvurusu incelemeye gönderildi:</p>` +
            `<ul style="margin: 0; padding-left: 20px;">` +
            `<li style="margin: 0 0 6px 0;"><strong>Firma:</strong> ${kacir(params.firmaAdi)}</li>` +
            `<li style="margin: 0 0 6px 0;"><strong>Yetkili:</strong> ${kacir(params.adSoyad)}</li>` +
            `<li style="margin: 0 0 6px 0;"><strong>E-posta:</strong> ${kacir(params.eposta)}</li>` +
            `<li style="margin: 0 0 6px 0;"><strong>Telefon:</strong> ${kacir(params.telefon)}</li>` +
            `<li style="margin: 0 0 6px 0;"><strong>Kullanıcı listesi:</strong> ${params.kullaniciSayisi} kişi</li>` +
            `<li style="margin: 0;"><strong>Ürün listesi:</strong> ${params.urunSayisi} ürün</li>` +
            `</ul>`,
          text:
            `Yeni bir kurumsal üyelik başvurusu incelemeye gönderildi:\n\n` +
            `- Firma: ${params.firmaAdi}\n` +
            `- Yetkili: ${params.adSoyad}\n` +
            `- E-posta: ${params.eposta}\n` +
            `- Telefon: ${params.telefon}\n` +
            `- Kullanıcı listesi: ${params.kullaniciSayisi} kişi\n` +
            `- Ürün listesi: ${params.urunSayisi} ürün`,
        },
        "admin-inceleme"
      )
    );
  } else {
    console.error("[kurumsal-uyelik] COGNITI_ADMIN_EMAIL tanımlı değil; yönetici bildirimi gönderilmedi.");
  }

  await Promise.allSettled(istekler);
}

export async function kurumsalBasvuruOnayEpostasiGonder(params: {
  eposta: string;
  adSoyad: string;
  firmaAdi: string;
  girisLinki: string;
}): Promise<{ ok: boolean; hata?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false, hata: "E-posta ayarları eksik." };
  }
  const hitap = params.adSoyad.trim() ? `Sayın ${params.adSoyad.trim()},` : "Sayın Yetkili,";

  try {
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [params.eposta],
        subject: "Cogniti Kurumsal Üyeliğiniz Onaylandı",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">${kacir(`${params.firmaAdi} adına yaptığınız kurumsal üyelik başvurunuz onaylanmıştır.`)}</p>` +
          `<p style="margin: 0 0 16px 0;">Kurumsal e-posta adresiniz ve belirlediğiniz şifrenizle Cogniti’ye giriş yapabilirsiniz: <a href="${kacir(params.girisLinki)}">Giriş sayfası</a></p>` +
          `<p style="margin: 0 0 16px 0;">Cogniti’ye hoş geldiniz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `${params.firmaAdi} adına yaptığınız kurumsal üyelik başvurunuz onaylanmıştır.\n\n` +
          `Kurumsal e-posta adresiniz ve belirlediğiniz şifrenizle Cogniti’ye giriş yapabilirsiniz:\n${params.girisLinki}\n\n` +
          `Cogniti’ye hoş geldiniz.\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });
    if (!yanit.ok) {
      return { ok: false, hata: `Resend HTTP ${yanit.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, hata: err instanceof Error ? err.message : "E-posta gönderilemedi." };
  }
}

export async function kurumsalBasvuruRedEpostasiGonder(params: {
  eposta: string;
  adSoyad: string;
  aciklama: string;
}): Promise<{ ok: boolean; hata?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COGNITI_UYELIK_EMAIL_FROM || process.env.ECLUB_DAVET_EMAIL_FROM;
  if (!apiKey || !from) {
    return { ok: false, hata: "E-posta ayarları eksik." };
  }
  const hitap = params.adSoyad.trim() ? `Sayın ${params.adSoyad.trim()},` : "Sayın Yetkili,";
  const aciklama = params.aciklama.trim();
  const htmlAciklama = kacir(aciklama).replaceAll("\n", "<br />");

  try {
    const yanit = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [params.eposta],
        subject: "Cogniti Kurumsal Üyelik Başvurunuz Hakkında",
        html:
          `<p style="margin: 0 0 16px 0;">${kacir(hitap)}</p>` +
          `<p style="margin: 0 0 16px 0;">Kurumsal üyelik başvurunuzun tamamlanabilmesi için aşağıdaki eksik veya hatalı bilgilerin eklenmesi/düzeltilerek Cogniti platformu üzerinden yeniden yüklenmesi gerekmektedir:</p>` +
          `<p style="margin: 0 0 16px 0;"><strong>${htmlAciklama}</strong></p>` +
          `<p style="margin: 0 0 16px 0;">İlginize teşekkür ederiz.</p>` +
          `<p style="margin: 0;">Cogniti · bilgi taşır</p>`,
        text:
          `${hitap}\n\n` +
          `Kurumsal üyelik başvurunuzun tamamlanabilmesi için aşağıdaki eksik veya hatalı bilgilerin eklenmesi/düzeltilerek Cogniti platformu üzerinden yeniden yüklenmesi gerekmektedir:\n\n` +
          `${aciklama}\n\n` +
          `İlginize teşekkür ederiz.\n\n` +
          `Cogniti · bilgi taşır`,
      }),
    });
    if (!yanit.ok) {
      return { ok: false, hata: `Resend HTTP ${yanit.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, hata: err instanceof Error ? err.message : "E-posta gönderilemedi." };
  }
}
