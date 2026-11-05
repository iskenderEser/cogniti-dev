import { partnerKaydiniDogrula, type PartnerKayitGirdisi } from "./partnerKaydi";

const AZAMI_BAYT = 4096;
const yanit = (veri: { hata: string } | { mesaj: string }, status: number) =>
  Response.json(veri, { status, headers: { "Cache-Control": "no-store" } });

/** Bağımlılık yalnız kalıcı kayıt işlemi; Auth hesabı veya e-posta bu adımda açılmaz. */
export function partnerKayitIsleyicisi(kaydet: (veri: PartnerKayitGirdisi) => Promise<boolean>) {
  return async function POST(request: Request): Promise<Response> {
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return yanit({ hata: "İstek doğrulanamadı. Lütfen sayfayı yenileyin." }, 403);
    }
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return yanit({ hata: "Form bilgileri okunamadı." }, 415);
    }
    const uzunluk = Number(request.headers.get("content-length") ?? 0);
    if (!Number.isFinite(uzunluk) || uzunluk < 0 || uzunluk > AZAMI_BAYT) {
      return yanit({ hata: "Form bilgileri çok uzun." }, 413);
    }
    // Content-Length olmadan/parçalı gelen istekler de aynı üst sınıra tabidir.
    let metin = "";
    const okuyucu = request.body?.getReader();
    if (!okuyucu) return yanit({ hata: "Form bilgileri okunamadı." }, 400);
    try {
      const decoder = new TextDecoder("utf-8", { fatal: true });
      let bayt = 0;
      while (true) {
        const parca = await okuyucu.read();
        if (parca.done) break;
        bayt += parca.value.byteLength;
        if (bayt > AZAMI_BAYT) {
          await okuyucu.cancel();
          return yanit({ hata: "Form bilgileri çok uzun." }, 413);
        }
        metin += decoder.decode(parca.value, { stream: true });
      }
      metin += decoder.decode();
    } catch {
      return yanit({ hata: "Form bilgileri okunamadı." }, 400);
    } finally {
      okuyucu.releaseLock();
    }
    let girdi: unknown;
    try { girdi = JSON.parse(metin); } catch { return yanit({ hata: "Form bilgileri okunamadı." }, 400); }
    const kontrol = partnerKaydiniDogrula(girdi);
    if (!kontrol.ok) return yanit({ hata: kontrol.hata }, 400);
    try {
      if (!await kaydet(kontrol.veri)) throw new Error("Kayıt tamamlanamadı");
    } catch {
      return yanit({ hata: "Üyelik kaydı şu anda yapılamıyor. Lütfen daha sonra tekrar deneyin." }, 503);
    }
    // Mevcut e-posta/telefon bilgisi dışarıya açıklanmaz; tekrar istek kayıt değiştirmez.
    return yanit({ mesaj: "Üyelik bilgileriniz alındı." }, 202);
  };
}
