"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, ArrowUpRight, Bell, BookOpen, Check, ChevronDown, Compass, Heart, Home, Layers, Search, Settings2, Sparkles, Trophy, UserRound, X } from "lucide-react";
import { YayinKarti, type YayinKartiVerisi } from "@/components/yayin/YayinKarti";
import { TEMALAR, VARSAYILAN_TEMA, type Tema } from "@/lib/tema/temalar";
import PanelNavbar from "@/components/panel/PanelNavbar";
import NavbardanTemaSecici from "@/components/tema/TemaSecici";
import styles from "./renk.module.css";

const YAYINLAR: YayinKartiVerisi[] = [
  { yayin_id: "renk-01", urun_adi: "Danışanla doğru iletişim", arac_turu: "video", icerik_turu: "egitim", durum: "yeni", video_puani: 80, extra_puan: 20 },
  { yayin_id: "renk-02", urun_adi: "Ürün bilgisinden güvene", arac_turu: "podcast", icerik_turu: "urun", durum: "yeni", video_puani: 60, extra_puan: 10 },
  { yayin_id: "renk-03", urun_adi: "Bilimsel bilgiye bir bakış", arac_turu: "flip_pdf", icerik_turu: "medikal", durum: "yeni", video_puani: 100 },
  { yayin_id: "renk-04", urun_adi: "VitaBalance ürün rehberi", arac_turu: "gorsel", icerik_turu: "urun", durum: "yeni", video_puani: 40 },
  { yayin_id: "renk-05", urun_adi: "Birlikte daha iyi bir ekip", arac_turu: "video", icerik_turu: "yonetim", durum: "yeni", video_puani: 80, extra_puan: 15 },
  { yayin_id: "renk-06", urun_adi: "Doğru sorular, güçlü iletişim", arac_turu: "podcast", icerik_turu: "egitim", durum: "devam", video_puani: 70 },
  { yayin_id: "renk-07", urun_adi: "Medikal okuryazarlık", arac_turu: "video", icerik_turu: "medikal", durum: "tamamlanan", video_puani: 120, extra_puan: 20 },
  { yayin_id: "renk-08", urun_adi: "DermaCare ürün dosyası", arac_turu: "flip_pdf", icerik_turu: "urun", durum: "tamamlanan", video_puani: 90 },
  { yayin_id: "renk-09", urun_adi: "Bir araştırmayı okumak", arac_turu: "gorsel", icerik_turu: "medikal", durum: "yeni", video_puani: 50 },
  { yayin_id: "renk-10", urun_adi: "Geri bildirimin gücü", arac_turu: "video", icerik_turu: "yonetim", durum: "yeni", video_puani: 80 },
].map((y, i) => ({
  ...y, gorunen_urun_id: `10${i + 1}`, firma_adi: "ÖrnekFirma", talep_no: 30001 + i,
  yayin_tarihi: "2026-10-15T09:00:00+03:00", begeni_sayisi: 12 + i * 3,
  favori_sayisi: 4 + i, izlenme_sayisi: 84 + i * 17,
}));

const FILTRELER = [
  { id: "tumu", ad: "Tümü" }, { id: "urun", ad: "Ürün" }, { id: "medikal", ad: "Medikal" },
  { id: "egitim", ad: "Satış" }, { id: "yonetim", ad: "Yönetim" },
];

