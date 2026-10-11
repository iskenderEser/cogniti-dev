import test from "node:test";
import assert from "node:assert/strict";
import * as echarts from "echarts/core";
import { LineChart, ScatterChart } from "echarts/charts";
import { GridComponent, TooltipComponent, MarkLineComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { eclubPerformansDonemi, eclubPerformansiHesapla } from "@/lib/eclub/performans";
import { eclubPerformansGrafikSecenegi } from "@/lib/eclub/performansGrafik";

echarts.use([LineChart, ScatterChart, GridComponent, TooltipComponent, MarkLineComponent, SVGRenderer]);
test("ECharts dört sabit satırı ve sekiz haftayı masaüstü ve mobil genişlikte çizer", () => {
  const donem = eclubPerformansDonemi(new Date("2026-10-11T12:00:00Z"));
  const veri = eclubPerformansiHesapla({ donem, izlemeler: [], puanlar: [], kayiplar: [], uyeler: [], baglar: [], eczaneIdler: [], yayinIdler: [] });
  for (const width of [1100, 330]) {
    const chart = echarts.init(null, null, { renderer: "svg", ssr: true, width, height: 365 });
    try {
      chart.setOption(eclubPerformansGrafikSecenegi(veri, "podcast", 2, width < 700));
      const svg = chart.renderToSVGString();
      for (const name of ["Video", "Podcast", "Görsel", "Literatür", "Bu hafta"]) assert.ok(svg.includes(name),name);
      const first = chart.convertToPixel({ gridIndex: 0 }, [1,0]) as number[];
      const last = chart.convertToPixel({ gridIndex: 0 }, [8,3]) as number[];
      assert.ok(first[0] >= 0 && last[0] <= width);
      assert.ok(first[1] < last[1]);
      assert.equal((chart.getOption().series as unknown[]).length,8);
    } finally { chart.dispose(); }
  }
});
