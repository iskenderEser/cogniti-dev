import type { SupabaseClient } from "@supabase/supabase-js";
import { ECZANEM_TALEP_ACAN_ROLLER } from "@/lib/utils/roller";
/** Yalnız önceden firma/eczane yetki kontrolünden geçmiş yayın kimlikleriyle çağrılır. */
export async function eczanemGonderimBaslangiclari(db: SupabaseClient, ids: string[]): Promise<Map<string,{ baslangic: string; sureMuaf: boolean }>> {
  const map = new Map<string,{ baslangic: string; sureMuaf: boolean }>();
  const tekil = [...new Set(ids)];
  for (let i = 0; i < tekil.length; i += 200) {
    const { data, error } = await db.from("eczanem_yayin_gonderim_sureleri").select("yayin_id,baslangic_at,uretici_rol").in("yayin_id",tekil.slice(i,i+200)).in("uretici_rol",ECZANEM_TALEP_ACAN_ROLLER);
    if (error) throw new Error("Eczanem gönderim süreleri alınamadı. 30 günlük süre SQL kurulumunu kontrol edin.");
    const {data: eski, error: eskiHata} = await db.from("eczanem_medikal_eski_yayinlar").select("yayin_id").in("yayin_id",tekil.slice(i,i+200));
    if(eskiHata) throw new Error("Eczanem Medikal geçiş SQL kurulumunu kontrol edin.");
    const eskiIdler=new Set((eski ?? []).map(row=>row.yayin_id));
    for (const row of data ?? []) {
      if (row.yayin_id && typeof row.baslangic_at === "string" && Number.isFinite(Date.parse(row.baslangic_at))) map.set(row.yayin_id,{baslangic:row.baslangic_at,sureMuaf:row.uretici_rol === "med_md" && eskiIdler.has(row.yayin_id)});
    }
  }
  return map;
}
