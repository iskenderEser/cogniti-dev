"use client";

/** Sayfa bazlı, kullanıcı ve kapsam anahtarıyla ayrılan salt okunur oturum önbelleği. */
export function sayfaOkumaOnbellegiOlustur<T>(alan: string, sureMs = 60_000) {
  const bellek = new Map<string, { veri: T; zaman: number }>();
  const istekler = new Map<string, Promise<T>>();
  const prefix = `hb_sayfa_${alan}_v1_`;

  function sil(anahtar: string, bekleyeniGecersizKil = true) {
    bellek.delete(anahtar);
    if (bekleyeniGecersizKil) istekler.delete(anahtar);
    try { sessionStorage.removeItem(prefix + anahtar); } catch { /* Depolama zorunlu değildir. */ }
  }

  function oku(anahtar: string, azamiYas = sureMs): T | null {
    try {
      const kayit = bellek.get(anahtar) ?? JSON.parse(sessionStorage.getItem(prefix + anahtar) ?? "null");
      const yas = Date.now() - kayit?.zaman;
      if (kayit && "veri" in kayit && typeof kayit.zaman === "number" && yas >= 0 && yas < azamiYas) {
        bellek.set(anahtar, kayit);
        return kayit.veri;
      }
    } catch { /* Bozuk kayıt yeniden okumayı engellemez. */ }
    sil(anahtar, false);
    return null;
  }

  function iste(anahtar: string, yukle: () => Promise<T>, zorla = false): Promise<T> {
    const mevcut = istekler.get(anahtar);
    if (mevcut && !zorla) return mevcut;
    const istek = Promise.resolve().then(yukle).then((veri) => {
      if (istekler.get(anahtar) !== istek) return veri;
      const kayit = { veri, zaman: Date.now() };
      bellek.set(anahtar, kayit);
      try { sessionStorage.setItem(prefix + anahtar, JSON.stringify(kayit)); } catch { /* Bellek kullanılabilir. */ }
      return veri;
    }).catch((error) => { if (istekler.get(anahtar) === istek) sil(anahtar); throw error; })
      .finally(() => { if (istekler.get(anahtar) === istek) istekler.delete(anahtar); });
    istekler.set(anahtar, istek);
    return istek;
  }

  return { oku, iste, sil };
}
