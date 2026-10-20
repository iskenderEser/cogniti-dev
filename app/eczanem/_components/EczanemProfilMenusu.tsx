"use client";

interface Props {
  ad: string;
  telefon?: string | null;
  onHesapSil?: () => void;
}

/** Ortak profil menüsünün üye bilgileri; silme onayını mevcut sayfa açar. */
export default function EczanemProfilMenusu({ ad, telefon, onHesapSil }: Props) {
  return <>
    <div className="space-y-1 p-2">
      <p className="text-sm font-bold text-[var(--tema-metin)]">{ad}</p>
      <p className="text-xs text-[var(--tema-ikincil-metin)]">{telefon ? `••• ••• ${telefon.slice(-4)}` : "Telefon bilgisi yok"}</p>
      <span className="inline-flex rounded-full bg-[var(--tema-menu-secili-zemin)] px-2 py-0.5 text-[10px] font-bold text-[var(--tema-menu-secili-metin)]">Eczanem Üyesi</span>
    </div>
    {onHesapSil && <div className="mt-2 border-t border-[var(--tema-cizgi)] pt-2">
      <button type="button" role="menuitem" onClick={onHesapSil}
        className="w-full rounded-lg border-none bg-transparent px-3 py-2 text-left text-xs font-semibold text-[var(--tema-hata)] hover:bg-[var(--tema-menu-hover)]">
        Hesabımı kalıcı olarak sil
      </button>
    </div>}
  </>;
}
