"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Link2, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SUREC11_TOAST } from "@/lib/bildirimler/toastMesajlari";

interface BaglamaTalebi {
  talep_id: string;
  eczane_id: string;
  eczane_adi: string;
  talep_turu: "yeni_bag" | "yeniden_aktivasyon";
  sona_erme: string;
  created_at: string;
}

interface Props {
  hata: (mesaj: string, adim?: string) => void;
  basari: (mesaj: string) => void;
  onOnaylandi?: () => void;
}

function tarihYaz(tarih: string): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(tarih));
}

export default function EczaneBaglamaTalepleriKarti({ hata, basari, onOnaylandi }: Props) {
  const [talepler, setTalepler] = useState<BaglamaTalebi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islenenId, setIslenenId] = useState<string | null>(null);
  const [retHedefi, setRetHedefi] = useState<BaglamaTalebi | null>(null);

  const cek = useCallback(async () => {
    setYukleniyor(true);
    try {
      const res = await fetch("/eczanem/api/baglama-talepleri", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) return;
      setTalepler(Array.isArray(data.talepler) ? data.talepler : []);
    } catch {
      // Sessiz; ana sayfa akışını bloklamaz.
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { void cek(); }, [cek]);

  const kararVer = async (talep: BaglamaTalebi, karar: "onayla" | "reddet") => {
    setIslenenId(talep.talep_id);
    try {
      const res = await fetch("/eczanem/api/baglama-talepleri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talep_id: talep.talep_id, karar }),
      });
      const data = await res.json();
      if (!res.ok) {
        hata(data.hata ?? "Kararınız işlenemedi.", "bağlantı talebi");
        return;
      }
      setRetHedefi(null);
      basari(data.mesaj ?? (karar === "onayla" ? SUREC11_TOAST.baglamaOnaylandi : SUREC11_TOAST.baglamaReddedildi));
      await cek();
      if (karar === "onayla") onOnaylandi?.();
    } catch {
      hata("Kararınız işlenemedi; yeniden deneyin.", "bağlantı talebi");
    } finally {
      setIslenenId(null);
    }
  };

  if (yukleniyor || talepler.length === 0) return null;

  return (
    <>
      <section
        aria-label="Bekleyen eczane bağlantı talepleri"
        className="flex flex-col gap-3 rounded-2xl border border-[var(--tema-yerel-eczanem-cizgi-22)] bg-[var(--tema-yerel-eczanem-kart-01)] p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--tema-yerel-eczanem-ana-metin-05)]">
          <Link2 className="size-4 text-[var(--tema-yerel-eczanem-eylem-metin-01)]" />
          <span>Onayınızı bekleyen eczane bağlantı talebi ({talepler.length})</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {talepler.map((talep) => (
            <div
              key={talep.talep_id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--tema-yerel-eczanem-cizgi-21)] bg-[var(--tema-yerel-eczanem-sayfa-zemini-14)] p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--tema-yerel-eczanem-ana-metin-14)]">
                  {talep.eczane_adi}
                </p>
                <p className="text-xs font-semibold leading-5 text-[var(--tema-yerel-eczanem-yardimci-metin-12)]">
                  {talep.talep_turu === "yeniden_aktivasyon"
                    ? "Daha önce pasife alınan üyeliğinizi yeniden aktifleştirmek istiyor."
                    : "Sizi Eczanem üye listesine eklemek istiyor."}{" "}
                  (Son geçerlilik: {tarihYaz(talep.sona_erme)})
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={islenenId === talep.talep_id}
                  onClick={() => void kararVer(talep, "onayla")}
                  className="bg-[var(--tema-yerel-eczanem-eylem-zemin-01)] text-xs font-extrabold hover:bg-[var(--tema-yerel-eczanem-eylem-zemin-02)]"
                >
                  <CheckCircle2 className="size-3.5" />
                  {islenenId === talep.talep_id ? "İşleniyor…" : "Onayla"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={islenenId === talep.talep_id}
                  onClick={() => setRetHedefi(talep)}
                  className="border-[var(--tema-yerel-eczanem-islevsel-cizgi-05)] text-xs font-bold text-[var(--tema-yerel-eczanem-islevsel-metin-10)]"
                >
                  <XCircle className="size-3.5" />
                  Reddet
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AlertDialog open={!!retHedefi} onOpenChange={(acik) => { if (!acik && !islenenId) setRetHedefi(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eczane bağlantı talebini reddetmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {retHedefi ? `${retHedefi.eczane_adi} tarafından gönderilen talep reddedilecek.` : "Bu talep reddedilecek."}{" "}
              Eczaneyle üyelik bağı kurulmaz; mevcut diğer eczaneleriniz ve puanlarınız etkilenmez.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!islenenId}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!islenenId}
              onClick={(event) => {
                event.preventDefault();
                if (retHedefi) void kararVer(retHedefi, "reddet");
              }}
              className="bg-[var(--tema-yerel-eczanem-islevsel-zemin-16)] hover:bg-[var(--tema-yerel-eczanem-islevsel-zemin-17)]"
            >
              <XCircle className="size-3.5" />
              {islenenId ? "Reddediliyor…" : "Talebi reddet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
