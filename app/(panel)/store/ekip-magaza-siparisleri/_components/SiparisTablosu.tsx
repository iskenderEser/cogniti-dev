// HBStore ekip sipariş listesi. Masaüstünde tablo, tablet/mobilde açılır satır.
// Tarih, ürün, alıcı, adet, puan, durum, kargo ve teslimat sözleşmesi korunur.

"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Package, Truck } from "lucide-react";
import type { SiparisSatiri } from "../_types";
import type { AdresSnapshot } from "@/lib/tclub/store/tipler";
import { DURUM_ETIKETLERI, DURUM_RENKLERI } from "@/lib/tclub/store/sabitler";
import { kargoTakipUrl } from "@/lib/tclub/store/kargo";

interface SiparisTablosuProps {
  siparisler: SiparisSatiri[];
  toplam: number;
  dahaVar: boolean;
  yukleniyor: boolean;
  dahaYukleniyor: boolean;
  dahaFazlaYukle: () => void;
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  borderBottom: "1px solid var(--tema-yerel-magaza-cizgi-11)",
  fontWeight: 800,
  color: "var(--tema-yerel-magaza-yardimci-metin-19)",
  fontSize: "10px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  background: "var(--tema-yerel-magaza-sayfa-zemini-01)",
  fontFamily: "'Nunito', sans-serif",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 12px",
  borderBottom: "1px solid var(--tema-yerel-magaza-cizgi-12)",
  color: "var(--tema-yerel-magaza-ana-metin-01)",
  fontSize: "12px",
  fontFamily: "'Nunito', sans-serif",
  verticalAlign: "middle",
};

const tarihFormatla = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function DurumRozeti({ durum }: { durum: SiparisSatiri["durum"] }) {
  const stil = DURUM_RENKLERI[durum];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-extrabold"
      style={{ color: stil.metin, background: stil.arka, border: `1px solid ${stil.kenar}` }}
    >
      {DURUM_ETIKETLERI[durum]}
    </span>
  );
}

function UrunKimligi({ siparis }: { siparis: SiparisSatiri }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--tema-yerel-magaza-sayfa-zemini-07)] text-[var(--tema-yerel-magaza-yardimci-metin-18)]">
        {siparis.urun_gorsel_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={siparis.urun_gorsel_url} alt={siparis.urun_adi} className="h-full w-full object-cover" />
        ) : (
          <Package size={15} />
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-bold text-[var(--tema-yerel-magaza-ana-metin-01)]">{siparis.urun_adi}</div>
        <div className="mt-0.5 text-[10px] font-medium text-[var(--tema-yerel-magaza-yardimci-metin-18)]">{siparis.adet} adet</div>
      </div>
    </div>
  );
}

