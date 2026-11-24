"use client";

import CognitiLogo from "@/components/marka/CognitiLogo";
import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";
import { SifreBelirlemeFormu } from "@/components/auth/SifreBelirlemeFormu";
import { YASAL_METINLER, type YasalMetin } from "@/app/login/_components/yasalMetinler";
import { createClient } from "@/lib/supabase/client";
import { guvenliCikisYap } from "@/lib/auth/guvenliCikis";
import { sonrakiSayfaToastYaz, SUREC2_TOAST } from "@/lib/bildirimler/toastMesajlari";

const KVKK_ONAY_HATASI =
  "Devam etmek için KVKK Aydınlatma Metni ve üyelik onayını işaretlemeniz gerekir.";

function YasalMetinTetikleyici({ metin, etiket }: { metin: YasalMetin | undefined; etiket: string }) {
  if (!metin) return <>{etiket}</>;
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline border-0 bg-transparent p-0 font-bold text-[var(--tema-kontrol-eylem)] underline underline-offset-2 cursor-pointer"
        >
          {etiket}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--tema-yerel-giris-ortu-01)]/30" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-[var(--tema-yerel-giris-kart-01)] text-[var(--tema-yerel-giris-ana-metin-01)] shadow-xl"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-[var(--tema-yerel-giris-cizgi-01)] px-6 py-4">
            <Dialog.Title className="m-0 text-[13px] font-semibold leading-[18px]">
              {metin.baslik}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Kapat"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-[var(--tema-yerel-giris-yardimci-metin-02)] hover:bg-[var(--tema-yerel-giris-sayfa-zemini-01)] hover:text-[var(--tema-yerel-giris-ana-metin-01)]"
            >
              <span aria-hidden="true">×</span>
            </Dialog.Close>
          </div>
          <article className="min-h-48 overflow-y-auto px-6 py-5 text-left text-[11px] leading-[17px] text-[var(--tema-yerel-giris-ana-metin-01)]">
            {metin.bolumler.map((bolum, bolumSirasi) => (
              <section key={bolum.baslik ?? `${metin.baslik}-${bolumSirasi}`} className={bolumSirasi === 0 ? "" : "mt-5"}>
                {bolum.baslik && (
                  <h3 className="mb-2 text-[12px] font-bold leading-[17px] text-[var(--tema-yerel-giris-ana-metin-02)]">
                    {bolum.baslik}
                  </h3>
                )}
                <div className="space-y-2.5">
                  {bolum.paragraflar.map((paragraf) => (
                    <p key={paragraf} className="m-0">
                      {paragraf}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DavetSifreKarti({
  token,
  kvkkOnayiGerekli = false,
}: {
  token: string | null;
  kvkkOnayiGerekli?: boolean;
}) {
  const [kvkkOnay, setKvkkOnay] = useState(false);
  const kullanimKosullari = YASAL_METINLER.find((m) => m.baslik.includes("Kullanım Koşulları"));
  const kvkkMetni = YASAL_METINLER.find((m) => m.baslik.includes("KVKK"));

  useEffect(() => {
    // Link sırlarını tarayıcı geçmişinden ve sonraki Referer başlıklarından çıkar.
    window.history.replaceState(null, "", "/sifre-olustur");
  }, []);

  return <main className="flex min-h-screen items-center justify-center bg-[var(--tema-yerel-giris-kart-01)] px-6 py-10" style={{ fontFamily: "'Nunito', sans-serif" }}>
    <div className="w-full max-w-sm">
      <CognitiLogo className="mx-auto mb-8 h-36 object-contain" style={{ width: 144 }} />
      {!token ? <p role="alert" className="text-sm text-[var(--tema-yerel-giris-ana-metin-01)]">Davet bağlantısı bulunamadı. Yöneticinizden, temsilcinizden veya eczanenizden yeni davet isteyin.</p> : <SifreBelirlemeFormu
        baslik="Şifre oluştur"
        buton="Kaydet"
        ekIcerik={kvkkOnayiGerekli ? (
          <label className="flex items-start gap-2.5 rounded-xl border border-[var(--tema-yerel-giris-cizgi-03)] bg-[var(--tema-yerel-giris-kart-01)] p-3 text-xs leading-relaxed text-[var(--tema-yerel-giris-yardimci-metin-01)] cursor-pointer">
            <input
              type="checkbox"
              checked={kvkkOnay}
              onChange={(e) => setKvkkOnay(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--tema-kontrol-eylem)]"
            />
            <span>
              <YasalMetinTetikleyici metin={kvkkMetni} etiket="Cogniti KVKK Aydınlatma Metni" />&apos;ni ve{" "}
              <YasalMetinTetikleyici metin={kullanimKosullari} etiket="Platform Kullanım Koşulları" />&apos;nı okudum; kişisel verilerimin işlenmesini ve Eczanem üyeliğimi onaylıyorum.
            </span>
          </label>
        ) : undefined}
        ekKontrol={kvkkOnayiGerekli ? () => (kvkkOnay ? null : KVKK_ONAY_HATASI) : undefined}
        onKaydet={async (sifre, tekrar) => {
          const r = await fetch("/sifre-olustur/api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              sifre,
              tekrar,
              ...(kvkkOnayiGerekli ? { kvkk_onay: kvkkOnay } : {}),
            }),
          });
          const d = await r.json();
          if (!r.ok || !d.tamamlandi) throw new Error(d.hata ?? "Kayıt tamamlanamadı.");
          await guvenliCikisYap(createClient());
          sonrakiSayfaToastYaz(SUREC2_TOAST.sifreOlusturuldu);
          window.location.replace("/login");
        }}
      />}
    </div>
  </main>;
}
