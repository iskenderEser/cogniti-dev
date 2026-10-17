// app/talepler/_components/UretimSeridi.tsx
//
// ÜRETİM ŞERİDİ — sayfanın omurgası.
//
// Talep → Senaryo → seçilen öğrenme aracı → Soru Seti → Yayın. Beş adım her talepte çizilir; o
// üretim yönteminde hiç üretilmeyecek adımlar kırmızı ve işleme kapalı gelir
// (S-1). Kullanıcı hangi yöntemi seçerse seçsin sürecin tamamını görür.
//
// Hal hesabı burada YAPILMAZ — lib/utils/uretimSeridi.ts'ten hazır gelir. İçerik
// de burada üretilmez: adımın kutusunu çağıran çizer (icerikCiz). Bu dosya yalnız
// şeridin kendisini ve aç/kapa davranışını sahiplenir.
//
// Durum metinleri sözlükten (DurumPill) okunur. Burada sabit yazılan iki metin
// var ve ikisinin de sözlükte karşılığı YOKTUR — biri henüz başlamamış, diğeri
// hiç başlamayacak işin hâli.

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Pill, DurumPill, NOTR_RENK } from "@/components/pill";
import type { Adim, AdimAnahtari } from "@/lib/utils/uretimSeridi";
import type { OgrenmeAraciTuru } from "@/lib/ogrenmeAraci/tipler";

/** Sırası gelmemiş adım — sözlükte karşılığı yok (henüz başlamamış iş). */
const BEKLENIYOR = "Bekleniyor";
/** Bu varyantta İÜ'nün üretmeyeceği adım — sistem geçiriyor (S-1). */
const ASAMA_GECILDI = "Bu aşama geçildi";
/** Aksiyon kırmızısı — kapalı adımın rengi (İskender 28.07). */
const KAPALI_RENK = { bg: "var(--tema-yerel-uretim-islevsel-zemin-18)", metin: "var(--tema-yerel-uretim-vurgu-metin-01)", kenar: "var(--tema-yerel-uretim-islevsel-cizgi-07)" };

interface Props {
  adimlar: Adim[];
  rol: string;
  formatTarih: (tarih: string | null) => string;
  /** Adımın açılınca görünecek içeriği. null dönerse kutu hiç çizilmez. */
  icerikCiz: (anahtar: AdimAnahtari) => ReactNode;
  /** Şerit hangi talebe ait — talep değişince açık kutu aktif adıma sıfırlanır. */
  talepId: string;
  ogrenmeAraciTuru: OgrenmeAraciTuru;
}

function daireStili(hal: Adim["hal"]): React.CSSProperties {
  switch (hal) {
    case "tamam":
      return { background: "var(--tema-yerel-uretim-islevsel-zemin-19)", borderColor: "var(--tema-yerel-uretim-islevsel-cizgi-15)" };
    case "aktif":
      return { background: "var(--tema-yerel-uretim-eylem-zemin-06)", borderColor: "var(--tema-yerel-uretim-cizgi-25)", boxShadow: "0 0 0 4px var(--tema-yerel-uretim-golge-03)" };
    case "hazir":
      return { background: "var(--tema-yerel-uretim-kart-02)", borderColor: "var(--tema-yerel-uretim-islevsel-cizgi-15)" };
    case "kapali":
      return { background: "var(--tema-yerel-uretim-islevsel-zemin-20)", borderColor: "var(--tema-yerel-uretim-islevsel-cizgi-16)" };
    default:
      return { background: "var(--tema-yerel-uretim-sayfa-zemini-12)", borderColor: "var(--tema-yerel-uretim-cizgi-26)" };
  }
}

function kartStili(hal: Adim["hal"]): React.CSSProperties {
  if (hal === "aktif") return { background: "var(--tema-yerel-uretim-sayfa-zemini-03)", borderColor: "var(--tema-yerel-uretim-cizgi-27)", boxShadow: "0 8px 22px var(--tema-yerel-uretim-golge-04)" };
  if (hal === "tamam") return { background: "var(--tema-yerel-uretim-kart-02)", borderColor: "var(--tema-yerel-uretim-islevsel-cizgi-17)" };
  if (hal === "hazir") return { background: "var(--tema-yerel-uretim-islevsel-zemin-21)", borderColor: "var(--tema-yerel-uretim-islevsel-cizgi-02)" };
  if (hal === "kapali") return { background: "var(--tema-yerel-uretim-islevsel-zemin-22)", borderColor: "var(--tema-yerel-uretim-islevsel-cizgi-18)" };
  return { background: "var(--tema-yerel-uretim-sayfa-zemini-13)", borderColor: "var(--tema-yerel-uretim-cizgi-28)" };
}

