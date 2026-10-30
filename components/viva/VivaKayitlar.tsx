"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock3, Download, Play, Video } from "lucide-react";
import { YenileButonu } from "@/components/ui/yenile-butonu";
import { SayfaYenileBasligi } from "@/components/ui/sayfa-yenile-basligi";
import { vivaIndirmeAcik } from "@/lib/viva/indirme";
import { vivaTarih } from "@/lib/viva/sozlesme";
import styles from "./viva-detay.module.css";
type Kayit = { anahtar: string; id: string | null; baslangic: string | null; sure: number | null; durum: string };
const ADLAR: Record<string, string> = { kaydediliyor: "Kayıt başladı", hazirlaniyor: "Dosya hazırlanıyor", hazir: "Kayıt hazır", hata: "Kayıt hatası" };
export default function VivaKayitlar({ etkinlikId, canli, detayTasarimi = false, yenilemeSayaci = 0 }: { etkinlikId: string; canli: boolean; detayTasarimi?: boolean; yenilemeSayaci?: number }) {
  const [kayitlar, setKayitlar] = useState<Kayit[]>([]), [hata, setHata] = useState(""), [bilgi, setBilgi] = useState("");
  const [indirmeBitis, setIndirmeBitis] = useState<string | null>(null);
  const [sureDoldu, setSureDoldu] = useState(false);
  const [yenileme, setYenileme] = useState(0), [busy, setBusy] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);
  const eylemKontrolu = useRef<AbortController | null>(null);
  const islemKilitli = useRef(false);
  useEffect(() => {
    const kontrol = new AbortController(); eylemKontrolu.current = kontrol;
    return () => { kontrol.abort(); };
  }, [etkinlikId]);
  useEffect(() => {
    if (!indirmeBitis || sureDoldu) return;
    const bitis = Date.parse(indirmeBitis);
    if (!Number.isFinite(bitis)) return;
    if (bitis <= Date.now()) { setSureDoldu(true); return; }
    const timer = setTimeout(() => setSureDoldu(Date.now() >= bitis), Math.min(bitis - Date.now(), 2_147_483_647));
    return () => clearTimeout(timer);
  }, [indirmeBitis, sureDoldu]);
  useEffect(() => {
    setYukleniyor(true);
    const kontrol = new AbortController(); let timer: ReturnType<typeof setTimeout>; const bas = Date.now();
    const oku = async () => {
      if (kontrol.signal.aborted) return;
      if (document.hidden) { timer = setTimeout(() => void oku(), 15_000); return; }
      try {
        const r = await fetch(`/viva/api/kayit?etkinlik_id=${encodeURIComponent(etkinlikId)}`, { cache: "no-store", signal: kontrol.signal });
        const d = await r.json(); if (kontrol.signal.aborted) return; if (!r.ok) throw Error(d.hata ?? "Kayıt bilgileri alınamadı.");
        if (!kontrol.signal.aborted) { setKayitlar(d.kayitlar); setIndirmeBitis(d.indirme_bitis); setSureDoldu(d.suresi_doldu); setHata(""); }
        if (canli || (yenileme > 0 && Date.now() - bas < 90_000) || (Date.now() - bas < 600_000 && d.kayitlar.some((k: Kayit) => ["kaydediliyor", "hazirlaniyor"].includes(k.durum)))) timer = setTimeout(() => void oku(), 15_000);
      } catch (e) { if (!kontrol.signal.aborted) { setKayitlar([]); setIndirmeBitis(null); setSureDoldu(false); setHata(e instanceof Error ? e.message : "Kayıt bilgileri alınamadı."); } }
      finally { if (!kontrol.signal.aborted) setYukleniyor(false); }
    };
    void oku(); return () => { kontrol.abort(); clearTimeout(timer); };
  }, [etkinlikId, canli, yenileme, yenilemeSayaci]);
  async function yenile() {
    if (islemKilitli.current) return;
    islemKilitli.current = true; const signal = eylemKontrolu.current?.signal;
    setBusy(true); setBilgi("");
    try { const r = await fetch("/viva/api/kayit", { method: "POST", headers: { "Content-Type": "application/json" }, signal, body: JSON.stringify({ etkinlik_id: etkinlikId, islem: "yenile" }) }); const d = await r.json(); if (!r.ok) throw Error(d.hata); if (signal?.aborted) return; setHata(""); setBilgi("Kayıt kontrolü sıraya alındı. Sonuçlar otomatik güncellenecek."); setYenileme(n => n + 1); }
    catch { if (!signal?.aborted) setHata("Kayıt kontrolü başlatılamadı."); } finally { islemKilitli.current = false; if (!signal?.aborted) setBusy(false); }
  }
  async function indir(id: string, tur: "video" | "sohbet") {
    if (islemKilitli.current || !vivaIndirmeAcik({ indirme_bitis: indirmeBitis, suresi_doldu: sureDoldu })) return;
    islemKilitli.current = true; const signal = eylemKontrolu.current?.signal;
    setBusy(true); setHata("");
    try { const r = await fetch(`/viva/api/kayit?etkinlik_id=${encodeURIComponent(etkinlikId)}&id=${encodeURIComponent(id)}&tur=${tur}`, { cache: "no-store", signal }); const d = await r.json(); if (!r.ok) { if (r.status === 410) setSureDoldu(true); throw Error(d.hata); } if (signal?.aborted) return; const a = document.createElement("a"); a.href = d.url; a.rel = "noreferrer noopener"; a.referrerPolicy = "no-referrer"; a.click(); }
    catch (e) { if (!signal?.aborted) setHata(e instanceof Error ? e.message : "Kayıt bağlantısı alınamadı."); } finally { islemKilitli.current = false; if (!signal?.aborted) setBusy(false); }
  }
  if (detayTasarimi) return <Card className={styles.pane}><section aria-label="Viva kayıtları">
    <SayfaYenileBasligi className={styles.paneHead} baslik={<h2>Yayın kayıtları</h2>} aksiyon={<YenileButonu yenileniyor={busy} etiket="Kayıtları güncelle" onYenile={yenile} />} />
    <p className={styles.sectionDescription}>Video ve sohbet kaydını yayın odasındaki <strong>Kaydı başlat / Kaydı durdur</strong> düğmesiyle yönetin. Her başlangıç ayrı bir kayıt parçası oluşturabilir.</p>
    <p className={`${styles.note} ${sureDoldu ? styles.warning : ""}`}><Clock3 aria-hidden="true" />{sureDoldu ? "7 günlük indirme süresi doldu." : indirmeBitis ? `Son indirme: ${vivaTarih(indirmeBitis)}` : "Kayıtlar yayın bittikten sonra 7 gün indirilebilir."}</p>
    {hata && <p role="alert" className={styles.error}>{hata}</p>}{bilgi && <p role="status" className={styles.help}>{bilgi}</p>}
    {yukleniyor && <p role="status" className={styles.emptyText}>Kayıt bilgileri yükleniyor…</p>}
    {!yukleniyor && !hata && !kayitlar.length && <div className={styles.empty}><Video aria-hidden="true" /><h3>Henüz kayıt dosyası yok</h3><p>Kaydı başlattığınızda kayıt parçaları burada görünür.</p></div>}
    {!hata && <ul className={styles.dataList}>{kayitlar.map((k, i) => <li key={k.anahtar} className={styles.recordRow}><span className={styles.recordThumb}><Play aria-hidden="true" /></span><div className={styles.recordContent}><strong>Parça {i + 1}</strong><p>{ADLAR[k.durum] ?? "Hazırlanıyor"}{k.sure !== null && ` · ${Math.ceil(k.sure / 60)} dakika`}</p>{k.baslangic && <p>{vivaTarih(k.baslangic)}</p>}</div>{k.durum === "hazir" && k.id && <div className={styles.recordActions}>{(["video", "sohbet"] as const).map(tur => <Button key={tur} variant="outline" disabled={busy || !vivaIndirmeAcik({ indirme_bitis: indirmeBitis, suresi_doldu: sureDoldu })} onClick={() => void indir(k.id!, tur)}><Download aria-hidden="true" />{tur === "video" ? "Videoyu indir" : "Sohbet metnini indir"}</Button>)}</div>}</li>)}</ul>}
  </section></Card>;
  return <section aria-label="Viva kayıtları" className="space-y-3 rounded-xl border border-border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Yayın kayıtları</h2><Button variant="outline" disabled={busy} onClick={() => void yenile()}>Kayıtları güncelle</Button></div>
    <p className="text-sm text-muted-foreground">Video ve sohbet kaydını canlı görüşmenin üstündeki Kaydı başlat / Kaydı durdur düğmesiyle yönetin. Her başlangıç ayrı bir kayıt parçası oluşturabilir. Kayıtlar yayın bittikten sonra 7 gün indirilebilir.</p>
    {indirmeBitis && <p className="text-sm text-muted-foreground">{sureDoldu ? "7 günlük indirme süresi doldu." : `Son indirme: ${new Date(indirmeBitis).toLocaleString("tr-TR")}`}</p>}
    {hata && <p role="alert" className="text-sm text-destructive">{hata}</p>}{bilgi && <p role="status" className="text-sm">{bilgi}</p>}
    {!kayitlar.length ? <p className="text-sm text-muted-foreground">Henüz kayıt dosyası bildirilmedi.</p> : <ul className="divide-y divide-border">{kayitlar.map((k, i) => <li key={k.anahtar} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>Parça {i + 1} · {ADLAR[k.durum] ?? "Hazırlanıyor"}{k.sure !== null && ` · ${Math.ceil(k.sure / 60)} dk`}</span>{k.durum === "hazir" && k.id && <div className="flex flex-wrap gap-2">{(["video", "sohbet"] as const).map(tur => <Button key={tur} variant="outline" disabled={busy || sureDoldu || Boolean(indirmeBitis && Date.now() >= Date.parse(indirmeBitis))} onClick={() => void indir(k.id!, tur)}>{tur === "video" ? "Videoyu indir" : "Sohbet metnini indir"}</Button>)}</div>}</li>)}</ul>}
  </section>;
}
