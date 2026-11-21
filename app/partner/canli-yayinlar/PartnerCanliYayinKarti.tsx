"use client";

import { useState } from "react";
import { Pencil, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CanliYayinHoykKabugu,
  KISA_TARIH_BICIMI,
  SAAT_BICIMI,
  TL_BICIMI,
  hedefRolKisaEtiketi,
  type CanliEgitimKaydi,
  type CanliOturumKaydi,
} from "./CanliYayinHoykKabugu";

const ERKEN_GIRIS_MS = 15 * 60_000;
const BITIS_TOLERANS_MS = 10 * 60_000;

interface PartnerCanliYayinKartiProps {
  className?: string;
  onizlemeModu?: boolean;
  fiyatBelirlendiMi?: boolean;
  egitim: CanliEgitimKaydi;
  oturumlar: CanliOturumKaydi[];
  sirketAdi: string;
  logoSurumu?: number;
  simdiMs: number;
  baslatilanId: string | null;
  onDuzenle: () => void;
  onYayiniBaslat: (oturumId: string) => void;
}

/** Partner Agora Canlı Yayınlar ekranındaki HOYK kartı. */
export function PartnerCanliYayinKarti({
  className = "h-full",
  onizlemeModu = false,
  fiyatBelirlendiMi = true,
  egitim,
  oturumlar,
  sirketAdi,
  logoSurumu,
  simdiMs,
  baslatilanId,
  onDuzenle,
  onYayiniBaslat,
}: PartnerCanliYayinKartiProps) {
  const [seciliOturumId, setSeciliOturumId] = useState<string | null>(null);

  const seciliOturum =
    oturumlar.find((o) => o.oturum_id === seciliOturumId) ?? oturumlar[0] ?? null;

  const siparisSayisi = oturumlar.filter((o) => o.durum === "siparis_verildi").length;
  const musaitSayisi = oturumlar.filter((o) => o.durum === "musait").length;

  const seciliPasif = !egitim.aktif_mi || seciliOturum?.durum === "iptal";

  const sagRozet = seciliPasif ? (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
      Pasif (Gizli)
    </span>
  ) : siparisSayisi > 0 ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
      {siparisSayisi} Sipariş
    </span>
  ) : musaitSayisi > 0 || onizlemeModu ? (
    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
      Siparişe Açık
    </span>
  ) : (
    <span className="rounded-full bg-[var(--tema-yuzey)] px-2 py-0.5 text-[10px] font-semibold text-[var(--tema-ikincil-metin)]">
      Saat Yok
    </span>
  );

  const basMs = seciliOturum ? Date.parse(seciliOturum.baslangic_at) : 0;
  const bitMs = seciliOturum ? Date.parse(seciliOturum.bitis_at) : 0;
  const henuzErken = Boolean(seciliOturum && simdiMs < basMs - ERKEN_GIRIS_MS);
  const suresiDoldu = Boolean(seciliOturum && simdiMs > bitMs + BITIS_TOLERANS_MS);

  return (
    <CanliYayinHoykKabugu
      className={className}
      sirketAdi={sirketAdi}
      logoSurumu={logoSurumu}
      egitimAdi={egitim.egitim_adi}
      sureDakika={egitim.sure_dakika}
      kapasite={egitim.kapasite}
      baslangicMs={seciliOturum ? Date.parse(seciliOturum.baslangic_at) : null}
      bosTarihMetni="Tarih ve saat eklenmedi"
      pasifMi={seciliPasif}
      sagRozet={sagRozet}
    >
      {/* Hedef kitle pill'leri + PE kodu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {egitim.hedef_roller.length > 0 ? (
            egitim.hedef_roller.map((rol) => (
              <span
                key={rol}
                className="inline-flex items-center rounded-full border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2 py-0.5 text-[9.5px] font-bold text-[var(--tema-metin)]"
              >
                {hedefRolKisaEtiketi(rol)}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center rounded-full border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2 py-0.5 text-[9.5px] font-bold text-[var(--tema-metin)]">
              Hedef kitle seçilmedi
            </span>
          )}
        </div>
        {egitim.partner_egitim_id && (
          <span
            aria-label={`Yayın ID: ${egitim.partner_egitim_id}`}
            className="shrink-0 pt-0.5 font-mono text-[10.5px] font-bold text-[var(--tema-hoyk-talep-metni)]"
          >
            {egitim.partner_egitim_id}
          </span>
        )}
      </div>

      {/* Açıklama (2 satır) */}
      <p className="m-0 mt-2 min-h-[2.25rem] line-clamp-2 text-[11px] leading-relaxed text-[var(--tema-ikincil-metin)]">
        {egitim.aciklama.trim() || "Canlı yayın içeriği ve kazanımları burada görünecek."}
      </p>

      {/* Satış Fiyatı Özeti */}
      <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2.5 py-1.5 text-[11px]">
        <span className="text-[var(--tema-ikincil-metin)]">Satış Fiyatı</span>
        <strong className="text-[var(--tema-baslik)]">
          {fiyatBelirlendiMi ? TL_BICIMI.format(egitim.fiyat_tl) : "—"}
        </strong>
      </div>

      {/* Oturum Saatleri Chipleri */}
      {(oturumlar.length > 0 || onizlemeModu) && (
        <div className="mt-2.5 border-t border-dashed border-[var(--tema-cizgi)] pt-2">
          <div className="flex flex-wrap gap-1.5">
            {oturumlar.length > 0 ? (
              oturumlar.map((o) => {
                const secili = seciliOturum?.oturum_id === o.oturum_id;
                const d = new Date(o.baslangic_at);
                const noktaRengi =
                  o.durum === "siparis_verildi"
                    ? "bg-emerald-500"
                    : o.durum === "musait"
                      ? "bg-blue-500"
                      : "bg-slate-400";
                return (
                  <button
                    key={o.oturum_id}
                    type="button"
                    aria-pressed={secili}
                    onClick={() => setSeciliOturumId(o.oturum_id)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold transition ${
                      secili
                        ? "border-[var(--tema-kontrol-eylem)] bg-[var(--tema-kontrol-hover)] text-[var(--tema-kontrol-eylem)]"
                        : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)] hover:border-[var(--tema-kontrol-eylem)]"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${noktaRengi}`} aria-hidden="true" />
                    {KISA_TARIH_BICIMI.format(d)} · {SAAT_BICIMI.format(d)}
                  </button>
                );
              })
            ) : (
              <button
                type="button"
                aria-pressed={true}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--tema-kontrol-eylem)] bg-[var(--tema-kontrol-hover)] px-2 py-1 text-[10px] font-bold text-[var(--tema-kontrol-eylem)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                Tarih · Saat
              </button>
            )}
          </div>
        </div>
      )}

      {/* Seçili Oturum Sipariş Durumu & Canlı Yayın Başlatma */}
      {seciliOturum && (seciliOturum.durum === "siparis_verildi" || seciliOturum.durum === "tamamlandi") && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2.5 py-2">
          <div className="min-w-0 text-[10.5px] leading-snug">
            {seciliOturum.durum === "siparis_verildi" && (
              <>
                <div className="font-extrabold text-emerald-700">Sipariş Verildi</div>
                <div className="truncate text-[var(--tema-ikincil-metin)]">
                  {seciliOturum.satin_alan_firma_adi
                    ? `Firma: ${seciliOturum.satin_alan_firma_adi}`
                    : "Sipariş onaylandı"}
                </div>
              </>
            )}
            {seciliOturum.durum === "tamamlandi" && (
              <>
                <div className="font-extrabold text-slate-600">Tamamlandı</div>
                {seciliOturum.satin_alan_firma_adi && (
                  <div className="truncate text-[var(--tema-ikincil-metin)]">
                    Firma: {seciliOturum.satin_alan_firma_adi}
                  </div>
                )}
              </>
            )}
          </div>

          {seciliOturum.durum === "siparis_verildi" && (
            <Button
              type="button"
              size="sm"
              className="h-7 shrink-0 gap-1 px-2.5 text-[10.5px]"
              disabled={!onizlemeModu && (baslatilanId === seciliOturum.oturum_id || henuzErken || suresiDoldu)}
              title={
                henuzErken
                  ? "Yayın odasına başlangıç saatinden en fazla 15 dakika önce giriş yapılabilir."
                  : suresiDoldu
                    ? "Bu canlı yayın oturumunun süresi dolmuştur."
                    : undefined
              }
              onClick={() => onYayiniBaslat(seciliOturum.oturum_id)}
            >
              <Radio className="size-3" aria-hidden="true" />
              {baslatilanId === seciliOturum.oturum_id
                ? "Açılıyor..."
                : suresiDoldu
                  ? "Süresi Doldu"
                  : henuzErken
                    ? "15 dk Önce Açılır"
                    : "Yayını Başlat"}
            </Button>
          )}
        </div>
      )}

      {/* Düzenle Butonu */}
      <div className="mt-auto pt-2.5">
        <div className="flex items-center border-t border-[var(--tema-cizgi)] pt-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full gap-1.5 px-2.5 text-[11px] whitespace-nowrap"
            onClick={onDuzenle}
          >
            <Pencil className="size-3" aria-hidden="true" />
            Düzenle
          </Button>
        </div>
      </div>
    </CanliYayinHoykKabugu>
  );
}
