"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { Calendar, Clock, Radio, Users, X } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { agoraTokenTutari } from "@/lib/agora/vitrin";
import { ROL_ADLARI, URETICI_ROLLER, type HedefRol } from "@/lib/utils/roller";

export interface AgoraCanliOturumu {
  oturum_id: string;
  canli_egitim_id: string;
  partner_id: string;
  sirket_adi: string;
  egitim_adi: string;
  kategori: string;
  hedef_roller: HedefRol[];
  aciklama: string;
  sure_dakika: number;
  kapasite: number;
  fiyat_tl: number;
  baslangic_at: string;
  bitis_at: string;
  durum: "musait" | "rezerve";
  kendi_firmam_rezerve: boolean;
}

const TARIH_SAAT_BICIMI = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function AgoraCanliYayinlar({
  partnerId,
  hedefRol,
  onBasari,
}: {
  partnerId: string | null;
  hedefRol: HedefRol | "";
  onBasari: (mesaj: string) => void;
}) {
  const { kullanici } = useAuth();
  const uretici = URETICI_ROLLER.includes(kullanici?.rol.toLowerCase() ?? "");

  const [oturumlar, setOturumlar] = useState<AgoraCanliOturumu[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [seciliOturum, setSeciliOturum] = useState<AgoraCanliOturumu | null>(null);
  const [satinAliniyor, setSatinAliniyor] = useState(false);
  const [katilinanId, setKatilinanId] = useState<string | null>(null);

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

  const filtrelenenler = useMemo(() => {
    return oturumlar.filter((o) => {
      if (partnerId && o.partner_id !== partnerId) return false;
      if (hedefRol && !o.hedef_roller.includes(hedefRol)) return false;
      return true;
    });
  }, [oturumlar, partnerId, hedefRol]);

  const satinAl = async () => {
    if (!seciliOturum) return;
    setSatinAliniyor(true);
    setHata("");
    try {
      const r = await fetch("/agora/api/canli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oturum_id: seciliOturum.oturum_id,
          fiyat_tl: seciliOturum.fiyat_tl,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setHata(d.hata ?? "Canlı yayın rezervasyonu tamamlanamadı.");
        return;
      }
      const borcNotu =
        Number(d.borca_yazilan_token) > 0
          ? ` ${Number(d.borca_yazilan_token).toLocaleString("tr-TR")} token borca yazıldı.`
          : "";
      onBasari(
        `“${seciliOturum.egitim_adi}” canlı yayın oturumu firmanız için rezerve edildi.${borcNotu}`,
      );
      setSeciliOturum(null);
      await yukle();
    } catch {
      setHata("Canlı yayın rezervasyonu tamamlanamadı.");
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
        setHata(d.hata ?? "Canlı yayın odasına bağlanılamadı.");
        return;
      }
      window.open(d.url, "_blank", "noopener,noreferrer");
    } catch {
      setHata("Canlı yayın odasına bağlanılamadı.");
    } finally {
      setKatilinanId(null);
    }
  };

  if (yukleniyor) return <p role="status">Canlı yayın oturumları yükleniyor…</p>;

  return (
    <section aria-label="Agora Canlı Yayınlar (Viva)" className="space-y-4">
      {hata && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hata}
        </p>
      )}

      {filtrelenenler.length === 0 ? (
        <p className="rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-6 text-sm text-[var(--tema-ikincil-metin)]">
          Seçili kriterlere uygun planlanmış canlı yayın oturumu bulunmuyor.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtrelenenler.map((o) => {
            const token = agoraTokenTutari(o.fiyat_tl);
            return (
              <article
                key={o.oturum_id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--tema-cizgi)] bg-[var(--tema-yuzey)] p-5 shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      <Radio size={12} aria-hidden="true" />
                      Viva Canlı Yayın
                    </span>
                    <span className="text-[11px] font-medium text-[var(--tema-ikincil-metin)]">
                      {o.kategori}
                    </span>
                  </div>

                  <h3 className="m-0 text-base font-bold leading-snug text-[var(--tema-baslik)]">
                    {o.egitim_adi}
                  </h3>
                  <div className="text-xs font-medium text-[var(--tema-kontrol-eylem)]">
                    {o.sirket_adi}
                  </div>
                  <p className="m-0 line-clamp-3 text-xs leading-relaxed text-[var(--tema-ikincil-metin)]">
                    {o.aciklama}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {o.hedef_roller.map((r) => (
                      <span
                        key={r}
                        className="rounded-md bg-[var(--tema-zemin)] px-2 py-0.5 text-[10px] font-medium text-[var(--tema-ikincil-metin)]"
                      >
                        {ROL_ADLARI[r] ?? r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-[var(--tema-cizgi)] pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--tema-ikincil-metin)]">
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--tema-baslik)]">
                      <Calendar size={13} aria-hidden="true" />
                      {TARIH_SAAT_BICIMI.format(new Date(o.baslangic_at))}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} aria-hidden="true" />
                        {o.sure_dakika} dk
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} aria-hidden="true" />
                        {o.kapasite} kişi
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm font-bold text-[var(--tema-baslik)]">
                      {token.toLocaleString("tr-TR")} Token
                    </strong>

                    {o.kendi_firmam_rezerve ? (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Rezerve
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          disabled={katilinanId === o.oturum_id}
                          onClick={() => void yayinaKatil(o.oturum_id)}
                        >
                          {katilinanId === o.oturum_id ? "Bağlanıyor..." : "Yayına Katıl"}
                        </Button>
                      </div>
                    ) : (
                      uretici && (
                        <Button type="button" onClick={() => setSeciliOturum(o)}>
                          Rezerve Et
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog.Root
        open={seciliOturum !== null}
        onOpenChange={(acik) => {
          if (!acik && !satinAliniyor) setSeciliOturum(null);
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
                Canlı Yayın Rezervasyonu
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" aria-label="Kapat" disabled={satinAliniyor}>
                  <X size={15} />
                </Button>
              </Dialog.Close>
            </div>

            {seciliOturum && (
              <div className="space-y-4 text-sm text-[var(--tema-metin)]">
                <p className="m-0">
                  <strong>{seciliOturum.egitim_adi}</strong> ({seciliOturum.sirket_adi}) canlı yayını
                  yalnızca firmanız için rezerve edilecektir.
                </p>
                <div className="space-y-1.5 rounded-xl border border-[var(--tema-cizgi)] bg-[var(--tema-zemin)] p-3.5 text-xs">
                  <div>
                    <strong>Tarih &amp; Saat:</strong>{" "}
                    {TARIH_SAAT_BICIMI.format(new Date(seciliOturum.baslangic_at))}
                  </div>
                  <div>
                    <strong>Süre &amp; Kapasite:</strong> {seciliOturum.sure_dakika} dakika · En fazla{" "}
                    {seciliOturum.kapasite} katılımcı
                  </div>
                  <div>
                    <strong>Toplam Bedel:</strong>{" "}
                    {agoraTokenTutari(seciliOturum.fiyat_tl).toLocaleString("tr-TR")} Token (Ek Viva dakika
                    ücreti kesilmez)
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={satinAliniyor}
                    onClick={() => setSeciliOturum(null)}
                  >
                    Vazgeç
                  </Button>
                  <Button type="button" disabled={satinAliniyor} onClick={() => void satinAl()}>
                    {satinAliniyor ? "Onaylanıyor..." : "Onayla ve Satın Al"}
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
