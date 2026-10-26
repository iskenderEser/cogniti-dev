"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { vivaGorusmeGirdisi, vivaPrebuiltBaslat } from "@/lib/viva/prebuilt";
import { vivaOnizlemeAyari } from "@/lib/viva/onizleme";
import styles from "./viva-oda.module.css";
import { ArrowRight, Check, Clock3, LoaderCircle, LockKeyhole, MicOff, Video, VideoOff, WifiOff } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type Hedef = { etkinlikId: string; davetToken?: never } | { davetToken: string; etkinlikId?: never };
type Durum = "beklemede" | "baglaniyor" | "bekliyor" | "hazirlaniyor" | "gorusmede" | "ayrildi" | "hata";
export default function VivaOdaAlani({ etkinlikId, davetToken, onDonus, surum, onizleme = false, otomatikKatil = false }: Hedef & { onDonus?: () => void; surum?: number; onizleme?: boolean; yonetebilir?: boolean; otomatikKatil?: boolean }) {
  const kapsayici = useRef<HTMLDivElement>(null);
  const bitirmeEngelli = useRef(true);
  const [bitirmeOnayi, setBitirmeOnayi] = useState(false);
  const [deneme, setDeneme] = useState(otomatikKatil ? 1 : 0);
  const [durum, setDurum] = useState<Durum>(otomatikKatil ? "baglaniyor" : "beklemede");
  const [beklemeNedeni, setBeklemeNedeni] = useState<"zaman" | "oda" | "sunucu">("oda");
  const [baglantiKesik, setBaglantiKesik] = useState(false);
  const [sonlandirildi, setSonlandirildi] = useState(false);
  const [saglayiciBekliyor, setSaglayiciBekliyor] = useState(false);
  const yenidenKontrol = useRef<(() => void) | null>(null);
  const bitirKilidi = useRef(false), eylemKontrolu = useRef<AbortController | null>(null);
  useEffect(() => { const kontrol = new AbortController(); eylemKontrolu.current = kontrol; return () => kontrol.abort(); }, [etkinlikId, davetToken]);
  const [mesaj, setMesaj] = useState("");
  const [paylasim, setPaylasim] = useState(true);
  const [rol, setRol] = useState("");
  const [bitiriliyor, setBitiriliyor] = useState(false);
  const bitirmePasif = bitiriliyor || baglantiKesik || rol !== "sunucu" || durum !== "gorusmede";
  useEffect(() => { bitirmeEngelli.current = bitirmePasif; }, [bitirmePasif]);
  const yol = etkinlikId ? "/viva/api/katilim" : `/viva/davet/${encodeURIComponent(davetToken!)}/katilim`;
  const bitirmeAcik = Boolean(etkinlikId && surum);
  const govde = etkinlikId ? JSON.stringify({ etkinlik_id: etkinlikId }) : "{}";
  useEffect(() => {
    if (!deneme || !kapsayici.current) return;
    const kontrol = new AbortController();
    let istekSuruyor = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let baslatTimer: ReturnType<typeof setTimeout> | undefined;
    let oturum: ReturnType<typeof vivaPrebuiltBaslat> | undefined;
    const kapat = () => {
      kontrol.abort(); clearTimeout(timer); clearTimeout(baslatTimer);
      void oturum?.kapat().catch(() => undefined);
    };
    const sayfadanCik = () => { kapat(); setDurum("ayrildi"); };
    window.addEventListener("pagehide", sayfadanCik);
    const basladiBildir = async () => {
      try {
        const r = await fetch("/viva/api/yasam", { method: "POST", cache: "no-store", signal: kontrol.signal,
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "basladi", etkinlik_id: etkinlikId }) });
        if (!kontrol.signal.aborted) {
          if (r.status === 202 || r.status === 429 || r.status >= 500) baslatTimer = setTimeout(() => void basladiBildir(), 5_000);
          else if (!r.ok) setMesaj("Yayın başlangıcı doğrulanamadı. Etkinlik bilgilerini yenileyin.");
        }
      } catch { if (!kontrol.signal.aborted) baslatTimer = setTimeout(() => void basladiBildir(), 5_000); }
    };
    const baglan = async () => {
      if (istekSuruyor || kontrol.signal.aborted || oturum) return;
      istekSuruyor = true;
      try {
        const res = await fetch(yol, { method: "POST", credentials: "same-origin", cache: "no-store", signal: kontrol.signal,
          headers: { "Content-Type": "application/json" }, body: govde });
        const data = await res.json();
        if (kontrol.signal.aborted) return;
        if (!res.ok) throw new Error(typeof data?.hata === "string" ? data.hata : "Katılım doğrulanamadı.");
        if (res.status === 202 && data?.durum === "bekliyor" && ["zaman", "oda", "sunucu"].includes(data.neden)) {
          setDurum("bekliyor"); setBeklemeNedeni(data.neden);
          setMesaj(data.neden === "zaman" ? "Etkinliğin başlama saati bekleniyor." : data.neden === "sunucu" ? "Sunucunun görüşmeye katılması bekleniyor." : "Görüşme odası hazırlanıyor.");
          timer = setTimeout(() => void baglan(), 5_000);
          return;
        }
        const girdi = vivaGorusmeGirdisi(data);
        if (res.status !== 200 || !kapsayici.current) throw new Error("Katılım doğrulanamadı.");
        setDurum("hazirlaniyor"); setMesaj(""); setRol(girdi.rol);
        oturum = vivaPrebuiltBaslat({ kapsayici: kapsayici.current, girdi,
          ...(onizleme && etkinlikId && girdi.rol === "sunucu" ? { entegrasyonlar: vivaOnizlemeAyari(window.location.origin, etkinlikId) } : {}),
          // Alt çubuk doğrudan ortak onayı açar; üstte ikinci bir kontrol bulunmaz.
          ...(bitirmeAcik && girdi.rol === "sunucu" ? { bitirmeIstegi: () => {
            if (!kontrol.signal.aborted && !bitirmeEngelli.current) setBitirmeOnayi(true);
          } } : {}),
          baglanti: kesik => { if (!kontrol.signal.aborted) setBaglantiKesik(kesik); },
          durum: d => { if (!kontrol.signal.aborted) {
            setDurum(d);
            if (d === "gorusmede" && girdi.rol === "sunucu" && etkinlikId) void basladiBildir();
            if (d === "ayrildi") { clearTimeout(baslatTimer); setBaglantiKesik(false); }
          } },
          hata: m => { if (!kontrol.signal.aborted) { setMesaj(m); setDurum("hata"); setBaglantiKesik(false); } },
          paylasimDestegi: d => { if (!kontrol.signal.aborted) setPaylasim(d); },
          kayitDurdu: instanceId => {
            if (kontrol.signal.aborted) return;
            if (etkinlikId && girdi.rol === "sunucu" && instanceId) void fetch("/viva/api/kayit", { method: "POST", signal: kontrol.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "durdu", etkinlik_id: etkinlikId, instance_id: instanceId }) }).catch(() => undefined);
          },
        });
        await oturum.hazir;
      } catch (err) {
        if (!kontrol.signal.aborted) { setMesaj(err instanceof Error ? err.message : "Görüşme açılamadı. Yeniden deneyin."); setDurum("hata"); }
      } finally { istekSuruyor = false; }
    };
    yenidenKontrol.current = () => { if (!istekSuruyor && !kontrol.signal.aborted && !oturum) { clearTimeout(timer); void baglan(); } };
    void baglan();
    return () => { yenidenKontrol.current = null; window.removeEventListener("pagehide", sayfadanCik); kapat(); };
  }, [deneme, yol, govde, etkinlikId, onizleme, bitirmeAcik]);
  async function herkesIcinBitir() {
    if (bitirmePasif || bitirKilidi.current || !etkinlikId || !surum || rol !== "sunucu" || durum !== "gorusmede") return;
    const signal = eylemKontrolu.current?.signal; bitirKilidi.current = true;
    setBitiriliyor(true);
    try {
      // Oda ekranının eski sürümü yerine sunucudan en güncel etkinlik sürümü alınır.
      const detay = await fetch(`/viva/api?islem=detay&etkinlik_id=${encodeURIComponent(etkinlikId)}`, { cache: "no-store", signal });
      const d = await detay.json();
      if (signal?.aborted) return;
      if (!detay.ok || !d?.etkinlik?.yonetebilir) throw new Error("Görüşmeyi bitirme yetkiniz doğrulanamadı.");
      const r = await fetch("/viva/api/yasam", { method: "POST", cache: "no-store", signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ islem: "bitir", etkinlik_id: etkinlikId, surum: d.etkinlik.surum }) });
      const sonuc = await r.json();
      if (signal?.aborted) return;
      if (!r.ok) throw new Error(sonuc.hata ?? "Görüşme bitirilemedi.");
      setSonlandirildi(true); setSaglayiciBekliyor(sonuc.tekrar_gerekli === true);
      setMesaj(sonuc.mesaj); setDeneme(0); setDurum("ayrildi");
    } catch (err) { if (!signal?.aborted) setMesaj(err instanceof Error ? err.message : "Görüşme bitirilemedi."); }
    finally { bitirKilidi.current = false; if (!signal?.aborted) setBitiriliyor(false); }
  }
  function baslat() { setMesaj(""); setBaglantiKesik(false); setSonlandirildi(false); setSaglayiciBekliyor(false); setDurum("baglaniyor"); setDeneme(n => n + 1); }
  const onizlemeAcik = durum === "hazirlaniyor" || durum === "gorusmede";
  function beklemeyiBirak() { setDeneme(0); setDurum("beklemede"); setMesaj(""); setRol(""); }
  const donus = onDonus ? <Button variant="outline" onClick={onDonus}>Etkinlik bilgilerine dön</Button> : <Button asChild variant="outline"><Link href={`/viva/${etkinlikId}`}>Etkinlik bilgilerine dön</Link></Button>;
  return <section aria-label="Viva yayın alanı" className={styles.room}>
    {rol === "sunucu" && durum === "gorusmede" && <AlertDialog open={bitirmeOnayi && !bitirmePasif} onOpenChange={setBitirmeOnayi}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Görüşme herkes için bitirilsin mi?</AlertDialogTitle><AlertDialogDescription>Katılımcıların ve özel davetlilerin bu etkinliğin yayın odasına erişimi kapatılacak.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction onClick={() => void herkesIcinBitir()}>Herkes için bitir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
    {baglantiKesik && durum === "gorusmede" && <div role="status" className={styles.reconnect}><WifiOff aria-hidden="true" /><div><strong>Bağlantı yeniden kuruluyor</strong><p>Görüşme ekranını açık tutun. Bağlantı düzeldiğinde görüşmeniz devam edecek.</p></div></div>}
    <div className={styles.roomLayoutClosed}>
      <div className={styles.stage}>
        <div ref={kapsayici} className={styles.callFrame} hidden={!onizlemeAcik} />
        {durum === "beklemede" && <div className={styles.prejoin}><div className={styles.previewPlaceholder}><span className={styles.previewIcon}><VideoOff aria-hidden="true" /></span><span>Henüz katılmadınız</span><div className={styles.mediaOff}><MicOff aria-hidden="true" />Mikrofon kapalı<VideoOff aria-hidden="true" />Kamera kapalı</div></div><div className={styles.prejoinCopy}><p className={styles.kicker}>VİVA YAYIN ODASI</p><h2>{davetToken ? "Buluşmayı izlemeye hazırsınız" : "Buluşmaya hazır mısınız?"}</h2><p>{davetToken ? "İzleyici olarak katılıyorsunuz. Kamera, mikrofon ve ekran paylaşımı gönderemezsiniz." : "Kamera ve mikrofonunuz başlangıçta kapalıdır. Katılım doğrulamasından sonra cihazlarınızı görüşme araç çubuğundan açıp kontrol edebilirsiniz."}</p><Button onClick={baslat}>Görüşmeye katıl<ArrowRight aria-hidden="true" /></Button></div></div>}
        {durum === "baglaniyor" && <div className={styles.roomState} role="status"><span className={styles.stateIcon}><LockKeyhole aria-hidden="true" /></span><h2>Katılımınız doğrulanıyor…</h2><p>Etkinlik erişiminiz ve katılım koşulları kontrol ediliyor.</p><LoaderCircle className={styles.spinner} aria-hidden="true" /><Button variant="outline" onClick={beklemeyiBirak}>Beklemeyi bırak</Button></div>}
        {durum === "bekliyor" && <div className={styles.roomState} role="status"><span className={styles.stateIcon}>{beklemeNedeni === "oda" ? <Video aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</span><h2>{beklemeNedeni === "zaman" ? "Buluşmanızın saati bekleniyor" : beklemeNedeni === "sunucu" ? "Düzenleyenin katılması bekleniyor" : "Görüşme odası hazırlanıyor…"}</h2><p>{mesaj} Bu sırada sayfayı açık tutabilirsiniz.</p><span className={styles.waitPill}><LoaderCircle className={styles.spinner} aria-hidden="true" />Katılım durumu kontrol ediliyor</span><div className={styles.stateActions}><Button variant="outline" onClick={() => yenidenKontrol.current?.()}>Yeniden kontrol et</Button><Button variant="outline" onClick={beklemeyiBirak}>Beklemeyi bırak</Button>{donus}</div></div>}
        {durum === "ayrildi" && <div className={styles.roomState} role="status"><span className={styles.stateIcon}><Check aria-hidden="true" /></span><h2>{sonlandirildi ? saglayiciBekliyor ? "Etkinliğe erişim kapatıldı" : "Buluşma sona erdi" : "Görüşmeden ayrıldınız"}</h2><p>{sonlandirildi ? mesaj : "Görüşmeden ayrıldınız. Görüşmeden çıkmanız, etkinliği diğer katılımcılar için bitirmez."}</p><div className={styles.stateActions}>{!sonlandirildi && <Button onClick={baslat}>Yeniden katıl</Button>}{donus}</div></div>}
        {durum === "hata" && <div className={styles.roomState} role="alert"><span className={styles.stateIcon}><WifiOff aria-hidden="true" /></span><h2>Görüşme bağlantısı kurulamadı.</h2><p>{mesaj}</p><div className={styles.stateActions}><Button onClick={baslat}>Yeniden katıl</Button>{donus}</div></div>}
      </div>
    </div>
    <div className={styles.callNotes}>{durum === "hazirlaniyor" && <p role="status">Görüşmeye bağlanılıyor… Kamera ve mikrofonunuz başlangıçta kapalıdır.</p>}{durum === "gorusmede" && mesaj && <p role="alert" className={styles.errorText}>{mesaj}</p>}{!paylasim && rol !== "izleyici" && onizlemeAcik && <p>Bu tarayıcıda ekran paylaşımı başlatılamıyor; paylaşılan ekranları izleyebilirsiniz.</p>}</div>
  </section>;
}
