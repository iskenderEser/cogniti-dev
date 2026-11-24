"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { Radio, X } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  CanliYayinHoykKabugu,
  KISA_TARIH_BICIMI,
  SAAT_BICIMI,
  hedefRolKisaEtiketi,
} from "@/app/partner/canli-yayinlar/CanliYayinHoykKabugu";
import { AgoraRafOklari } from "@/components/agora/AgoraRafOklari";
import rafStyles from "@/components/agora/AgoraVitrini.module.css";
import { Button } from "@/components/ui/button";
import MobilYayinAkisi from "@/components/yayin/MobilYayinAkisi";
import { agoraTokenTutari } from "@/lib/agora/vitrin";
import { SUREC15_TOAST } from "@/lib/bildirimler/toastMesajlari";
import { URETICI_ROLLER, type HedefRol } from "@/lib/utils/roller";

export interface AgoraCanliOturumu {
  oturum_id: string;
  canli_egitim_id: string;
  partner_id: string;
  sirket_adi: string;
  partner_egitim_id?: string;
  egitim_adi: string;
  kategori: string;
  hedef_roller: HedefRol[];
  aciklama: string;
  sure_dakika: number;
  kapasite: number;
  fiyat_tl: number;
  baslangic_at: string;
  bitis_at: string;
  durum: "musait" | "siparis_verildi";
  siparis_verildi_mi: boolean;
}

interface CanliEgitimGrubu {
  canli_egitim_id: string;
  partner_id: string;
  sirket_adi: string;
  partner_egitim_id?: string;
  egitim_adi: string;
  kategori: string;
  hedef_roller: HedefRol[];
  aciklama: string;
  sure_dakika: number;
  kapasite: number;
  fiyat_tl: number;
  oturumlar: AgoraCanliOturumu[];
}

const TARIH_SAAT_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

const ERKEN_GIRIS_MS = 15 * 60_000;
const BITIS_TOLERANS_MS = 10 * 60_000;

function saatAraligiFormatla(baslangicIso: string, bitisIso: string): string {
  return `${SAAT_BICIMI.format(new Date(baslangicIso))} – ${SAAT_BICIMI.format(new Date(bitisIso))}`;
}

function partnerEgitimNo(kod?: string): number {
  const eslesme = kod?.match(/(\d+)/);
  return eslesme ? Number(eslesme[1]) : 0;
}

function CanliYayinRafi({
  baslik,
  gruplar,
  filtreAnahtari,
  renderKart,
}: {
  baslik: string;
  gruplar: CanliEgitimGrubu[];
  filtreAnahtari: string;
  renderKart: (g: CanliEgitimGrubu) => ReactNode;
}) {
  const raf = useRef<HTMLDivElement>(null);
  if (gruplar.length === 0) return null;

  return (
    <section className={rafStyles.raf} aria-label={baslik}>
      <div className={rafStyles.rafBaslik}>
        <h2>{baslik}</h2>
      </div>
      <MobilYayinAkisi
        kayitlar={gruplar}
        kayitAnahtari={(g) => g.canli_egitim_id}
        renderKart={renderKart}
        sayacGoster={false}
        sifirlamaAnahtari={`${baslik}:${filtreAnahtari}`}
        masaustuIcerik={
          <div className={rafStyles.rafAlani}>
            <AgoraRafOklari raf={raf} baslik={baslik} />
            <div key={`${baslik}:${filtreAnahtari}`} ref={raf} className={rafStyles.kaydir}>
              {gruplar.map((g) => (
                <div
                  key={g.canli_egitim_id}
                  className="w-[320px] min-w-0 shrink-0 snap-start"
                >
                  {renderKart(g)}
                </div>
              ))}
            </div>
          </div>
        }
      />
    </section>
  );
}

