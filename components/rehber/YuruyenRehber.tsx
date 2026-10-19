"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { rehberKonumu, yuruyusSuresi, type Dikdortgen, type Nokta } from "./konum";
import styles from "./rehber.module.css";
import KityVeda from "./KityVeda";
import { kityHedefiniBul } from "@/lib/rehber/kityHedef";

export type RehberAdimi = {
  hedefId: string;
  hedefSecici?: string;
  baslik: string;
  aciklama: string;
  sesDosyasi?: string;
};

type Props = {
  adimlar: readonly RehberAdimi[];
  karsilama?: RehberAdimi;
  acik: boolean;
  onKapat: () => void;
  onTamamla?: () => void;
  sesli?: boolean;
  tarayiciSesiKullan?: boolean;
  hedefiHazirla?: (adim: RehberAdimi, signal: AbortSignal) => Promise<void>;
  altIcerik?: ReactNode;
  vedaMetni?: string;
  vedaSesDosyasi?: string;
};

type Yerlesim = ReturnType<typeof rehberKonumu>;
type Gorunum = { konum: Nokta; kare: number; sagaBakiyor: boolean };

const ILK_GORUNUM: Gorunum = { konum: { x: 24, y: 300 }, kare: 6, sagaBakiyor: true };

export default function YuruyenRehber(props: Props) {
  return props.acik ? <AktifRehber {...props} /> : null;
}

