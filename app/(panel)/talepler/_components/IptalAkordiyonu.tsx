// app/talepler/_components/IptalAkordiyonu.tsx
//
// İptal edilen talepler — sol kolonun altında, kapalı akordiyonda.
//
// Neden burada: iptal edilen talep hiç içerik üretmedi, yani yayın tarafında hiç
// var olmadı. Mutfakta doğdu, mutfakta öldü — kaydı da mutfakta durur.
//
// Amaç geriye bakmak: "ne iptal ettik, HANGİ AŞAMADA kaldı, İŞ KİMDEYDİ". Bu
// yüzden sütunlar mevcut sistemdekiyle aynı tutuldu (S-3); prototipin sütun
// kümesi (üretim yöntemi + hedef rol) bu iki soruyu düşürüyordu.
//
// Tıklanabilir DEĞİL: kapalı iş, seçilmez, sağda şeridi açılmaz.
// Boşsa hiç çizilmez — iptali olmayan üreticinin sayfasında boş kutu durmasın.

"use client";

import { useState } from "react";
import { TALEP_TURU_KURALLARI } from "@/lib/uretici/yetenekler";
import { yayin_kodu } from "@/lib/utils/yayinKodu";
import { AsamaPill } from "@/components/pill";
import type { TalepSatiri } from "../_ureticiRolTypes";

interface Props {
  talepler: TalepSatiri[];
  formatTarih: (tarih: string | null) => string;
}

const baslikVer = (t: TalepSatiri) =>
  t.urun_adi !== "-" ? t.urun_adi : (TALEP_TURU_KURALLARI[t.egitim_turu]?.ad ?? t.egitim_turu);

export function IptalAkordiyonu({ talepler, formatTarih }: Props) {
  const [acik, setAcik] = useState(false);

  if (talepler.length === 0) return null;

  return (
    <div className="bg-[var(--tema-yerel-uretim-kart-01)] border border-[var(--tema-yerel-uretim-cizgi-01)] rounded-xl overflow-hidden">
      <div
        onClick={() => setAcik((a) => !a)}
        className="px-5 py-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-[var(--tema-yerel-uretim-sayfa-zemini-01)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--tema-yerel-uretim-ana-metin-01)]">İptal Edilen Talepler</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "var(--tema-yerel-uretim-islevsel-zemin-09)", color: "var(--tema-yerel-uretim-islevsel-metin-08)", border: "0.5px solid var(--tema-yerel-uretim-islevsel-cizgi-07)" }}
          >
            {talepler.length}
          </span>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--tema-yerel-uretim-yardimci-metin-06)"
          strokeWidth="2"
          width="16"
          height="16"
          className="transition-transform duration-200 flex-shrink-0"
          style={{ transform: acik ? "rotate(180deg)" : "none" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {acik && (
        // Sol kolon dar; tablo kesilmek yerine yatay kayar.
        <div className="border-t border-[var(--tema-yerel-uretim-cizgi-03)] overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--tema-yerel-uretim-cizgi-03)] bg-[var(--tema-yerel-uretim-sayfa-zemini-01)]">
                <th className="text-left px-4 py-2.5 text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-medium text-xs uppercase">ID</th>
                <th className="text-left px-3 py-2.5 text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-medium text-xs uppercase">Ürün / Tür</th>
                <th className="text-left px-3 py-2.5 text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-medium text-xs uppercase whitespace-nowrap">İptal Aşaması</th>
                <th className="text-left px-3 py-2.5 text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-medium text-xs uppercase whitespace-nowrap">İçerik Üreticisi</th>
                <th className="text-left px-3 py-2.5 text-[var(--tema-yerel-uretim-yardimci-metin-02)] font-medium text-xs uppercase">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {talepler.map((t) => (
                <tr key={t.talep_id} className="border-b border-[var(--tema-yerel-uretim-cizgi-02)]">
                  <td className="px-4 py-3 text-[var(--tema-yerel-uretim-yardimci-metin-01)] text-xs whitespace-nowrap">
                    {yayin_kodu(t.firma_adi, t.talep_no)}
                  </td>
                  <td className="px-3 py-3 text-[var(--tema-yerel-uretim-yardimci-metin-01)]">{baslikVer(t)}</td>
                  <td className="px-3 py-3"><AsamaPill asama={t.asama} ogrenmeAraciTuru={t.ogrenme_araci_turu} /></td>
                  <td className="px-3 py-3 text-[var(--tema-yerel-uretim-yardimci-metin-01)] text-xs">
                    {t.iu_ad_soyad ?? <span className="text-[var(--tema-yerel-uretim-yardimci-metin-07)]">—</span>}
                  </td>
                  <td className="px-3 py-3 text-[var(--tema-yerel-uretim-yardimci-metin-01)] text-xs whitespace-nowrap">{formatTarih(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
