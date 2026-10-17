"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MISAFIR_TEMA_ANAHTARI, VARSAYILAN_TEMA, temaGecerliMi, type Tema } from "@/lib/tema/temalar";
import { useAuth } from "@/app/providers/AuthProvider";

type TemaBaglami = { tema: Tema; temaDegistir: (tema: Tema) => void };
const TemaContext = createContext<TemaBaglami | null>(null);

function misafirTemasiniOku(): Tema {
  try {
    const tema = window.localStorage.getItem(MISAFIR_TEMA_ANAHTARI);
    return temaGecerliMi(tema) ? tema : VARSAYILAN_TEMA;
  } catch {
    return VARSAYILAN_TEMA;
  }
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const { kullanici, yukleniyor } = useAuth();
  const kullaniciId = kullanici?.id ?? null;
  const [tema, setTema] = useState<Tema>(VARSAYILAN_TEMA);
  const kimlikRef = useRef<string | null | undefined>(undefined);
  const degisimRef = useRef(0);
  const kayitSirasi = useRef<Promise<void>>(Promise.resolve());

  const uygula = useCallback((yeniTema: Tema) => {
    document.documentElement.setAttribute("data-tema", yeniTema);
    setTema(yeniTema);
    try {
      // Login ekranı bu tarayıcıda en son kullanılan görünümü korur.
      window.localStorage.setItem(MISAFIR_TEMA_ANAHTARI, yeniTema);
      return true;
    } catch {
      return false;
    }
  }, []);

  const kaydet = useCallback((id: string, yeniTema: Tema, surum: number) => {
    // Hızlı tıklamalarda son seçim en son kaydedilir; eski hesaba ait
    // bekleyen işler hesap değişiminden sonra gönderilmez.
    kayitSirasi.current = kayitSirasi.current.then(async () => {
      if (kimlikRef.current !== id || degisimRef.current !== surum) return;
      const response = await fetch("/tema/api", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kullanici_id: id, tema: yeniTema }),
      });
      const sonuc = await response.json();
      if (!response.ok || sonuc.kullanici_id !== id || sonuc.tema !== yeniTema) throw new Error("Tema kaydedilemedi.");
    }).catch(() => {
      if (kimlikRef.current === id && degisimRef.current === surum) {
        window.alert("Tema tercihiniz kaydedilemedi. Lütfen tekrar seçin.");
      }
    });
  }, []);

  useEffect(() => {
    const misafirTemasi = misafirTemasiniOku();
    uygula(misafirTemasi);
    if (yukleniyor) return;
    kimlikRef.current = kullaniciId;
    let aktif = true;
    const surum = degisimRef.current;

    if (kullaniciId) {
      void (async () => {
        try {
          const response = await fetch("/tema/api", { cache: "no-store" });
          const sonuc = await response.json();
          if (!aktif || degisimRef.current !== surum) return;
          if (!response.ok || sonuc.kullanici_id !== kullaniciId || (sonuc.tema !== null && !temaGecerliMi(sonuc.tema))) {
            throw new Error("Tema okunamadı.");
          }
          uygula(sonuc.tema ?? misafirTemasi);
          if (sonuc.tema === null) kaydet(kullaniciId, misafirTemasi, surum);
        } catch {
          if (aktif && degisimRef.current === surum) window.alert("Tema tercihiniz yüklenemedi. Lütfen tekrar seçin.");
        }
      })();
    }

    return () => {
      aktif = false;
      kimlikRef.current = undefined;
    };
  }, [kullaniciId, yukleniyor, uygula, kaydet]);

  const temaDegistir = useCallback((yeniTema: Tema) => {
    const tarayiciyaKaydedildi = uygula(yeniTema);
    const surum = ++degisimRef.current;
    if (kullaniciId) {
      kaydet(kullaniciId, yeniTema, surum);
    } else if (!tarayiciyaKaydedildi) {
      window.alert("Tema tercihiniz bu tarayıcıda kaydedilemedi.");
    }
  }, [kullaniciId, uygula, kaydet]);

  return <TemaContext.Provider value={{ tema, temaDegistir }}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const baglam = useContext(TemaContext);
  if (!baglam) throw new Error("TemaProvider bulunamadı.");
  return baglam;
}
