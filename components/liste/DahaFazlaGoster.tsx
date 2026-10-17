// components/liste/DahaFazlaGoster.tsx
//
// Listenin altındaki "Daha Fazla Göster" düğmesi. Her tıklamada useListe'nin
// adımı kadar (varsayılan 10) satır daha açılır.
//
// Gösterilecek satır kalmadıysa hiç çizilmez — boş bir düğme kalmasın.
// Kaç kayıttan kaçının göründüğü düğmenin üstünde yazar; kullanıcı listenin
// bittiğini mi yoksa devamı olduğunu mu bilmeli.

"use client";

interface Props {
  dahaVar: boolean;
  gorunenSayi: number;
  toplam: number;
  onGoster: () => void;
}

export function DahaFazlaGoster({ dahaVar, gorunenSayi, toplam, onGoster }: Props) {
  if (!dahaVar) return null;

  return (
    <div className="px-5 py-3 border-t border-[var(--tema-yerel-ortak-sayfa-cizgi-08)] flex items-center justify-center gap-3">
      <span className="text-xs text-[var(--tema-yerel-ortak-sayfa-yardimci-metin-12)]">
        {gorunenSayi} / {toplam}
      </span>
      <button
        type="button"
        onClick={onGoster}
        className="text-xs font-semibold text-[var(--tema-yerel-ortak-sayfa-ana-metin-08)] bg-[var(--tema-yerel-ortak-sayfa-kart-01)] border border-[var(--tema-yerel-ortak-sayfa-cizgi-06)] rounded-full px-4 py-1.5 cursor-pointer transition-colors hover:bg-[var(--tema-yerel-ortak-sayfa-sayfa-zemini-06)]"
      >
        Daha Fazla Göster
      </button>
    </div>
  );
}
