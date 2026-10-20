import { createClient, createAdminClient } from "@/lib/supabase/server";
import { TEMA_TERCIHI_ANAHTARI, TEMA_TERCIHI_SURUM_ANAHTARI, TEMA_TERCIHI_SURUMU, temaGecerliMi } from "@/lib/tema/temalar";

function yanit(veri: unknown, status = 200) {
  return Response.json(veri, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yanit({ hata: "Oturum açmanız gerekiyor." }, 401);

    const tema = user.user_metadata[TEMA_TERCIHI_ANAHTARI];
    // Eski kayıtlar kullanıcı seçimi ile tarayıcıdan otomatik aktarımı ayırmıyor.
    // Tamamı geçersizdir; varsayılan mavi, yalnız yeni açık seçimle değişir.
    const guncelSecim = user.user_metadata[TEMA_TERCIHI_SURUM_ANAHTARI] === TEMA_TERCIHI_SURUMU;
    return yanit({ kullanici_id: user.id, tema: guncelSecim && temaGecerliMi(tema) ? tema : null });
  } catch {
    return yanit({ hata: "Tema tercihi okunamadı." }, 500);
  }
}

export async function PUT(request: Request) {
  let veri;
  try {
    veri = await request.json();
  } catch {
    return yanit({ hata: "Geçersiz tercih isteği." }, 400);
  }
  if (!veri || typeof veri.kullanici_id !== "string" || !temaGecerliMi(veri.tema)) {
    return yanit({ hata: "Geçersiz tema tercihi." }, 400);
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return yanit({ hata: "Oturum açmanız gerekiyor." }, 401);
    if (user.id !== veri.kullanici_id) return yanit({ hata: "Hesap değişti; tercih kaydedilmedi." }, 409);

    // Yalnız doğrulanmış hesabın açık seçimi ve sürümü yazılır. Tarayıcıda
    // hesap değişse de eski isteğin yanıtı yeni hesabın oturum çerezini yazmaz.
    const admin = createAdminClient();
    const { data, error: kayitHatasi } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { [TEMA_TERCIHI_ANAHTARI]: veri.tema, [TEMA_TERCIHI_SURUM_ANAHTARI]: TEMA_TERCIHI_SURUMU },
    });
    if (kayitHatasi || data.user?.id !== user.id || data.user.user_metadata[TEMA_TERCIHI_ANAHTARI] !== veri.tema
      || data.user.user_metadata[TEMA_TERCIHI_SURUM_ANAHTARI] !== TEMA_TERCIHI_SURUMU) {
      return yanit({ hata: "Tema tercihi kaydedilemedi." }, 500);
    }
    return yanit({ kullanici_id: user.id, tema: veri.tema });
  } catch {
    return yanit({ hata: "Tema tercihi kaydedilemedi." }, 500);
  }
}
