import { TUM_ROLLER, TUKETICI_ROLLER } from "@/lib/utils/roller";

export function fiyatlariGorebilir(rol: string | null | undefined): boolean {
  const deger = (rol ?? "").trim().toLowerCase();
  return TUM_ROLLER.includes(deger) && !TUKETICI_ROLLER.includes(deger) && deger !== "bm" && deger !== "iu";
}
