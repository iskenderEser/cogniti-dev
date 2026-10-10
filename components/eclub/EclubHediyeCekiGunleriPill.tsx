"use client";

import { useEclubStoreTakvim } from "@/hooks/useEclubStoreTakvim";

export default function EclubHediyeCekiGunleriPill() {
  const { takvim } = useEclubStoreTakvim();
  if (!takvim) return null;
  const kalanGun = Math.floor(takvim.kalanMs / 86_400_000);
  const onGunKala = !takvim.acik && kalanGun <= 10;
  const metin = takvim.acik
    ? "Hediye çeki günleri açık"
    : `Hediye çeki günlerine ${kalanGun > 0 ? `${kalanGun} gün` : takvim.kisaKalanSureMetni}`;

  return <span
    className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-center text-[10px] font-bold shadow-xs"
    style={{
      backgroundColor: takvim.acik ? "#f0fdf4" : onGunKala ? "#1e3a8a" : "#fffbeb",
      borderColor: takvim.acik ? "#bbf7d0" : onGunKala ? "#1e3a8a" : "#fef3c7",
      color: takvim.acik ? "#166534" : onGunKala ? "#ffffff" : "#92400e",
    }}
    title={takvim.acik ? `Kapanışa ${takvim.kalanSureMetni} kaldı` : `Talep dönemi: ${takvim.sonrakiDonemEtiketi}`}
  >
    {!onGunKala && <span className="h-2 w-2 shrink-0 rounded-full" aria-hidden="true"
      style={{ backgroundColor: takvim.acik ? "#16a34a" : "#f59e0b", boxShadow: takvim.acik ? "0 0 6px #16a34a" : "none" }} />}
    {metin}
  </span>;
}
