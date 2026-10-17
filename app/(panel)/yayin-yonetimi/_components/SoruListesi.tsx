// app/yayin-yonetimi/_components/SoruListesi.tsx
//
// Bir soru setinin sorularını listeler. İki modda çalışır:
//   - bekleyen modu (puanlama açık): her soruya puan seçici + "hepsine aynı puan" kısayolu
//   - yayın modu (salt görüntüleme): atanmış puan rozet olarak görünür
//
// Davranış orijinal page.tsx ile birebir aynıdır.

"use client";

import { SadeFormSecimi } from "@/components/kontrol/SadeKontroller";

import type { Soru } from "@/app/(panel)/talepler/_types";
import type { Bekleyen } from "../_types";
import { SORU_PUAN_SECENEKLERI, SORU_PUAN_SECENEKLERI_ECZANEM } from "../_types";

interface SoruListesiProps {
  sorular: Soru[];
  soru_seti_durum_id: string;
  bekleyen?: Bekleyen | false;
  getSoruPuani: (soru_seti_durum_id: string, soru_index: number) => number | "";
  setSoruPuani: (soru_seti_durum_id: string, soru_index: number, puan: number) => void;
  hepsineAyniPuanAta: (soru_seti_durum_id: string, sorular: Soru[], puan: number) => void;
}

export function SoruListesi({
  sorular,
  soru_seti_durum_id,
  bekleyen,
  getSoruPuani,
  setSoruPuani,
  hepsineAyniPuanAta,
}: SoruListesiProps) {
  // Eczanem yayınlarında soru puanı skalası farklıdır; diğer hedeflerde mevcut liste.
  const soruPuanSecenekleri = bekleyen && bekleyen.hedef_roller.includes("eczanem")
    ? SORU_PUAN_SECENEKLERI_ECZANEM
    : SORU_PUAN_SECENEKLERI;

  return (
    <div className="border-t border-[var(--tema-yerel-uretim-cizgi-43)] bg-[var(--tema-yerel-uretim-sayfa-zemini-16)] px-3.5 py-3.5 md:px-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold text-[var(--tema-yerel-uretim-ana-metin-23)]">Soru Seti</p>
          <p className="mt-0.5 text-[10px] text-[var(--tema-yerel-uretim-yardimci-metin-33)]">{sorular.length} soru · doğru seçenekler mavi ile işaretlidir</p>
        </div>
      {bekleyen && (
        <div className="flex items-center justify-end gap-2 rounded-xl border border-[var(--tema-yerel-uretim-cizgi-07)] bg-[var(--tema-yerel-uretim-secim-zemin-03)] px-3 py-2">
          <span className="text-xs font-bold text-[var(--tema-yerel-uretim-eylem-metin-07)]">Tümüne aynı puan</span>
          <SadeFormSecimi value="" onChange={(e) => { if (e.target.value) hepsineAyniPuanAta(soru_seti_durum_id, sorular, Number(e.target.value)); }} aria-label="Tüm sorulara aynı puanı ata" className="w-full">
            <option value="">Seçiniz</option>
            {soruPuanSecenekleri.map(p => <option key={p} value={p}>{p} puan</option>)}
          </SadeFormSecimi>
        </div>
      )}
      </div>
      <div className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
        {sorular.map((soru: Soru, i: number) => {
          const sp = getSoruPuani(soru_seti_durum_id, i);
          const puanDolu = typeof sp === "number" && sp > 0;
          return (
            <div key={i} className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 transition ${
              puanDolu ? "border-[var(--tema-yerel-uretim-cizgi-06)] bg-[var(--tema-yerel-uretim-sayfa-zemini-22)] shadow-sm" : "border-[var(--tema-yerel-uretim-cizgi-44)] bg-[var(--tema-yerel-uretim-kart-01)]"
            }`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold transition ${
                puanDolu ? "bg-[var(--tema-yerel-uretim-eylem-zemin-06)] text-[var(--tema-yerel-uretim-ters-metin-01)]" : "bg-[var(--tema-yerel-uretim-secim-zemin-04)] text-[var(--tema-yerel-uretim-eylem-metin-14)]"
              }`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="mb-2 text-xs font-bold leading-relaxed text-[var(--tema-yerel-uretim-ana-metin-24)]">{soru.soru_metni}</div>
                <div className="flex flex-col gap-1">
                  {soru.secenekler?.map((s, j: number) => (
                    <span key={j} className="w-fit rounded-full px-2.5 py-1 text-[10px]"
                      style={{ border: s.dogru ? "0.5px solid var(--tema-yerel-uretim-islevsel-cizgi-09)" : "0.5px solid var(--tema-yerel-uretim-islevsel-cizgi-23)", color: s.dogru ? "var(--tema-yerel-uretim-islevsel-metin-34)" : "var(--tema-yerel-uretim-islevsel-metin-35)", background: s.dogru ? "var(--tema-yerel-uretim-islevsel-zemin-28)" : "var(--tema-yerel-uretim-islevsel-zemin-29)" }}>
                      {s.harf}. {s.metin}
                    </span>
                  ))}
                </div>
              </div>
              {bekleyen ? (
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-extrabold ${puanDolu ? "text-[var(--tema-yerel-uretim-eylem-metin-02)]" : "text-[var(--tema-yerel-uretim-yardimci-metin-34)]"}`}>
                    {puanDolu ? "✓ Puan" : "Puan"}
                  </span>
                  <SadeFormSecimi value={sp} onChange={(e) => setSoruPuani(soru_seti_durum_id, i, Number(e.target.value))} aria-label={`${i + 1}. soru puanı`} className="w-full">
                    <option value="">-</option>
                    {soruPuanSecenekleri.map(p => <option key={p} value={p}>{p} puan</option>)}
                  </SadeFormSecimi>
                </div>
              ) : (
                <div className="flex shrink-0 flex-col items-end gap-0.5 rounded-lg bg-[var(--tema-yerel-uretim-secim-zemin-06)] px-2 py-1.5">
                  <span className="text-[9px] font-bold uppercase text-[var(--tema-yerel-uretim-yardimci-metin-35)]">Puan</span>
                  <span className="text-xs font-extrabold text-[var(--tema-yerel-uretim-eylem-metin-15)]">{sp || "—"}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
