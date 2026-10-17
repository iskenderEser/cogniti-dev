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
      backgroundColor: takvim.acik ? "var(--tema-cek-gun-acik-zemin)" : onGunKala ? "var(--tema-cek-gun-yakin-zemin)" : "var(--tema-cek-gun-kapali-zemin)",
      borderColor: takvim.acik ? "var(--tema-cek-gun-acik-cizgi)" : onGunKala ? "var(--tema-cek-gun-yakin-zemin)" : "var(--tema-cek-gun-kapali-cizgi)",
      color: takvim.acik ? "var(--tema-cek-gun-acik-metin)" : onGunKala ? "var(--tema-ters-metin)" : "var(--tema-cek-gun-kapali-metin)",
    }}
    title={takvim.acik ? `Kapanışa ${takvim.kalanSureMetni} kaldı` : `Talep dönemi: ${takvim.sonrakiDonemEtiketi}`}
  >
    {!onGunKala && <span className="h-2 w-2 shrink-0 rounded-full" aria-hidden="true"
      style={{ backgroundColor: takvim.acik ? "var(--tema-cek-gun-acik-nokta)" : "var(--tema-cek-gun-kapali-nokta)", boxShadow: takvim.acik ? "0 0 6px var(--tema-cek-gun-acik-nokta)" : "none" }} />}
    {metin}
  </span>;
}