export function AgoraCanliYayinlar({
  partnerId,
  hedefRol,
  arama = "",
  onBasari,
}: {
  partnerId: string | null;
  hedefRol: HedefRol | "";
  arama?: string;
  onBasari: (mesaj: string) => void;
}) {
  const { kullanici } = useAuth();
  const uretici = URETICI_ROLLER.includes(kullanici?.rol.toLowerCase() ?? "");

  const [oturumlar, setOturumlar] = useState<AgoraCanliOturumu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [seciliOturumIdHaritasi, setSeciliOturumIdHaritasi] = useState<Record<string, string>>({});
  const [acikAciklamaHaritasi, setAcikAciklamaHaritasi] = useState<Record<string, boolean>>({});
  const [onayOturumu, setOnayOturumu] = useState<AgoraCanliOturumu | null>(null);
  const [satinAliniyor, setSatinAliniyor] = useState(false);
  const [katilinanId, setKatilinanId] = useState<string | null>(null);
  const [simdiMs, setSimdiMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setSimdiMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    try {
      const r = await fetch("/agora/api/canli", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Canlı yayın oturumları okunamadı.");
        return;
      }
      setOturumlar(d.oturumlar ?? []);
    } catch {
      setHata("Canlı yayın oturumları okunamadı.");
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    void yukle();
  }, [yukle]);

  const gruplar = useMemo<CanliEgitimGrubu[]>(() => {
    const sorgu = arama.trim().toLocaleLowerCase("tr-TR");
    const uygunOturumlar = oturumlar.filter((o) => {
      if (partnerId && o.partner_id !== partnerId) return false;
      if (hedefRol && !o.hedef_roller.includes(hedefRol)) return false;
      if (
        sorgu &&
        ![o.egitim_adi, o.partner_egitim_id, o.sirket_adi, o.kategori, o.aciklama].some((alan) =>
          (alan ?? "").toLocaleLowerCase("tr-TR").includes(sorgu),
        )
      ) {
        return false;
      }
      return true;
    });

    const harita = new Map<string, CanliEgitimGrubu>();
    for (const o of uygunOturumlar) {
      const mevcut = harita.get(o.canli_egitim_id);
      if (mevcut) {
        mevcut.oturumlar.push(o);
      } else {
        harita.set(o.canli_egitim_id, {
          canli_egitim_id: o.canli_egitim_id,
          partner_id: o.partner_id,
          sirket_adi: o.sirket_adi,
          partner_egitim_id: o.partner_egitim_id,
          egitim_adi: o.egitim_adi,
          kategori: o.kategori,
          hedef_roller: o.hedef_roller,
          aciklama: o.aciklama,
          sure_dakika: o.sure_dakika,
          kapasite: o.kapasite,
          fiyat_tl: o.fiyat_tl,
          oturumlar: [o],
        });
      }
    }

    return Array.from(harita.values());
  }, [oturumlar, partnerId, hedefRol, arama]);

  const satinAl = async () => {
    if (!onayOturumu) return;
    setSatinAliniyor(true);
    setHata("");
    try {
      const r = await fetch("/agora/api/canli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oturum_id: onayOturumu.oturum_id,
          fiyat_tl: onayOturumu.fiyat_tl,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Canlı yayın siparişi tamamlanamadı.");
        return;
      }
      onBasari(
        SUREC15_TOAST.canliSiparisTamamlandi(
          onayOturumu.egitim_adi,
          Number(d.borca_yazilan_token) || 0,
        ),
      );
      setOnayOturumu(null);
      await yukle();
    } catch {
      setHata("Canlı yayın siparişi tamamlanamadı.");
    } finally {
      setSatinAliniyor(false);
    }
  };

  const yayinaKatil = async (oturumId: string) => {
    setHata("");
    setKatilinanId(oturumId);
    try {
      const r = await fetch("/agora/api/canli/katil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oturum_id: oturumId }),
      });
      const d = await r.json();
      if (!r.ok || typeof d.url !== "string") {
        setHata(d.hata ?? "Canlı yayın odası açılamadı.");
        return;
      }
      window.open(d.url, "_blank", "noopener,noreferrer");
    } catch {
      setHata("Canlı yayın odası açılamadı.");
    } finally {
      setKatilinanId(null);
    }
  };

  if (yukleniyor) return <p role="status">Canlı yayın oturumları yükleniyor…</p>;

  const filtreAnahtari = `${partnerId ?? ""}:${hedefRol}:${arama}`;

  const enYakinBaslangic = (g: CanliEgitimGrubu) =>
    Math.min(...g.oturumlar.map((o) => Date.parse(o.baslangic_at)));

  const sonEklenenler = [...gruplar].sort(
    (a, b) =>
      partnerEgitimNo(b.partner_egitim_id) - partnerEgitimNo(a.partner_egitim_id) ||
      enYakinBaslangic(b) - enYakinBaslangic(a) ||
      a.canli_egitim_id.localeCompare(b.canli_egitim_id),
  );

  const tarihiYaklasanlar = [...gruplar].sort(
    (a, b) =>
      enYakinBaslangic(a) - enYakinBaslangic(b) ||
      a.canli_egitim_id.localeCompare(b.canli_egitim_id),
  );

  const kartOlustur = (g: CanliEgitimGrubu) => {
    const seciliId = seciliOturumIdHaritasi[g.canli_egitim_id];
    const seciliOturum =
      g.oturumlar.find((o) => o.oturum_id === seciliId) ?? g.oturumlar[0];
    const token = agoraTokenTutari(g.fiyat_tl);
    const aciklamaAcik = !!acikAciklamaHaritasi[g.canli_egitim_id];
    const uzunAciklama = g.aciklama.length > 140;
    const basMs = Date.parse(seciliOturum.baslangic_at);
    const bitMs = Date.parse(seciliOturum.bitis_at);
    const henuzErken = simdiMs < basMs - ERKEN_GIRIS_MS;
    const suresiDoldu = simdiMs > bitMs + BITIS_TOLERANS_MS;

    return (
      <CanliYayinHoykKabugu
        className="h-full"
        sirketAdi={g.sirket_adi}
        logoSrc={`/agora/api/partner-logo/${g.partner_id}`}
        egitimAdi={g.egitim_adi}
        sureDakika={g.sure_dakika}
        kapasite={g.kapasite}
        baslangicMs={basMs}
        sagRozet={
          seciliOturum.siparis_verildi_mi ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Sipariş Verildi
            </span>
          ) : undefined
        }
      >
        {/* Hedef kitle pill'leri + PE kodu */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {g.hedef_roller.map((r) => (
              <span
                key={r}
                className="inline-flex items-center rounded-full border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2 py-0.5 text-[9.5px] font-bold text-[var(--tema-metin)]"
              >
                {hedefRolKisaEtiketi(r)}
              </span>
            ))}
          </div>
          {g.partner_egitim_id && (
            <span
              aria-label={`Yayın ID: ${g.partner_egitim_id}`}
              className="shrink-0 pt-0.5 font-mono text-[10.5px] font-bold text-[var(--tema-hoyk-talep-metni)]"
            >
              {g.partner_egitim_id}
            </span>
          )}
        </div>

        {/* Açıklama */}
        <div className="mt-2">
          <p
            className={`m-0 min-h-[2.25rem] text-[11px] leading-relaxed text-[var(--tema-ikincil-metin)] ${
              aciklamaAcik ? "" : "line-clamp-2"
            }`}
          >
            {g.aciklama}
          </p>
          {uzunAciklama && (
            <button
              type="button"
              onClick={() =>
                setAcikAciklamaHaritasi((onceki) => ({
                  ...onceki,
                  [g.canli_egitim_id]: !aciklamaAcik,
                }))
              }
              className="mt-1 border-none bg-transparent p-0 text-[10.5px] font-semibold text-[var(--tema-kontrol-eylem)] hover:underline"
            >
              {aciklamaAcik ? "Kısalt" : "Tam açıklamayı oku"}
            </button>
          )}
        </div>

        {/* Token Tutarı Özeti */}
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] px-2.5 py-1.5 text-[11px]">
          <span className="text-[var(--tema-ikincil-metin)]">Sipariş Tutarı</span>
          <strong className="text-[var(--tema-baslik)]">
            {token.toLocaleString("tr-TR")} Token
          </strong>
        </div>

        {/* Oturum Saatleri Chipleri */}
        <div className="mt-2.5 border-t border-dashed border-[var(--tema-cizgi)] pt-2">
          <div className="flex flex-wrap gap-1.5">
            {g.oturumlar.map((slot) => {
              const aktif = slot.oturum_id === seciliOturum.oturum_id;
              const d = new Date(slot.baslangic_at);
              const noktaRengi = slot.siparis_verildi_mi ? "bg-emerald-500" : "bg-blue-500";
              return (
                <button
                  key={slot.oturum_id}
                  type="button"
                  aria-pressed={aktif}
                  onClick={() =>
                    setSeciliOturumIdHaritasi((onceki) => ({
                      ...onceki,
                      [g.canli_egitim_id]: slot.oturum_id,
                    }))
                  }
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold transition ${
                    aktif
                      ? "border-[var(--tema-kontrol-eylem)] bg-[var(--tema-kontrol-hover)] text-[var(--tema-kontrol-eylem)]"
                      : "border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] text-[var(--tema-metin)] hover:border-[var(--tema-kontrol-eylem)]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${noktaRengi}`} aria-hidden="true" />
                  {KISA_TARIH_BICIMI.format(d)} · {SAAT_BICIMI.format(d)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alıcı Vitrin Aksiyonu */}
        {(seciliOturum.siparis_verildi_mi || uretici) && (
          <div className="mt-auto pt-2.5">
            <div className="flex items-center border-t border-[var(--tema-cizgi)] pt-2.5">
              {seciliOturum.siparis_verildi_mi ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 w-full gap-1.5 px-2.5 text-[11px] whitespace-nowrap"
                  disabled={
                    katilinanId === seciliOturum.oturum_id || henuzErken || suresiDoldu
                  }
                  title={
                    henuzErken
                      ? "Yayın odasına başlangıç saatinden en fazla 15 dakika önce giriş yapılabilir."
                      : suresiDoldu
                        ? "Bu canlı yayın oturumunun süresi dolmuştur."
                        : undefined
                  }
                  onClick={() => void yayinaKatil(seciliOturum.oturum_id)}
                >
                  <Radio className="size-3" aria-hidden="true" />
                  {katilinanId === seciliOturum.oturum_id
                    ? "Bağlanıyor..."
                    : suresiDoldu
                      ? "Süresi Doldu"
                      : henuzErken
                        ? "15 dk Önce Açılır"
                        : "Yayına Katıl"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 w-full px-2.5 text-[11px] whitespace-nowrap"
                  onClick={() => setOnayOturumu(seciliOturum)}
                >
                  Sipariş Ver
                </Button>
              )}
            </div>
          </div>
        )}
      </CanliYayinHoykKabugu>
    );
  };

  return (
    <section aria-label="Agora Canlı Yayınlar (Viva)" className="space-y-4">
      {hata && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hata}
        </p>
      )}

      {gruplar.length === 0 ? (
        <p className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-6 text-sm text-[var(--tema-ikincil-metin)]">
          Seçili kriterlere uygun planlanmış canlı yayın oturumu bulunmuyor.
        </p>
      ) : (
        <div>
          <CanliYayinRafi
            baslik="Son Eklenenler"
            gruplar={sonEklenenler}
            filtreAnahtari={filtreAnahtari}
            renderKart={kartOlustur}
          />
          <CanliYayinRafi
            baslik="Tarihi Yaklaşanlar"
            gruplar={tarihiYaklasanlar}
            filtreAnahtari={filtreAnahtari}
            renderKart={kartOlustur}
          />
        </div>
      )}

      <Dialog.Root
        open={onayOturumu !== null}
        onOpenChange={(acik) => {
          if (!acik && !satinAliniyor) setOnayOturumu(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <Dialog.Title className="m-0 text-lg font-bold text-[var(--tema-baslik)]">
                Canlı Yayın Siparişi
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" aria-label="Kapat" disabled={satinAliniyor}>
                  <X size={15} />
                </Button>
              </Dialog.Close>
            </div>

            {onayOturumu && (
              <div className="space-y-4 text-sm text-[var(--tema-metin)]">
                <p className="m-0">
                  <strong>{onayOturumu.egitim_adi}</strong> ({onayOturumu.sirket_adi}) canlı yayını
                  için firmanız adına sipariş oluşturulacaktır.
                </p>
                <div className="space-y-1.5 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-3.5 text-xs">
                  <div>
                    <strong>Tarih &amp; Saat:</strong>{" "}
                    {TARIH_SAAT_BICIMI.format(new Date(onayOturumu.baslangic_at))} (
                    {saatAraligiFormatla(onayOturumu.baslangic_at, onayOturumu.bitis_at)})
                  </div>
                  <div>
                    <strong>Süre &amp; Kapasite:</strong> {onayOturumu.sure_dakika} dakika · En fazla{" "}
                    {onayOturumu.kapasite} katılımcı
                  </div>
                  <div>
                    <strong>Sipariş Tutarı:</strong>{" "}
                    {agoraTokenTutari(onayOturumu.fiyat_tl).toLocaleString("tr-TR")} Token (Ek Viva dakika
                    ücreti kesilmez)
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={satinAliniyor}
                    onClick={() => setOnayOturumu(null)}
                  >
                    Vazgeç
                  </Button>
                  <Button type="button" disabled={satinAliniyor} onClick={() => void satinAl()}>
                    {satinAliniyor ? "Onaylanıyor..." : "Siparişi Onayla"}
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
