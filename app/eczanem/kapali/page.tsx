"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import EclubGecisKarti from "../_components/EclubGecisKarti";

export default function EczanemKapaliPage() {
  const { cikisYap } = useAuth();
  const [silmeAcik, setSilmeAcik] = useState(false);
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [siliniyor, setSiliniyor] = useState(false);
  const [bilgi, setBilgi] = useState("");

  const hesabimiSil = async (event: React.FormEvent) => {
    event.preventDefault();
    setHata("");
    setSiliniyor(true);
    try {
      const response = await fetch("/eczanem/api/hesabimi-sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sifre }),
      });
      const data = await response.json();
      if (!response.ok) {
        setHata(data.hata ?? "Hesabınız silinemedi.");
        return;
      }
      await cikisYap();
    } catch {
      setHata("Hesabınız silinemedi; yeniden deneyin.");
    } finally {
      setSiliniyor(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--tema-yerel-eczanem-sayfa-zemini-05)] px-4 py-16">
      <div className="mx-auto max-w-md">
      <EclubGecisKarti hata={(mesaj) => setHata(mesaj)} basari={(mesaj) => setBilgi(mesaj)} />
      {bilgi && <p className="mb-3 rounded-xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-13)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-27)] px-4 py-3 text-xs font-semibold text-[var(--tema-yerel-eczanem-islevsel-metin-27)]">{bilgi}</p>}
      <section className="rounded-2xl border border-[var(--tema-yerel-eczanem-cizgi-06)] bg-[var(--tema-yerel-eczanem-kart-01)] p-6 shadow-sm">
        <h1 className="text-lg font-bold text-[var(--tema-yerel-eczanem-ana-metin-02)]">Eczanem şu anda kapalı</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--tema-yerel-eczanem-ana-metin-16)]">
          Eczanem, bağlı olduğunuz firmalar için şu anda kullanıma açık değildir.
        </p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => cikisYap()}
            className="rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-27)] px-3 py-2 text-sm font-semibold text-[var(--tema-yerel-eczanem-ana-metin-13)] hover:bg-[var(--tema-yerel-eczanem-sayfa-zemini-05)]"
          >
            Çıkış yap
          </button>
          <button
            type="button"
            onClick={() => setSilmeAcik((acik) => !acik)}
            className="rounded-lg border border-[var(--tema-yerel-eczanem-islevsel-cizgi-02)] px-3 py-2 text-sm font-semibold text-[var(--tema-yerel-eczanem-islevsel-metin-07)] hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-08)]"
          >
            Hesabımı sil
          </button>
        </div>

        {silmeAcik && (
          <form onSubmit={hesabimiSil} className="mt-5 rounded-xl border border-[var(--tema-yerel-eczanem-islevsel-cizgi-20)] bg-[var(--tema-yerel-eczanem-islevsel-zemin-08)] p-4">
            <p className="text-sm font-semibold text-[var(--tema-yerel-eczanem-islevsel-metin-38)]">Hesabınız ve kişisel verileriniz kalıcı olarak silinecek.</p>
            <label className="mt-3 block text-xs font-semibold text-[var(--tema-yerel-eczanem-ana-metin-13)]" htmlFor="kapali-silme-sifre">
              Onaylamak için şifrenizi girin
            </label>
            <input
              id="kapali-silme-sifre"
              type="password"
              value={sifre}
              onChange={(event) => setSifre(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--tema-yerel-eczanem-cizgi-27)] bg-[var(--tema-yerel-eczanem-kart-01)] px-3 py-2 text-sm outline-none focus:border-[var(--tema-yerel-eczanem-islevsel-cizgi-21)]"
              required
            />
            {hata && <p className="mt-2 text-xs text-[var(--tema-yerel-eczanem-islevsel-metin-07)]">{hata}</p>}
            <button
              type="submit"
              disabled={siliniyor || !sifre}
              className="mt-3 w-full rounded-lg bg-[var(--tema-yerel-eczanem-islevsel-zemin-30)] px-3 py-2 text-sm font-bold text-[var(--tema-yerel-eczanem-ters-metin-01)] disabled:opacity-50"
            >
              {siliniyor ? "Siliniyor…" : "Evet, hesabımı kalıcı olarak sil"}
            </button>
          </form>
        )}
      </section>
      </div>
    </main>
  );
}
