import { kkoHesapTuru, type KkoHesapTuru } from "./kkoYetkisi";

export type TokenKullanimTercihi = "kko" | "paket" | null;

/** Tek bir kişisel/firma hesabının sunucuda okunan durumu; istemci beyanı değildir. */
export type KkoPaketGecisDurumu = {
  tercih: TokenKullanimTercihi;
  kullanilabilirPaketTokeni: number;
  acikSiparisSayisi: number;
  blokeliToken: number;
};

function durumGecerli(durum: KkoPaketGecisDurumu | null): durum is KkoPaketGecisDurumu {
  return !!durum && (durum.tercih === null || durum.tercih === "kko" || durum.tercih === "paket")
    && [durum.kullanilabilirPaketTokeni, durum.acikSiparisSayisi, durum.blokeliToken]
      .every(n => Number.isSafeInteger(n) && n >= 0);
}

/**
 * Kayıt adımı ilgili hesabı kilitledikten sonra çağırır. Bu fonksiyon kayıt yazmaz.
 * KKÖ tüketimleri korunur; paket yüklemesinden mahsup edilmez ve fatura oluşturulmaz.
 */
export function kkoPaketGecisiniKontrolEt(
  rol: string | null | undefined,
  beklenenHesap: KkoHesapTuru,
  hedef: "kko" | "paket",
  durum: KkoPaketGecisDurumu | null,
) {
  const hesapTuru = kkoHesapTuru(rol);
  if (!hesapTuru || hesapTuru !== beklenenHesap) {
    return { ok: false as const, status: 403, hata: "Bu hesap için işlem yetkiniz bulunmuyor." };
  }
  if ((hedef !== "kko" && hedef !== "paket") || !durumGecerli(durum)) {
    return { ok: false as const, status: 503, hata: "Token hesabının kullanım durumu doğrulanamadı." };
  }
  if (hedef === "kko") {
    if (durum.tercih === "kko") {
      return { ok: false as const, status: 409, hata: "Bu hesapta KKÖ zaten etkin." };
    }
    if (durum.kullanilabilirPaketTokeni > 0 || durum.acikSiparisSayisi > 0 || durum.blokeliToken > 0) {
      return { ok: false as const, status: 409,
        hata: "Kullanılabilir paket tokenı, açık sipariş veya blokeli gönderi varken KKÖ’ye geçilemez." };
    }
  }
  return {
    ok: true as const,
    hesapTuru,
    sonrakiTercih: hedef,
    kkoKapatilacak: hedef === "paket" && durum.tercih === "kko",
    // Önceki tüketim kayıtlarına ve yeni paketin token miktarına dokunulmaz.
    oncekiKkoTuketimiKorunacak: true as const,
    pakettenDusulecekKkoTokeni: 0 as const,
  };
}
