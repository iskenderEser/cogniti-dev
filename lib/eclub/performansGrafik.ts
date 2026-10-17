import type { EChartsCoreOption } from "echarts/core";
import { ECLUB_PERFORMANS_TURLERI, type PerformansTuru, type PerformansVerisi } from "./performans";
const sayi = (n: number) => n.toLocaleString("tr-TR");

export function eclubPerformansGrafikSecenegi(veri: PerformansVerisi, tur: PerformansTuru, hafta: number, mobil = false): EChartsCoreOption {
    return {
      animationDuration: 300,
      grid: { left: mobil ? 83 : 115, right: mobil ? 26 : 52, top: 52, bottom: 32 },
      tooltip: { trigger: "item", backgroundColor: "var(--tema-cizim-performans-kart)", borderColor: "var(--tema-cizim-performans-cizgi)", textStyle: { color: "var(--tema-cizim-performans-metin)", fontSize: 12 },
        formatter: (p: { seriesId?: string; value?: number[] }) => {
          const t = ECLUB_PERFORMANS_TURLERI.find(t => t.tur === p.seriesId);
          if (!t || !Array.isArray(p.value)) return "";
          return `${t.ad} · ${p.value[0]}. hafta<br><b>${sayi(p.value[2])} puan</b>`;
        } },
      xAxis: { type: "value", min: 1, max: 8, interval: 1, position: "top", axisLine: { show: false }, axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: "var(--tema-cizim-performans-eksen)", type: "dashed" } }, axisLabel: { fontSize: mobil ? 11 : 12, color: "var(--tema-cizim-performans-soluk)", margin: 17 } },
      yAxis: { type: "category", inverse: true, data: ECLUB_PERFORMANS_TURLERI.map(t => t.ad), axisLine: { show: false }, axisTick: { show: false },
        splitLine: { show: false }, axisLabel: { margin: mobil ? 16 : 26, fontSize: mobil ? 11 : 12, fontWeight: 650, color: (_: string, i: number) => ECLUB_PERFORMANS_TURLERI[i].renk } },
      series: [
        ...ECLUB_PERFORMANS_TURLERI.map((t,i) => ({ id: `${t.tur}-cizgi`, type: "line", data: veri.donem.haftalar.map(h => [h.hafta,i]), symbol: "none", silent: true, z: 1,
          lineStyle: { color: t.renk, opacity: .17, width: 3 },
          ...(i === 0 && Date.parse(veri.donem.simdi) >= Date.parse(veri.donem.baslangic) && Date.parse(veri.donem.simdi) < Date.parse(veri.donem.bitisHaric) ? { markLine: { silent: true, symbol: "none", lineStyle: { color: "var(--tema-cizim-performans-hafta-cizgi)", type: "dashed", width: 1.5 },
            label: { show: true, formatter: "Bu hafta", position: "end", color: "var(--tema-cizim-performans-hafta-metin)", fontSize: 10 }, data: [{ xAxis: veri.donem.aktifHafta }] } } : {}) })),
        ...ECLUB_PERFORMANS_TURLERI.map((t,i) => ({ id: t.tur, type: "scatter", z: 3,
          data: veri.satirlar.find(s => s.tur === t.tur)!.haftalar.map(h => ({ value: [h.hafta,i,h.puan], symbolSize: tur === t.tur && hafta === h.hafta ? 17 : h.puan ? 11 : 7,
            itemStyle: { color: h.puan ? t.renk : "var(--tema-cizim-performans-kart)", borderColor: h.puan ? t.renk : "var(--tema-cizim-performans-bos-cizgi)", borderWidth: tur === t.tur && hafta === h.hafta ? 4 : 1,
              shadowColor: tur === t.tur && hafta === h.hafta ? `var(--tema-cizim-arac-${t.tur === "flip_pdf" ? "literatur" : t.tur}-golge)` : "transparent", shadowBlur: 10 } })),
          label: { show: true, position: "bottom", distance: 12, fontSize: mobil ? 10 : 12, color: t.renk, fontWeight: 650,
            formatter: (p: { value: number[] }) => p.value[2] ? sayi(p.value[2]) : "" }, emphasis: { scale: 1.3 } })),
      ],
    };
}