function AktifRehber({ adimlar, karsilama, acik, onKapat, onTamamla, sesli = false, tarayiciSesiKullan = true, hedefiHazirla, altIcerik, vedaMetni, vedaSesDosyasi }: Props) {
  const [kabulEdildi, setKabulEdildi] = useState(false);
  const karsilamada = Boolean(karsilama && !kabulEdildi);
  const [adim, setAdim] = useState(0);
  const [asama, setAsama] = useState<"yuruyor" | "anlatiyor">("yuruyor");
  const [duraklatildi, setDuraklatildi] = useState(false);
  const [sesAcik, setSesAcik] = useState(sesli);
  const [sesHatasi, setSesHatasi] = useState("");
  const [gorunum, setGorunum] = useState<Gorunum>(ILK_GORUNUM);
  const [yerlesim, setYerlesim] = useState<Yerlesim | null>(null);
  const [hedef, setHedef] = useState<Dikdortgen | null>(null);
  const [hedefYok, setHedefYok] = useState(false);
  const [gorselHazir, setGorselHazir] = useState(false);
  const [gorselHatasi, setGorselHatasi] = useState(false);
  const [veda, setVeda] = useState(false);
  const vedaRef = useRef(false);
  const tamamlandiRef = useRef(false);
  const konumRef = useRef(ILK_GORUNUM.konum);
  const hedefKonumRef = useRef<Yerlesim | null>(null);
  const hareketRef = useRef(false);
  const azHareketRef = useRef(false);
  const kapatRef = useRef(onKapat);
  const bitirRef = useRef(onTamamla);
  const hazirlaRef = useRef(hedefiHazirla);
  const kapatDugmesiRef = useRef<HTMLButtonElement>(null);
  const balonRef = useRef<HTMLElement>(null);
  const adimBilgisi = karsilamada ? karsilama : adimlar[adim];
  const tarayiciSesi = tarayiciSesiKullan && !adimlar.some(a => a.sesDosyasi);

  const vedayaGec = useCallback(() => {
    if (vedaRef.current) return;
    vedaRef.current = true;
    setVeda(true);
  }, []);
  const vedayiBitir = useCallback(() => {
    if (tamamlandiRef.current) return;
    tamamlandiRef.current = true;
    bitirRef.current?.();
    kapatRef.current();
  }, []);

  useEffect(() => { kapatRef.current = onKapat; bitirRef.current = onTamamla; }, [onKapat, onTamamla]);
  useEffect(() => { hazirlaRef.current = hedefiHazirla; }, [hedefiHazirla]);

  useEffect(() => {
    const medya = window.matchMedia("(prefers-reduced-motion: reduce)");
    const degisti = () => { azHareketRef.current = medya.matches; };
    degisti();
    medya.addEventListener("change", degisti);
    return () => medya.removeEventListener("change", degisti);
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setGorselHazir(true);
    img.onerror = () => setGorselHatasi(true);
    img.src = "/rehber/cogniti-sprite.png";
    return () => { img.onload = null; img.onerror = null; };
  }, []);

  useEffect(() => {
    if (!acik) return;
    const oncekiOdak = document.activeElement;
    const odakZamani = window.setTimeout(() => kapatDugmesiRef.current?.focus({ preventScroll: true }), 50);
    const klavye = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (vedaRef.current) vedayiBitir();
        else kapatRef.current();
      }
    };
    document.addEventListener("keydown", klavye);
    return () => {
      window.clearTimeout(odakZamani);
      document.removeEventListener("keydown", klavye);
      if (oncekiOdak instanceof HTMLElement && oncekiOdak.isConnected) oncekiOdak.focus({ preventScroll: true });
    };
  }, [acik, vedayiBitir]);

  useEffect(() => {
    if (!acik || !adimBilgisi || !gorselHazir || veda) return;
    let temizle: (() => void) | undefined;
    const iptal = new AbortController();
    const baslatmaKaresi = requestAnimationFrame(() => {
      setAsama("yuruyor");
      setHedef(null);
      setSesHatasi("");
      const baslat = (hazirlamaHatasi = false) => {
        if (iptal.signal.aborted) return;
        const eleman = kityHedefiniBul(adimBilgisi);
        if (!eleman || hazirlamaHatasi) {
          setHedefYok(true);
          setHedef(null);
          setAsama("anlatiyor");
          return;
        }
        setHedefYok(false);
        setAsama("yuruyor");
        let hareketKaresi = 0;
        let olcumKaresi = 0;
        let durduruldu = false;

        const olc = () => {
          const r = (kityHedefiniBul(adimBilgisi) ?? eleman).getBoundingClientRect();
          const dikdortgen = { left: r.left, top: r.top, width: r.width, height: r.height };
          const yeni = rehberKonumu(dikdortgen, { width: window.innerWidth, height: window.innerHeight }, balonRef.current?.getBoundingClientRect().height || 270);
          hedefKonumRef.current = yeni;
          setHedef(dikdortgen);
          setYerlesim(yeni);
          if (!hareketRef.current) {
            konumRef.current = yeni.avatar;
            setGorunum({ konum: yeni.avatar, kare: 7, sagaBakiyor: yeni.sagaBakiyor });
          }
          return yeni;
        };
        const olcumIste = () => {
          cancelAnimationFrame(olcumKaresi);
          olcumKaresi = requestAnimationFrame(olc);
        };

        hareketRef.current = true;
        const ilkRect = eleman.getBoundingClientRect();
        if (ilkRect.top < 90 || ilkRect.bottom > window.innerHeight - 40) {
          eleman.scrollIntoView({ block: "center", behavior: azHareketRef.current ? "instant" : "smooth" });
        }
        const hedefYer = olc();
        const baslangic = { ...konumRef.current };
        const sure = karsilamada || azHareketRef.current ? 0 : yuruyusSuresi(baslangic, hedefYer.avatar);
        let gecen = 0;
        let oncekiZaman: number | null = null;

        const ilerle = (zaman: number) => {
          if (durduruldu) return;
          if (oncekiZaman !== null) gecen += Math.min(zaman - oncekiZaman, 100);
          oncekiZaman = zaman;
          const oran = sure === 0 || azHareketRef.current ? 1 : Math.min(1, gecen / sure);
          const son = hedefKonumRef.current ?? hedefYer;
          const yeniKonum = { x: baslangic.x + (son.avatar.x - baslangic.x) * oran, y: baslangic.y + (son.avatar.y - baslangic.y) * oran };
          konumRef.current = yeniKonum;
          setGorunum({
            konum: yeniKonum,
            kare: oran < 1 ? Math.floor(gecen / 105) % 6 : 7,
            sagaBakiyor: oran < 1 ? son.avatar.x >= baslangic.x : son.sagaBakiyor,
          });
          if (oran < 1) hareketKaresi = requestAnimationFrame(ilerle);
          else { hareketRef.current = false; setAsama("anlatiyor"); }
        };
        hareketKaresi = requestAnimationFrame(ilerle);
        window.addEventListener("resize", olcumIste);
        window.addEventListener("scroll", olcumIste, true);
        const gozlemci = new ResizeObserver(olcumIste);
        gozlemci.observe(eleman);
        if (balonRef.current) gozlemci.observe(balonRef.current);
        const menuGozlemcisi = adimBilgisi.hedefSecici ? new MutationObserver(olcumIste) : null;
        menuGozlemcisi?.observe(document.body, { childList: true, subtree: true });
        temizle = () => {
          durduruldu = true;
          hareketRef.current = false;
          cancelAnimationFrame(hareketKaresi);
          cancelAnimationFrame(olcumKaresi);
          window.removeEventListener("resize", olcumIste);
          window.removeEventListener("scroll", olcumIste, true);
          gozlemci.disconnect();
          menuGozlemcisi?.disconnect();
        };
      };
      if (hazirlaRef.current) {
        void hazirlaRef.current(adimBilgisi, iptal.signal).then(() => baslat(), () => baslat(true));
      } else baslat();
    });
    return () => { iptal.abort(); cancelAnimationFrame(baslatmaKaresi); temizle?.(); };
  }, [acik, adimBilgisi, gorselHazir, veda, karsilamada]);

  useEffect(() => {
    if (!acik || veda || karsilamada || asama !== "anlatiyor" || duraklatildi || hedefYok || !gorselHazir || !adimBilgisi) return;
    let zamanlayici: number | undefined;
    let iptal = false;
    let konusma: SpeechSynthesisUtterance | undefined;
    let kayit: HTMLAudioElement | undefined;
    let sesHatasiBildirildi = false;
    const otomatikDevam = (gecikme: number) => {
      if (iptal || azHareketRef.current) return;
      zamanlayici = window.setTimeout(() => {
        if (adim < adimlar.length - 1) { setAsama("yuruyor"); setAdim(adim + 1); }
        else vedayaGec();
      }, gecikme);
    };
    const hataBildir = () => {
      if (iptal || sesHatasiBildirildi) return;
      sesHatasiBildirildi = true;
      setSesHatasi("Ses başlatılamadı. Sesi kapatıp açarak yeniden deneyebilirsin.");
      otomatikDevam(6500);
    };
    const ses = window.speechSynthesis;
    if (sesAcik && adimBilgisi.sesDosyasi) {
      kayit = new Audio(adimBilgisi.sesDosyasi);
      kayit.onplaying = () => { if (!iptal) setSesHatasi(""); };
      kayit.onended = () => otomatikDevam(800);
      kayit.onerror = hataBildir;
      void kayit.play().catch(hataBildir);
    } else if (sesAcik && tarayiciSesi && ses && "SpeechSynthesisUtterance" in window) {
      konusma = new SpeechSynthesisUtterance(`${adim === 0 ? "Merhaba, ben Kity. " : ""}${adimBilgisi.baslik} ${adimBilgisi.aciklama}`);
      konusma.lang = "tr-TR";
      const turkceSes = ses.getVoices().find(s => /^tr(?:-|_)/i.test(s.lang));
      if (turkceSes) konusma.voice = turkceSes;
      konusma.onstart = () => { if (!iptal) setSesHatasi(""); };
      konusma.onend = () => otomatikDevam(800);
      konusma.onerror = hataBildir;
      try { ses.cancel(); ses.resume(); ses.speak(konusma); }
      catch { hataBildir(); }
    } else {
      otomatikDevam(6500);
    }
    return () => {
      iptal = true;
      window.clearTimeout(zamanlayici);
      if (kayit) { kayit.onplaying = null; kayit.onended = null; kayit.onerror = null; kayit.pause(); }
      if (konusma) { konusma.onstart = null; konusma.onend = null; konusma.onerror = null; ses.cancel(); }
    };
  }, [acik, adim, adimBilgisi, adimlar.length, asama, duraklatildi, hedefYok, gorselHazir, veda, vedayaGec, sesAcik, tarayiciSesi, karsilamada]);

  if (!acik || !adimBilgisi) return null;
  if (veda) return <KityVeda baslangic={gorunum.konum} baslangicYukseklik={yerlesim?.avatarYukseklik ?? 240} onBitti={vedayiBitir} metin={vedaMetni} sesDosyasi={sesAcik ? vedaSesDosyasi : undefined} />;
  const saga = gorunum.sagaBakiyor;
  const balonStili: CSSProperties = yerlesim
    ? { left: yerlesim.balon.x, top: yerlesim.balon.y, width: yerlesim.balon.width }
    : { right: 20, bottom: 20, width: "min(260px, calc(100vw - 32px))" };
  const el = yerlesim ? {
    x: gorunum.konum.x + yerlesim.avatarGenislik * (saga ? 0.88 : 0.12),
    y: gorunum.konum.y + yerlesim.avatarYukseklik * 0.2,
  } : null;

  return (
    <div className={styles.katman} data-rehber-asama={asama}>
      {hedef && !karsilamada && <div className={styles.vurgu} aria-hidden="true" style={{ left: hedef.left - 7, top: hedef.top - 7, width: hedef.width + 14, height: hedef.height + 14 }} />}
      {!karsilamada && asama === "anlatiyor" && !hedefYok && el && yerlesim && (
        <svg className={styles.isaret} aria-hidden="true">
          <defs><marker id="cogniti-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#a16a35" /></marker></defs>
          <path d={`M ${el.x} ${el.y} Q ${(el.x + yerlesim.hedefNoktasi.x) / 2} ${el.y - 28}, ${yerlesim.hedefNoktasi.x} ${yerlesim.hedefNoktasi.y}`} fill="none" stroke="#a16a35" strokeWidth="2" strokeDasharray="4 5" markerEnd="url(#cogniti-ok)" />
        </svg>
      )}
      {yerlesim && gorselHazir && !hedefYok && <div aria-hidden="true" className={styles.karakterKonum} style={{ width: yerlesim.avatarGenislik, height: yerlesim.avatarYukseklik, transform: `translate3d(${gorunum.konum.x}px, ${gorunum.konum.y}px, 0)` }}>
        <div className={`${styles.karakter} ${asama === "anlatiyor" ? styles.bekleme : ""}`} style={{ backgroundPosition: `${(gorunum.kare % 4) * 100 / 3}% ${Math.floor(gorunum.kare / 4) * 100}%`, transform: `scaleX(${saga ? 1 : -1})` }} />
        <div className={styles.golge} />
      </div>}
      <aside ref={balonRef} className={styles.balon} style={balonStili} aria-label="Kity sayfa rehberi">
        <div className={styles.balonUst}>
          <span className={styles.imza}><span /> KITY</span>
          <div className={styles.balonDugmeleri}>
            {sesli && <button type="button" className={styles.kapat} aria-label={sesAcik ? "Sesi kapat" : "Sesi aç"} aria-pressed={sesAcik} onClick={() => { setSesHatasi(""); setSesAcik(!sesAcik); }}>{sesAcik ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>}
            <button ref={kapatDugmesiRef} type="button" onClick={onKapat} className={styles.kapat} aria-label="Turu kapat"><X size={17} /></button>
          </div>
        </div>
        <div aria-live="polite" aria-atomic="true">
          {!karsilamada && <p className={styles.adimEtiketi}>{String(adim + 1).padStart(2, "0")} / {String(adimlar.length).padStart(2, "0")} <span>{asama === "yuruyor" ? "Yanına geliyorum…" : "Birlikte keşfedelim"}</span></p>}
          <h2>{adimBilgisi.baslik}</h2>
          <p className={styles.aciklama}>{gorselHatasi ? "Karakter yüklenemedi. Sayfayı yenileyerek tekrar deneyebilirsin." : !gorselHazir ? "Karakter hazırlanıyor…" : hedefYok ? "Bu adımın alanı şu anda görünmüyor. Sonraki adıma geçebilirsin." : adimBilgisi.aciklama}</p>
          {sesli && tarayiciSesi && (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) && <p role="status">Bu tarayıcı seslendirmeyi desteklemiyor.</p>}
          {sesAcik && sesHatasi && <p role="status">{sesHatasi}</p>}
        </div>
        {karsilamada ? <div className={styles.kontroller}>
          <button type="button" className={styles.ileri} disabled={!gorselHazir || hedefYok} onClick={() => { setAsama("yuruyor"); setKabulEdildi(true); }}>Evet</button>
          <button type="button" className={styles.otomatik} onClick={vedayaGec}>Hayır</button>
        </div> : <>
        <div className={styles.adimCubuklari} aria-hidden="true">{adimlar.map((a, i) => <span key={a.hedefId} data-aktif={i === adim} data-tamam={i < adim} />)}</div>
        <div className={styles.kontroller}>
          <button type="button" onClick={() => setDuraklatildi(!duraklatildi)} className={styles.otomatik} aria-label={duraklatildi ? "Otomatik tura devam et" : "Otomatik turu duraklat"}>{duraklatildi ? <Play size={14} /> : <Pause size={14} />} {duraklatildi ? "Devam et" : "Duraklat"}</button>
          <button type="button" onClick={() => { setAsama("yuruyor"); setAdim(Math.max(0, adim - 1)); }} disabled={adim === 0} className={styles.geri} aria-label="Önceki adım"><ArrowLeft size={16} /></button>
          <button type="button" onClick={() => { if (adim === adimlar.length - 1) vedayaGec(); else { setAsama("yuruyor"); setAdim(adim + 1); } }} className={styles.ileri}>{adim === adimlar.length - 1 ? "Bitir" : "İleri"}<ArrowRight size={15} /></button>
        </div>
        </>}
        {altIcerik}
      </aside>
    </div>
  );
}
