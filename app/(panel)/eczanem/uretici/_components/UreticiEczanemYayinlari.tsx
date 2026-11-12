import { panelBaslangici } from "@/lib/panel/baslangic";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { ureticiUrunListeKapsami } from "@/lib/uretici/urunKapsami";
import { URETICI_ROLLER } from "@/lib/utils/roller";
import { redirect } from "next/navigation";
import BmEczanemYayinlari from "../../bm/_components/BmEczanemYayinlari";

export default async function UreticiEczanemYayinlari({ gorunum }: { gorunum: "eczane" | "uye" }) {
  const supabase = await createClient();
  const { data: { user }, error: oturumHatasi } = await supabase.auth.getUser();
  if (oturumHatasi || !user) redirect("/login");

  const db = createAdminClient();
  const { data: profil, error: profilHatasi } = await db.from("kullanicilar")
    .select("rol, firma_id, takim_id, aktif_mi").eq("kullanici_id", user.id).maybeSingle();
  if (profilHatasi) throw profilHatasi;
  const rol = profil?.rol?.toLowerCase() ?? "";
  if (!profil?.aktif_mi || !URETICI_ROLLER.includes(rol)) redirect(panelBaslangici(rol).yol);

  const kapsam = profil.firma_id && ureticiUrunListeKapsami({ ...profil, rol }, profil.firma_id, null);
  if (!kapsam) return <BmEczanemYayinlari gorunum={gorunum} yonetici="uretici" />;

  const sorgu = db.from("urunler").select("urun_id, urun_adi").eq("firma_id", kapsam.firma_id);
  const { data, error } = await (kapsam.takim_id
    ? sorgu.eq("takim_id", kapsam.takim_id)
    : sorgu.not("takim_id", "is", null));
  if (error) throw error;
  const urunler = (data ?? []).sort((a, b) => a.urun_adi.localeCompare(b.urun_adi, "tr"));

  return <BmEczanemYayinlari gorunum={gorunum} yonetici="uretici" urunler={urunler} />;
}
