// app/providers/AuthProvider.tsx
//
// Uygulama genelinde auth state'i yöneten provider.
//
// Lock yarışı koruması (single-flight):
// Supabase auth-token Web Lock'ını "steal" opsiyonuyla alıyor. Aynı anda iki
// kullaniciyiYukle() çalışırsa ikincisi birincinin lock'ını çalar, birincisi
// AbortError ile düşer. Single-flight pattern: aynı anda yalnızca bir
// kullaniciyiYukle() çalışır, ikinci çağrı geldiğinde mevcut Promise döner.

"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { AuthKullanici, KimlikTuru } from "@/types/auth";
import { oturumDusurulmeliMi, beniHatirlaTemizle } from "@/lib/utils/beniHatirla";
import { guvenliCikisYap } from "@/lib/auth/guvenliCikis";
import { clearAuthKullaniciCache, getAuthKullaniciCache, setAuthKullaniciCache } from "@/lib/panel/panelCache";

interface AuthContextTipi {
  kullanici: AuthKullanici | null;
  yukleniyor: boolean;
  cikisYap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextTipi>({
  kullanici: null,
  yukleniyor: true,
  cikisYap: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [kullanici, setKullanici] = useState<AuthKullanici | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Single-flight: devam eden bir yükleme varsa Promise'i sakla.
  // İkinci çağrı geldiğinde yeni getUser yapmaz, mevcut Promise'i bekler.
  const yuklemePromiseRef = useRef<Promise<void> | null>(null);

  // SSR çıktısıyla ilk istemci çıktısını aynı tut; son doğrulanmış sekme kimliğini
  // tarayıcının ilk boyamasından hemen önce devreye al.
  useLayoutEffect(() => {
    if (window.location.pathname === "/login") return;
    const kayitliKullanici = getAuthKullaniciCache();
    if (!kayitliKullanici) return;
    setKullanici(kayitliKullanici);
    setYukleniyor(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let kapandi = false, kimlikSurumu = 0;
    let yenilemeTimer: ReturnType<typeof setTimeout> | undefined;

    const kullaniciyiYukle = async (): Promise<void> => {
      // Eğer zaten bir yükleme devam ediyorsa o Promise'i döndür.
      // Yeni bir auth.getUser() çağrısı YAPILMAZ — lock yarışı imkansız.
      if (yuklemePromiseRef.current) {
        return yuklemePromiseRef.current;
      }

      const surum = kimlikSurumu;
      const guncelMi = () => !kapandi && surum === kimlikSurumu;
      const promise = (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!guncelMi()) return;

          if (!user) {
            clearAuthKullaniciCache();
            setKullanici(null);
            setYukleniyor(false);
            return;
          }

          // F-03/B: "Beni hatırla" işaretsiz girilmişti ve tarayıcı kapatılıp
          // açılmış (oturum işaret çerezi ölmüş) — oturum düşürülür.
          if (oturumDusurulmeliMi()) {
            beniHatirlaTemizle();
            await guvenliCikisYap(supabase);
            if (!guncelMi()) return;
            setKullanici(null);
            setYukleniyor(false);
            return;
          }

          const kayitliKullanici = getAuthKullaniciCache();
          if (kayitliKullanici && kayitliKullanici.id !== user.id) {
            clearAuthKullaniciCache();
            setKullanici(null);
            setYukleniyor(true);
          }

          // Birleşik kimlik view'ı: kullanicilar + eclub_kisiler'i auth_id üzerinden
          // birleştirir. Tek sorgu; kimlik_turu ile kim olduğu ayrılır.
          const { data, error } = await supabase
            .from("v_auth_kimlik")
            .select("kimlik_turu, rol, ad, soyad, firma_id, telefon")
            .eq("auth_id", user.id)
            .single();

          if (!guncelMi()) return;
          if (error || !data) {
            clearAuthKullaniciCache();
            setKullanici(null);
            setYukleniyor(false);
            return;
          }

          const dogrulanmisKullanici: AuthKullanici = {
            id: user.id,
            email: user.email ?? "",
            rol: data.rol,
            ad: data.ad,
            soyad: data.soyad,
            adSoyad: [data.ad, data.soyad]
              .filter((parca): parca is string => typeof parca === "string" && parca.trim().length > 0)
              .map((parca) => parca.trim())
              .join(" "),
            firma_id: data.firma_id ?? null,
            kimlik_turu: data.kimlik_turu as KimlikTuru,
            telefon: data.telefon ?? null,
          };
          setAuthKullaniciCache(dogrulanmisKullanici);
          setKullanici(dogrulanmisKullanici);

          setYukleniyor(false);
        } catch (err: unknown) {
          if (!guncelMi()) return;
          // AbortError gibi bir yarış geçişi (savunma katmanı) gelirse sessizce geç,
          // single-flight zaten bunu engelliyor ama yine de güvenlik için.
          if (err instanceof Error && err.name === "AbortError") return;
          console.error("[AuthProvider] kullaniciyiYukle hatası:", err);
          clearAuthKullaniciCache();
          setKullanici(null);
          setYukleniyor(false);
        }
      })();

      yuklemePromiseRef.current = promise;
      try {
        await promise;
      } finally {
        yuklemePromiseRef.current = null;
      }
    };

    // Önceki anonim okuma giriş olayıyla çakışırsa onun sonucuyla yetinme;
    // bitmesini bekleyip yeni oturumu ayrıca doğrula. StrictMode kurulumu da bunu kullanır.
    const tazele = async () => {
      const surum = kimlikSurumu;
      const onceki = yuklemePromiseRef.current;
      if (onceki) await onceki;
      if (!kapandi && surum === kimlikSurumu) await kullaniciyiYukle();
    };
    void tazele();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        kimlikSurumu++; clearTimeout(yenilemeTimer);
        clearAuthKullaniciCache();
        setKullanici(null); setYukleniyor(false);
        // Tüm kimlikler (müşteri dahil) /login üzerinden giriş yapar.
        router.push("/login");
      } else if (event === "SIGNED_IN") {
        kimlikSurumu++; clearTimeout(yenilemeTimer);
        // Supabase bildiriminin kilidi ve giriş çerezinin yazımı tamamlandıktan sonra oku.
        // Callback Promise döndürmez ve kendi içinde başka auth isteği başlatmaz.
        yenilemeTimer = setTimeout(() => { void tazele(); }, 0);
      }
    });

    return () => { kapandi = true; clearTimeout(yenilemeTimer); subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cikisYap = useCallback(async () => {
    const supabase = createClient();
    beniHatirlaTemizle();
    await guvenliCikisYap(supabase);
    setKullanici(null);
    setYukleniyor(false);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ kullanici, yukleniyor, cikisYap }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
