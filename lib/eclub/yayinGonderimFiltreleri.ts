import { eclubKisiHedefRolu } from "@/lib/utils/roller";
import type { OneriKisi, OneriYayin } from "@/app/(panel)/eclub/oneriler/_types";

export type GonderimFiltresi = "tumu" | "gonderilebilir" | "planlanan" | "gonderilen";

export function yayinAlicisiUygun(kisi: OneriKisi, yayin: OneriYayin): boolean {
  const hedef = eclubKisiHedefRolu(kisi.rol);
  return kisi.aktif_mi && !!kisi.auth_user_id && !!hedef && yayin.hedef_roller.includes(hedef);
}

export function yayinGonderimListeleri(yayinlar: readonly OneriYayin[], kisiler: readonly OneriKisi[],
  gonderilenKisiler: Readonly<Record<string, readonly string[]>>,
  planlananYayinIdleri: readonly string[] = []) {
  void kisiler; // Hazır statüsü incelemenin tamamlanmasıdır; alıcı/kota ayrıca kontrol edilir.
  const gonderilebilir = yayinlar.filter((yayin) => yayin.gonderim_incelemesi_tamamlandi);
  const planlananlar = new Set(planlananYayinIdleri);

  return {
    tumu: [...yayinlar],
    gonderilebilir,
    planlanan: yayinlar.filter((yayin) => planlananlar.has(yayin.yayin_id)),
    gonderilen: yayinlar.filter((yayin) => (gonderilenKisiler[yayin.yayin_id]?.length ?? 0) > 0),
  };
}
