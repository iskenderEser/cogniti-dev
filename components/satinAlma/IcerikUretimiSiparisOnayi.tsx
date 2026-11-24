"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SUREC5_TOAST } from "@/lib/bildirimler/toastMesajlari";
import type { BakiyeTuru } from "@/lib/satinAlma/esnekPaket";

export type IcerikUretimiSiparisi = { talep_id: string; token: number };

const tokenFormati = new Intl.NumberFormat("tr-TR");
const HESAPLAR = [
  { tur: "kisisel", etiket: "Kişisel Token Hesabı" },
  { tur: "firma_ortak", etiket: "Firma Ortak Token Hesabı" },
] as const;

export function IcerikUretimiSiparisOnayi({ siparis, onKapat, onOdendi }: {
  siparis: IcerikUretimiSiparisi | null;
  onKapat: () => void;
  onOdendi: (mesaj: string) => void;
}) {
  if (!siparis) return null;
  return <AcikSiparisOnayi key={siparis.talep_id} siparis={siparis} onKapat={onKapat} onOdendi={onOdendi} />;
}

function AcikSiparisOnayi({ siparis, onKapat, onOdendi }: {
  siparis: IcerikUretimiSiparisi;
  onKapat: () => void;
  onOdendi: (mesaj: string) => void;
}) {
  const grup = useId();
  const [hesap, setHesap] = useState<BakiyeTuru | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [yetersiz, setYetersiz] = useState(false);
  const kilit = useRef(false);

  async function onayla() {
    if (!hesap || kilit.current) return;
    kilit.current = true;
    setBekliyor(true);
    setHata(null);
    setYetersiz(false);
    try {
      const yanit = await fetch("/api/satin-alma/icerik-uretimi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ talep_id: siparis.talep_id, hesap }),
      });
      const veri = await yanit.json();
      if (!yanit.ok || veri.ok !== true) {
        setYetersiz(yanit.status === 422 && veri.kod === "bakiye_yetersiz");
        setHata(typeof veri.hata === "string" ? veri.hata : "Ödeme tamamlanamadı.");
        return;
      }
    } catch {
      setHata("Ödeme sonucu alınamadı. Aynı siparişi yeniden deneyebilirsiniz.");
      return;
    } finally {
      kilit.current = false;
      setBekliyor(false);
    }

    window.dispatchEvent(new Event("cogniti-token-bakiye-yenile"));
    onKapat();
    onOdendi(SUREC5_TOAST.icerikUretimiOnaylandi);
  }

  return (
    <AlertDialog open onOpenChange={(acik) => { if (!acik && !kilit.current) onKapat(); }}>
      <AlertDialogContent onEscapeKeyDown={(event) => { if (kilit.current) event.preventDefault(); }}>
        <AlertDialogHeader>
          <AlertDialogTitle>Sipariş Onayı</AlertDialogTitle>
          <AlertDialogDescription>
            Talep ettiğiniz içerik için hesabınızdan {tokenFormati.format(siparis.token)} token alınacaktır. Onaylıyor musunuz?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset disabled={bekliyor} className="space-y-2 text-sm">
          <legend className="mb-2 font-semibold">Kullanılacak token hesabı</legend>
          {HESAPLAR.map(({ tur, etiket }) => (
            <label key={tur} className="flex items-center gap-2">
              <input type="radio" name={grup} checked={hesap === tur} onChange={() => {
                setHesap(tur);
                setHata(null);
                setYetersiz(false);
              }} />
              {etiket}
            </label>
          ))}
        </fieldset>
        {hata && <p role="alert" className="text-sm text-destructive">{hata}</p>}
        {yetersiz && <Button asChild variant="outline"><Link href="/fiyatlar">Token Siparişi Ver</Link></Button>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={bekliyor}>Hayır</AlertDialogCancel>
          <Button type="button" disabled={!hesap || bekliyor} onClick={() => void onayla()}>
            {bekliyor ? "İşleniyor…" : "Evet"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
