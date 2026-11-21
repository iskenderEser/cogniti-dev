"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { CheckCircle2, ChevronDown, Download, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BOLIS_RENGI,
  BOLIS_YUMUSAK_CIZGI,
  BOLIS_YUMUSAK_ZEMIN,
  type BolisSecenek,
} from "@/lib/bolis/tipler";
import { DESTEKLENEN_UZANTILAR, dosyadanTaslaklar } from "@/lib/soru/dosyadanGetir";

export interface BolisSoruTaslagi {
  id: string;
  soru_metni: string;
  secenekler: BolisSecenek[];
  dogru_secenek: string;
  puan: number;
}

export function yeniSoruTaslagiOlustur(index: number): BolisSoruTaslagi {
  return {
    id: `soru-${Date.now()}-${index}`,
    soru_metni: "",
    secenekler: [
      { anahtar: "A", metin: "" },
      { anahtar: "B", metin: "" },
      { anahtar: "C", metin: "" },
      { anahtar: "D", metin: "" },
    ],
    dogru_secenek: "",
    puan: 10,
  };
}

export function BolisSoruEditoru({
  sorular,
  onChange,
  saltOkunur = false,
}: {
  sorular: BolisSoruTaslagi[];
  onChange: (yeni: BolisSoruTaslagi[]) => void;
  saltOkunur?: boolean;
}) {
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [secenekSayisi, setSecenekSayisi] = useState(4);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosyaMesaji, setDosyaMesaji] = useState<{ tur: "bilgi" | "hata"; metin: string } | null>(
    null,
  );
  const toplamPuan = sorular.reduce((t, s) => t + (Number.isFinite(s.puan) ? s.puan : 0), 0);

  const sorulariIndir = () => {
    const doluSorular = sorular.filter((s) => s.soru_metni.trim().length > 0);
    const maksSecenek = Math.max(
      secenekSayisi,
      ...doluSorular.map((s) => s.secenekler.length),
    );
    const basliklar = [
      "Soru",
      ...Array.from({ length: maksSecenek }, (_, i) => String.fromCharCode(65 + i)),
      "Doğru",
    ];
    const satirlar =
      doluSorular.length > 0
        ? doluSorular.map((s) => [
            s.soru_metni.trim(),
            ...Array.from({ length: maksSecenek }, (_, i) => s.secenekler[i]?.metin.trim() ?? ""),
            s.dogru_secenek,
          ])
        : [
            [
              "Örnek soru metni buraya yazılır?",
              ...Array.from({ length: maksSecenek }, (_, i) => `${String.fromCharCode(65 + i)} seçeneği`),
              "A",
            ],
          ];
    const ws = XLSX.utils.aoa_to_sheet([basliklar, ...satirlar]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sorular");
    XLSX.writeFile(wb, doluSorular.length > 0 ? "bolis-sorular.xlsx" : "bolis-soru-sablonu.xlsx");
  };

  const dosyadanYukle = async (dosya: File) => {
    setYukleniyor(true);
    setDosyaMesaji(null);
    try {
      const sonuc = await dosyadanTaslaklar(dosya, secenekSayisi);
      if (!sonuc.ok) {
        setDosyaMesaji({ tur: "hata", metin: sonuc.hata });
        return;
      }

      const mevcutBosTekSoru =
        sorular.length === 1 &&
        !sorular[0].soru_metni.trim() &&
        sorular[0].secenekler.every((o) => !o.metin.trim());
      const temelListe = mevcutBosTekSoru ? [] : sorular;
      const kalanKontenjan = Math.max(0, 100 - temelListe.length);
      if (kalanKontenjan === 0) {
        setDosyaMesaji({ tur: "hata", metin: "En fazla 100 soru ekleyebilirsiniz." });
        return;
      }

      const simdi = Date.now();
      const yeniSorular: BolisSoruTaslagi[] = sonuc.taslaklar
        .slice(0, kalanKontenjan)
        .map((t, idx) => {
          const ham = t.secenekler.slice(0, 10);
          while (ham.length < 2) ham.push("");
          const secenekler: BolisSecenek[] = ham.map((metin, k) => ({
            anahtar: String.fromCharCode(65 + k),
            metin,
          }));
          const dogruSecenek =
            t.dogru !== null && t.dogru >= 0 && t.dogru < secenekler.length
              ? secenekler[t.dogru].anahtar
              : "";
          return {
            id: `dosya-${simdi}-${idx}`,
            soru_metni: t.soru_metni,
            secenekler,
            dogru_secenek: dogruSecenek,
            puan: 10,
          };
        });

      onChange([...temelListe, ...yeniSorular]);
      const kirpilmaNotu =
        sonuc.taslaklar.length > kalanKontenjan
          ? ` (100 soru sınırı nedeniyle ilk ${kalanKontenjan} soru alındı.)`
          : "";
      setDosyaMesaji({
        tur: "bilgi",
        metin: `${yeniSorular.length} soru dosyadan aktarıldı.${kirpilmaNotu}${sonuc.uyari ? ` ${sonuc.uyari}` : ""}`,
      });
    } finally {
      setYukleniyor(false);
      if (dosyaRef.current) dosyaRef.current.value = "";
    }
  };

  const soruGuncelle = (idx: number, guncel: Partial<BolisSoruTaslagi>) => {
    onChange(sorular.map((s, i) => (i === idx ? { ...s, ...guncel } : s)));
  };

  const secenekEkle = (soruIdx: number) => {
    const s = sorular[soruIdx];
    if (!s || s.secenekler.length >= 10) return;
    const anahtar = String.fromCharCode(65 + s.secenekler.length);
    soruGuncelle(soruIdx, {
      secenekler: [...s.secenekler, { anahtar, metin: "" }],
    });
  };

  const secenekSil = (soruIdx: number, optIdx: number) => {
    const s = sorular[soruIdx];
    if (!s || s.secenekler.length <= 2) return;
    const kalan = s.secenekler
      .filter((_, i) => i !== optIdx)
      .map((opt, i) => ({ anahtar: String.fromCharCode(65 + i), metin: opt.metin }));
    const dogruHalaVar = kalan.some((o) => o.anahtar === s.dogru_secenek);
    soruGuncelle(soruIdx, {
      secenekler: kalan,
      dogru_secenek: dogruHalaVar ? s.dogru_secenek : "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium text-[var(--tema-ikincil-metin)]">
          Toplam <strong className="text-[var(--tema-baslik)]">{sorular.length} / 100</strong> soru ·
          Toplam Puan:{" "}
          <strong style={{ color: BOLIS_RENGI }}>{toplamPuan.toLocaleString("tr-TR")}</strong>
        </div>
        {!saltOkunur && sorular.length < 100 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="relative inline-flex items-center">
              <select
                aria-label="Dosyadan yükleme şık sayısı"
                value={secenekSayisi}
                onChange={(e) => setSecenekSayisi(Number(e.target.value))}
                className="h-8 appearance-none rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-zemin)] pl-2.5 pr-7 text-[11px] font-medium text-[var(--tema-metin)] cursor-pointer"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} Şık
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                aria-hidden="true"
                className="pointer-events-none absolute right-2 text-[var(--tema-ikincil-metin)]"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={yukleniyor}
              className="h-8 gap-1.5 text-xs"
              title="Desteklenen türler: .xlsx, .docx, .txt, .pptx, .pdf"
              onClick={() => dosyaRef.current?.click()}
            >
              <Upload size={13} aria-hidden="true" />
              {yukleniyor ? "Okunuyor..." : "Dosyadan Toplu Yükle"}
            </Button>
            <input
              ref={dosyaRef}
              type="file"
              accept={DESTEKLENEN_UZANTILAR}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void dosyadanYukle(f);
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => onChange([...sorular, yeniSoruTaslagiOlustur(sorular.length + 1)])}
            >
              <Plus size={14} aria-hidden="true" />
              Soru Ekle
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={sorulariIndir}
            >
              <Download size={13} aria-hidden="true" />
              Soruları İndir
            </Button>
          </div>
        )}
      </div>

      {dosyaMesaji && (
        <p
          role={dosyaMesaji.tur === "hata" ? "alert" : "status"}
          className={`m-0 rounded-lg border px-3 py-2 text-xs font-medium ${
            dosyaMesaji.tur === "hata"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {dosyaMesaji.metin}
        </p>
      )}

      {sorular.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-6 text-center text-xs text-[var(--tema-ikincil-metin)]">
          Henüz soru eklenmedi. En fazla 100 çoktan seçmeli soru (her soruda 2–10 seçenek) ekleyebilirsiniz.
        </div>
      ) : (
        <div className="space-y-4">
          {sorular.map((soru, sIdx) => (
            <div
              key={soru.id}
              className="space-y-3 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex h-[22px] items-center rounded-full border px-2 text-[10.5px] leading-none font-semibold"
                    style={{
                      backgroundColor: BOLIS_YUMUSAK_ZEMIN,
                      borderColor: BOLIS_YUMUSAK_CIZGI,
                      color: BOLIS_RENGI,
                    }}
                  >
                    Soru {sIdx + 1}
                  </span>
                  {!soru.dogru_secenek && (
                    <span className="inline-flex h-[22px] items-center rounded-full border border-amber-300 bg-amber-50 px-2 text-[10px] leading-none font-medium text-amber-800">
                      Doğru şık seçilmedi
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--tema-ikincil-metin)]">
                    Puan
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      step="1"
                      disabled={saltOkunur}
                      value={soru.puan}
                      onChange={(e) =>
                        soruGuncelle(sIdx, { puan: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="h-8 w-20 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] px-2 text-center text-xs font-bold text-[var(--tema-baslik)]"
                    />
                  </label>
                  {!saltOkunur && (
                    <button
                      type="button"
                      aria-label={`Soru ${sIdx + 1} sil`}
                      onClick={() => onChange(sorular.filter((_, i) => i !== sIdx))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={2}
                disabled={saltOkunur}
                placeholder={`${sIdx + 1}. soru metnini yazın…`}
                value={soru.soru_metni}
                onChange={(e) => soruGuncelle(sIdx, { soru_metni: e.target.value })}
                className="w-full rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] p-2.5 text-sm text-[var(--tema-metin)]"
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--tema-ikincil-metin)]">
                  <span>Seçenekler ({soru.secenekler.length} / 10) — Doğru şıkkı işaretleyin</span>
                  {!saltOkunur && soru.secenekler.length < 10 && (
                    <button
                      type="button"
                      onClick={() => secenekEkle(sIdx)}
                      className="border-0 bg-transparent p-0 text-[11px] font-bold hover:underline cursor-pointer"
                      style={{ color: BOLIS_RENGI }}
                    >
                      + Seçenek Ekle
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {soru.secenekler.map((opt, optIdx) => {
                    const dogru = soru.dogru_secenek === opt.anahtar;
                    return (
                      <div
                        key={opt.anahtar}
                        className={`flex items-center gap-2 rounded-lg border p-1.5 ${
                          dogru
                            ? "border-emerald-500 bg-emerald-50/70"
                            : "border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)]"
                        }`}
                      >
                        <button
                          type="button"
                          disabled={saltOkunur}
                          aria-pressed={dogru}
                          title="Doğru cevap olarak işaretle"
                          onClick={() => soruGuncelle(sIdx, { dogru_secenek: opt.anahtar })}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-extrabold transition cursor-pointer ${
                            dogru
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)]"
                          }`}
                        >
                          {dogru ? <CheckCircle2 size={14} /> : opt.anahtar}
                        </button>
                        <input
                          type="text"
                          disabled={saltOkunur}
                          placeholder={`${opt.anahtar} seçeneği`}
                          value={opt.metin}
                          onChange={(e) => {
                            const yeniSecenekler = soru.secenekler.map((o, i) =>
                              i === optIdx ? { ...o, metin: e.target.value } : o,
                            );
                            soruGuncelle(sIdx, { secenekler: yeniSecenekler });
                          }}
                          className="h-7 min-w-0 flex-1 border-0 bg-transparent text-xs text-[var(--tema-metin)] outline-none"
                        />
                        {!saltOkunur && soru.secenekler.length > 2 && (
                          <button
                            type="button"
                            aria-label={`${opt.anahtar} seçeneğini sil`}
                            onClick={() => secenekSil(sIdx, optIdx)}
                            className="border-0 bg-transparent p-1 text-[var(--tema-ikincil-metin)] hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!saltOkunur && sorular.length > 0 && sorular.length < 100 && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => onChange([...sorular, yeniSoruTaslagiOlustur(sorular.length + 1)])}
          >
            <Plus size={14} aria-hidden="true" />
            Yeni Soru Ekle ({sorular.length + 1})
          </Button>
        </div>
      )}
    </div>
  );
}
