"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, Info, Mail, RefreshCw, Video } from "lucide-react";
import CognitiLogo from "@/components/marka/CognitiLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vivaTarih } from "@/lib/viva/sozlesme";
import VivaOdaAlani from "./VivaOdaAlani";
import VivaDurumAlani from "./VivaDurumAlani";
import styles from "./viva-yardimci.module.css";

interface MisafirBilgi {
  baslik: string; aciklama: string; baslangic: string; bitis: string; ad: string; eposta_maskeli: string; dogrulandi: boolean;
}
class DavetIstekHatasi extends Error {
  constructor(mesaj: string, readonly status: number) { super(mesaj); }
}
async function davetIstek<T>(url: string, init: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, cache: "no-store", credentials: "same-origin" });
  const d = await r.json();
  if (!r.ok) throw new DavetIstekHatasi(typeof d?.hata === "string" ? d.hata : "İşlem tamamlanamadı. Yeniden deneyin.", r.status);
  return d;
}
function bilgiOku(b: MisafirBilgi): MisafirBilgi {
  if (!b || typeof b.baslik !== "string" || typeof b.ad !== "string" || typeof b.eposta_maskeli !== "string"
    || typeof b.aciklama !== "string" || typeof b.dogrulandi !== "boolean"
    || !Number.isFinite(Date.parse(b.baslangic)) || !Number.isFinite(Date.parse(b.bitis))) throw new Error("Davet bilgileri okunamadı. Yeniden deneyin.");
  return b;
}
// Token değişince eski davetin doğrulanmış görünümü ve istekleri birlikte kaldırılır.
export default function VivaMisafir({ token }: { token: string }) {
  return <MisafirIcerigi key={token} token={token} />;
}
function MisafirIcerigi({ token }: { token: string }) {
  const [bilgi, setBilgi] = useState<MisafirBilgi | null>(null);
  const [hata, setHata] = useState(""); const [gecersiz, setGecersiz] = useState(false);
  const [islemHatasi, setIslemHatasi] = useState(""); const [mesaj, setMesaj] = useState("");
  const [kod, setKod] = useState(""); const [kodAdimi, setKodAdimi] = useState(false);
  const [busy, setBusy] = useState<"kod" | "dogrula" | null>(null);
  const [oda, setOda] = useState(false); const [yenileme, setYenileme] = useState(0);
  const [kontrolEdiliyor, setKontrolEdiliyor] = useState(false);
  const islemKilidi = useRef(false), islemKontrolu = useRef<AbortController | null>(null), bilgiKontrolu = useRef<AbortController | null>(null);
  const url = `/viva/davet/${encodeURIComponent(token)}/api`;
  const yukle = useCallback(async (signal: AbortSignal) => {
    const b = bilgiOku(await davetIstek<MisafirBilgi>(url, { signal }));
    if (!signal.aborted) { setBilgi(b); setHata(""); setGecersiz(false); if (!b.dogrulandi) setOda(false); }
  }, [url]);
  useEffect(() => {
    if (islemKilidi.current) return;
    const kontrol = new AbortController(); bilgiKontrolu.current = kontrol;
    void yukle(kontrol.signal).catch(e => {
      if (!kontrol.signal.aborted) {
        setBilgi(null); setOda(false); setMesaj("");
        setGecersiz(e instanceof DavetIstekHatasi && [403, 404, 410].includes(e.status));
        setHata(e instanceof DavetIstekHatasi ? e.message : "Davet bilgileri alınamadı. Bağlantınızı kontrol ederek yeniden deneyin.");
      }
    }).finally(() => { if (!kontrol.signal.aborted) setKontrolEdiliyor(false); });
    return () => kontrol.abort();
  }, [yukle, yenileme]);
  useEffect(() => () => { islemKontrolu.current?.abort(); }, []);
  useEffect(() => {
    const yenile = () => { if (document.visibilityState === "visible" && !islemKilidi.current) setYenileme(n => n + 1); };
    const timer = window.setInterval(yenile, 30_000);
    document.addEventListener("visibilitychange", yenile);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", yenile); };
  }, []);
  function yenidenKontrol() {
    if (islemKilidi.current) return;
    setKontrolEdiliyor(true); setYenileme(n => n + 1);
  }
  async function islem(tur: "kod" | "dogrula") {
    if (islemKilidi.current || !bilgi || bilgi.dogrulandi || (tur === "dogrula" && !/^\d{6}$/.test(kod))) return;
    islemKilidi.current = true;
    bilgiKontrolu.current?.abort(); setKontrolEdiliyor(false);
    const kontrol = new AbortController(); islemKontrolu.current = kontrol;
    setBusy(tur); setIslemHatasi(""); setMesaj("");
    try {
      const b = await davetIstek<MisafirBilgi & { mesaj?: string }>(url, { method: "POST", signal: kontrol.signal,
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(tur === "kod" ? { islem: tur } : { islem: tur, kod }) });
      if (kontrol.signal.aborted) return;
      if (tur === "dogrula") {
        const dogrulanan = bilgiOku(b);
        if (!dogrulanan.dogrulandi) throw new Error("E-posta doğrulanamadı. Kodu kontrol ederek yeniden deneyin.");
        setBilgi(dogrulanan); setKod(""); setMesaj("E-posta adresiniz doğrulandı.");
      } else { setKodAdimi(true); setKod(""); setMesaj(b.mesaj ?? "Doğrulama kodu davetteki e-posta adresine gönderildi."); }
    } catch (err) {
      if (!kontrol.signal.aborted) {
        setIslemHatasi(err instanceof DavetIstekHatasi ? err.message : "İşlem tamamlanamadı. Bağlantınızı kontrol ederek yeniden deneyin.");
        // Hatalı kod da 403 döner: yalnız bilgi kontrolü davetin kapandığına karar verir.
        if (err instanceof DavetIstekHatasi && [403, 404, 410].includes(err.status)) setYenileme(n => n + 1);
      }
    } finally {
      if (!kontrol.signal.aborted) { islemKilidi.current = false; setBusy(null); }
    }
  }
  const adim = bilgi?.dogrulandi ? 3 : kodAdimi ? 2 : 1;
  return <main className={styles.surface}><div className={`${styles.guestPage} ${oda ? styles.roomPage : ""}`}>
    <header className={styles.guestTop}><CognitiLogo width={150} height={50} /><span className={styles.brandCaption}>Viva · Özel davet</span></header>
    {!oda && <nav className={styles.breadcrumb} aria-label="İçerik konumu"><span>Cogniti · Viva</span><ChevronRight aria-hidden="true" /><span aria-current="page">Özel davet</span></nav>}
    {!bilgi && !hata && <VivaDurumAlani tur="yukleniyor" anaBaslik baslik="Davet kontrol ediliyor…" aciklama="Etkinlik bilgileriniz ve davetinizin durumu yükleniyor." />}
    {!bilgi && hata && <VivaDurumAlani tur={gecersiz ? "kilit" : "hata"} anaBaslik baslik={gecersiz ? "Bu davet artık kullanılamıyor" : "Davet açılamadı"}
      aciklama={<>{hata}{gecersiz && <><br />Yeni bir bağlantı için etkinliği düzenleyen kişiyle iletişime geçin.</>}</>}>
      <Button variant="outline" disabled={kontrolEdiliyor} onClick={yenidenKontrol}><RefreshCw aria-hidden="true" />{kontrolEdiliyor ? "Kontrol ediliyor…" : "Daveti yeniden kontrol et"}</Button>
    </VivaDurumAlani>}
    {bilgi && !oda && <div className={styles.guestLayout}>
      <section className={styles.welcome}>
        <p className={styles.kicker}>BİRLİKTE ÖĞRENMEYE DAVETLİSİNİZ</p><h1>Bir buluşma,<br />yeni bir bakış açısı.</h1>
        <p className={styles.summary}>Merhaba {bilgi.ad}. Viva etkinliğine izleyici olarak davet edildiniz.</p>
        <div className={styles.facts}>
          <div className={styles.fact}><Video aria-hidden="true" /><div><h2>{bilgi.baslik}</h2>{bilgi.aciklama && <p className={styles.eventDescription}>{bilgi.aciklama}</p>}</div></div>
          <div className={styles.fact}><CalendarDays aria-hidden="true" /><div><strong>{vivaTarih(bilgi.baslangic)}</strong><p>Bitiş: {vivaTarih(bilgi.bitis)} · Türkiye saati</p></div></div>
        </div>
      </section>
      <section className={styles.verifyCard} aria-labelledby="viva-dogrulama-baslik" aria-busy={!!busy}>
        <ol className={styles.steps} aria-label="Davet adımları">{["E-posta doğrulama", "Kodu doğrulayın", "E-posta doğrulandı"].map((metin, i) => <li key={metin} className={i < adim ? styles.stepDone : undefined} aria-current={i + 1 === adim ? "step" : undefined}><span className={styles.srOnly}>{i + 1}. {metin}</span></li>)}</ol>
        <span className={styles.guestRole}>{adim === 3 ? <Check aria-hidden="true" /> : <Mail aria-hidden="true" />}0{adim} · {adim === 1 ? "E-posta doğrulama" : adim === 2 ? "Kodu doğrulayın" : "E-posta doğrulandı"}</span>
        <h2 id="viva-dogrulama-baslik">{adim === 1 ? "Davetiniz size özel." : adim === 2 ? "E-postanızı kontrol edin." : `Hoş geldiniz, ${bilgi.ad}.`}</h2>
        {adim === 1 ? <>
          <p>Katılım için <strong>{bilgi.eposta_maskeli}</strong> adresine göndereceğimiz altı haneli kodu doğrulayın.</p>
          <Button className={styles.fullButton} disabled={!!busy || kontrolEdiliyor} onClick={() => void islem("kod")}>{busy === "kod" ? "Kod gönderiliyor…" : "E-posta doğrulama kodu gönder"}<ArrowRight aria-hidden="true" /></Button>
          <p className={styles.help}>Kod yalnızca davetinizde kayıtlı e-posta adresine gönderilir.</p>
          <Button variant="ghost" className={styles.fullButton} disabled={!!busy} onClick={() => setKodAdimi(true)}>Kodum var</Button>
        </> : adim === 2 ? <>
          <p><strong>{bilgi.eposta_maskeli}</strong> adresine gönderilen altı haneli kodu girin.</p>
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); void islem("dogrula"); }}>
            <Label htmlFor="viva-kod">Doğrulama kodu</Label><Input id="viva-kod" className={styles.otp} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={kod} disabled={!!busy} placeholder="••••••" aria-describedby="viva-kod-yardim" aria-invalid={!!islemHatasi || undefined} onChange={x => setKod(x.target.value.replace(/\D/g, "").slice(0, 6))} />
            <p className={styles.help} id="viva-kod-yardim">Kod davetinizdeki e-posta adresine bağlıdır.</p>
            <Button type="submit" className={styles.fullButton} disabled={!!busy || kontrolEdiliyor || kod.length !== 6}>{busy === "dogrula" ? "Doğrulanıyor…" : "Doğrula"}<ArrowRight aria-hidden="true" /></Button>
          </form>
          <Button variant="ghost" className={styles.fullButton} disabled={!!busy || kontrolEdiliyor} onClick={() => void islem("kod")}>{busy === "kod" ? "Kod gönderiliyor…" : "Kodu yeniden gönder"}</Button>
        </> : <>
          <p>Etkinliği izlemeye hazırsınız. Yayın odasına geçerek katılım durumunu kontrol edebilirsiniz.</p>
          <div className={styles.successNote}><Check aria-hidden="true" />E-posta doğrulandı · İzleyici</div>
          <Button className={styles.fullButton} disabled={kontrolEdiliyor} onClick={() => setOda(true)}><Video aria-hidden="true" />Yayın odasını aç</Button>
        </>}
        {islemHatasi && <p role="alert" className={styles.error}>{islemHatasi}</p>}{mesaj && <p role="status" className={styles.message}>{mesaj}</p>}
        <div className={styles.note}><Info aria-hidden="true" /><p>Bu davet yalnızca bu etkinliği izlemek içindir. Kamera ve mikrofon gönderemezsiniz. Erişiminiz etkinlik bitiminde kapanır.</p></div>
      </section>
    </div>}
    {bilgi?.dogrulandi && oda && <section className={styles.guestRoom} aria-label="Misafir yayın odası">
      <header className={styles.roomHeader}><div><Button variant="ghost" onClick={() => setOda(false)}><ArrowLeft aria-hidden="true" />Etkinlik bilgilerine dön</Button><h1>{bilgi.baslik}</h1><p>{vivaTarih(bilgi.baslangic)} – {vivaTarih(bilgi.bitis)} · İzleyici</p></div><span className={styles.viewerTag}>Yalnız izleme</span></header>
      <VivaOdaAlani davetToken={token} onDonus={() => setOda(false)} />
    </section>}
    {bilgi && <div className={styles.refreshLine}><Button variant="ghost" disabled={!!busy || kontrolEdiliyor} onClick={yenidenKontrol}><RefreshCw aria-hidden="true" />{kontrolEdiliyor ? "Kontrol ediliyor…" : "Daveti yeniden kontrol et"}</Button></div>}
    <footer className={styles.guestFooter}>Cogniti · bilgi taşır</footer>
  </div></main>;
}
