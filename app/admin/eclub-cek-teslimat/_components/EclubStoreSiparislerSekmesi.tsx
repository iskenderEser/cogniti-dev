"use client";

import { SadeKontrolButonu, SadeKontrolGrubu } from "@/components/kontrol/SadeKontroller";

import {
    CEK_KODU_GORUNUR_DURUMLARI,
    CEK_TALEP_ADMIN_DURUMLARI,
    CEK_TALEP_DURUM_META,
    type EclubStoreCekTalebiSatiri,
} from "@/lib/eclub/store/eclubStoreTipler";
import { Check, Copy, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

interface Props {
  cekTalepleri: EclubStoreCekTalebiSatiri[];
  cekYukleniyor: boolean;
  cekDurumFiltre: string;
  setCekDurumFiltre: (durum: string) => void;
  islemLoading: boolean;
  cekKoduTeslim: (talepId: string, cekKodu: string) => Promise<boolean>;
  excelExport: (talepler: EclubStoreCekTalebiSatiri[]) => void;
}

const CEK_FILTRELER = [
  { id: "", ad: "Tümü" },
  ...CEK_TALEP_ADMIN_DURUMLARI.map((id) => ({ id, ad: CEK_TALEP_DURUM_META[id].etiket })),
];

export default function EclubStoreSiparislerSekmesi({
  cekTalepleri,
  cekYukleniyor,
  cekDurumFiltre,
  setCekDurumFiltre,
  islemLoading,
  cekKoduTeslim,
  excelExport,
}: Props) {
  const [kodInputs, setKodInputs] = useState<Record<string, string>>({});
  const [kopyalandiId, setKopyalandiId] = useState<string | null>(null);

  const handleKodGonder = async (talepId: string) => {
    const kod = kodInputs[talepId]?.trim();
    if (!kod) return;
    if (await cekKoduTeslim(talepId, kod)) {
      setKodInputs((onceki) => {
        const sonraki = { ...onceki };
        delete sonraki[talepId];
        return sonraki;
      });
    }
  };

  const kodKopyala = async (kod: string, id: string) => {
    await navigator.clipboard.writeText(kod);
    setKopyalandiId(id);
    setTimeout(() => setKopyalandiId(null), 2000);
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
        <SadeKontrolGrubu tur="kapsul">
          {CEK_FILTRELER.map((filtre) => {
            const aktif = cekDurumFiltre === filtre.id;
            return (
              <SadeKontrolButonu key={filtre.id} onClick={() => setCekDurumFiltre(filtre.id)} aria-pressed={aktif}>
                {filtre.ad}
              </SadeKontrolButonu>
            );
          })}
        </SadeKontrolGrubu>
        <button type="button" onClick={() => excelExport(cekTalepleri)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "var(--tema-yerel-yonetim-islevsel-zemin-14)", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, color: "var(--tema-yerel-yonetim-ters-metin-03)", cursor: "pointer" }}>
          <FileSpreadsheet size={15} /> Excel&apos;e Aktar
        </button>
      </div>

      {cekYukleniyor ? (
        <p style={{ textAlign: "center", color: "var(--tema-yerel-yonetim-yardimci-metin-04)", fontSize: "14px", padding: "24px" }}>Yükleniyor...</p>
      ) : cekTalepleri.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--tema-yerel-yonetim-yardimci-metin-04)", fontSize: "14px", padding: "24px" }}>Çek talebi bulunamadı.</p>
      ) : (
        <div style={{ border: "0.5px solid var(--tema-yerel-yonetim-cizgi-01)", borderRadius: "10px", overflowX: "auto", background: "var(--tema-yerel-yonetim-kart-03)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "var(--tema-yerel-yonetim-sayfa-zemini-02)", borderBottom: "1px solid var(--tema-yerel-yonetim-cizgi-01)", textAlign: "left", color: "var(--tema-yerel-yonetim-yardimci-metin-02)" }}>
                {['Tarih', 'Eczane (GLN)', 'Talep Eden', 'UTT & BM', 'Ürün & Satış Şartı', 'Puan', 'Çek Tutarı', 'Durum', 'Çek Kodu Teslimatı'].map((baslik) => (
                  <th key={baslik} style={{ padding: "10px 12px", fontWeight: 700 }}>{baslik}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cekTalepleri.map((talep) => {
                const durum = CEK_TALEP_DURUM_META[talep.durum];
                const kodGonderildi = CEK_KODU_GORUNUR_DURUMLARI.includes(talep.durum) && talep.cek_kodu;
                return (
                  <tr key={talep.talep_id} style={{ borderBottom: "1px solid var(--tema-yerel-yonetim-cizgi-05)" }}>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{new Date(talep.created_at).toLocaleDateString("tr-TR")}</td>
                    <td style={{ padding: "10px 12px" }}><strong>{talep.eczane_adi}</strong><div style={{ color: "var(--tema-yerel-yonetim-yardimci-metin-02)" }}>GLN: {talep.gln || "—"}</div></td>
                    <td style={{ padding: "10px 12px" }}><strong>{talep.talep_eden_ad_soyad}</strong><div style={{ color: "var(--tema-yerel-yonetim-yardimci-metin-02)" }}>{talep.talep_eden_rol}</div></td>
                    <td style={{ padding: "10px 12px" }}>UTT: <strong>{talep.utt_adi || "—"}</strong><div style={{ color: "var(--tema-yerel-yonetim-yardimci-metin-02)" }}>BM: {talep.bm_adi || "—"}</div></td>
                    <td style={{ padding: "10px 12px" }}><strong>{talep.urun_adi}</strong><div style={{ color: "var(--tema-yerel-yonetim-islevsel-metin-18)" }}>{talep.siparis_adet ? `${talep.siparis_adet} adet + ${talep.siparis_mal_fazlasi} MF` : "Siparişsiz"}</div></td>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{talep.toplanan_puan.toLocaleString("tr-TR")}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 800, color: "var(--tema-yerel-yonetim-islevsel-metin-18)" }}>{talep.talep_edilen_cek_tl.toLocaleString("tr-TR")} TL</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ padding: "3px 8px", borderRadius: "999px", color: durum.metin, background: durum.arka, fontWeight: 700, whiteSpace: "nowrap" }}>{durum.etiket}</span></td>
                    <td style={{ padding: "10px 12px" }}>
                      {kodGonderildi ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--tema-yerel-yonetim-islevsel-zemin-07)", border: "1px solid var(--tema-yerel-yonetim-islevsel-cizgi-08)", padding: "4px 8px", borderRadius: "6px" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 800 }}>{talep.cek_kodu}</span>
                          <button type="button" onClick={() => void kodKopyala(talep.cek_kodu!, talep.talep_id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--tema-yerel-yonetim-islevsel-metin-19)" }}>{kopyalandiId === talep.talep_id ? <Check size={13} /> : <Copy size={13} />}</button>
                        </div>
                      ) : talep.durum === "onaylandi" ? (
                        <div style={{ display: "flex", gap: "4px" }}>
                          <input type="text" placeholder="Çek kodu" value={kodInputs[talep.talep_id] ?? ""} onChange={(event) => setKodInputs((onceki) => ({ ...onceki, [talep.talep_id]: event.target.value }))} style={{ padding: "4px 8px", border: "1px solid var(--tema-yerel-yonetim-cizgi-02)", borderRadius: "6px", width: "140px" }} />
                          <button type="button" onClick={() => void handleKodGonder(talep.talep_id)} disabled={islemLoading} style={{ padding: "4px 8px", background: "var(--tema-yerel-yonetim-islevsel-zemin-14)", color: "var(--tema-yerel-yonetim-ters-metin-03)", border: "none", borderRadius: "6px", fontWeight: 700 }}>Gönder</button>
                        </div>
                      ) : <span style={{ color: "var(--tema-yerel-yonetim-yardimci-metin-04)" }}>Onay süreci devam ediyor</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
