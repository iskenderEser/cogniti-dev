"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { ArrowLeft, Compass, Download } from "lucide-react";
import type { EChartsCoreOption } from "echarts/core";
import EChart from "@/components/grafik/EChart";
import { Button } from "@/components/ui/button";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import {
  BOLIS_HEDEF_ROL_ETIKETLERI,
  BOLIS_KAYIT_TIPI_ETIKETLERI,
  BOLIS_RENGI,
  BOLIS_YUMUSAK_CIZGI,
  BOLIS_YUMUSAK_ZEMIN,
  type BolisKayitTipi,
} from "@/lib/bolis/tipler";
import type {
  BolisRaporKatilimci,
  BolisRaporSoruAnalizi,
} from "@/app/(panel)/bolis/api/[sinavId]/rapor/route";

interface RaporYaniti {
  sinav: {
    sinav_id: string;
    baslik: string;
    kayit_tipi: BolisKayitTipi;
    durum: string;
    sure_dakika: number;
  };
  ozet: {
    katilimciSayisi: number;
    maksimumPuan: number;
    ortalamaPuan: number;
    ortalamaBasari: number;
    enYuksekPuan: number;
    enDusukPuan: number;
    soruSayisi: number;
  };
  oneCikanlar: {
    enCokDogru: BolisRaporSoruAnalizi | null;
    enCokYanlis: BolisRaporSoruAnalizi | null;
    enCokBos: BolisRaporSoruAnalizi | null;
    enCokCevaplanan: BolisRaporSoruAnalizi | null;
  };
  soruAnalizleri: BolisRaporSoruAnalizi[];
  katilimcilar: BolisRaporKatilimci[];
}

type SoruSiralama = "sira" | "dogru" | "yanlis" | "bos" | "cevaplanan";

