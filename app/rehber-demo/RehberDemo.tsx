"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Check, CirclePlay, Compass, Home, Play, RotateCcw, Sparkles, UserRound, Wallet } from "lucide-react";
import YuruyenRehber, { type RehberAdimi } from "@/components/rehber/YuruyenRehber";
import styles from "./demo.module.css";

const ADIMLAR: readonly RehberAdimi[] = [
  { hedefId: "demo-yayinlar", baslik: "Keşfetmeye buradan başla.", aciklama: "Yayınlarını tek bir yerde bulursun. Şimdi sana bir yayın kartını göstereyim." },
  { hedefId: "demo-yayin-karti", baslik: "Sıradaki yayının burada.", aciklama: "Yayın kartında içeriği görebilir, İzlemeye başla düğmesiyle yayını açabilirsin." },
  { hedefId: "demo-puanlar", baslik: "Puanlarını takip et.", aciklama: "Puanlarım alanından kazanımlarını ve hareketlerini inceleyebilirsin. İstersen bu düğmeye tıkla." },
  { hedefId: "demo-profil", baslik: "Her şey seninle başlar.", aciklama: "Hesap bilgilerine buradan ulaşırsın. Küçük turumuz bitti; yeniden yürümemi istersen Turu tekrar oynat'a bas." },
];

