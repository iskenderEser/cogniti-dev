"use client";

import { useEffect, useRef, useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { esnekPaketBakiyeTuru, esnekPaketSiparisIstegiGecerli, type EsnekPaketSiparisIstegi } from "@/lib/satinAlma/esnekPaket";

type Teklif = { tokenAdedi: number; tarifeSurumu: number; birimFiyat: number };
const para = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function EsnekPaketSiparis({ rol, kullaniciId, teklif, fiyatYenile }: {
  rol: string; kullaniciId: string; teklif: Teklif | null; fiyatYenile: () => void;
}) {
  const hesapTuru = esnekPaketBakiyeTuru(rol);
  const [acik, setAcik] = useState(false);
  const [siparis, setSiparis] = useState<EsnekPaketSiparisIstegi | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  const [belirsiz, setBelirsiz] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [hazir, setHazir] = useState(false);
  const kilit = useRef(false);
  const kayitAnahtari = `cogniti-esnek-siparis:${kullaniciId}:${hesapTuru}`;

  useEffect(() => {
    try {
      const kayit = sessionStorage.getItem(kayitAnahtari);
      if (kayit) {
        const veri: unknown = JSON.parse(kayit);
        if (esnekPaketSiparisIstegiGecerli(veri)) {
          setSiparis(veri); setBelirsiz(true);
          setMesaj("Önceki siparişin sonucu doğrulanmadı. Aynı siparişi yeniden deneyin.");
        } else sessionStorage.removeItem(kayitAnahtari);
      }
      setHazir(true);
    } catch { setMesaj("Sipariş kaydı okunamadı. Tarayıcının oturum depolamasına izin verin."); }
  }, [kayitAnahtari]);

  if (!hesapTuru || !kullaniciId) return null;
  const hesapAdi = hesapTuru === "kisisel" ? "Kişisel Token Hesabı" : "Firma Token Hesabı";
  const paketTutariKurus = siparis ? Math.round(siparis.birimFiyat * 100) * siparis.tokenAdedi : 0;
  const kdvKurus = Math.round(paketTutariKurus * 20 / 100);
  function ac() {
    setMesaj(belirsiz ? "Önceki siparişin sonucunu aynı işlemle doğrulayacağız." : "");
    if (!belirsiz && teklif) setSiparis({ ...teklif, islemAnahtari: crypto.randomUUID() });
    setAcik(true);
  }
  async function onayla() {
    if (!siparis || kilit.current) return;
    kilit.current = true; setBekliyor(true); setMesaj("");
    // Yanıt kaybolursa sayfa yenilense bile aynı işlem anahtarı ile devam edilir.
    try { sessionStorage.setItem(kayitAnahtari, JSON.stringify(siparis)); }
    catch {
      setMesaj("Sipariş kaydı saklanamadı. Tarayıcının oturum depolamasına izin verin.");
      kilit.current = false; setBekliyor(false); return;
    }
    try {
      const yanit = await fetch("/api/satin-alma/esnek-paket", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...siparis, hesapTuru }), signal: AbortSignal.timeout(20000),
      });
      const veri = await yanit.json();
      if (yanit.ok && veri.ok === true && typeof veri.siparisId === "string") {
        sessionStorage.removeItem(kayitAnahtari); setBelirsiz(false); setSiparis(null); setAcik(false);
        setMesaj(`Siparişiniz kaydedildi. Tokenlar ${hesapAdi}na yüklendi.`);
        window.dispatchEvent(new Event("cogniti-token-bakiye-yenile"));
      } else if ([400, 401, 403, 409].includes(yanit.status)) {
        sessionStorage.removeItem(kayitAnahtari); setBelirsiz(false); setSiparis(null); setAcik(false);
        setMesaj(typeof veri.hata === "string" ? veri.hata : "Sipariş onaylanamadı.");
        if (yanit.status === 409) fiyatYenile();
      } else {
        setBelirsiz(true); setMesaj("Sipariş sonucu doğrulanamadı. Aynı siparişi yeniden deneyin.");
      }
    } catch {
      setBelirsiz(true); setMesaj("Sipariş sonucu doğrulanamadı. Aynı siparişi yeniden deneyin.");
    } finally { kilit.current = false; setBekliyor(false); }
  }
  return <div className="mt-4 flex flex-col items-end gap-2">
    <Button type="button" disabled={!hazir || (!teklif && !belirsiz)} onClick={ac}>
      {belirsiz ? "Sipariş sonucunu kontrol et" : "Siparişi tamamla"}
    </Button>
    {!acik && mesaj && <p role="status" className="text-sm text-muted-foreground">{mesaj}</p>}
    <AlertDialog open={acik} onOpenChange={v => { if (!kilit.current) setAcik(v); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Esnek Paket Sipariş Detayı</AlertDialogTitle>
          <AlertDialogDescription>Tokenlarınızı 31 Aralık&apos;a kadar dilediğiniz zaman kullanabilirsiniz.</AlertDialogDescription>
        </AlertDialogHeader>
        {siparis && <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt>Token Hesabı</dt><dd className="text-right">{hesapAdi}</dd>
          <dt>Token Adedi</dt><dd className="text-right">{siparis.tokenAdedi.toLocaleString("tr-TR")}</dd>
          <dt>KDV Hariç Paket Tutarı</dt><dd className="text-right">{para(paketTutariKurus / 100)} TL</dd>
          <dt>KDV (%20)</dt><dd className="text-right">{para(kdvKurus / 100)} TL</dd>
          <dt className="font-semibold">KDV Dahil Paket Toplamı</dt>
          <dd className="text-right font-semibold">{para((paketTutariKurus + kdvKurus) / 100)} TL</dd>
        </dl>}
        {mesaj && <p role="alert" className="text-sm">{mesaj}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={bekliyor}>{belirsiz ? "Kapat" : "Vazgeç"}</AlertDialogCancel>
          <Button type="button" disabled={bekliyor || !siparis} onClick={() => void onayla()}>
            {bekliyor ? "İşleniyor…" : belirsiz ? "Aynı siparişi yeniden dene" : "Siparişi onayla"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
