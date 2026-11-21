"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { ChevronDown, Download, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BOLIS_HEDEF_ROLLER,
  BOLIS_HEDEF_ROL_ETIKETLERI,
  type BolisHedefRol,
} from "@/lib/bolis/tipler";

export interface BolisDavetliSatiri {
  ad: string;
  soyad: string;
  eposta: string;
  telefon: string;
  rol_grubu: BolisHedefRol | "";
  takim_adi: string;
  bolge_adi: string;
  eczane_adi: string;
}

const BOS_SATIR: BolisDavetliSatiri = {
  ad: "",
  soyad: "",
  eposta: "",
  telefon: "",
  rol_grubu: "",
  takim_adi: "",
  bolge_adi: "",
  eczane_adi: "",
};

function rolMetnindenCoz(deger: string): BolisHedefRol | "" {
  const s = deger.trim().toLocaleLowerCase("tr-TR");
  if (!s) return "";
  if (s === "utt" || s.includes("temsilci")) return "utt";
  if (s === "bm" || s.includes("bölge")) return "bm";
  if (s === "eczane_teknisyeni" || s.includes("teknisyen")) return "eczane_teknisyeni";
  if (s === "eczaci" || s.includes("eczacı")) return "eczaci";
  if (s === "eczanem" || s.includes("danışan") || s.includes("danisan")) return "eczanem";
  return "";
}

