import { URETICI_ROLLER } from "@/lib/utils/roller";

/** İç panelin giriş, logo ve yetki dönüş hedefi. Dış kimliklerin kendi rotaları kabuklarında çözülür. */
export function panelBaslangici(rol: string | null | undefined) {
  const uretici = URETICI_ROLLER.includes((rol ?? "").trim().toLowerCase());
  return uretici
    ? { yol: "/yayin-yonetimi", etiket: "Yayın Yönetimi" }
    : { yol: "/ana-sayfa", etiket: "Ana Sayfa" };
}