const TARIH_SAAT_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export default function BolisRaporEkrani({ sinavId }: { sinavId: string }) {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [veri, setVeri] = useState<RaporYaniti | null>(null);
  const [soruSiralama, setSoruSiralama] = useState<SoruSiralama>("sira");
  const [arama, setArama] = useState("");

  const yenile = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    try {
      const r = await fetch(`/bolis/api/${sinavId}/rapor`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Sınav raporu okunamadı.");
        return;
      }
      setVeri(d as RaporYaniti);
    } catch {
      setHata("Sınav raporu okunamadı.");
    } finally {
      setYukleniyor(false);
    }
  }, [sinavId]);

  useEffect(() => {
    void yenile();
  }, [yenile]);

  const siraliSorular = useMemo(() => {
    const liste = [...(veri?.soruAnalizleri ?? [])];
    if (soruSiralama === "dogru") {
      return liste.sort((a, b) => b.dogru_sayisi - a.dogru_sayisi || a.sira - b.sira);
    }
    if (soruSiralama === "yanlis") {
      return liste.sort((a, b) => b.yanlis_sayisi - a.yanlis_sayisi || a.sira - b.sira);
    }
    if (soruSiralama === "bos") {
      return liste.sort((a, b) => b.bos_sayisi - a.bos_sayisi || a.sira - b.sira);
    }
    if (soruSiralama === "cevaplanan") {
      return liste.sort((a, b) => b.cevaplanan_sayisi - a.cevaplanan_sayisi || a.sira - b.sira);
    }
    return liste.sort((a, b) => a.sira - b.sira);
  }, [veri, soruSiralama]);

  const filtrelenmisKatilimcilar = useMemo(() => {
    const liste = veri?.katilimcilar ?? [];
    const s = arama.trim().toLocaleLowerCase("tr-TR");
    if (!s) return liste;
    return liste.filter((k) =>
      [k.katilimci_etiketi, k.eposta, k.telefon, k.takim_adi, k.bolge_adi, k.eczane_adi]
        .filter(Boolean)
        .some((v) => String(v).toLocaleLowerCase("tr-TR").includes(s)),
    );
  }, [veri, arama]);

  const sutunOption = useMemo<EChartsCoreOption>(() => {
    const sorular = veri?.soruAnalizleri ?? [];
    return {
      animation: true,
      animationDuration: 650,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 36, right: 16, top: 36, bottom: 28 },
      xAxis: {
        type: "category",
        data: sorular.map((s) => `S${s.sira}`),
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          name: "Doğru",
          type: "bar",
          stack: "toplam",
          barMaxWidth: 28,
          itemStyle: { color: "#0F766E", borderRadius: [0, 0, 0, 0] },
          data: sorular.map((s) => s.dogru_sayisi),
        },
        {
          name: "Yanlış",
          type: "bar",
          stack: "toplam",
          barMaxWidth: 28,
          itemStyle: { color: "#E11D48" },
          data: sorular.map((s) => s.yanlis_sayisi),
        },
        {
          name: "Boş",
          type: "bar",
          stack: "toplam",
          barMaxWidth: 28,
          itemStyle: { color: "#94A3B8", borderRadius: [4, 4, 0, 0] },
          data: sorular.map((s) => s.bos_sayisi),
        },
      ],
    };
  }, [veri]);

  const radarOption = useMemo<EChartsCoreOption>(() => {
    const sorular = veri?.soruAnalizleri ?? [];
    const katilimci = veri?.ozet.katilimciSayisi ?? 0;

    if (sorular.length >= 3) {
      const gostergeler = sorular.slice(0, 12).map((s) => ({
        name: `S${s.sira}`,
        max: 100,
      }));
      return {
        animation: true,
        animationDuration: 700,
        tooltip: { trigger: "item" },
        radar: {
          indicator: gostergeler,
          radius: "66%",
          splitNumber: 4,
          axisName: { fontSize: 11 },
        },
        series: [
          {
            name: "Doğru Oranı (%)",
            type: "radar",
            areaStyle: { color: "rgba(15, 118, 110, 0.22)" },
            lineStyle: { color: "#0F766E", width: 2 },
            itemStyle: { color: "#0F766E" },
            data: [
              {
                value: sorular.slice(0, 12).map((s) => s.dogru_orani),
                name: "Soru Başarı Oranı (%)",
              },
            ],
          },
        ],
      };
    }

    const toplamSoruKatilim = Math.max(1, sorular.length * Math.max(1, katilimci));
    const topDogru = sorular.reduce((t, s) => t + s.dogru_sayisi, 0);
    const topYanlis = sorular.reduce((t, s) => t + s.yanlis_sayisi, 0);
    const topBos = sorular.reduce((t, s) => t + s.bos_sayisi, 0);
    const topCevap = topDogru + topYanlis;

    return {
      animation: true,
      animationDuration: 700,
      tooltip: { trigger: "item" },
      radar: {
        indicator: [
          { name: "Başarı %", max: 100 },
          { name: "Doğru %", max: 100 },
          { name: "Yanlış %", max: 100 },
          { name: "Boş %", max: 100 },
          { name: "Cevaplama %", max: 100 },
        ],
        radius: "66%",
        axisName: { fontSize: 11 },
      },
      series: [
        {
          name: "Genel Dağılım (%)",
          type: "radar",
          areaStyle: { color: "rgba(15, 118, 110, 0.22)" },
          lineStyle: { color: "#0F766E", width: 2 },
          itemStyle: { color: "#0F766E" },
          data: [
            {
              value: [
                veri?.ozet.ortalamaBasari ?? 0,
                Math.round((topDogru / toplamSoruKatilim) * 100),
                Math.round((topYanlis / toplamSoruKatilim) * 100),
                Math.round((topBos / toplamSoruKatilim) * 100),
                Math.round((topCevap / toplamSoruKatilim) * 100),
              ],
              name: "Genel Profil (%)",
            },
          ],
        },
      ],
    };
  }, [veri]);

  const excelIndir = () => {
    if (!veri) return;
    const anonimMi = veri.sinav.kayit_tipi === "anonim";
    const katilimciSatirlari = veri.katilimcilar.map((k, idx) =>
      anonimMi
        ? {
            Sıra: idx + 1,
            Katılımcı: k.katilimci_etiketi,
            Puan: k.toplam_puan,
            "Maksimum Puan": k.maksimum_puan,
            "Başarı (%)": k.basari_yuzdesi,
            Doğru: k.dogru_sayisi,
            Yanlış: k.yanlis_sayisi,
            Boş: k.bos_sayisi,
            Teslim: k.teslim_at ? TARIH_SAAT_BICIMI.format(new Date(k.teslim_at)) : "",
          }
        : {
            Sıra: idx + 1,
            "Ad Soyad": k.katilimci_etiketi,
            "E-posta": k.eposta ?? "",
            Telefon: k.telefon ?? "",
            Rol: k.rol_grubu ? BOLIS_HEDEF_ROL_ETIKETLERI[k.rol_grubu] : "",
            Takım: k.takim_adi ?? "",
            Bölge: k.bolge_adi ?? "",
            Eczane: k.eczane_adi ?? "",
            Puan: k.toplam_puan,
            "Maksimum Puan": k.maksimum_puan,
            "Başarı (%)": k.basari_yuzdesi,
            Doğru: k.dogru_sayisi,
            Yanlış: k.yanlis_sayisi,
            Boş: k.bos_sayisi,
            Teslim: k.teslim_at ? TARIH_SAAT_BICIMI.format(new Date(k.teslim_at)) : "",
          },
    );

    const soruSatirlari = veri.soruAnalizleri.map((s) => ({
      "Soru No": s.sira,
      "Soru Metni": s.soru_metni,
      "Doğru Şık": s.dogru_secenek,
      Puan: s.puan,
      Doğru: s.dogru_sayisi,
      Yanlış: s.yanlis_sayisi,
      Boş: s.bos_sayisi,
      Cevaplanan: s.cevaplanan_sayisi,
      "Doğru Oranı (%)": s.dogru_orani,
    }));

    const wb = XLSX.utils.book_new();
    const wsKatilimci = XLSX.utils.json_to_sheet(
      katilimciSatirlari.length > 0 ? katilimciSatirlari : [{ Bilgi: "Henüz katılım yok" }],
    );
    const wsSoru = XLSX.utils.json_to_sheet(
      soruSatirlari.length > 0 ? soruSatirlari : [{ Bilgi: "Soru bulunmuyor" }],
    );
    XLSX.utils.book_append_sheet(wb, wsKatilimci, "Katılımcı Sonuçları");
    XLSX.utils.book_append_sheet(wb, wsSoru, "Soru Analizi");

    const temizAd = veri.sinav.baslik
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9ğüşöçı]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    XLSX.writeFile(wb, `bolis-rapor-${temizAd || "sinav"}.xlsx`);
  };

  if (yukleniyor) {
    return (
      <div className="mx-auto max-w-6xl p-6 text-sm text-[var(--tema-ikincil-metin)]">
        BOLIS sınav raporu hazırlanıyor…
      </div>
    );
  }

  if (hata || !veri) {
    return (
      <div className="mx-auto max-w-6xl space-y-3 p-6">
        <button
          type="button"
          onClick={() => router.push("/bolis")}
          className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-medium text-[var(--tema-ikincil-metin)] cursor-pointer"
        >
          <ArrowLeft size={13} />
          BOLIS Sınav Yönetimi
        </button>
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hata || "Rapor bulunamadı."}
        </p>
      </div>
    );
  }

  const anonimMi = veri.sinav.kayit_tipi === "anonim";

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pb-4 pt-9 sm:px-6 sm:pb-6 sm:pt-11">
      {/* Üst Başlık */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--tema-cizgi)] pb-4">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => router.push("/bolis")}
            className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-medium text-[var(--tema-ikincil-metin)] hover:text-[var(--tema-baslik)] cursor-pointer"
          >
            <ArrowLeft size={13} />
            BOLIS Sınav Yönetimi
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-[10px] leading-none font-semibold tracking-wider"
              style={{
                backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                borderColor: BOLIS_YUMUSAK_CIZGI,
                color: BOLIS_RENGI,
              }}
            >
              <Compass size={11} />
              BOLIS RAPOR
            </span>
            <span className="text-xs text-[var(--tema-ikincil-metin)]">
              {BOLIS_KAYIT_TIPI_ETIKETLERI[veri.sinav.kayit_tipi]}
            </span>
          </div>
          <h1 className="m-0 text-xl font-semibold text-[var(--tema-baslik)]">
            {veri.sinav.baslik}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={excelIndir}
            className="h-8 gap-1.5 text-xs"
          >
            <Download size={13} aria-hidden="true" />
            İndir (Excel)
          </Button>
          <YenileButonu yenileniyor={yukleniyor} onYenile={() => void yenile()} />
        </div>
      </div>

      {/* Genel Özet Kartları */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { etiket: "Tamamlanan Katılım", deger: veri.ozet.katilimciSayisi.toLocaleString("tr-TR") },
          {
            etiket: "Ortalama Puan",
            deger: `${veri.ozet.ortalamaPuan.toLocaleString("tr-TR")} / ${veri.ozet.maksimumPuan.toLocaleString("tr-TR")}`,
          },
          { etiket: "Ortalama Başarı", deger: `%${veri.ozet.ortalamaBasari}` },
          {
            etiket: "En Yüksek / En Düşük",
            deger: `${veri.ozet.enYuksekPuan} / ${veri.ozet.enDusukPuan}`,
          },
        ].map((k) => (
          <article
            key={k.etiket}
            className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-4 shadow-sm"
            style={{ borderTop: `2px solid ${BOLIS_RENGI}` }}
          >
            <span className="block text-[11px] font-medium text-[var(--tema-ikincil-metin)]">
              {k.etiket}
            </span>
            <strong className="mt-1 block text-lg font-semibold text-[var(--tema-baslik)]">
              {k.deger}
            </strong>
          </article>
        ))}
      </section>

      {/* Öne Çıkan Sorular */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            baslik: "En Çok Doğru Cevaplanan",
            soru: veri.oneCikanlar.enCokDogru,
            deger: veri.oneCikanlar.enCokDogru
              ? `${veri.oneCikanlar.enCokDogru.dogru_sayisi} doğru (%${veri.oneCikanlar.enCokDogru.dogru_orani})`
              : "—",
            renk: "#0F766E",
          },
          {
            baslik: "En Çok Yanlış Yapılan",
            soru: veri.oneCikanlar.enCokYanlis,
            deger: veri.oneCikanlar.enCokYanlis
              ? `${veri.oneCikanlar.enCokYanlis.yanlis_sayisi} yanlış`
              : "—",
            renk: "#E11D48",
          },
          {
            baslik: "En Çok Boş Bırakılan",
            soru: veri.oneCikanlar.enCokBos,
            deger: veri.oneCikanlar.enCokBos ? `${veri.oneCikanlar.enCokBos.bos_sayisi} boş` : "—",
            renk: "#64748B",
          },
          {
            baslik: "En Çok Cevaplanan",
            soru: veri.oneCikanlar.enCokCevaplanan,
            deger: veri.oneCikanlar.enCokCevaplanan
              ? `${veri.oneCikanlar.enCokCevaplanan.cevaplanan_sayisi} yanıt`
              : "—",
            renk: "#2563EB",
          },
        ].map((kart) => (
          <article
            key={kart.baslik}
            className="rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[var(--tema-ikincil-metin)]">
                {kart.baslik}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: kart.renk }}>
                {kart.deger}
              </span>
            </div>
            <p className="m-0 mt-1.5 line-clamp-2 text-xs font-medium text-[var(--tema-baslik)]">
              {kart.soru ? `Soru ${kart.soru.sira}: ${kart.soru.soru_metni}` : "Henüz veri yok"}
            </p>
          </article>
        ))}
      </section>

      {/* Animasyonlu ECharts Grafikleri: Sütun + Radar */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-4 shadow-sm">
          <h2 className="m-0 mb-2 text-[13px] font-semibold text-[var(--tema-baslik)]">
            Soru Bazlı Doğru / Yanlış / Boş Dağılımı (Sütun Grafik)
          </h2>
          <EChart option={sutunOption} height={290} indirAdi="bolis-sutun-grafik" />
        </div>

        <div className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-4 shadow-sm">
          <h2 className="m-0 mb-2 text-[13px] font-semibold text-[var(--tema-baslik)]">
            Bilgi Derinliği Başarı Profili (Radar Grafik)
          </h2>
          <EChart option={radarOption} height={290} indirAdi="bolis-radar-grafik" />
        </div>
      </section>

      {/* Soru Analizi Tablosu */}
      <section className="space-y-3 rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-[13px] font-semibold text-[var(--tema-baslik)]">
            Soru Bazlı Detay Analiz ({veri.soruAnalizleri.length} soru)
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["sira", "Sıraya Göre"],
                ["dogru", "En Çok Doğru"],
                ["yanlis", "En Çok Yanlış"],
                ["bos", "En Çok Boş"],
                ["cevaplanan", "En Çok Cevaplanan"],
              ] as const
            ).map(([deger, etiket]) => {
              const aktif = soruSiralama === deger;
              return (
                <button
                  key={deger}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() => setSoruSiralama(deger)}
                  className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] leading-none font-medium transition cursor-pointer ${
                    aktif
                      ? ""
                      : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)] hover:bg-[var(--tema-kontrol-hover)]"
                  }`}
                  style={
                    aktif
                      ? {
                          backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                          borderColor: BOLIS_YUMUSAK_CIZGI,
                          color: BOLIS_RENGI,
                        }
                      : undefined
                  }
                >
                  {etiket}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--tema-cizgi)]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[11px] text-[var(--tema-ikincil-metin)]">
                <th className="px-3 py-2">Soru</th>
                <th className="px-3 py-2">Doğru Şık</th>
                <th className="px-3 py-2 text-right">Doğru</th>
                <th className="px-3 py-2 text-right">Yanlış</th>
                <th className="px-3 py-2 text-right">Boş</th>
                <th className="px-3 py-2 text-right">Cevaplanan</th>
                <th className="px-3 py-2 text-right">Başarı %</th>
              </tr>
            </thead>
            <tbody>
              {siraliSorular.map((s) => (
                <tr key={s.soru_id} className="border-b border-[var(--tema-cizgi)] last:border-b-0">
                  <td className="max-w-md px-3 py-2 font-medium text-[var(--tema-baslik)]">
                    <span className="mr-1.5 font-semibold" style={{ color: BOLIS_RENGI }}>
                      S{s.sira}.
                    </span>
                    {s.soru_metni}
                  </td>
                  <td className="px-3 py-2 font-semibold text-emerald-700">{s.dogru_secenek}</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                    {s.dogru_sayisi}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-red-600">
                    {s.yanlis_sayisi}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--tema-ikincil-metin)]">
                    {s.bos_sayisi}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--tema-metin)]">
                    {s.cevaplanan_sayisi}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-[var(--tema-baslik)]">
                    %{s.dogru_orani}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Katılımcı Sonuçları Tablosu */}
      <section className="space-y-3 rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-[13px] font-semibold text-[var(--tema-baslik)]">
            Katılımcı Sonuçları ({filtrelenmisKatilimcilar.length})
          </h2>
          {!anonimMi && (
            <input
              type="search"
              placeholder="Ad, e-posta, takım, bölge veya eczane ara…"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="h-8 w-full rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] px-3 text-xs text-[var(--tema-metin)] sm:w-72"
            />
          )}
        </div>

        {filtrelenmisKatilimcilar.length === 0 ? (
          <p className="m-0 py-4 text-center text-xs text-[var(--tema-ikincil-metin)]">
            Henüz tamamlanmış katılım bulunmuyor.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--tema-cizgi)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[11px] text-[var(--tema-ikincil-metin)]">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">{anonimMi ? "Katılımcı" : "Ad Soyad"}</th>
                  {!anonimMi && <th className="px-3 py-2">Rol</th>}
                  {!anonimMi && <th className="px-3 py-2">İletişim</th>}
                  {!anonimMi && <th className="px-3 py-2">Takım / Bölge / Eczane</th>}
                  <th className="px-3 py-2 text-right">Puan</th>
                  <th className="px-3 py-2 text-right">Başarı</th>
                  <th className="px-3 py-2 text-right">D / Y / B</th>
                  <th className="px-3 py-2 text-right">Teslim</th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmisKatilimcilar.map((k, idx) => (
                  <tr
                    key={k.oturum_id}
                    className="border-b border-[var(--tema-cizgi)] last:border-b-0"
                  >
                    <td className="px-3 py-2 text-[var(--tema-ikincil-metin)]">{idx + 1}</td>
                    <td className="px-3 py-2 font-semibold text-[var(--tema-baslik)]">
                      {k.katilimci_etiketi}
                    </td>
                    {!anonimMi && (
                      <td className="px-3 py-2 text-[var(--tema-metin)]">
                        {k.rol_grubu ? BOLIS_HEDEF_ROL_ETIKETLERI[k.rol_grubu] : "—"}
                      </td>
                    )}
                    {!anonimMi && (
                      <td className="px-3 py-2 text-[var(--tema-ikincil-metin)]">
                        {[k.eposta, k.telefon].filter(Boolean).join(" · ") || "—"}
                      </td>
                    )}
                    {!anonimMi && (
                      <td className="px-3 py-2 text-[var(--tema-ikincil-metin)]">
                        {[k.takim_adi, k.bolge_adi, k.eczane_adi].filter(Boolean).join(" · ") ||
                          "—"}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right font-semibold text-[var(--tema-baslik)]">
                      {k.toplam_puan} / {k.maksimum_puan}
                    </td>
                    <td
                      className="px-3 py-2 text-right font-semibold"
                      style={{ color: BOLIS_RENGI }}
                    >
                      %{k.basari_yuzdesi}
                    </td>
                    <td className="px-3 py-2 text-right text-[var(--tema-ikincil-metin)]">
                      <span className="text-emerald-700">{k.dogru_sayisi}</span> /{" "}
                      <span className="text-red-600">{k.yanlis_sayisi}</span> / {k.bos_sayisi}
                    </td>
                    <td className="px-3 py-2 text-right text-[var(--tema-ikincil-metin)]">
                      {k.teslim_at ? TARIH_SAAT_BICIMI.format(new Date(k.teslim_at)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
