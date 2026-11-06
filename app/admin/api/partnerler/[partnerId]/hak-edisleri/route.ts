import { adminGirisKontrol } from "@/lib/utils/adminGirisKontrol";
import { createAdminClient } from "@/lib/supabase/server";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { odemeGunuGecerli, hakedisOkumaHatasi, hakedisSayfasi, partnerHakEdisListesiGecerli } from "@/lib/agora/hakedis";

type Context = { params: Promise<{ partnerId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const auth = await adminGirisKontrol();
    if (!auth.gecerli) return auth.yanit;
    const { partnerId } = await context.params;
    if (!uuidGecerliMi(partnerId)) return partnerYanit({ hata: "Geçersiz partner." }, 400);
    const sayfa = hakedisSayfasi(new URL(request.url).searchParams.get("sayfa"));
    if (sayfa === null) return partnerYanit({ hata: "Geçersiz hak ediş sayfası." }, 400);
    const id = partnerId.toLowerCase();
    const { data, error } = await createAdminClient(AbortSignal.timeout(15000)).rpc("agora_partner_admin_hakedisleri_oku", {
      p_admin_id: auth.kullaniciId, p_partner_id: id, p_sayfa: sayfa,
    });
    if (error) {
      const sonuc = hakedisOkumaHatasi(error.code);
      return partnerYanit({ hata: sonuc.mesaj }, sonuc.status);
    }
    if (data === null) return partnerYanit({ hata: "Partner firma bulunamadı." }, 404);
    if (!partnerHakEdisListesiGecerli(data, id, sayfa)) {
      return partnerYanit({ hata: "Hak ediş bilgileri doğrulanamadı." }, 503);
    }
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Hak edişler okunamadı. Yeniden deneyin." }, 503); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const auth = await adminGirisKontrol();
    if (!auth.gecerli) return auth.yanit;
    const { partnerId } = await context.params;
    if (!uuidGecerliMi(partnerId)) return partnerYanit({ hata: "Geçersiz partner." }, 400);
    const body = await partnerJsonOku(request);
    if (!body.ok) return body.yanit;
    const r = body.veri;
    if (!uuidGecerliMi(r.siparis_id) || !odemeGunuGecerli(r.planlanan_odeme_gunu)
      || !odemeGunuGecerli(r.onceki_odeme_gunu)) {
      return partnerYanit({ hata: "Geçersiz sipariş veya ödeme günü." }, 400);
    }
    const { data, error } = await createAdminClient(AbortSignal.timeout(15000)).rpc("agora_partner_admin_odeme_gunu_kaydet", {
      p_admin_id: auth.kullaniciId, p_partner_id: partnerId.toLowerCase(), p_siparis_id: r.siparis_id,
      p_planlanan_odeme_gunu: r.planlanan_odeme_gunu, p_onceki_odeme_gunu: r.onceki_odeme_gunu,
    });
    if (error) {
      const kod = error.code;
      if (kod === "40001") return partnerYanit({ hata: "Ödeme günü başka bir işlemde değişmiş. Listeyi yenileyin." }, 409);
      if (kod === "P0002") return partnerYanit({ hata: "Hak ediş bulunamadı." }, 404);
      if (kod === "42501") return partnerYanit({ hata: "Ödeme gününü değiştirme yetkiniz bulunmuyor." }, 403);
      if (kod === "22023") return partnerYanit({ hata: "Geçersiz ödeme günü." }, 400);
      return partnerYanit({ hata: "Ödeme günü kaydedilemedi. SQL kurulumunu kontrol edip yeniden deneyin." }, 503);
    }
    if (!data || typeof data !== "object" || data.siparis_id !== r.siparis_id
      || data.planlanan_odeme_gunu !== r.planlanan_odeme_gunu) {
      return partnerYanit({ hata: "Kayıt sonucu doğrulanamadı. Listeyi yenileyin." }, 503);
    }
    return partnerYanit(data);
  } catch { return partnerYanit({ hata: "Ödeme günü kaydedilemedi. Yeniden deneyin." }, 503); }
}