export function UretimSeridi({ adimlar, rol, formatTarih, icerikCiz, talepId, ogrenmeAraciTuru }: Props) {
  const router = useRouter();

  // E-4: yalnız AKTİF adımın kutusu açık gelir; tamamlananlar kapalı başlar.
  const aktifAnahtar = adimlar.find((a) => a.hal === "aktif")?.anahtar ?? null;
  const [acik, setAcik] = useState<AdimAnahtari | null>(aktifAnahtar);

  // Başka bir talep seçilince açık kutu yeni talebin aktif adımına döner.
  useEffect(() => {
    setAcik(aktifAnahtar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talepId]);

  return (
    <div className="flex flex-col">
      {adimlar.map((adim, i) => {
        const sonuncu = i === adimlar.length - 1;
        // Kapalı adım hiçbir koşulda açılmaz (S-1). Yayına alma bu sayfaya
        // taşınmadı; Yayın adımı kendi sayfasına götürür (D-3).
        const yolaGider = !!adim.yol && adim.hal !== "kapali";
        const acilabilir = adim.hal !== "kapali" && !adim.yol;
        const icerik = acilabilir && acik === adim.anahtar ? icerikCiz(adim.anahtar) : null;

        const tikla = () => {
          if (yolaGider) router.push(adim.yol!);
          else if (acilabilir) setAcik((o) => (o === adim.anahtar ? null : adim.anahtar));
        };

        return (
          <div key={adim.anahtar} className="flex gap-3">
            {/* Daire + bağlantı çizgisi */}
            <div className="flex w-7 shrink-0 flex-col items-center">
              <span
                className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-extrabold transition-all"
                style={daireStili(adim.hal)}
              >
                {adim.hal === "tamam" ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="var(--tema-yerel-uretim-ters-metin-02)" strokeWidth="3" className="h-3.5 w-3.5"><path d="m5 12 4 4L19 6" /></svg>
                ) : adim.hal === "hazir" ? (
                  <span className="text-[var(--tema-yerel-uretim-islevsel-metin-01)]">✓</span>
                ) : adim.hal === "kapali" ? (
                  <span className="text-[var(--tema-yerel-uretim-islevsel-metin-22)]">—</span>
                ) : (
                  <span className={adim.hal === "aktif" ? "text-[var(--tema-yerel-uretim-ters-metin-01)]" : "text-[var(--tema-yerel-uretim-yardimci-metin-16)]"}>{i + 1}</span>
                )}
              </span>
              {!sonuncu && (
                <span
                  className="my-1 min-h-4 w-0.5 flex-1"
                  style={{ background: adim.hal === "tamam" ? "var(--tema-yerel-uretim-islevsel-zemin-23)" : "var(--tema-yerel-uretim-sayfa-zemini-14)" }}
                />
              )}
            </div>

            {/* Gövde */}
            <div className={`min-w-0 flex-1 ${sonuncu ? "" : "pb-3"}`}>
              <div className="overflow-hidden rounded-xl border transition-all" style={kartStili(adim.hal)}>
              <button
                type="button"
                onClick={tikla}
                disabled={!yolaGider && !acilabilir}
                aria-expanded={acilabilir ? acik === adim.anahtar : undefined}
                className="flex w-full flex-wrap items-center gap-2 px-3 py-2.5 text-left disabled:cursor-default enabled:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--tema-yerel-uretim-odak-01)]"
              >
                <span
                  className="text-sm font-extrabold"
                  style={{ color: adim.hal === "ileri" ? "var(--tema-yerel-uretim-yardimci-metin-21)" : adim.hal === "kapali" ? "var(--tema-yerel-uretim-islevsel-metin-23)" : "var(--tema-yerel-uretim-ana-metin-19)" }}
                >
                  {adim.etiket}
                </span>

                {adim.hal === "kapali" ? (
                  <Pill renk={KAPALI_RENK}>{ASAMA_GECILDI}</Pill>
                ) : adim.hal === "ileri" ? (
                  <Pill renk={NOTR_RENK}>{BEKLENIYOR}</Pill>
                ) : adim.durum_kodu ? (
                  <DurumPill kod={adim.durum_kodu} rol={rol} tarih={adim.tarih} girdi={{ ogrenmeAraciTuru }} />
                ) : null}

                {adim.tarih && adim.hal !== "kapali" && (
                  <span className="ml-auto text-[10px] font-semibold text-[var(--tema-yerel-uretim-yardimci-metin-22)]">{formatTarih(adim.tarih)}</span>
                )}
                {(yolaGider || acilabilir) && (
                  <span
                    aria-hidden="true"
                    className="ml-auto text-base font-bold text-[var(--tema-yerel-uretim-yardimci-metin-23)] transition-transform"
                    style={{ transform: acilabilir && acik === adim.anahtar ? "rotate(90deg)" : undefined }}
                  >›</span>
                )}
              </button>

              {icerik && (
                <div className="border-t border-[var(--tema-yerel-uretim-cizgi-29)] bg-[var(--tema-yerel-uretim-kart-01)] px-3.5 py-3.5">
                  {icerik}
                </div>
              )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
