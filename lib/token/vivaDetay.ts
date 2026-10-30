import type { TokenDetayHamSatir, TokenKullanimSatiri } from "./detay";

export function vivaDetayRpc(kullanici: string, sayfa: number, alici: string | null, gorunum: string, tm: string | null, bm: string | null, utt: string | null) {
  return { p_kullanici: kullanici, p_sayfa: sayfa, p_alici: alici, p_gorunum: gorunum, p_tm: tm, p_bm: bm, p_utt: utt };
}

export function vivaDetaySunumu(satir: TokenDetayHamSatir): TokenKullanimSatiri {
  const roller: Record<string, string> = { eczaci: "Eczacı", eczane_teknisyeni: "Eczane Teknisyeni", eclub: "Eczacı ve Ecz. Teknisyeni", viva_katilim: "Viva katılımı" };
  const davetliler: Record<string, string> = { ic: "Firma üyesi", eclub: "Eclub üyesi", ozel: "Özel davetli" };
  return {
    id: satir.id,
    gonderimTarihi: new Date(`${satir.tarih}T12:00:00+03:00`).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }),
    yayinKodu: "—", yayinId: null, yayinAdi: satir.yayin_adi || "—", urun: satir.urun || "—", yayinAraci: "Viva",
    gonderilenRol: roller[satir.rol] ?? "Viva katılımı", gonderilenSayi: satir.katilim_sayisi ?? null,
    toplamToken: satir.token,
    davetliler: (satir.davetli_turleri ?? []).map(tur => davetliler[tur]).filter(Boolean).join(" / ") || "—",
    davetliSayisi: satir.davetli_sayisi ?? null, katilimSayisi: satir.katilim_sayisi ?? null,
  };
}
