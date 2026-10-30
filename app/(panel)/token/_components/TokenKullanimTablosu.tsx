"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../token.module.css";
import { Table, TableFooter, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TokenDetayYaniti, TokenKullanimSatiri } from "@/lib/token/detay";
import TokenHoykModal from "./TokenHoykModal";
import type { YayinTuruFiltreDegeri } from "@/components/ogrenme-araci/YayinTuruFiltresi";

import { SadeTabloSecimi } from "@/components/kontrol/SadeKontroller";
import type { TalepTuru } from "@/lib/uretici/yetenekler";

const basliklar = ["Gönderim Tarihi", "Yayın Kodu", "Ürün Adı", "Yayın Aracı", "Alıcı", "Alıcı Sayısı", "Kullanılan Token"];
const sayi = (deger: number | null) => deger == null ? "—" : deger.toLocaleString("tr-TR");

function BosDurum() {
  return <div className={styles.bosDurum}>
    <span className={styles.bosIkon}><BarChart3 aria-hidden="true" size={20} /></span>
    <p>Henüz token tüketim kaydı bulunmuyor.</p>
  </div>;
}

export default function TokenKullanimTablosu({ aylikToplam = false, ay = "", yil = "", onYilDegistir, onAyDegistir, hoykGoster = false, oneri = false, aracTuru = "tumu", gonderiTuru = "tumu", bos = false, eczanem = false, bm = false, tm = false, yonetici = false, tmId = "", bmId = "", uttId = "", aliciFiltresi, egitimTuru }: { aylikToplam?: boolean; ay?: string; yil?: string; onYilDegistir?: (yil: string) => void; onAyDegistir?: (ay: string) => void; egitimTuru?: TalepTuru; hoykGoster?: boolean; oneri?: boolean; aracTuru?: YayinTuruFiltreDegeri | "viva"; gonderiTuru?: "tumu" | "eclub" | "eczanem" | "urun_egitimi" | "icerik"; bos?: boolean; eczanem?: boolean; bm?: boolean; tm?: boolean; yonetici?: boolean; tmId?: string; bmId?: string; uttId?: string; aliciFiltresi?: "eczaci" | "eczane_teknisyeni" | "eclub" }) {
  const yayinAdiGoster = !eczanem && gonderiTuru === "eclub" && (aracTuru === "tumu" || aracTuru === "viva");
  const vivaGorunumu = !eczanem && gonderiTuru === "eclub" && aracTuru === "viva";
  const yayinKoduGoster = !vivaGorunumu;
  const tabloBasliklari = vivaGorunumu ? ["Etkinlik Tarihi", "Etkinlik Adı", "Ürün Adı", "Yayın Aracı", "Davetliler", "Davetli Sayısı", "Katılım Sayısı", "Kullanılan Token"] : eczanem ? [...basliklar.slice(0, 4), "Gönderilen Eczane Sayısı", "İletilen Üye Sayısı", "Kullanılan Token"] : yayinAdiGoster ? [...basliklar.slice(0, 2), "Etkinlik Adı", ...basliklar.slice(2)] : basliklar;
  const sutunGenislikleri = eczanem ? [14, 17, 14, 12, 16, 14, 13] : vivaGorunumu ? [12, 19, 10, 9, 17, 11, 11, 11] : yayinAdiGoster ? [12, 15, 18, 12, 11, 10, 10, 12] : [15, 18, 15, 12, 13, 11, 16];
  const [satirlar, setSatirlar] = useState<TokenKullanimSatiri[]>([]);
  const [toplamlar, setToplamlar] = useState<{ genel: number; ay: number | null } | null>(null);
  const [sayfa, setSayfa] = useState(0);
  const [devamiVar, setDevamiVar] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(!bos);
  const [hata, setHata] = useState("");
  const [yenileme, setYenileme] = useState(0);
  const [seciliYayin, setSeciliYayin] = useState<TokenKullanimSatiri | null>(null);
  const acilanDugme = useRef<HTMLButtonElement | null>(null);
  const kilit = useRef(false);
  const bosIcerik = bos || (aylikToplam && yukleniyor) ? <div className={styles.bosDurum} /> : <BosDurum />;
  const yayinKodu = (satir: TokenKullanimSatiri) => hoykGoster && satir.yayinId && satir.yayinKodu !== "—"
    ? <button type="button" className={styles.yayinKoduButonu} aria-haspopup="dialog" onClick={(event) => { acilanDugme.current = event.currentTarget; setSeciliYayin(satir); }}>{satir.yayinKodu}</button> : satir.yayinKodu;
  useEffect(() => {
    if (bos) return;
    const controller = new AbortController();
    kilit.current = true;
    async function yukle() {
      setYukleniyor(true); setHata(""); setToplamlar(null);
      try {
        const sorgu = new URLSearchParams({ sayfa: String(sayfa) });
        if (aylikToplam) { sorgu.set("toplam", "1"); if (ay) sorgu.set("ay", ay); }
        if (oneri) sorgu.set("gonderi", "oneri");
        else if (gonderiTuru !== "tumu") sorgu.set("gonderi", gonderiTuru);
        if (egitimTuru) sorgu.set("egitim_turu",egitimTuru);
        if (aracTuru !== "tumu") sorgu.set("arac", aracTuru);
        if (aliciFiltresi) sorgu.set("alici", aliciFiltresi);
        if (bm || tm || yonetici) { sorgu.set("gorunum", yonetici ? "yonetici" : tm ? "tm" : "bm"); if (yonetici && tmId) sorgu.set("tm_id", tmId); if ((tm || yonetici) && bmId) sorgu.set("bm_id", bmId); if (uttId) sorgu.set("utt_id", uttId); }
        const response = await fetch(`/token/api/detay?${sorgu}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.hata || "Token kullanım detayları alınamadı.");
        if (controller.signal.aborted) return;
        const detay = data as TokenDetayYaniti;
        setSatirlar(eski => sayfa === 0 ? detay.satirlar : [...new Map([...eski, ...detay.satirlar].map(satir => [satir.id, satir])).values()]);
        setDevamiVar(detay.devamiVar);
        if (aylikToplam && typeof detay.genelToplam === "number") setToplamlar({ genel: detay.genelToplam, ay: detay.ayToplami ?? null });
      } catch (error) {
        if (!controller.signal.aborted) setHata(error instanceof Error ? error.message : "Token kullanım detayları alınamadı.");
      } finally {
        if (!controller.signal.aborted) { setYukleniyor(false); kilit.current = false; }
      }
    }
    void yukle();
    return () => controller.abort();
  }, [aylikToplam, ay, sayfa, yenileme, oneri, aracTuru, gonderiTuru, bos, bm, tm, yonetici, tmId, bmId, uttId, aliciFiltresi, egitimTuru]);

  return <section className={styles.tabloAlani} aria-label="Token kullanım detayları">
    {aylikToplam && <div className={styles.ayFiltresi}>
      <div className={styles.zamanSecimi}><SadeTabloSecimi
        menuClassName={styles.zamanMenusu} etiket="Token kullanım ayı" placeholder="Ay seçin" aranabilir={false} deger={ay.slice(5)}
        disabled={!/^20(2[6-9]|3[0-6])$/.test(yil)}
        secenekler={[{deger:"",etiket:"Ay seçin"}, ...["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map((ad,index)=>({deger:String(index+1).padStart(2,"0"),etiket:ad}))]}
        onDegistir={deger=>onAyDegistir?.(deger ? `${yil}-${deger}` : "")}
      /></div>
      <div className={styles.zamanSecimi}><SadeTabloSecimi
        menuClassName={styles.zamanMenusu} etiket="Token kullanım yılı" placeholder="Yıl seçin" aranabilir={false} deger={yil}
        secenekler={Array.from({length:11},(_,index)=>({deger:String(2026+index),etiket:String(2026+index)}))}
        onDegistir={deger=>{onYilDegistir?.(deger);if(ay)onAyDegistir?.(`${deger}-${ay.slice(5)}`);}}
      /></div>
      <Button type="button" variant="outline" size="sm" disabled={!ay} onClick={() => onAyDegistir?.("")}>Tüm tarihler</Button>
    </div>}
    {aylikToplam && yukleniyor && <p role="status" className={styles.detayDurumu}>Token kullanım detayları yükleniyor…</p>}
    {!aylikToplam && satirlar.length === 0 && yukleniyor ? <p role="status" className={styles.detayDurumu}>Token kullanım detayları yükleniyor…</p> : (aylikToplam || !(satirlar.length === 0 && hata)) && <><div className={styles.masaustuTablo}>
      <Table className={styles.detayTablosu}>
        <colgroup>{sutunGenislikleri.map((genislik, index) => <col key={index} style={{ width: `${genislik}%` }} />)}</colgroup>
        <TableHeader><TableRow>{tabloBasliklari.map((baslik, index) => <TableHead key={baslik} scope="col" className={index >= tabloBasliklari.length - (eczanem || vivaGorunumu ? 3 : 2) ? styles.sayisalBaslik : undefined}>{baslik}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{satirlar.length ? satirlar.map(satir => <TableRow key={satir.id}>
          <TableCell>{satir.gonderimTarihi}</TableCell>{yayinKoduGoster && <TableCell>{yayinKodu(satir)}</TableCell>}{yayinAdiGoster && <TableCell>{satir.yayinAdi || "—"}</TableCell>}<TableCell className={styles.urunHucre}>{satir.urun}</TableCell>
          <TableCell>{satir.yayinAraci}</TableCell>{eczanem ? <TableCell className={styles.sayisalHucre}>{sayi(satir.eczaneSayisi ?? null)}</TableCell> : <TableCell>{vivaGorunumu ? satir.davetliler || "—" : satir.gonderilenRol}</TableCell>}
          {vivaGorunumu ? <><TableCell className={styles.sayisalHucre}>{sayi(satir.davetliSayisi ?? null)}</TableCell><TableCell className={styles.sayisalHucre}>{sayi(satir.katilimSayisi ?? null)}</TableCell></> : <TableCell className={styles.sayisalHucre}>{sayi(satir.gonderilenSayi)}</TableCell>}
          <TableCell className={styles.tokenHucre}>{sayi(satir.toplamToken)}</TableCell>
        </TableRow>) : <TableRow><TableCell colSpan={tabloBasliklari.length} className={styles.bosHucre}>{bosIcerik}</TableCell></TableRow>}</TableBody>
        {aylikToplam && <TableFooter className={styles.tokenToplamlari}>
          <TableRow><TableCell colSpan={tabloBasliklari.length - 1}>Genel Toplam Token</TableCell><TableCell className={styles.tokenHucre}>{sayi(toplamlar?.genel ?? null)}</TableCell></TableRow>
          {ay && <TableRow><TableCell colSpan={tabloBasliklari.length - 1}>Seçilen Ay Toplamı</TableCell><TableCell className={styles.tokenHucre}>{sayi(toplamlar?.ay ?? null)}</TableCell></TableRow>}
        </TableFooter>}
      </Table>
    </div>
    <div className={styles.darEkranKartlari}>
      {satirlar.length ? satirlar.map(satir => <article key={satir.id} className={styles.kullanimKarti} aria-label={`${satir.urun} token kullanımı`}>
        <dl className={styles.kartAlanlari}>
          <div><dt>{vivaGorunumu ? "Etkinlik Tarihi" : "Gönderim Tarihi"}</dt><dd>{satir.gonderimTarihi}</dd></div>
          {yayinKoduGoster && <div><dt>Yayın Kodu</dt><dd>{yayinKodu(satir)}</dd></div>}
          {yayinAdiGoster && <div><dt>Etkinlik Adı</dt><dd>{satir.yayinAdi || "—"}</dd></div>}
          <div><dt>Ürün Adı</dt><dd className={styles.urunHucre}>{satir.urun}</dd></div>
          <div><dt>Yayın Aracı</dt><dd>{satir.yayinAraci}</dd></div>
          {!eczanem && <div><dt>{vivaGorunumu ? "Davetliler" : "Alıcı"}</dt><dd>{vivaGorunumu ? satir.davetliler || "—" : satir.gonderilenRol}</dd></div>}
        </dl>
        <dl className={styles.kartToplamlari}>
          {eczanem && <div><dt>Gönderilen Eczane Sayısı</dt><dd>{sayi(satir.eczaneSayisi ?? null)}</dd></div>}
          {vivaGorunumu ? <><div><dt>Davetli Sayısı</dt><dd>{sayi(satir.davetliSayisi ?? null)}</dd></div><div><dt>Katılım Sayısı</dt><dd>{sayi(satir.katilimSayisi ?? null)}</dd></div></> : <div><dt>{eczanem ? "İletilen Üye Sayısı" : "Alıcı Sayısı"}</dt><dd>{sayi(satir.gonderilenSayi)}</dd></div>}
          <div><dt>Kullanılan Token</dt><dd className={styles.tokenHucre}>{sayi(satir.toplamToken)}</dd></div>
        </dl>
      </article>) : <div className={styles.kullanimKarti}>{bosIcerik}</div>}
      {aylikToplam && <dl className={styles.mobilTokenToplamlari}>
        <div><dt>Genel Toplam Token</dt><dd>{sayi(toplamlar?.genel ?? null)}</dd></div>
        {ay && <div><dt>Seçilen Ay Toplamı</dt><dd>{sayi(toplamlar?.ay ?? null)}</dd></div>}
      </dl>}
    </div></>}
    {hata && <div className={styles.detayHatasi}><p role="alert">{hata}</p><Button type="button" variant="outline" size="sm" onClick={() => setYenileme(n => n + 1)} disabled={yukleniyor}>Yeniden dene</Button></div>}
    {devamiVar && !hata && <div className={styles.detaySayfalama}><Button type="button" variant="outline" size="sm" disabled={yukleniyor} onClick={() => { if (!kilit.current) { kilit.current = true; setSayfa(n => n + 1); } }}>{yukleniyor ? "Yükleniyor…" : "Daha fazla göster"}</Button></div>}
    {seciliYayin?.yayinId && <TokenHoykModal key={seciliYayin.yayinId} yayinId={seciliYayin.yayinId} yayinKodu={seciliYayin.yayinKodu} bm={bm} tm={tm} yonetici={yonetici} tmId={tmId} bmId={bmId} uttId={uttId} onKapat={() => setSeciliYayin(null)} onKapanisOdagi={() => acilanDugme.current?.focus()} />}
  </section>;
}
