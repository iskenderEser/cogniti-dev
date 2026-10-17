// app/talepler/_components/HazirSoruSetiBlogu.tsx
//
// "Hazır soru setim var" seçiliyken görünen blok (Y-2 — yapısal giriş):
//   - Dosya yükleme (SoruIceAktar — Word/Excel/PPT/PDF/metin okuyup formu doldurur)
//   - Yapısal soru kartları (SoruSetiFormu — soru + A/B + doğru işareti)
// F-8/F-9: bayat yapıştır text alanı kaldırıldı (IU sayfasıyla aynı). Doğrulama alan
// bazlıdır ve gönderimde useTalepFormu.validateForm'da (taslaklariDogrula) çalışır.
// Parent koşullu render eder (hazirSoruSeti === true).

"use client";

import { SoruSetiFormu } from "@/components/SoruSetiFormu";
import { SoruIceAktar } from "@/components/SoruIceAktar";
import type { SoruTaslagi } from "@/lib/soru/taslak";

interface HazirSoruSetiBloguProps {
  buyukluk: number;
  secenekSayisi: number;
  taslaklar: SoruTaslagi[];
  onDegis: (taslaklar: SoruTaslagi[]) => void;
  onIceAktar: (taslaklar: SoruTaslagi[], uyari: string) => void;
}

export function HazirSoruSetiBlogu({ buyukluk, secenekSayisi, taslaklar, onDegis, onIceAktar }: HazirSoruSetiBloguProps) {
  return (
    <div className="border border-[var(--tema-yerel-uretim-cizgi-01)] rounded-lg overflow-hidden">
      <div className="px-3 py-2.5 bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] border-b border-[var(--tema-yerel-uretim-cizgi-03)]">
        <span className="text-xs font-semibold text-[var(--tema-yerel-uretim-ana-metin-03)]">Soru Seti</span>
        <span className="text-xs text-[var(--tema-yerel-uretim-yardimci-metin-02)] ml-2">
          (video onaylandığında sistem seti otomatik işler — tam {buyukluk} soru girilmeli)
        </span>
      </div>
      <div className="p-3">
        <SoruIceAktar onDoldur={onIceAktar} secenekSayisi={secenekSayisi} />
        <SoruSetiFormu taslaklar={taslaklar} onDegis={onDegis} buyukluk={buyukluk} secenekSayisi={secenekSayisi} />
      </div>
    </div>
  );
}
