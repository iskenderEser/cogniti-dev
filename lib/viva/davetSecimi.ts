import { ROL_ADLARI, TUKETICI_ROLLER } from "@/lib/utils/roller";
import type { VivaKisi } from "./sozlesme";

const KISALTMALAR: Record<string, string> = {
  pm: "PM", jr_pm: "Jr.PM", kd_pm: "Kd.PM", tm: "TM", bm: "BM", utt: "UTT", kd_utt: "Kd.UTT",
  gm: "GM", gm_yrd: "GMY", drk: "DRK", paz_md: "Paz.Md.", blm_md: "Blm.Md.", med_md: "Med.Md.",
  grp_pm: "Grp.PM", sm: "SM", iu: "İÜ", admin: "Admin", egt_md: "Eğt.Md.", egt_yrd_md: "Eğt.Md.Yrd.",
  egt_yon: "Eğt.Yön.", egt_uz: "Eğt.Uzm.", ik_drk: "İK.Drk.", ik_md: "İK.Md.",
  ik_yrd_md: "İK.Md.Yrd.", ik_uz: "İK.Uzm.", ik_per: "İK.Per.", eczaci: "Ecz.",
  ikinci_eczaci: "2.Ecz.", yardimci_eczaci: "Yrd.Ecz.", eczane_teknisyeni: "Ecz.Tek.",
};
export function vivaKisiSecimEtiketi(kisi: VivaKisi): string {
  const rol = typeof kisi.alt === "string" ? kisi.alt.trim() : "";
  const unvan = KISALTMALAR[rol] ?? ROL_ADLARI[rol] ?? rol;
  return unvan ? `${unvan} · ${kisi.ad}` : kisi.ad;
}
/** Bölge toplu seçimi yalnız UTT/KD_UTT'leri kapsar; diğer firma rolleri tekil listede kalır. */
export function vivaFirmaBolgeGruplari(kisiler: readonly VivaKisi[]) {
  const gruplar = new Map<string, { id: string; etiket: string; degerler: string[] }>();
  for (const k of kisiler) {
    if (k.tur !== "ic" || !TUKETICI_ROLLER.includes(k.alt) || !k.bolge_id || !k.bolge_adi) continue;
    const grup = gruplar.get(k.bolge_id) ?? { id: k.bolge_id, etiket: k.bolge_adi, degerler: [] };
    grup.degerler.push(`ic:${k.id}`); gruplar.set(k.bolge_id, grup);
  }
  return [...gruplar.values()].sort((a, b) => a.etiket.localeCompare(b.etiket, "tr"));
}