export default function RehberDemo() {
  const [acik, setAcik] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);
  const [bildirim, setBildirim] = useState("");
  const baslat = () => { setBildirim(""); setAcik(true); };

  return <main className={styles.sayfa}>
    <header className={styles.ustAlan}>
      <Link href="/" className={styles.logo} aria-label="HapBilgi ana sayfa"><span className={styles.logoSembol}>h<span>·</span></span>hapbilgi<span className={styles.logoAyirac} /><span className={styles.studyo}>DENEYİM ATÖLYESİ</span></Link>
      <span className={styles.demoEtiketi}><span /> Rehber önizlemesi</span>
    </header>

    <section className={styles.giris}>
      <div className={styles.girisMetni}>
        <p className={styles.kucukBaslik}><Sparkles size={14} /> SAYFAYI BİRLİKTE KEŞFEDELİM</p>
        <h1>Tanışın, <span>Kity.</span><br />Size yolu göstersin.</h1>
        <p className={styles.girisAciklama}>Yanınıza gelir, neyin nerede olduğunu gösterir.<br className={styles.masaustuSatir} /> HapBilgi&apos;de ilk adımlarınız için küçük bir yol arkadaşı.</p>
        <div className={styles.baslatSatiri}>
          <button type="button" className={styles.baslat} onClick={baslat} disabled={acik}><Play size={16} fill="currentColor" />{acik ? "Kity size eşlik ediyor" : tamamlandi ? "Turu tekrar oynat" : "Kity’yi yürüt"}{!acik && <ArrowRight size={17} />}</button>
          <span>4 durak · yaklaşık 40 saniye</span>
        </div>
        <div className={styles.ozellikler}><span><Check size={13} /> Yürür</span><span><Check size={13} /> İşaret eder</span><span><Check size={13} /> Yol gösterir</span></div>
      </div>
      <div className={styles.karsilama} aria-label="Kity karakteri">
        <div className={styles.yorunge} />
        <span className={styles.merhaba}>Merhaba, ben Kity <span>✦</span></span>
        <div className={styles.portre} aria-hidden="true" />
        <span className={styles.isimEtiketi}><span /> Yeni yol arkadaşınız</span>
      </div>
    </section>

    <div className={styles.demoBaslik}><span><Compass size={15} /> Keşif alanınız</span><span><ArrowDown size={13} /> Turu başlatın, Kity&apos;yi takip edin</span></div>

    <section className={styles.panel} aria-label="Örnek HapBilgi çalışma alanı">
      <nav className={styles.gezinme} aria-label="Demo menüsü">
        <span className={styles.panelMarka}>Benim HapBilgim</span>
        <div className={styles.sekmeler}>
          <button type="button" className={styles.anaSayfa} onClick={() => setBildirim("Örnek ana sayfadasın.")}><Home size={16} /> Ana sayfa</button>
          <button id="demo-yayinlar" type="button" className={styles.aktifSekme} onClick={() => setBildirim("Yayın alanı aşağıda. Kity sana kartı gösterecek.")}><BookOpen size={16} /> Yayınlarım <span>3</span></button>
        </div>
        <button id="demo-profil" type="button" aria-label="Hesabım" className={styles.profil} onClick={() => setBildirim("Hesap bilgileri alanını keşfettin. Bu ekran bir hareket demosudur.")}><span><UserRound size={17} /></span><span>Hesabım<small>Üye profili</small></span><ArrowRight size={14} /></button>
      </nav>

      <div className={styles.panelIcerik}>
        <div className={styles.yayinAlani}>
          <p className={styles.bolumEtiketi}>BİRAZ MERAK, YENİ BİR ADIM.</p>
          <h2>Öğrenmeye bir yerden başlayın.</h2>
          <p className={styles.bolumAciklama}>Size ulaşan yayınlar ve keşfedecekleriniz.</p>
          <article id="demo-yayin-karti" className={styles.yayinKarti}>
            <div className={styles.kapak}><span className={styles.kapakCizgi} /><span className={styles.videoEtiketi}>ÖRNEK YAYIN</span><span className={styles.oynat}><Play size={24} fill="currentColor" /></span><span className={styles.kapakMetin}>Her gün<br /><strong>yeni bir bakış.</strong></span><span className={styles.sure}>04:30</span></div>
            <div className={styles.kartBilgisi}><span className={styles.kategori}>HAPBİLGİ&apos;YE HOŞ GELDİNİZ</span><h3>Öğrenmenin yeni bir yolu</h3><p>Küçük adımlar, kalıcı kazanımlar.</p><button type="button" onClick={() => setBildirim("Yayını başlatma alanını keşfettin. Bu demoda gerçek bir yayın açılmaz.")}>İzlemeye başla <CirclePlay size={16} /></button></div>
          </article>
        </div>
        <div className={styles.sagAlan}>
          <div className={styles.puanKarti}>
            <span className={styles.puanIkon}><Wallet size={23} strokeWidth={1.5} /></span><p>Küçük adımlar birikir.</p><h3>Öğrenin.<br />Kazanımlarınızı görün.</h3><span className={styles.puanAciklama}>Puanlarınız ve hareketleriniz,<br />bir bakışta yanınızda.</span>
            <button id="demo-puanlar" type="button" onClick={() => setBildirim("Puanlarım alanını keşfettin. Bu demoda gerçek puan verisi kullanılmıyor.")}>Puanlarım <ArrowRight size={16} /></button>
          </div>
          <div className={styles.ipucu}><span>✦</span><p>Kity&apos;ye ayak uydurun.<br /><strong>İsterseniz turu duraklatıp kendiniz keşfedin.</strong></p></div>
        </div>
      </div>
      <footer className={styles.panelAlt}><span><span /> Örnek çalışma alanı</span><span>Merak etmek, başlamaktır.</span></footer>
    </section>

    <footer className={styles.altAlan}><span>HapBilgi × Kity</span><span>Birlikte keşfetmek daha kolay.</span><button type="button" onClick={baslat} disabled={acik}><RotateCcw size={13} /> Turu tekrar oynat</button></footer>
    {bildirim && <div className={styles.bildirim} role="status"><Check size={16} /><span>{bildirim}</span><button type="button" aria-label="Mesajı kapat" onClick={() => setBildirim("")}>×</button></div>}
    <YuruyenRehber adimlar={ADIMLAR} acik={acik} onKapat={() => setAcik(false)} onTamamla={() => setTamamlandi(true)} />
  </main>;
}
