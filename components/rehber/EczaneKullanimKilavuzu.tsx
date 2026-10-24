"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { eczaneKilavuzFirmasiniSec, eczaneKilavuzunuSec, type EczaneKilavuzFirmasi } from "@/lib/rehber/eczaneKilavuzu";
import UreticiKullanimKilavuzu from "./UreticiKullanimKilavuzu";

export default function EczaneKullanimKilavuzu() {
  const { kullanici } = useAuth();
  return kullanici ? <EczaneKilavuzIcerigi key={kullanici.id} rol={kullanici.rol} /> : null;
}
function EczaneKilavuzIcerigi({ rol }: { rol: string }) {
  const pathname = usePathname();
  const sorgu = useSearchParams();
  const [veri, setVeri] = useState<{ firmalar: EczaneKilavuzFirmasi[]; hata: boolean }>({ firmalar: [], hata: false });
  const [manuelFirma, setManuelFirma] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const oku = async () => {
      try {
        const yanit = await fetch("/eclub/firmalar/api", { cache: "no-store", signal: controller.signal });
        const sonuc = await yanit.json();
        if (!yanit.ok || !Array.isArray(sonuc.firmalar)) throw new Error("Firma bilgisi alınamadı.");
        if (!controller.signal.aborted) setVeri({ firmalar: sonuc.firmalar, hata: false });
      } catch {
        if (!controller.signal.aborted) setVeri({ firmalar: [], hata: true });
      }
    };
    void oku();
    window.addEventListener("focus", oku);
    return () => { controller.abort(); window.removeEventListener("focus", oku); };
  }, []);
  const { firma, rotaSecimi } = eczaneKilavuzFirmasiniSec(veri.firmalar, pathname, sorgu.get("firma_id"), manuelFirma);
  const kilavuz = eczaneKilavuzunuSec(firma, rol);
  const kontrol = <label className="flex w-full flex-col gap-1 text-xs">
    <span>Kılavuz firması</span>
    <select aria-label="Kılavuz firması" value={firma?.firma_id ?? ""} disabled={!!rotaSecimi || veri.hata} onChange={event => setManuelFirma(event.target.value)} className="w-full rounded-md border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-2 text-[var(--tema-metin)]">
      <option value="">{veri.hata ? "Firma bilgisi alınamadı" : "Firma seçiniz"}</option>
      {veri.firmalar.map(f => <option key={f.firma_id} value={f.firma_id}>{f.firma_adi}</option>)}
    </select>
  </label>;
  return <UreticiKullanimKilavuzu kilavuz={kilavuz} rolBasligi="Eczaneler" ekKontroller={kontrol} />;
}