function KargoBilgisi({ siparis }: { siparis: SiparisSatiri }) {
  const kargoUrl = kargoTakipUrl(siparis.kargo_firmasi, siparis.kargo_takip_no);
  if (!siparis.kargo_firmasi) return <span className="text-[var(--tema-yerel-magaza-yardimci-metin-20)]">—</span>;
  return (
    <div>
      <div className="font-semibold text-[var(--tema-yerel-magaza-ana-metin-01)]">{siparis.kargo_firmasi}</div>
      {kargoUrl ? (
        <a href={kargoUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[var(--tema-yerel-magaza-eylem-metin-03)] underline underline-offset-2">
          {siparis.kargo_takip_no}
        </a>
      ) : (
        <div className="text-[11px] text-[var(--tema-yerel-magaza-yardimci-metin-18)]">{siparis.kargo_takip_no}</div>
      )}
    </div>
  );
}

export default function SiparisTablosu(p: SiparisTablosuProps) {
  const [acikSiparis, setAcikSiparis] = useState<string | null>(null);

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--tema-yerel-magaza-cizgi-01)] bg-[var(--tema-yerel-magaza-kart-01)] shadow-[0_6px_18px_var(--tema-yerel-magaza-golge-01)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--tema-yerel-magaza-cizgi-11)] px-4 py-3.5">
        <div>
          <h2 className="text-sm font-extrabold text-[var(--tema-yerel-magaza-ana-metin-01)]">Sipariş Listesi</h2>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--tema-yerel-magaza-yardimci-metin-18)]">
            {p.yukleniyor ? "Siparişler yükleniyor..." : `${p.siparisler.length} / ${p.toplam} sipariş gösteriliyor`}
          </p>
        </div>
        <div className="rounded-xl bg-[var(--tema-yerel-magaza-sayfa-zemini-08)] px-3 py-1.5 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)]">
          Toplam {p.toplam}
        </div>
      </div>

      {p.yukleniyor ? (
        <div className="px-4 py-12 text-center text-sm font-medium text-[var(--tema-yerel-magaza-yardimci-metin-18)]">Yükleniyor...</div>
      ) : p.siparisler.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <Package className="mx-auto h-7 w-7 text-[var(--tema-yerel-magaza-yardimci-metin-21)]" />
          <p className="mt-2 text-sm font-bold text-[var(--tema-yerel-magaza-yardimci-metin-19)]">Bu filtrelerle eşleşen sipariş yok.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th style={thStyle}>Tarih</th>
                  <th style={thStyle}>Ürün</th>
                  <th style={thStyle}>Alıcı</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Toplam Puan</th>
                  <th style={thStyle}>Durum</th>
                  <th style={thStyle}>Kargo</th>
                  <th style={thStyle}>Teslimat</th>
                </tr>
              </thead>
              <tbody>
                {p.siparisler.map((siparis) => {
                  const adres = siparis.adres_snapshot as AdresSnapshot;
                  return (
                    <tr key={siparis.siparis_id} className="transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-09)]">
                      <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "var(--tema-yerel-magaza-yardimci-metin-02)" }}>{tarihFormatla(siparis.created_at)}</td>
                      <td style={{ ...tdStyle, minWidth: 210 }}><UrunKimligi siparis={siparis} /></td>
                      <td style={tdStyle}>
                        <div className="font-bold">{siparis.alici_ad} {siparis.alici_soyad}</div>
                        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tema-yerel-magaza-yardimci-metin-18)]">{siparis.alici_rol}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", color: "var(--tema-yerel-magaza-vurgu-metin-01)", fontWeight: 800 }}>{siparis.toplam_puan.toLocaleString("tr-TR")}</td>
                      <td style={tdStyle}><DurumRozeti durum={siparis.durum} /></td>
                      <td style={tdStyle}><KargoBilgisi siparis={siparis} /></td>
                      <td style={{ ...tdStyle, color: "var(--tema-yerel-magaza-yardimci-metin-02)", minWidth: 130 }}>{adres.ilce} / {adres.il}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[var(--tema-yerel-magaza-cizgi-11)] lg:hidden">
            {p.siparisler.map((siparis) => {
              const adres = siparis.adres_snapshot as AdresSnapshot;
              const acik = acikSiparis === siparis.siparis_id;
              return (
                <div key={siparis.siparis_id}>
                  <button
                    type="button"
                    className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors ${acik ? "bg-[var(--tema-yerel-magaza-sayfa-zemini-10)]" : "bg-[var(--tema-yerel-magaza-kart-01)] hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-09)]"}`}
                    onClick={() => setAcikSiparis(acik ? null : siparis.siparis_id)}
                    aria-expanded={acik}
                  >
                    <div className="min-w-0">
                      <UrunKimligi siparis={siparis} />
                      <div className="mt-2 flex flex-wrap items-center gap-2 pl-[46px]">
                        <span className="text-[11px] font-bold text-[var(--tema-yerel-magaza-ana-metin-07)]">{siparis.alici_ad} {siparis.alici_soyad}</span>
                        <DurumRozeti durum={siparis.durum} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="whitespace-nowrap text-sm text-[var(--tema-yerel-magaza-vurgu-metin-01)]">{siparis.toplam_puan.toLocaleString("tr-TR")}</strong>
                      <ChevronDown size={16} className={`text-[var(--tema-yerel-magaza-yardimci-metin-02)] transition-transform ${acik ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {acik && (
                    <div className="grid gap-3 border-t border-[var(--tema-yerel-magaza-cizgi-09)] bg-[var(--tema-yerel-magaza-sayfa-zemini-09)] px-4 py-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-11)] bg-[var(--tema-yerel-magaza-kart-01)] p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-magaza-yardimci-metin-18)]">Sipariş</div>
                        <div className="mt-1 text-xs font-bold text-[var(--tema-yerel-magaza-ana-metin-01)]">{tarihFormatla(siparis.created_at)}</div>
                        <div className="mt-1 text-[11px] text-[var(--tema-yerel-magaza-yardimci-metin-02)]">{siparis.adet} adet · birim {siparis.puan_birim_fiyat.toLocaleString("tr-TR")} puan</div>
                      </div>
                      <div className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-11)] bg-[var(--tema-yerel-magaza-kart-01)] p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-magaza-yardimci-metin-18)]"><Truck size={12} /> Kargo</div>
                        <div className="mt-1 text-xs"><KargoBilgisi siparis={siparis} /></div>
                      </div>
                      <div className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-11)] bg-[var(--tema-yerel-magaza-kart-01)] p-3 sm:col-span-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[var(--tema-yerel-magaza-yardimci-metin-18)]"><MapPin size={12} /> Teslimat</div>
                        <div className="mt-1 text-xs font-bold text-[var(--tema-yerel-magaza-ana-metin-01)]">{adres.alici_adi} · {adres.ilce} / {adres.il}</div>
                        <div className="mt-1 text-[11px] leading-4 text-[var(--tema-yerel-magaza-yardimci-metin-02)]">{adres.adres_detay}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {p.dahaVar && !p.yukleniyor && (
        <div className="border-t border-[var(--tema-yerel-magaza-cizgi-11)] px-4 py-4 text-center">
          <button
            onClick={p.dahaFazlaYukle}
            disabled={p.dahaYukleniyor}
            className="rounded-xl border border-[var(--tema-yerel-magaza-cizgi-07)] bg-[var(--tema-yerel-magaza-kart-01)] px-5 py-2 text-xs font-extrabold text-[var(--tema-yerel-magaza-ana-metin-07)] transition-colors hover:bg-[var(--tema-yerel-magaza-sayfa-zemini-05)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {p.dahaYukleniyor ? "Yükleniyor..." : "Daha Fazla Yükle"}
          </button>
        </div>
      )}
    </section>
  );
}
