"use client";

import { useId, useRef, useState } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { TaahhutluPaket } from "@/lib/fiyat/taahhut";
import { esnekPaketBakiyeTuru } from "@/lib/satinAlma/esnekPaket";
import { abonelikIlkDonem } from "@/lib/satinAlma/abonelikIlkDonem";
import { trGunu } from "@/lib/zaman/kontrol";
import styles from "./fiyatlar.module.css";

const fiyat = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AbonelikPaketSecimi({ paketler, rol, kullaniciId }: {
  paketler: TaahhutluPaket[];
  rol: string;
  kullaniciId: string;
}) {
  const grup = useId();
  const [seciliPaket, setSeciliPaket] = useState<number | null>(null);
  const [acik, setAcik] = useState(false);
  const [baslangic, setBaslangic] = useState("");
  const [bekliyor, setBekliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [kayitSonucu, setKayitSonucu] = useState<{ paket: string; hesap: string } | null>(null);
  const [tarifeDegisti, setTarifeDegisti] = useState(false);
  const gonderiliyor = useRef(false);
  const hesapTuru = kullaniciId ? esnekPaketBakiyeTuru(rol) : null;
  const secim = paketler.find(paket => paket.id === seciliPaket);
  const hesapAdi = hesapTuru === "kisisel" ? "Kişisel Token Hesabı" : "Firma Token Hesabı";
  const aylikKurus = secim ? Math.round(secim.aylik * 100) : 0;
  const kdvKurus = Math.round(aylikKurus / 5);
  const ilkDonem = secim && baslangic ? abonelikIlkDonem(baslangic, secim.token, aylikKurus) : null;

  async function onayla() {
    if (!hesapTuru || !secim || !ilkDonem || tarifeDegisti || gonderiliyor.current) return;
    const paketNo = secim.id;
    const anahtar = `cogniti-abonelik:${kullaniciId}:${hesapTuru}:${paketNo}:${secim.token}:${aylikKurus}:${baslangic}`;
    gonderiliyor.current = true;
    setBekliyor(true);
    setMesaj("");
    try {
      const islemAnahtari = sessionStorage.getItem(anahtar) ?? crypto.randomUUID();
      sessionStorage.setItem(anahtar, islemAnahtari);
      const yanit = await fetch("/api/satin-alma/abonelik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hesapTuru, paketNo, aylikToken: secim.token, aylikKurus, islemAnahtari, baslangic }),
        signal: AbortSignal.timeout(20000),
      });
      const veri = await yanit.json();
      if (yanit.ok && veri.ok === true && typeof veri.siparisId === "string") {
        sessionStorage.removeItem(anahtar);
        setAcik(false);
        setSeciliPaket(null);
        setKayitSonucu({ paket: secim.ad, hesap: hesapAdi });
        window.dispatchEvent(new Event("cogniti-token-bakiye-yenile"));
      } else if ([400, 401, 403, 409].includes(yanit.status)) {
        if (yanit.status === 409) {
          sessionStorage.removeItem(anahtar);
          setTarifeDegisti(true);
        }
        setMesaj(typeof veri.hata === "string" ? veri.hata : "Sipariş kaydedilemedi.");
      } else {
        setMesaj("Sipariş sonucu doğrulanamadı. Aynı seçimle yeniden deneyin.");
      }
    } catch {
      setMesaj("Sipariş sonucu doğrulanamadı. Aynı seçimle yeniden deneyin.");
    } finally {
      gonderiliyor.current = false;
      setBekliyor(false);
    }
  }

  if (!paketler.length) return <p>Şu anda satışta abonelik paketi bulunmuyor.</p>;

  return <>
    <table className={styles.paketTablosu} aria-label="Abonelik paket fiyatları">
      <thead><tr><th scope="col">Paket</th><th scope="col">Token / ay</th><th scope="col">TL / token</th><th scope="col">Aylık Fatura tutarı</th></tr></thead>
      <tbody>
        {paketler.map(paket => (
          <tr key={paket.id}>
            <th scope="row">
              {hesapTuru ? (
                <label className={styles.abonelikPaketSecenegi}>
                  <input type="radio" name={grup} value={paket.id}
                    checked={seciliPaket === paket.id} onChange={() => setSeciliPaket(paket.id)} />
                  {paket.ad}
                </label>
              ) : paket.ad}
            </th>
            <td>{paket.token.toLocaleString("tr-TR")}</td>
            <td>{fiyat.format(paket.birim)}</td>
            <td>{paket.aylik.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL</td>
          </tr>
        ))}
      </tbody>
    </table>
    {hesapTuru && (
      <div className={styles.abonelikSiparisAlani}>
        <AlertDialog open={acik} onOpenChange={sonraki => {
          if (gonderiliyor.current) return;
          if (sonraki && !tarifeDegisti) {
            setMesaj("");
            setBaslangic(trGunu());
          }
          setAcik(sonraki);
        }}>
          <AlertDialogTrigger asChild>
            <Button type="button" disabled={!secim}>Siparişi Tamamla</Button>
          </AlertDialogTrigger>
          {secim && ilkDonem && (
            <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <AlertDialogHeader>
                <AlertDialogTitle>Abonelik Siparişini Onaylayın</AlertDialogTitle>
                <AlertDialogDescription>Seçtiğiniz paketi ve aylık tutarı kontrol edin.</AlertDialogDescription>
              </AlertDialogHeader>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <dt>Seçilen Paket</dt><dd className="text-right">{secim.ad}</dd>
                <dt>İlk Dönem</dt><dd className="text-right">{ilkDonem.kalanGun} gün</dd>
                <dt>İlk Yüklenecek Token</dt><dd className="text-right">{ilkDonem.token.toLocaleString("tr-TR")}</dd>
                <dt>İlk Dönem Tutarı</dt><dd className="text-right">{fiyat.format(ilkDonem.kurus / 100)} TL</dd>
                <dt>İlk Dönem KDV (%20)</dt><dd className="text-right">{fiyat.format(ilkDonem.kdvKurus / 100)} TL</dd>
                <dt className="font-semibold">İlk Dönem KDV Dahil Toplam</dt>
                <dd className="text-right font-semibold">{fiyat.format((ilkDonem.kurus + ilkDonem.kdvKurus) / 100)} TL</dd>
                <dt>Token Adedi / Ay</dt><dd className="text-right">{secim.token.toLocaleString("tr-TR")}</dd>
                <dt>Token Hesabı</dt><dd className="text-right">{hesapAdi}</dd>
                <dt>KDV Hariç Aylık Tutar</dt><dd className="text-right">{fiyat.format(aylikKurus / 100)} TL</dd>
                <dt>KDV (%20)</dt><dd className="text-right">{fiyat.format(kdvKurus / 100)} TL</dd>
                <dt className="font-semibold">KDV Dahil Aylık Toplam</dt>
                <dd className="text-right font-semibold">{fiyat.format((aylikKurus + kdvKurus) / 100)} TL</dd>
              </dl>
              {mesaj && <p role="alert" className="text-sm">{mesaj}</p>}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={bekliyor}>Vazgeç</AlertDialogCancel>
                <Button type="button" disabled={bekliyor || tarifeDegisti} onClick={() => void onayla()}>
                  {bekliyor ? "Kaydediliyor…" : "Onayla"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          )}
        </AlertDialog>
      </div>
    )}
    <div role="status">
      {kayitSonucu && <p>Abonelik siparişiniz kaydedildi. {kayitSonucu.paket} · {kayitSonucu.hesap}</p>}
    </div>
  </>;
}