export function BolisDavetliAlani({
  davetliler,
  onChange,
  saltOkunur = false,
}: {
  davetliler: BolisDavetliSatiri[];
  onChange: (yeni: BolisDavetliSatiri[]) => void;
  saltOkunur?: boolean;
}) {
  const dosyaRef = useRef<HTMLInputElement>(null);
  const [yeniKisi, setYeniKisi] = useState<BolisDavetliSatiri>(BOS_SATIR);
  const [bilgi, setBilgi] = useState("");

  const kisiEkle = () => {
    if (!yeniKisi.ad.trim() || !yeniKisi.soyad.trim()) {
      setBilgi("Ad ve soyad alanları zorunludur.");
      return;
    }
    setBilgi("");
    onChange([
      ...davetliler,
      {
        ...yeniKisi,
        ad: yeniKisi.ad.trim(),
        soyad: yeniKisi.soyad.trim(),
        eposta: yeniKisi.eposta.trim().toLowerCase(),
        telefon: yeniKisi.telefon.trim(),
        takim_adi: yeniKisi.takim_adi.trim(),
        bolge_adi: yeniKisi.bolge_adi.trim(),
        eczane_adi: yeniKisi.eczane_adi.trim(),
      },
    ]);
    setYeniKisi(BOS_SATIR);
  };

  const sablonIndir = () => {
    const satirlar = [
      {
        Ad: "Ayşe",
        Soyad: "Yılmaz",
        Eposta: "ayse.yilmaz@ornek.com",
        Telefon: "05320000000",
        Rol: "Temsilci",
        Takim: "Marmara-1",
        Bolge: "İstanbul",
        Eczane: "",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(satirlar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Katilimcilar");
    XLSX.writeFile(wb, "bolis-katilimci-sablonu.xlsx");
  };

  const topluYukle = async (dosya: File) => {
    try {
      const buf = await dosya.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ilkSayfa = wb.SheetNames[0];
      if (!ilkSayfa) {
        setBilgi("Excel dosyasında sayfa bulunamadı.");
        return;
      }
      const hamSatirlar = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[ilkSayfa], {
        defval: "",
      });
      const eklenenler: BolisDavetliSatiri[] = [];
      for (const r of hamSatirlar) {
        const oku = (anahtarlar: string[]) => {
          for (const k of Object.keys(r)) {
            const norm = k.trim().toLocaleLowerCase("tr-TR");
            if (anahtarlar.some((a) => norm.includes(a))) {
              return String(r[k] ?? "").trim();
            }
          }
          return "";
        };
        const ad = oku(["ad"]);
        const soyad = oku(["soyad"]);
        if (!ad || !soyad) continue;
        eklenenler.push({
          ad,
          soyad,
          eposta: oku(["eposta", "e-posta", "mail"]).toLowerCase(),
          telefon: oku(["tel", "gsm", "cep"]),
          rol_grubu: rolMetnindenCoz(oku(["rol", "hedef"])),
          takim_adi: oku(["takim", "takım"]),
          bolge_adi: oku(["bolge", "bölge"]),
          eczane_adi: oku(["eczane"]),
        });
      }
      if (eklenenler.length === 0) {
        setBilgi("Geçerli katılımcı satırı bulunamadı (Ad ve Soyad sütunları gerekli).");
        return;
      }
      onChange([...davetliler, ...eklenenler]);
      setBilgi(`${eklenenler.length} katılımcı listeye eklendi.`);
    } catch {
      setBilgi("Excel dosyası okunamadı.");
    } finally {
      if (dosyaRef.current) dosyaRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="m-0 text-xs font-extrabold text-[var(--tema-baslik)]">
            Hazır Katılımcı Listesi ({davetliler.length} kişi)
          </h4>
          <p className="m-0 text-[11px] text-[var(--tema-ikincil-metin)]">
            Manuel ekleyebilir veya Excel (.xlsx / .csv) ile toplu yükleyebilirsiniz.
          </p>
        </div>
        {!saltOkunur && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              title="Excel şablonunu indir"
              onClick={sablonIndir}
            >
              <Download size={13} aria-hidden="true" />
              İndir
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => dosyaRef.current?.click()}
            >
              <Upload size={13} aria-hidden="true" />
              Toplu Yükle
            </Button>
            <input
              ref={dosyaRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void topluYukle(f);
              }}
            />
          </div>
        )}
      </div>

      {!saltOkunur && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Ad *"
            value={yeniKisi.ad}
            onChange={(e) => setYeniKisi((k) => ({ ...k, ad: e.target.value }))}
            className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] px-2.5 text-xs text-[var(--tema-metin)]"
          />
          <input
            type="text"
            placeholder="Soyad *"
            value={yeniKisi.soyad}
            onChange={(e) => setYeniKisi((k) => ({ ...k, soyad: e.target.value }))}
            className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] px-2.5 text-xs text-[var(--tema-metin)]"
          />
          <input
            type="email"
            placeholder="E-posta"
            value={yeniKisi.eposta}
            onChange={(e) => setYeniKisi((k) => ({ ...k, eposta: e.target.value }))}
            className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] px-2.5 text-xs text-[var(--tema-metin)]"
          />
          <input
            type="tel"
            placeholder="Telefon"
            value={yeniKisi.telefon}
            onChange={(e) => setYeniKisi((k) => ({ ...k, telefon: e.target.value }))}
            className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] px-2.5 text-xs text-[var(--tema-metin)]"
          />
          <div className="relative flex items-center">
            <select
              value={yeniKisi.rol_grubu}
              onChange={(e) =>
                setYeniKisi((k) => ({ ...k, rol_grubu: e.target.value as BolisHedefRol | "" }))
              }
              className="h-9 w-full appearance-none rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] pl-2.5 pr-8 text-xs text-[var(--tema-metin)] cursor-pointer"
            >
              <option value="">Rol seçin (opsiyonel)</option>
              {BOLIS_HEDEF_ROLLER.map((r) => (
                <option key={r} value={r}>
                  {BOLIS_HEDEF_ROL_ETIKETLERI[r]}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 text-[var(--tema-ikincil-metin)]"
            />
          </div>
          <input
            type="text"
            placeholder="Takım adı"
            value={yeniKisi.takim_adi}
            onChange={(e) => setYeniKisi((k) => ({ ...k, takim_adi: e.target.value }))}
            className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] px-2.5 text-xs text-[var(--tema-metin)]"
          />
          <input
            type="text"
            placeholder="Bölge / Eczane adı"
            value={yeniKisi.bolge_adi || yeniKisi.eczane_adi}
            onChange={(e) => {
              const v = e.target.value;
              setYeniKisi((k) =>
                k.rol_grubu === "eczaci" || k.rol_grubu === "eczane_teknisyeni"
                  ? { ...k, eczane_adi: v, bolge_adi: "" }
                  : { ...k, bolge_adi: v, eczane_adi: "" },
              );
            }}
            className="h-9 rounded-lg border border-[var(--tema-kontrol-cizgi)] bg-[var(--tema-yuzey)] px-2.5 text-xs text-[var(--tema-metin)]"
          />
          <Button type="button" size="sm" variant="outline" className="h-9 gap-1 text-xs" onClick={kisiEkle}>
            <Plus size={13} aria-hidden="true" />
            Listeye Ekle
          </Button>
        </div>
      )}

      {bilgi && <p className="m-0 text-[11px] font-semibold text-[var(--tema-kontrol-eylem)]">{bilgi}</p>}

      {davetliler.length > 0 && (
        <div className="max-h-56 overflow-auto rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[11px] text-[var(--tema-ikincil-metin)]">
                <th className="px-2.5 py-2">Ad Soyad</th>
                <th className="px-2.5 py-2">E-posta / Tel</th>
                <th className="px-2.5 py-2">Rol</th>
                <th className="px-2.5 py-2">Kurum / Ekip</th>
                {!saltOkunur && <th className="w-10 px-2 py-2" />}
              </tr>
            </thead>
            <tbody>
              {davetliler.map((d, idx) => (
                <tr key={`${d.ad}-${d.soyad}-${idx}`} className="border-b border-[var(--tema-cizgi)] last:border-b-0">
                  <td className="px-2.5 py-1.5 font-semibold text-[var(--tema-baslik)]">
                    {d.ad} {d.soyad}
                  </td>
                  <td className="px-2.5 py-1.5 text-[var(--tema-ikincil-metin)]">
                    {[d.eposta, d.telefon].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-2.5 py-1.5">
                    {d.rol_grubu ? BOLIS_HEDEF_ROL_ETIKETLERI[d.rol_grubu] : "—"}
                  </td>
                  <td className="px-2.5 py-1.5 text-[var(--tema-ikincil-metin)]">
                    {[d.takim_adi, d.bolge_adi, d.eczane_adi].filter(Boolean).join(" · ") || "—"}
                  </td>
                  {!saltOkunur && (
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        aria-label="Katılımcıyı çıkar"
                        onClick={() => onChange(davetliler.filter((_, i) => i !== idx))}
                        className="border-0 bg-transparent p-1 text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
