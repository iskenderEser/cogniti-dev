"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Info, RefreshCw } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { Button } from "@/components/ui/button";
import { vivaUuidMu } from "@/lib/viva/sozlesme";
import VivaDurumAlani from "./VivaDurumAlani";
import styles from "./viva-yardimci.module.css";

type Sonuc = { id: string; deneme: number; durum: "dogrulandi" | "yetkisiz" | "hata" };
export default function VivaEntegrasyonOnizleme({ etkinlikId }: { etkinlikId?: string }) {
  const [deneme, setDeneme] = useState(0);
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const gecerli = vivaUuidMu(etkinlikId);
  useEffect(() => {
    if (!gecerli || !etkinlikId) return;
    const kontrol = new AbortController();
    async function kontrolEt() {
      try {
        const r = await fetch(`/viva/api?islem=detay&etkinlik_id=${encodeURIComponent(etkinlikId!)}`, { cache: "no-store", credentials: "same-origin", signal: kontrol.signal });
        const d = await r.json();
        if (!kontrol.signal.aborted) setSonuc({ id: etkinlikId!, deneme,
          durum: r.ok && d?.etkinlik?.yonetebilir === true ? "dogrulandi" : r.ok || [401, 403, 404].includes(r.status) ? "yetkisiz" : "hata" });
      } catch { if (!kontrol.signal.aborted) setSonuc({ id: etkinlikId!, deneme, durum: "hata" }); }
    }
    void kontrolEt(); return () => kontrol.abort();
  }, [etkinlikId, deneme, gecerli]);
  const durum = !gecerli ? "gecersiz" : sonuc?.id === etkinlikId && sonuc.deneme === deneme ? sonuc.durum : "kontrol";
  return <main className={styles.surface}><div className={styles.integrationPage}>
    <header className={styles.guestTop}><CognitiLogo width={150} height={50} /><span className={styles.brandCaption}>Viva · Önizleme</span></header>
    <p className={styles.kicker}>COGNİTİ · VİVA</p><h1 className={styles.integrationTitle}>Birlikte öğrenme alanı</h1>
    {durum === "kontrol" ? <VivaDurumAlani tur="yukleniyor" baslik="Cogniti oturumu kontrol ediliyor…" aciklama="Etkinlik yetkiniz doğrulanıyor." />
      : durum === "dogrulandi" ? <>
        <div className={styles.successNote} role="status"><Check aria-hidden="true" />Cogniti oturumunuz ve etkinlik yetkiniz doğrulandı.</div>
        <article className={styles.integrationContent}><p className={styles.kicker}>İÇERİK ALANI · ÖNİZLEME</p><h2>Yayın sırasında içerik paylaşımı</h2><p>Görüşme sırasında Cogniti içeriğinin açılacağı alanın tasarım örneği.</p>
          <div className={styles.documentPreview}><span className={styles.documentLine} aria-hidden="true" /><h3>Birlikte öğrenmek,<br />birlikte gelişmek.</h3><p>Örnek içerik · Gerçek öğrenme aracı, soru veya puan işlemi içermez.</p></div>
        </article>
      </> : <VivaDurumAlani tur={durum === "hata" ? "hata" : "kilit"} baslik={durum === "gecersiz" ? "Geçersiz etkinlik" : durum === "hata" ? "Cogniti bağlantısı doğrulanamadı" : "Cogniti oturumu doğrulanamadı"}
        aciklama={durum === "gecersiz" ? "Önizlemeyi geçerli bir etkinliğin yayın odasından açın." : "Etkinliği ana Cogniti penceresinde kontrol edin."}>
        {gecerli && <Button variant="outline" onClick={() => setDeneme(n => n + 1)}><RefreshCw aria-hidden="true" />Yeniden dene</Button>}
      </VivaDurumAlani>}
    <div className={styles.note}><Info aria-hidden="true" /><p>Bu alan Cogniti entegrasyon önizlemesidir. Gerçek içerik, öğrenme veya puan işlemi başlatmaz.</p></div>
    {gecerli && <div className={styles.actions}><Button asChild variant="outline"><a href={`/viva/${etkinlikId}`} target="_blank" rel="noopener noreferrer">Etkinlik bilgilerini aç<ArrowUpRight aria-hidden="true" /></a></Button></div>}
  </div></main>;
}
