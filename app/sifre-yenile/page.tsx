// app/sifre-yenile/page.tsx
//
// Şifre yenileme sayfası (F-03/A). "Şifremi unuttum" e-postasındaki bağlantı
// buraya düşer: bağlantıdaki kod, tarayıcı istemcisi tarafından otomatik olarak
// kurtarma (recovery) oturumuna çevrilir; kullanıcı yeni şifresini belirler.
// Şifre politikası admin tekli/toplu ile aynıdır (B-36: min 6, Türkçe mesaj).
// Kayıt sonrası oturum kapatılır — kullanıcı yeni şifresiyle login'den girer.

"use client";

import CognitiLogo from "@/components/marka/CognitiLogo";
import { SifreBelirlemeFormu } from "@/components/auth/SifreBelirlemeFormu";
import { createClient } from "@/lib/supabase/client";
import { guvenliCikisYap } from "@/lib/auth/guvenliCikis";
import { useEffect, useState } from "react";

export default function SifreYenilePage() {
  const [tamamlandi, setTamamlandi] = useState(false);
  // null: oturum çözülüyor; false: bağlantı geçersiz/süresi dolmuş; true: hazır.
  const [oturumHazir, setOturumHazir] = useState<boolean | null>(null);
  const [eposta, setEposta] = useState("");
  const [yenidenGonderiliyor, setYenidenGonderiliyor] = useState(false);
  const [yenidenMesaj, setYenidenMesaj] = useState("");

  useEffect(() => {
    try {
      const kayitli = sessionStorage.getItem("cogniti_sifirlama_eposta");
      if (kayitli) setEposta(kayitli);
    } catch {}
    const supabase = createClient();
    // Bağlantıdaki kodun oturuma çevrilmesi anlık olmayabilir — kısa tolerans:
    // önce mevcut oturuma bak, yoksa auth olayını bekle, 5 sn'de pes et.
    let bitti = false;
    const isaretle = (deger: boolean, kullaniciEposta?: string | null) => {
      if (kullaniciEposta) setEposta(kullaniciEposta);
      if (bitti) return;
      bitti = true;
      setOturumHazir(deger);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) isaretle(true, session.user?.email);
      if (event === "SIGNED_OUT") return; // kayıt sonrası bilinçli çıkış
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) isaretle(true, session.user?.email);
    });

    const zamanlayici = setTimeout(() => isaretle(false), 5000);
    return () => {
      clearTimeout(zamanlayici);
      subscription.unsubscribe();
    };
  }, []);

  const handleKaydet = async (sifre: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: sifre });
    if (error) {
      if (error.code === "same_password" || /same_password|different from the old password/i.test(error.message)) {
        throw new Error("Yeni şifreniz mevcut şifrenizden farklı olmalıdır.");
      }
      setOturumHazir(false);
      return;
    }
    setTamamlandi(true);
    await guvenliCikisYap(supabase);
    window.location.replace("/login");
  };

  const handleYeniBaglantiIste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eposta.trim() || yenidenGonderiliyor) return;
    setYenidenGonderiliyor(true);
    setYenidenMesaj("");
    const res = await fetch("/api/auth/sifre-sifirla", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eposta: eposta.trim() }),
    }).catch(() => null);
    setYenidenGonderiliyor(false);
    if (!res?.ok) {
      setYenidenMesaj("Bağlantı gönderilemedi. Lütfen biraz sonra tekrar deneyin.");
      return;
    }
    setYenidenMesaj(
      "E-posta adresiniz sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderilecektir. Lütfen gelen ve spam (istenmeyen) kutunuzu kontrol ediniz."
    );
  };

  return (
    <div
      className="min-h-screen bg-[var(--tema-yerel-giris-kart-01)] flex flex-col items-center justify-center px-6 py-10"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="w-full max-w-sm">
        <CognitiLogo className="object-contain mx-auto mb-8" style={{ width: 144, height: 144 }} />

        {oturumHazir === null && (
          <p className="text-sm text-[var(--tema-yerel-giris-yardimci-metin-01)] text-center">Bağlantı doğrulanıyor...</p>
        )}

        {oturumHazir === false && (
          <form onSubmit={handleYeniBaglantiIste} className="flex flex-col gap-4">
            <p className="text-sm text-[var(--tema-yerel-giris-ana-metin-04)] leading-relaxed m-0">
              Şifre yenileme süreniz geçmiştir. Lütfen yeniden butona tıklayarak, yeni bağlantı isteyin ve e-postanızı kontrol edin.
            </p>
            <label className="block text-xs font-semibold text-[var(--tema-yerel-giris-yardimci-metin-01)]">
              E-posta
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="ornek@sirket.com"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                disabled={yenidenGonderiliyor}
                className="mt-1.5 w-full rounded-xl border border-[var(--tema-yerel-giris-cizgi-03)] bg-[var(--tema-yerel-giris-kart-01)] px-3.5 py-2.5 text-sm text-[var(--tema-yerel-giris-ana-metin-03)] outline-none focus:border-[var(--tema-kontrol-odak)]"
              />
            </label>
            {yenidenMesaj && (
              <p role="status" className="m-0 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-3.5 py-2.5 text-xs font-light leading-relaxed text-[var(--tema-hata)]">
                {yenidenMesaj}
              </p>
            )}
            <button
              type="submit"
              disabled={yenidenGonderiliyor}
              className="w-full rounded-xl bg-[var(--tema-kontrol-eylem)] py-3 text-sm font-bold text-[var(--tema-kontrol-eylem-metin)] cursor-pointer disabled:opacity-60"
            >
              {yenidenGonderiliyor ? "Gönderiliyor…" : "Yeni Bağlantı İste"}
            </button>
          </form>
        )}

        {oturumHazir === true && tamamlandi && (
          <div className="bg-[var(--tema-yerel-giris-islevsel-zemin-02)] border border-[var(--tema-yerel-giris-islevsel-cizgi-02)] rounded-xl px-4 py-3">
            <p className="text-sm text-[var(--tema-yerel-giris-islevsel-metin-01)] m-0">
              Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
            </p>
          </div>
        )}

        {oturumHazir === true && !tamamlandi && (
          <SifreBelirlemeFormu baslik="Yeni Şifre Belirle" buton="Şifreyi Güncelle" onKaydet={handleKaydet} />
        )}
      </div>
    </div>
  );
}
