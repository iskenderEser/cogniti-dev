// components/hbligi/league/LeadershipScore.tsx
// Seçili dönemde kullanıcının lidere ilerleyişini görselleştirir.

"use client";

import { Target } from "lucide-react";
import styles from "./league.module.css";

export default function LeadershipScore({
  lidereKalanPuan,
  mevcutSira,
  mevcutNetPuan,
  liderNetPuan,
}: {
  lidereKalanPuan: number;
  mevcutSira: number;
  mevcutNetPuan: number;
  liderNetPuan: number;
}) {
  const liderMi = mevcutSira === 1 || lidereKalanPuan === 0;
  const ilerleme = liderNetPuan > 0
    ? Math.min(1, Math.max(0, mevcutNetPuan / liderNetPuan))
    : 0;
  const aci = Math.PI * (1 - ilerleme);
  const isaretX = 160 + 132 * Math.cos(aci);
  const isaretY = 180 - 132 * Math.sin(aci);
  const etiketX = Math.min(236, Math.max(4, isaretX - 40));
  const etiketY = Math.min(122, Math.max(3, isaretY - 61));

  return (
    <section className={`${styles.panel} flex h-full min-h-0 flex-col p-4`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className={styles.sectionHeading}>Liderliğe Doğru</h2>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--tema-cizim-lider-simge-zemin)] text-[var(--tema-cizim-lider-simge)]">
          <Target className="h-[18px] w-[18px]" />
        </div>
      </div>

      <div className="mx-auto mt-1 w-full max-w-[520px] flex-1 content-center">
        <svg
          viewBox="0 0 320 210"
          className="block h-auto w-full"
          role="img"
          aria-label={`Liderlik ilerlemesi yüzde ${Math.round(ilerleme * 100)}`}
        >
          <path
            d="M 28 180 A 132 132 0 0 1 292 180"
            fill="none"
            stroke="var(--tema-cizim-lider-yol)"
            strokeWidth="18"
            strokeLinecap="round"
            pathLength="100"
          />
          <path
            d="M 28 180 A 132 132 0 0 1 292 180"
            fill="none"
            stroke="var(--tema-cizim-lider-ilerleme)"
            strokeWidth="18"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${ilerleme * 100} 100`}
          />
          {!liderMi && (
            <>
              <rect x={etiketX} y={etiketY} width="80" height="43" rx="12" fill="var(--tema-cizim-lider-etiket)" stroke="var(--tema-cizim-lider-etiket-cizgi)" />
              <path d={`M ${isaretX - 6} ${etiketY + 43} L ${isaretX} ${etiketY + 50} L ${isaretX + 6} ${etiketY + 43} Z`} fill="var(--tema-cizim-lider-etiket)" stroke="var(--tema-cizim-lider-etiket-cizgi)" strokeLinejoin="round" />
              <text x={etiketX + 40} y={etiketY + 17} textAnchor="middle" fill="var(--tema-cizim-lider-sen)" fontSize="10" fontWeight="700">Sen</text>
              <text x={etiketX + 40} y={etiketY + 35} textAnchor="middle" fill="var(--tema-cizim-lider-puan)" fontSize="15" fontWeight="900">{mevcutNetPuan.toLocaleString("tr-TR")}</text>
              <circle cx={isaretX} cy={isaretY} r="11" fill="var(--tema-cizim-lider-isaret)" stroke="var(--tema-cizim-lider-isaret-cizgi)" strokeWidth="3" />
              <circle cx={isaretX} cy={isaretY} r="5" fill="var(--tema-cizim-lider-sen)" />
            </>
          )}

          <text x="160" y="123" textAnchor="middle" fill="var(--tema-cizim-lider-yardimci)" fontSize="10" fontWeight="700" letterSpacing="0.7">
            {liderMi ? "NET PUANIN" : "LİDERE"}
          </text>
          <text x="160" y="155" textAnchor="middle" fill="var(--tema-cizim-lider-puan)" fontSize="32" fontWeight="900">
            {liderMi ? mevcutNetPuan.toLocaleString("tr-TR") : lidereKalanPuan.toLocaleString("tr-TR")}
          </text>
          <text x="160" y="173" textAnchor="middle" fill="var(--tema-cizim-lider-yardimci)" fontSize="10" fontWeight="700" letterSpacing="0.7">
            {liderMi ? "PUAN" : "PUAN KALDI"}
          </text>

          <rect x="243" y="65" width="72" height="43" rx="12" fill="var(--tema-cizim-lider-altin-zemin)" />
          <path d="M 275 108 L 283 117 L 291 108 Z" fill="var(--tema-cizim-lider-altin-zemin)" />
          <text x="279" y="82" textAnchor="middle" fill="var(--tema-cizim-lider-puan)" fontSize="9" fontWeight="700">{liderMi ? "Sen" : "Lider"}</text>
          <text x="279" y="100" textAnchor="middle" fill="var(--tema-cizim-lider-puan)" fontSize="14" fontWeight="900">{liderNetPuan.toLocaleString("tr-TR")}</text>

          <circle cx="292" cy="179" r="21" fill="var(--tema-cizim-lider-altin-zemin)" stroke="var(--tema-cizim-lider-altin-cizgi)" strokeWidth="2" />
          <g transform="translate(282 167)" fill="none" stroke="var(--tema-cizim-lider-altin-simge)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 2h10v6a5 5 0 0 1-10 0V2Z" />
            <path d="M5 4H2v2a4 4 0 0 0 4 4M15 4h3v2a4 4 0 0 1-4 4M10 13v4M6 18h8" />
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-3 divide-x divide-[var(--tema-cizim-lider-bolme)] rounded-2xl bg-[var(--tema-cizim-lider-alt-zemin)] px-2 py-3 text-center">
        <div>
          <div className="text-[8px] font-normal uppercase tracking-wide text-[var(--tema-cizim-lider-yardimci)]">Sıran</div>
          <div className="mt-0.5 text-[13px] font-normal tabular-nums text-[var(--tema-cizim-lider-puan)]">{mevcutSira}</div>
        </div>
        <div>
          <div className="text-[8px] font-normal uppercase tracking-wide text-[var(--tema-cizim-lider-yardimci)]">Senin puanın</div>
          <div className="mt-0.5 text-[13px] font-normal tabular-nums text-[var(--tema-cizim-lider-puan)]">{mevcutNetPuan.toLocaleString("tr-TR")}</div>
        </div>
        <div>
          <div className="text-[8px] font-normal uppercase tracking-wide text-[var(--tema-cizim-lider-yardimci)]">Liderin puanı</div>
          <div className="mt-0.5 text-[13px] font-normal tabular-nums text-[var(--tema-cizim-lider-puan)]">{liderNetPuan.toLocaleString("tr-TR")}</div>
        </div>
      </div>
    </section>
  );
}
