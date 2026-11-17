import {
  partnerKaydiniDogrula,
  partnerOzgecmisDogrula,
  type PartnerKayitGirdisi,
  type PartnerOzgecmisDosyasi,
} from "./partnerKaydi";

const AZAMI_JSON_BAYT = 16384;
const AZAMI_FORM_BAYT = 11 * 1024 * 1024;
const yanit = (veri: { hata: string } | { mesaj: string }, status: number) =>
  Response.json(veri, { status, headers: { "Cache-Control": "no-store" } });

async function sinirliJsonOku(request: Request): Promise<{ ok: true; girdi: unknown } | { ok: false; yanit: Response }> {
  const uzunluk = Number(request.headers.get("content-length") ?? 0);
  if (!Number.isFinite(uzunluk) || uzunluk < 0 || uzunluk > AZAMI_JSON_BAYT) {
    return { ok: false, yanit: yanit({ hata: "Form bilgileri çok uzun." }, 413) };
  }
  let metin = "";
  const okuyucu = request.body?.getReader();
  if (!okuyucu) return { ok: false, yanit: yanit({ hata: "Form bilgileri okunamadı." }, 400) };
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bayt = 0;
    while (true) {
      const parca = await okuyucu.read();
      if (parca.done) break;
      bayt += parca.value.byteLength;
      if (bayt > AZAMI_JSON_BAYT) {
        await okuyucu.cancel();
        return { ok: false, yanit: yanit({ hata: "Form bilgileri çok uzun." }, 413) };
      }
      metin += decoder.decode(parca.value, { stream: true });
    }
    metin += decoder.decode();
  } catch {
    return { ok: false, yanit: yanit({ hata: "Form bilgileri okunamadı." }, 400) };
  } finally {
    okuyucu.releaseLock();
  }
  try {
    return { ok: true, girdi: JSON.parse(metin) };
  } catch {
    return { ok: false, yanit: yanit({ hata: "Form bilgileri okunamadı." }, 400) };
  }
}

/** Bağımlılık yalnız kalıcı kayıt işlemi; Auth hesabı veya e-posta bu adımda açılmaz. */
export function partnerKayitIsleyicisi(
  kaydet: (veri: PartnerKayitGirdisi, ozgecmis?: PartnerOzgecmisDosyasi) => Promise<boolean>,
) {
  return async function POST(request: Request): Promise<Response> {
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return yanit({ hata: "İstek doğrulanamadı. Lütfen sayfayı yenileyin." }, 403);
    }
    const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";

    let girdi: unknown;
    let ozgecmis: PartnerOzgecmisDosyasi | undefined;

    if (contentType === "application/json") {
      const okunan = await sinirliJsonOku(request);
      if (!okunan.ok) return okunan.yanit;
      girdi = okunan.girdi;
    } else if (contentType === "multipart/form-data") {
      const uzunluk = Number(request.headers.get("content-length") ?? 0);
      if (!Number.isFinite(uzunluk) || uzunluk < 0 || uzunluk > AZAMI_FORM_BAYT) {
        return yanit({ hata: "Gönderilen dosya ve bilgiler çok büyük." }, 413);
      }
      let form: FormData;
      try {
        form = await request.formData();
      } catch {
        return yanit({ hata: "Form bilgileri okunamadı." }, 400);
      }
      const hamVeri = form.get("veri");
      if (typeof hamVeri !== "string" || hamVeri.length > AZAMI_JSON_BAYT) {
        return yanit({ hata: "Form bilgileri okunamadı." }, 400);
      }
      try {
        girdi = JSON.parse(hamVeri);
      } catch {
        return yanit({ hata: "Form bilgileri okunamadı." }, 400);
      }
      const dosya = form.get("ozgecmis");
      if (dosya instanceof File && dosya.size > 0) {
        const bytes = new Uint8Array(await dosya.arrayBuffer());
        const cvKontrol = partnerOzgecmisDogrula({ name: dosya.name, type: dosya.type, size: dosya.size }, bytes);
        if (!cvKontrol.ok) return yanit({ hata: cvKontrol.hata }, 400);
        ozgecmis = cvKontrol.dosya;
      }
    } else {
      return yanit({ hata: "Form bilgileri okunamadı." }, 415);
    }

    const kontrol = partnerKaydiniDogrula(girdi);
    if (!kontrol.ok) return yanit({ hata: kontrol.hata }, 400);
    if (kontrol.veri.tur === "kisisel" && !ozgecmis) {
      return yanit({ hata: "Kişisel başvurularda özgeçmiş (PDF veya Word) yüklemeniz zorunludur." }, 400);
    }

    try {
      if (!(await kaydet(kontrol.veri, ozgecmis))) throw new Error("Kayıt tamamlanamadı");
    } catch {
      return yanit({ hata: "Üyelik kaydı şu anda yapılamıyor. Lütfen daha sonra tekrar deneyin." }, 503);
    }
    return yanit({ mesaj: "Üyelik bilgileriniz alındı." }, 202);
  };
}
