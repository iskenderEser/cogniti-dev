import type { ReactNode } from "react";
import type { UyeGonderimEczaneDetayi } from "@/lib/eczanem/uyeGonderimOzeti";
import { YayinGonderimDetayKarti } from "./YayinGonderimDetayKarti";

export function UyeGonderimDetaylari({ urunAdi, eczaneler, children }: {
  urunAdi: string;
  eczaneler: UyeGonderimEczaneDetayi[];
  children: ReactNode;
}) {
  if (eczaneler.length === 0) return children;

  return (
    <YayinGonderimDetayKarti urunAdi={urunAdi} detay={<>
      <p className="mb-1.5 text-[10px] text-[var(--tema-gonderim-detay-baslik-yardimci)]">Gönderilen üye / Güncel aktif üye</p>
      <ul className="space-y-1.5">
        {eczaneler.map(({ eczaneId, eczaneAdi, gonderilenUyeSayisi, aktifUyeSayisi }) => (
          <li key={eczaneId} className="flex items-start justify-between gap-2 rounded-lg border border-[var(--tema-gonderim-detay-satir-cizgi)] bg-[var(--tema-gonderim-detay-yuzey)] px-2.5 py-2 text-[10px] text-[var(--tema-gonderim-detay-kisi-metni)]">
            <span className="min-w-0 break-words">{eczaneAdi}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {gonderilenUyeSayisi.toLocaleString("tr-TR")}/{aktifUyeSayisi.toLocaleString("tr-TR")}
            </span>
          </li>
        ))}
      </ul>
    </>}>
      {children}
    </YayinGonderimDetayKarti>
  );
}