export default function RenkKarsilastirma({ navbarDili = false }: { navbarDili?: boolean }) {
  const [tema, setTema] = useState<Tema>(VARSAYILAN_TEMA);
  const [filtre, setFiltre] = useState("tumu");
  const [arama, setArama] = useState("");
  const [yayinlar, setYayinlar] = useState(YAYINLAR);
  const [seciliYayin, setSeciliYayin] = useState<YayinKartiVerisi | null>(null);
  const yesil = tema === "yesil";
  const gorunenler = yayinlar.filter(y => (filtre === "tumu" || y.icerik_turu === filtre) && y.urun_adi.toLocaleLowerCase("tr-TR").includes(arama.toLocaleLowerCase("tr-TR")));
  const etkilesim = (id: string, tur: "begeni" | "favori") => setYayinlar(onceki => onceki.map(y => y.yayin_id !== id ? y : tur === "begeni"
    ? { ...y, begeni_mi: !y.begeni_mi, begeni_sayisi: (y.begeni_sayisi ?? 0) + (y.begeni_mi ? -1 : 1) }
    : { ...y, favori_mi: !y.favori_mi, favori_sayisi: (y.favori_sayisi ?? 0) + (y.favori_mi ? -1 : 1) }));

  return <div className={`${styles.sayfa}${navbarDili ? ` ${styles.navbarDiliSayfa}` : ""}`} data-tema={tema}>
    {navbarDili ? <div className={styles.navbarOnizleme}>
      <PanelNavbar adSoyad="Örnek Kullanıcı" onCikis={() => {}} temaSeciciGoster={false} />
      <NavbardanTemaSecici tema={tema} onTemaDegistir={setTema} />
    </div> : <div className={styles.karsilastirma}>
      <div className={styles.karsilastirmaMetni}><ArrowLeftRight size={16} /><span><strong>Aynı HOYK’lar, iki renk yaklaşımı.</strong><small>İçerik ve yerleşim sabit. Düğmelerle ileri geri karşılaştırın.</small></span></div>
      <div className={styles.temaSecimi} role="group" aria-label="Renk görünümü">
        <button type="button" aria-pressed={!yesil} onClick={() => setTema("mavi")}><span className={styles.eskiNokta} /> {TEMALAR.mavi.ad}{!yesil && <Check size={13} />}</button>
        <button type="button" aria-pressed={yesil} onClick={() => setTema("yesil")}><span className={styles.yeniNokta} /> {TEMALAR.yesil.ad}{yesil && <Check size={13} />}</button>
      </div>
    </div>}

    <div className={styles.kabuk}>
      <aside className={styles.solMenu} aria-label="Örnek gezinme">
        {!navbarDili && <div className={styles.marka}>hapbilgi<span>Öğrenirken kazandırır.</span></div>}
        <p className={styles.menuEtiketi}>ÇALIŞMA ALANI</p>
        <span className={styles.menuOgesi}><Home size={16} /> Ana sayfa</span>
        <span className={`${styles.menuOgesi} ${styles.menuAktif}`} aria-current="page"><BookOpen size={16} /> Yayınlarım <b>10</b></span>
        <span className={styles.menuOgesi}><Compass size={16} /> Keşfet</span>
        <span className={styles.menuOgesi}><Heart size={16} /> Favorilerim</span>
        <span className={styles.menuOgesi}><Trophy size={16} /> Ligim</span>
        <div className={styles.menuAlt}><span className={styles.minikIsaret}>✦</span><p>Öğrenmenin<br /><strong>yeni bir bakışı var.</strong></p><Link href="/rehber-demo">Rehber demosu <ArrowUpRight size={13} /></Link></div>
        <div className={styles.profil}><span><UserRound size={17} /></span><p>Örnek kullanıcı<small>Üye çalışma alanı</small></p></div>
      </aside>

      <div className={styles.anaAlan}>
        {!navbarDili && <header className={styles.ustCubuk}><span>Çalışma alanım <span>/</span> <strong>Yayınlarım</strong></span><div><span className={styles.ornekEtiketi}>Renk önizlemesi</span><Bell size={17} /><span className={styles.kullaniciHarf}>ÖK</span></div></header>}
        <main className={styles.icerik}>
          <div className={styles.sayfaBasligi}><div><p className={styles.ustEtiket}><Layers size={13} /> ÖĞRENME ALANINIZ</p><h1>Yayınlarım</h1><p className={styles.aciklama}>Yeni bir bilgi, yeni bir bakış. Size ulaşan yayınları keşfedin.</p></div><span className={styles.sayac}><BookOpen size={15} /> 10 yayın <ChevronDown size={13} /></span></div>

          <div className={styles.renkNotu}><Sparkles size={17} /><span>{yesil ? "Walkthrough paleti: açık krem, sütlü yeşil ve sıcak toprak." : "Beyaz kartlar, açık gri zemin ve mevcut mavi vurgular."}</span><div className={styles.renkOrnekleri} aria-label={yesil ? "Açık krem, sütlü yeşil ve sıcak toprak" : "Beyaz, açık gri ve mavi"}><i /><i /><i /></div></div>

          <div className={styles.aracCubugu}>
            <div className={styles.filtreler} role="group" aria-label="Yayın kategorisi">{FILTRELER.map(f => <button type="button" key={f.id} aria-pressed={filtre === f.id} onClick={() => setFiltre(f.id)}>{f.ad}<span>{f.id === "tumu" ? 10 : yayinlar.filter(y => y.icerik_turu === f.id).length}</span></button>)}</div>
            <label className={styles.arama}><Search size={15} /><input aria-label="Yayınlarda ara" placeholder="Yayınlarda ara…" value={arama} onChange={e => setArama(e.target.value)} /><Settings2 size={14} /></label>
          </div>

          <div className={styles.rafBasligi}><h2>{filtre === "tumu" ? "Tüm yayınlarınız" : `${FILTRELER.find(f => f.id === filtre)?.ad} yayınları`}</h2><span>{gorunenler.length} yayın gösteriliyor</span></div>
          <div className={styles.kartlar} aria-label="HOYK yayın kartları">
            {gorunenler.map(y => <YayinKarti key={y.yayin_id} yayin={y} ariaLabel={`${y.urun_adi} yayın kartı`} onClick={setSeciliYayin} onBegeni={(_, id) => etkilesim(id, "begeni")} onFavori={(_, id) => etkilesim(id, "favori")} />)}
          </div>
          {gorunenler.length === 0 && <p className={styles.bosDurum}>Bu aramayla eşleşen yayın bulunamadı.</p>}
          <div className={styles.aciklamaNotu}><span><Check size={13} /> Aynı kart bileşeni</span><span><Check size={13} /> Aynı bilgi yoğunluğu</span><span><Check size={13} /> Walkthrough’dan alınan renkler</span></div>
        </main>
        <footer className={styles.altCubuk}><span>Görsel karşılaştırma · Örnek içerik</span><span>HAPBİLGİ · {yesil ? "YEŞİL GÖRÜNÜM" : "MAVİ GÖRÜNÜM"}</span></footer>
      </div>
    </div>

    {seciliYayin && <div className={styles.modalZemin} onClick={() => setSeciliYayin(null)}><section className={styles.modal} role="dialog" aria-modal="true" aria-label="Yayın kartı önizlemesi" onClick={e => e.stopPropagation()}><button type="button" className={styles.kapat} aria-label="Önizlemeyi kapat" onClick={() => setSeciliYayin(null)}><X size={18} /></button><span className={styles.ustEtiket}>YAYIN ÖNİZLEMESİ</span><h2>{seciliYayin.urun_adi}</h2><p>Bu örnek kartla renkleri ve okunabilirliği karşılaştırabilirsiniz.</p><button type="button" className={styles.modalDugme} onClick={() => setSeciliYayin(null)}>Yayınlara dön</button></section></div>}
  </div>;
}
