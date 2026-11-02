// app/admin/eclub/_components/EclubYonetimPaneli.tsx
//
// M2-b — E-Club yönetim içeriği (onay bekleyen eczaneler + kayıtlı
// firma/eczane/kişi). Eski /admin/eclub sayfasının kabuksuz hâli: auth,
// Navbar ve hata konteyneri ANA panelin işidir; bu bileşen yalnız içeriktir
// ve ana paneldeki E-Club sekmesine gömülür (plan B.2).

"use client";
import { useFirmaSaltOkunur } from "@/app/admin/_components/FirmaYonetimYetkisi";


import { useState } from "react";
import styles from "../../admin.module.css";
import local from "./eclub-yonetimi.module.css";
import EclubUyeler from "./EclubUyeler";
import { useEclubOnaylar } from "../_hooks/useEclubOnaylar";

interface EclubYonetimPaneliProps {
  firmaId: string;
  firmaAdi: string;
  hata: (mesaj: string, adim?: string, detay?: string) => void;
  basari: (mesaj: string) => void;
}

export default function EclubYonetimPaneli({ firmaId, firmaAdi, hata, basari }: EclubYonetimPaneliProps) {
  const saltOkunur = useFirmaSaltOkunur();
  // Ana panel bu bileşeni yalnız admin doğrulandıktan sonra render eder.
  const { bekleyenler, loading, islemLoading, kararVer } = useEclubOnaylar({ hazir: true, hata, basari, firmaId });
  const [reddetOnay, setReddetOnay] = useState<string | null>(null);

  return (
    <div className={`${styles.stack} ${local.legacy}`}>
      <EclubUyeler firmaId={firmaId} firmaAdi={firmaAdi} hata={hata} basari={basari} />

      {/* --- Onay Bekleyen Eczaneler --- */}
      <div className="bg-[var(--tema-kart)] border border-[var(--tema-kontrol-cizgi)] rounded-[18px] overflow-hidden">
        <div className="px-4 md:px-5 py-3.5 border-b border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] flex items-center justify-between">
          <span className="text-sm font-extrabold text-[var(--tema-kontrol-metin)]">Onay Bekleyen Eczaneler</span>
          <span className="text-xs text-[var(--tema-kontrol-ikincil-metin)]">{bekleyenler.length} kayıt</span>
        </div>

        {loading ? <p role="status" className={styles.empty}>Onay listesi yükleniyor…</p> : bekleyenler.length === 0 ? (
          <p className="text-sm text-[var(--tema-kontrol-ikincil-metin)] text-center py-8 m-0">Onay bekleyen eczane yok.</p>
        ) : (
          <div className="divide-y divide-[var(--tema-kontrol-cizgi)]">
            {bekleyenler.map((b) => (
              <div key={b.gln} className="px-4 md:px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-[var(--tema-kontrol-metin)]">{b.eczane_adi}</span>
                  <span className="text-xs text-[var(--tema-kontrol-ikincil-metin)] font-mono">{b.gln}</span>
                  <span className="text-xs text-[var(--tema-kontrol-ikincil-metin)]">
                    {b.il}{b.ilce ? ` / ${b.ilce}` : ""}
                    {b.ekleyen_ad ? ` · Ekleyen: ${b.ekleyen_ad}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {reddetOnay === b.gln ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--tema-kontrol-ikincil-metin)]">Silinsin mi?</span>
                      <button onClick={async () => { await kararVer(b.gln, "reddet"); setReddetOnay(null); }}
                        disabled={saltOkunur || islemLoading}
                        className="text-xs px-2.5 py-1 rounded-lg border-none text-[var(--tema-yerel-yonetim-ters-metin-02)] cursor-pointer" style={{ background: "var(--tema-yerel-yonetim-vurgu-zemin-01)" }}>
                        Evet, reddet
                      </button>
                      <button onClick={() => setReddetOnay(null)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-transparent text-[var(--tema-kontrol-ikincil-metin)] cursor-pointer">Vazgeç</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => kararVer(b.gln, "onayla")} disabled={saltOkunur || islemLoading}
                        className="text-xs px-3 py-1.5 rounded-lg border-none bg-[var(--tema-kontrol-eylem)] text-[var(--tema-yerel-yonetim-ters-metin-02)] font-extrabold cursor-pointer">Onayla</button>
                      <button onClick={() => setReddetOnay(b.gln)} disabled={saltOkunur || islemLoading}
                        className="text-xs px-3 py-1.5 rounded-lg bg-transparent cursor-pointer"
                        style={{ border: "0.5px solid var(--tema-yerel-yonetim-islevsel-cizgi-02)", color: "var(--tema-yerel-yonetim-vurgu-metin-01)" }}>Reddet</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
