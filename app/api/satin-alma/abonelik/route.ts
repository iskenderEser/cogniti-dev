import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";

const pozitifTamSayi = (deger: unknown, enCok: number) =>
  typeof deger === "number" && Number.isSafeInteger(deger) && deger > 0 && deger <= enCok;

export async function POST(request: Request) {
  const body = await partnerJsonOku(request);
  if (!body.ok) return body.yanit;
  const { hesapTuru, paketNo, aylikToken, aylikKurus, islemAnahtari, baslangic } = body.veri;
  if (Object.keys(body.veri).length !== 6 || (hesapTuru !== "kisisel" && hesapTuru !== "firma_ortak")
    || typeof baslangic !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(baslangic)
    || !pozitifTamSayi(paketNo, 2147483647) || !pozitifTamSayi(aylikToken, 1_000_000_000)
    || !pozitifTamSayi(aylikKurus, Number.MAX_SAFE_INTEGER) || !uuidGecerliMi(islemAnahtari)) {
    return partnerYanit({ hata: "Abonelik siparişi bilgileri geçersiz." }, 400);
  }

  const belirsizSonuc = () => partnerYanit({ hata: "Sipariş sonucu doğrulanamadı. Aynı seçimle yeniden deneyin." }, 503);
  try {
    const oturum = await createClient();
    const { data: { user }, error: oturumHatasi } = await oturum.auth.getUser();
    if (oturumHatasi || !user) return partnerYanit({ hata: "Oturum açmanız gerekiyor." }, 401);

    const { data, error } = await createAdminClient(AbortSignal.timeout(10000)).rpc("cogniti_abonelik_siparisi_kaydet", {
      p_auth_id: user.id,
      p_hesap_turu: hesapTuru,
      p_paket_no: paketNo,
      p_aylik_token: aylikToken,
      p_aylik_kurus: aylikKurus,
      p_anahtar: islemAnahtari,
      p_baslangic: baslangic,
    });
    if (error?.code === "42501") return partnerYanit({ hata: "Bu hesap için sipariş yetkiniz yok." }, 403);
    if (error && ["22023", "22007", "22008"].includes(error.code)) return partnerYanit({ hata: "Abonelik siparişi bilgileri doğrulanamadı." }, 400);
    if (error?.code === "P0001") return partnerYanit({ hata: "Paket artık satışta olmayabilir, fiyatı veya ilk dönem tarihi değişmiş olabilir. Sayfayı yenileyin." }, 409);
    if (error || !uuidGecerliMi(data?.siparis_id)) return belirsizSonuc();

    return partnerYanit({ ok: true, siparisId: data.siparis_id });
  } catch {
    return belirsizSonuc();
  }
}
