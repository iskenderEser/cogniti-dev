"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { vivaGorusmeGirdisi, vivaPrebuiltBaslat } from "@/lib/viva/prebuilt";
import { vivaOnizlemeAyari } from "@/lib/viva/onizleme";
import VivaAnket from "./VivaAnket";
import { BOS_ANKET, type VivaAnketDurumu } from "@/lib/viva/anket";
import { vivaAnketArsivIstek } from "@/lib/viva/anketArsiv";
import styles from "./viva-oda.module.css";
import { ArrowRight, BookOpen, Check, ChartNoAxesColumn, Clock3, LoaderCircle, LockKeyhole, MicOff, Video, VideoOff, WifiOff, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Hedef = { etkinlikId: string; davetToken?: never } | { davetToken: string; etkinlikId?: never };
type Durum = "beklemede" | "baglaniyor" | "bekliyor" | "hazirlaniyor" | "gorusmede" | "ayrildi" | "hata";
export default function VivaOdaAlani({ etkinlikId, davetToken, onDonus, surum, onizleme = false, yonetebilir = false, otomatikKatil = false }: Hedef & { onDonus?: () => void; surum?: number; onizleme?: boolean; yonetebilir?: boolean; otomatikKatil?: boolean }) {
  const kapsayici = useRef<HTMLDivElement>(null);
  const aktifOturum = useRef<ReturnType<typeof vivaPrebuiltBaslat> | null>(null);
  const [anket, setAnket] = useState<VivaAnketDurumu>(BOS_ANKET);
  const [deneme, setDeneme] = useState(otomatikKatil ? 1 : 0);
  const [durum, setDurum] = useState<Durum>(otomatikKatil ? "baglaniyor" : "beklemede");
  const [beklemeNedeni, setBeklemeNedeni] = useState<"zaman" | "oda" | "sunucu">("oda");
  const [baglantiKesik, setBaglantiKesik] = useState(false);
  const [sonlandirildi, setSonlandirildi] = useState(false);
  const [saglayiciBekliyor, setSaglayiciBekliyor] = useState(false);
  const [soruPaneli, setSoruPaneli] = useState(false);
  const [kapatilanSoru, setKapatilanSoru] = useState<string | null>(null);
  const yenidenKontrol = useRef<(() => void) | null>(null);
  const bitirKilidi = useRef(false), eylemKontrolu = useRef<AbortController | null>(null);
  useEffect(() => { const kontrol = new AbortController(); eylemKontrolu.current = kontrol; return () => kontrol.abort(); }, [etkinlikId, davetToken]);
  const [mesaj, setMesaj] = useState("");
  const [paylasim, setPaylasim] = useState(true);
  const [rol, setRol] = useState("");
  const [bitiriliyor, setBitiriliyor] = useState(false);
  const [kayitMesaji, setKayitMesaji] = useState("");
  const [kayitDurumu, setKayitDurumu] = useState("durdu");
  const gorselAlani = useRef<HTMLInputElement>(null), arkaPlanKilidi = useRef(false);
  const [arkaPlanAcik, setArkaPlanAcik] = useState(false), [arkaPlanDestegi, setArkaPlanDestegi] = useState(false);
  const [arkaPlanBusy, setArkaPlanBusy] = useState(false), [arkaPlanMesaji, setArkaPlanMesaji] = useState("");
  const yol = etkinlikId ? "/viva/api/katilim" : `/viva/davet/${encodeURIComponent(davetToken!)}/katilim`;
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
      if (aktifOturum.current === oturum) aktifOturum.current = null;
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
          ...(etkinlikId ? { anketDeposu: { istek: (islem: string, veri?: Record<string, unknown>, signal?: AbortSignal) => vivaAnketArsivIstek(etkinlikId, islem, veri, signal), hata: (m: string) => { if (!kontrol.signal.aborted) setMesaj(m); } } } : {}),
          anket: d => { if (!kontrol.signal.aborted) setAnket(d); },
          ...(onizleme && etkinlikId && girdi.rol === "sunucu" ? { entegrasyonlar: vivaOnizlemeAyari(window.location.origin, etkinlikId) } : {}),
          baglanti: kesik => { if (!kontrol.signal.aborted) setBaglantiKesik(kesik); },
          durum: d => { if (!kontrol.signal.aborted) {
            setDurum(d);
            if (d === "gorusmede" && girdi.rol === "sunucu" && etkinlikId) void basladiBildir();
            if (d === "ayrildi") { clearTimeout(baslatTimer); setKayitDurumu("durdu"); setAnket(BOS_ANKET); setBaglantiKesik(false); }
          } },
          hata: m => { if (!kontrol.signal.aborted) { setMesaj(m); setDurum("hata"); setBaglantiKesik(false); } },
          paylasimDestegi: d => { if (!kontrol.signal.aborted) setPaylasim(d); },
          arkaPlanDestegi: d => { if (!kontrol.signal.aborted) setArkaPlanDestegi(d); },
          arkaPlanHatasi: m => { if (!kontrol.signal.aborted) setArkaPlanMesaji(m); },
          kayit: (d, instanceId) => {
            if (kontrol.signal.aborted) return;
            setKayitDurumu(d);
            setKayitMesaji(d === "basladi" ? "Kayıt başladı." : d === "durdu" ? "Kayıt durdu. Dosya hazırlanıyor." : "Kayıt işlemi başarısız oldu. Görüşme bağlantısı ayrı olarak devam eder; Daily ekranındaki kayıt durumunu kontrol edin.");
            if (d === "durdu" && etkinlikId && girdi.rol === "sunucu" && instanceId) void fetch("/viva/api/kayit", { method: "POST", signal: kontrol.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ islem: "durdu", etkinlik_id: etkinlikId, instance_id: instanceId }) }).catch(() => undefined);
          },
        });
        aktifOturum.current = oturum;
        await oturum.hazir;
      } catch (err) {
        if (!kontrol.signal.aborted) { setMesaj(err instanceof Error ? err.message : "Görüşme açılamadı. Yeniden deneyin."); setDurum("hata"); }
      } finally { istekSuruyor = false; }
    };
    yenidenKontrol.current = () => { if (!istekSuruyor && !kontrol.signal.aborted && !oturum) { clearTimeout(timer); void baglan(); } };
    void baglan();
    return () => { yenidenKontrol.current = null; window.removeEventListener("pagehide", sayfadanCik); kapat(); };
  }, [deneme, yol, govde, etkinlikId, onizleme]);
  const etkin = ["baglaniyor", "bekliyor", "hazirlaniyor", "gorusmede"].includes(durum);
  async function herkesIcinBitir() {
    if (bitirKilidi.current || !etkinlikId || !surum || rol !== "sunucu" || durum !== "gorusmede") return;
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
      setMesaj(sonuc.mesaj); setDeneme(0); setDurum("ayrildi"); setKayitDurumu("durdu");
    } catch (err) { if (!signal?.aborted) setMesaj(err instanceof Error ? err.message : "Görüşme bitirilemedi."); }
    finally { bitirKilidi.current = false; if (!signal?.aborted) setBitiriliyor(false); }
  }
  function kayitDegistir() {
    if (rol !== "sunucu" || durum !== "gorusmede" || baglantiKesik || kayitDurumu === "bekliyor") return;
    try {
      const baslat = kayitDurumu !== "basladi";
      const gonderildi = baslat ? aktifOturum.current?.kaydiBaslat() : aktifOturum.current?.kaydiDurdur();
      if (gonderildi) { setKayitDurumu("bekliyor"); setKayitMesaji(baslat ? "Video ve sohbet kaydı başlatılıyor…" : "Kayıt durduruluyor…"); }
    } catch { setKayitDurumu("hata"); setKayitMesaji("Kayıt işlemi gönderilemedi. Yeniden deneyin."); }
  }
  async function arkaPlanDegistir(tur: "yok" | "bulanik" | "gorsel", dosya?: File) {
    const oturum = aktifOturum.current;
    if (!oturum || arkaPlanKilidi.current) return;
    arkaPlanKilidi.current = true; setArkaPlanBusy(true); setArkaPlanMesaji("");
    try {
      if (tur === "gorsel") {
        if (!dosya || !["image/jpeg", "image/png"].includes(dosya.type) || !dosya.size || dosya.size > 5 * 1024 * 1024)
          throw Error("JPEG veya PNG biçiminde, en fazla 5 MB boyutunda bir görsel seçin.");
        const kaynak = await dosya.arrayBuffer();
        if (aktifOturum.current !== oturum) return;
        await oturum.arkaPlanDegistir({ tur, kaynak });
      } else await oturum.arkaPlanDegistir({ tur });
    } catch (e) { if (aktifOturum.current === oturum) setArkaPlanMesaji(e instanceof Error ? e.message : "Arka plan uygulanamadı."); }
    finally { if (aktifOturum.current === oturum) { arkaPlanKilidi.current = false; setArkaPlanBusy(false); } }
  }
  function baslat() { arkaPlanKilidi.current = false; setArkaPlanAcik(false); setArkaPlanBusy(false); setArkaPlanMesaji(""); setMesaj(""); setKayitMesaji(""); setAnket(BOS_ANKET); setKayitDurumu("durdu"); setBaglantiKesik(false); setSonlandirildi(false); setSaglayiciBekliyor(false); setDurum("baglaniyor"); setDeneme(n => n + 1); }
  const onizlemeAcik = durum === "hazirlaniyor" || durum === "gorusmede";
  const anketAcik = soruPaneli || Boolean(anket.soru && anket.soru.id !== kapatilanSoru);
  const anketYetkisi = yonetebilir || rol === "sunucu";
  function anketPanelDegistir() { setSoruPaneli(!anketAcik); setKapatilanSoru(anket.soru?.id ?? null); }
  function beklemeyiBirak() { setDeneme(0); setDurum("beklemede"); setMesaj(""); setRol(""); }
  const donus = onDonus ? <Button variant="outline" onClick={onDonus}>Etkinlik bilgilerine dön</Button> : <Button asChild variant="outline"><Link href={`/viva/${etkinlikId}`}>Etkinlik bilgilerine dön</Link></Button>;
  return <section aria-label="Viva yayın alanı" className={styles.room}>
    <div className={styles.toolbar}><div className={styles.connectionBadge}><span className={durum === "gorusmede" && !baglantiKesik ? styles.liveDot : styles.dot} aria-hidden="true" /><span>{baglantiKesik ? "Bağlantı yeniden kuruluyor" : durum === "gorusmede" ? "Görüşmedesiniz" : durum === "hazirlaniyor" ? "Cihaz önizlemesi" : durum === "bekliyor" ? "Katılım bekleniyor" : durum === "baglaniyor" ? "Katılım doğrulanıyor" : durum === "ayrildi" ? "Görüşme kapalı" : "Viva yayın odası"}</span>{rol && etkin && <span className={styles.role}>{rol === "sunucu" ? "Sunucu" : rol === "izleyici" ? "İzleyici" : "Katılımcı"}</span>}{kayitDurumu === "basladi" && <span className={styles.recordBadge}><span className={styles.dot} />Kayıt sürüyor</span>}</div>
      <div className={styles.toolbarActions}>{(anketYetkisi || anket.soru) && <Button variant="outline" aria-expanded={anketAcik} aria-controls="viva-soru-paneli" onClick={anketPanelDegistir}><ChartNoAxesColumn aria-hidden="true" />Soru / Anket</Button>}
        {rol && rol !== "izleyici" && durum === "gorusmede" && <Button variant="outline" disabled={baglantiKesik} aria-expanded={arkaPlanAcik} aria-controls="viva-arka-plan" onClick={() => setArkaPlanAcik(d => !d)}>Arka plan</Button>}
        {rol === "sunucu" && durum === "gorusmede" && <><Button variant="outline" disabled={bitiriliyor || baglantiKesik || kayitDurumu === "bekliyor"} onClick={kayitDegistir}>{kayitDurumu === "bekliyor" ? "Kayıt işleniyor…" : kayitDurumu === "basladi" ? "Kaydı durdur" : "Kaydı başlat"}</Button>
          <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" disabled={bitiriliyor || baglantiKesik}>Herkes için bitir</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Görüşme herkes için bitirilsin mi?</AlertDialogTitle><AlertDialogDescription>Katılımcıların ve özel davetlilerin bu etkinliğin yayın odasına erişimi kapatılacak.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction onClick={() => void herkesIcinBitir()}>Herkes için bitir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </>}
        <Dialog.Root><Dialog.Trigger asChild><Button variant="ghost" aria-label="Yayın odası yardımı"><BookOpen aria-hidden="true" />Yardım</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.helpModal}><Dialog.Title>Yayın odası yardımı</Dialog.Title><Dialog.Description>Katılmadan önce hazırlanın; görüşmenizi buradan yönetin.</Dialog.Description><ul><li>Kamera ve mikrofon başlangıçta kapalıdır. Cihazları görüşme önizlemesinden seçebilirsiniz.</li><li>Sohbet, kişiler, ekran paylaşımı, el kaldırma ve diğer görüşme araçları görüşme ekranındadır.</li><li>Sunucu soruları önceden hazırlayıp görüşmede açabilir. İzleyiciler cevap gönderemez.</li><li>Video ve sohbet kaydını yalnız sunucu başlatıp durdurur. Hazır dosyalar etkinlik detayında bulunur.</li><li>Görüşmeden ayrılmak diğer katılımcılar için etkinliği bitirmez. Herkes için bitir işlemi sunucuya aittir.</li></ul><Dialog.Close asChild><Button variant="outline">Kapat</Button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
      </div>
    </div>
    {arkaPlanAcik && rol !== "izleyici" && durum === "gorusmede" && <div id="viva-arka-plan" className={styles.backgroundPanel} aria-label="Arka plan ayarları">
      <div className={styles.panelHeading}><h3>Arka plan ayarları</h3><Button variant="ghost" size="icon" aria-label="Arka plan ayarlarını kapat" onClick={() => setArkaPlanAcik(false)}><X aria-hidden="true" /></Button></div>
      {arkaPlanDestegi ? <><div className={styles.backgroundActions}><Button variant="outline" disabled={arkaPlanBusy || baglantiKesik} onClick={() => void arkaPlanDegistir("bulanik")}>Bulanıklaştır</Button><Button variant="outline" disabled={arkaPlanBusy || baglantiKesik} onClick={() => gorselAlani.current?.click()}>Görsel seç</Button><Button variant="outline" disabled={arkaPlanBusy || baglantiKesik} onClick={() => void arkaPlanDegistir("yok")}>Efekti kaldır</Button></div>
        <input ref={gorselAlani} type="file" accept="image/jpeg,image/png" aria-label="Arka plan görseli" className={styles.srOnly} disabled={arkaPlanBusy || baglantiKesik} onChange={e => { const dosya = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (dosya) void arkaPlanDegistir("gorsel", dosya); }} /><p>JPEG veya PNG, en fazla 5 MB. Efekt kameranız açıkken görünür.</p>{arkaPlanBusy && <p role="status">Arka plan uygulanıyor…</p>}</> : <p>Bu cihaz veya tarayıcı arka plan efektlerini desteklemiyor. WebGL2 destekleyen bir masaüstü tarayıcı kullanın.</p>}
      {arkaPlanMesaji && <p role="alert" className={styles.errorText}>{arkaPlanMesaji}</p>}
    </div>}
    {baglantiKesik && durum === "gorusmede" && <div role="status" className={styles.reconnect}><WifiOff aria-hidden="true" /><div><strong>Bağlantı yeniden kuruluyor</strong><p>Görüşme ekranını açık tutun. Bağlantı düzeldiğinde görüşmeniz devam edecek.</p></div></div>}
    <div className={anketAcik ? styles.roomLayout : styles.roomLayoutClosed}>
      <div className={styles.stage}>
        <div ref={kapsayici} className={styles.callFrame} hidden={!onizlemeAcik} />
        {durum === "beklemede" && <div className={styles.prejoin}><div className={styles.previewPlaceholder}><span className={styles.previewIcon}><VideoOff aria-hidden="true" /></span><span>Henüz katılmadınız</span><div className={styles.mediaOff}><MicOff aria-hidden="true" />Mikrofon kapalı<VideoOff aria-hidden="true" />Kamera kapalı</div></div><div className={styles.prejoinCopy}><p className={styles.kicker}>VİVA YAYIN ODASI</p><h2>{davetToken ? "Buluşmayı izlemeye hazırsınız" : "Buluşmaya hazır mısınız?"}</h2><p>{davetToken ? "İzleyici olarak katılıyorsunuz. Kamera, mikrofon ve ekran paylaşımı gönderemezsiniz." : "Kamera ve mikrofonunuz başlangıçta kapalıdır. Katılım doğrulamasından sonra cihazlarınızı görüşme önizlemesinden kontrol edebilirsiniz."}</p><Button onClick={baslat}>Görüşmeye katıl<ArrowRight aria-hidden="true" /></Button></div></div>}
        {durum === "baglaniyor" && <div className={styles.roomState} role="status"><span className={styles.stateIcon}><LockKeyhole aria-hidden="true" /></span><h2>Katılımınız doğrulanıyor…</h2><p>Etkinlik erişiminiz ve katılım koşulları kontrol ediliyor.</p><LoaderCircle className={styles.spinner} aria-hidden="true" /><Button variant="outline" onClick={beklemeyiBirak}>Beklemeyi bırak</Button></div>}
        {durum === "bekliyor" && <div className={styles.roomState} role="status"><span className={styles.stateIcon}>{beklemeNedeni === "oda" ? <Video aria-hidden="true" /> : <Clock3 aria-hidden="true" />}</span><h2>{beklemeNedeni === "zaman" ? "Buluşmanızın saati bekleniyor" : beklemeNedeni === "sunucu" ? "Düzenleyenin katılması bekleniyor" : "Görüşme odası hazırlanıyor…"}</h2><p>{mesaj} Bu sırada sayfayı açık tutabilirsiniz.</p><span className={styles.waitPill}><LoaderCircle className={styles.spinner} aria-hidden="true" />Katılım durumu kontrol ediliyor</span><div className={styles.stateActions}><Button variant="outline" onClick={() => yenidenKontrol.current?.()}>Yeniden kontrol et</Button><Button variant="outline" onClick={beklemeyiBirak}>Beklemeyi bırak</Button>{donus}</div></div>}
        {durum === "ayrildi" && <div className={styles.roomState} role="status"><span className={styles.stateIcon}><Check aria-hidden="true" /></span><h2>{sonlandirildi ? saglayiciBekliyor ? "Etkinliğe erişim kapatıldı" : "Buluşma sona erdi" : "Görüşmeden ayrıldınız"}</h2><p>{sonlandirildi ? mesaj : "Görüşmeden ayrıldınız. Görüşmeden çıkmanız, etkinliği diğer katılımcılar için bitirmez."}</p><div className={styles.stateActions}>{!sonlandirildi && <Button onClick={baslat}>Yeniden katıl</Button>}{donus}</div></div>}
        {durum === "hata" && <div className={styles.roomState} role="alert"><span className={styles.stateIcon}><WifiOff aria-hidden="true" /></span><h2>Görüşme bağlantısı kurulamadı.</h2><p>{mesaj}</p><div className={styles.stateActions}><Button onClick={baslat}>Yeniden katıl</Button>{donus}</div></div>}
      </div>
      <aside id="viva-soru-paneli" className={styles.questionPanel} hidden={!anketAcik} aria-label="Yayın odası soru paneli"><div className={styles.panelHeading}><h3>{durum === "gorusmede" ? "Görüşme anketi" : "Sorularınızı hazırlayın"}</h3><Button variant="ghost" size="icon" aria-label="Soru panelini kapat" onClick={anketPanelDegistir}><X aria-hidden="true" /></Button></div>{!etkin && anketYetkisi && <p className={styles.panelNote}>Soruları önceden hazırlayabilir, görüşmeye katıldıktan sonra açabilirsiniz.</p>}
        <VivaAnket etkinlikId={etkinlikId} yonetebilir={anketYetkisi} bagli={durum === "gorusmede" && !baglantiKesik} izleyici={rol === "izleyici" || Boolean(davetToken)} durum={anket}
          ac={s => { if (!aktifOturum.current) throw Error("Önce görüşmeye katılın."); return aktifOturum.current.anketAc(s); }} kapat={() => aktifOturum.current?.anketKapat()} cevapla={i => aktifOturum.current?.anketCevapla(i)} />
      </aside>
    </div>
    <div className={styles.callNotes}>{durum === "hazirlaniyor" && <p role="status">Görüşme ekranı hazırlanıyor… Kamera, mikrofon ve cihaz ayarlarını açılan önizlemeden kontrol edebilirsiniz.</p>}{durum === "gorusmede" && <p role="status">Görüşmedesiniz. Ayrılmak için görüşme ekranındaki çıkış düğmesini kullanın.</p>}{kayitMesaji && <p role="status">{kayitMesaji}</p>}{durum === "gorusmede" && mesaj && <p role="alert" className={styles.errorText}>{mesaj}</p>}{!paylasim && rol !== "izleyici" && onizlemeAcik && <p>Bu tarayıcıda ekran paylaşımı başlatılamıyor; paylaşılan ekranları izleyebilirsiniz.</p>}{anketYetkisi && etkinlikId && <Link href={`/viva/${etkinlikId}?bolum=kayitlar`}>Kayıt ve anket arşivini aç<ArrowRight aria-hidden="true" /></Link>}</div>
  </section>;
}
