"use client";

import { useRef, useState } from "react";
import { HataMesajiContainer, useHataMesaji } from "@/components/HataMesaji";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SUREC3_TOAST } from "@/lib/bildirimler/toastMesajlari";
import { kkoHesapTuru } from "@/lib/satinAlma/kkoYetkisi";
import { KKO_TOKEN_FIYATI } from "@/lib/token/fiyatlandirma";
import { kkoSecimIstegiGecerli, type KkoSecimIstegi } from "@/lib/satinAlma/kkoSecimi";

/** KKÖ seçimi, Esnek Paket siparişinden bağımsız çalışır. */
export default function KkoSecimModali({ rol, kullaniciId }: { rol: string; kullaniciId: string }) {
  const [acikHesap, setAcikHesap] = useState<string | null>(null);
  const [istek, setIstek] = useState<KkoSecimIstegi | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  const kilit = useRef(false);
  const { mesajlar, basari, hata } = useHataMesaji();
  const hesapTuru = kkoHesapTuru(rol);
  if (!hesapTuru || !kullaniciId) return null;
  const hesapAnahtari = `${kullaniciId}:${hesapTuru}:${rol}`;
  const hesapAdi = hesapTuru === "kisisel" ? "Kişisel Token Hesabı" : "Firma Token Hesabı";
  const kayitAnahtari = `cogniti-kko-secim:${kullaniciId}:${hesapTuru}`;
  function acikligiDegistir(acik: boolean) {
    if (kilit.current) return;
    if (!acik) { setAcikHesap(null); return; }
    try {
      const kayit = sessionStorage.getItem(kayitAnahtari);
      const veri: unknown = kayit ? JSON.parse(kayit) : null;
      setIstek(kkoSecimIstegiGecerli(veri) && veri.hesapTuru === hesapTuru ? veri
        : { hesapTuru: hesapTuru!, birimFiyat: KKO_TOKEN_FIYATI, islemAnahtari: crypto.randomUUID() });
    } catch { setIstek(null); hata("Seçim kaydı okunamadı. Tarayıcının oturum depolamasına izin verin."); }
    setAcikHesap(hesapAnahtari);
  }
  async function onayla() {
    if (!istek || kilit.current) return;
    kilit.current = true; setBekliyor(true);
    try {
      sessionStorage.setItem(kayitAnahtari, JSON.stringify(istek));
    } catch {
      hata("Seçim kaydı saklanamadı. Tarayıcının oturum depolamasına izin verin.");
      kilit.current = false; setBekliyor(false); return;
    }
    try {
      const r = await fetch("/api/satin-alma/kko", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(istek), signal: AbortSignal.timeout(20000) });
      const veri = await r.json();
      if (r.ok && veri.ok === true && typeof veri.hesapId === "string") {
        sessionStorage.removeItem(kayitAnahtari); setAcikHesap(null); setIstek(null);
        basari(SUREC3_TOAST.kkoTanimlandi(hesapTuru!));
        window.dispatchEvent(new Event("cogniti-token-bakiye-yenile"));
      } else if ([400, 401, 403, 409].includes(r.status)) {
        sessionStorage.removeItem(kayitAnahtari); setIstek(null);
        hata(typeof veri.hata === "string" ? veri.hata : "KKÖ seçimi onaylanamadı.");
        if (r.status === 409) window.dispatchEvent(new Event("cogniti-token-bakiye-yenile"));
      } else hata("Seçimin sonucu doğrulanamadı. Aynı seçim için yeniden Onayla’ya basabilirsiniz.");
    } catch { hata("Seçimin sonucu doğrulanamadı. Aynı seçim için yeniden Onayla’ya basabilirsiniz."); }
    finally { kilit.current = false; setBekliyor(false); }
  }

  return <div className="flex flex-col items-end gap-2">
    <HataMesajiContainer mesajlar={mesajlar} />
    <AlertDialog open={acikHesap === hesapAnahtari} onOpenChange={acikligiDegistir}>
      <AlertDialogTrigger asChild><Button type="button">Siparişi Tamamla</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kullandığın Kadar Öde Seçimi</AlertDialogTitle>
          <AlertDialogDescription>Kullandığınız token miktarı ay sonunda faturalanır.</AlertDialogDescription>
        </AlertDialogHeader>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt>Seçilen Hesap</dt><dd className="text-right">{hesapAdi}</dd>
          <dt>Aylık Kullanım Limiti</dt><dd className="text-right">1.500 token</dd>
          <dt>Birim Fiyat / Token</dt><dd className="text-right">{(istek?.birimFiyat ?? KKO_TOKEN_FIYATI).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</dd>
          <dt>Faturalama</dt><dd className="text-right">Kullanılan Miktar Kadar</dd>
        </dl>
        <p className="text-sm text-muted-foreground">Kullanılmayan aylık kullanım hakkı sonraki aya devretmez. Fiyatlar KDV hariçtir.</p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={bekliyor}>Vazgeç</AlertDialogCancel>
          <Button type="button" disabled={bekliyor || !istek} onClick={() => void onayla()}>{bekliyor ? "İşleniyor…" : "Onayla"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
