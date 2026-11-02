"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, History, Users } from "lucide-react";
import { SadeSecim } from "@/components/kontrol/SadeKontroller";
import { ROL_ADLARI } from "@/lib/utils/roller";
import { yayin_kodu } from "@/lib/utils/yayinKodu";
import styles from "../admin.module.css";
import local from "./token-gonderileri.module.css";

type Toplam = { token: number; asim: number };
type Daily = { durum: string | null; katilim: number | null; oturum: number | null; kisi_saniye: number | null; tamamlandi: string | null; usd_dakika: number | null; kur: number | null; katsayi: number | null; token_fiyati: number | null };
type Gonderi = Toplam & { id: string; rol: string; gonderen_id: string; gonderen: string; tarih: string; kayit_tarihi: string; islem_turu: string; kaynak_id: string; arac: string; firma_adi: string | null; talep_no: number | null; urun_adi: string | null; etkinlik: string | null; alici_sayisi: number | null; alici_roller: string[]; daily: Daily | null };
type Alici = Toplam & { id: string; alici: string; alici_rol: string; kimlik: string; tarih: string };
type Rapor = { roller: (Toplam & { rol: string; gonderi: number })[]; gonderenler: { id: string; ad: string }[]; satirlar: Gonderi[]; kayit_sayisi: number; toplam: Toplam; genel_toplam: Toplam; liste_toplam: Toplam; detay: Alici[]; detay_sayisi: number };
const num = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
const olcu = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 6 });
const gun = (s: string) => new Date(s).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
const saat = (s: string) => new Date(s).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul" });
const rolAdi = (rol: string) => rol === "musteri" ? "Eczanem Üyesi" : rol === "ozel_davetli" ? "Özel Davetli" : rol === "bilinmiyor" ? "Rol Bilgisi Bulunamadı" : ROL_ADLARI[rol] ?? rol;
const ISLEMLER: Record<string, string> = { yayin: "Yayın Gönderimi", tclub_oneri: "BM Öneri Gönderisi", cclub_challenge: "Challenge Gönderisi", eclub_oneri: "E-Club Gönderisi", eczanem_musteri: "Eczanem Üye Gönderisi", viva_sure: "Viva Süre Tüketimi", viva_davet: "Eski Viva Davet Tüketimi" };
const ARACLAR = [{ deger: "tumu", etiket: "Tüm Araçlar" }, { deger: "video", etiket: "Video" }, { deger: "podcast", etiket: "Podcast" }, { deger: "gorsel", etiket: "Dijital Broşür" }, { deger: "flip_pdf", etiket: "Literatür" }, { deger: "viva", etiket: "Viva" }, { deger: "bilinmiyor", etiket: "Araç Bilgisi Bulunamadı" }];
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
function bugun() {
  const p = new Intl.DateTimeFormat("en", { timeZone: "Europe/Istanbul", year: "numeric", month: "numeric" }).formatToParts(new Date());
  return { yil: p.find(x => x.type === "year")!.value, ay: p.find(x => x.type === "month")!.value };
}
async function oku(url: string, signal: AbortSignal): Promise<Rapor> {
  const response = await fetch(url, { cache: "no-store", signal });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.hata === "string" ? result.hata : "Token tüketimleri alınamadı. Tekrar deneyin.");
  return result as Rapor;
}
function Sayfalama({ sayfa, toplam, degistir }: { sayfa: number; toplam: number; degistir: (n: number) => void }) {
  return <div className={local.pagination}><span>{num(toplam)} kayıt · Sayfa {sayfa + 1} / {Math.max(1, Math.ceil(toplam / 50))}</span><div><button type="button" className={styles.button} disabled={sayfa === 0} onClick={() => degistir(sayfa - 1)}>Önceki</button><button type="button" className={styles.button} disabled={(sayfa + 1) * 50 >= toplam} onClick={() => degistir(sayfa + 1)}>Sonraki</button></div></div>;
}
function GonderiDetayi({ satir, url }: { satir: Gonderi; url: string }) {
  const [sayfa, setSayfa] = useState(0);
  const [tekrar, setTekrar] = useState(0);
  const detayUrl = `${url}&detay=${satir.id}&detay_sayfa=${sayfa}&tekrar=${tekrar}`;
  const [sonuc, setSonuc] = useState<{ key: string; rapor?: Rapor; hata?: string } | null>(null);
  const viva = satir.islem_turu === "viva_sure";
  useEffect(() => {
    if (viva) return;
    const controller = new AbortController();
    void oku(detayUrl, controller.signal).then(rapor => { if (!controller.signal.aborted) setSonuc({ key: detayUrl, rapor }); }).catch(e => { if (!controller.signal.aborted) setSonuc({ key: detayUrl, hata: e instanceof Error ? e.message : "Detay alınamadı." }); });
    return () => controller.abort();
  }, [detayUrl, viva]);
  const guncel = sonuc?.key === detayUrl ? sonuc : null;
  const d = satir.daily;
  return <div className={local.detail}>
    <div className={local.detailHeading}><strong>{satir.etkinlik || yayin_kodu(satir.firma_adi, satir.talep_no)} · Gönderi Detayı</strong><span>{num(satir.token)} token · {num(satir.asim)} paket aşımı</span></div>
    {satir.urun_adi && <p>{satir.urun_adi}</p>}
    {viva ? <>
      <dl className={local.daily}>
        <div><dt>Daily Katılım Sayısı</dt><dd>{d?.katilim == null ? "—" : num(d.katilim)}</dd></div>
        <div><dt>Daily Oturum Sayısı</dt><dd>{d?.oturum == null ? "—" : num(d.oturum)}</dd></div>
        <div><dt>Toplam Kişi-Saniye</dt><dd>{d?.kisi_saniye == null ? "—" : num(d.kisi_saniye)}</dd></div>
        <div><dt>Tüketimin Kayda Geçişi</dt><dd>{gun(satir.kayit_tarihi)} · {saat(satir.kayit_tarihi)}</dd></div>
      </dl>
      <p>Viva tüketimi Daily’nin bildirdiği toplam katılım süresinden hesaplanır. Davetli sayısı token tüketimi değildir.</p>
      {d?.kisi_saniye != null && d.usd_dakika != null && d.kur != null && d.katsayi != null && d.token_fiyati != null && <p>Hesap: {num(d.kisi_saniye)} saniye / 60 × {olcu(d.usd_dakika)} USD/dakika × {olcu(d.kur)} kur × {olcu(d.katsayi)} katsayı / {olcu(d.token_fiyati)} TL/token; sonuç tam tokena yuvarlanır.</p>}
      {d?.durum !== "tamam" && <p role="status">Daily kullanım mutabakatı tamamlanmış olarak bulunamadı.</p>}
    </> : !guncel ? <p role="status">Alıcı detayları yükleniyor…</p> : guncel.hata ? <p role="alert">{guncel.hata} <button className={styles.button} type="button" onClick={() => setTekrar(n => n + 1)}>Tekrar Dene</button></p> : guncel.rapor && <>
      {satir.islem_turu === "viva_davet" && <p>Bu kayıt eski davet ücretlendirmesidir; Daily süre tüketimi değildir.</p>}
      <div className={styles.tableWrap}><table className={local.table}><thead><tr><th>Alıcı</th><th>Rol</th><th>Tarih</th><th>Saat</th><th className={local.number}>Tüketilen Token</th><th className={local.number}>Paket Aşımı</th></tr></thead><tbody>{guncel.rapor.detay.map(a => <tr key={a.id}><td>{a.alici}</td><td>{rolAdi(a.alici_rol)}</td><td className={local.nowrap}>{gun(a.tarih)}</td><td className={local.nowrap}>{saat(a.tarih)}</td><td className={local.number}>{num(a.token)}</td><td className={local.number}>{num(a.asim)}</td></tr>)}</tbody></table></div>
      <Sayfalama sayfa={sayfa} toplam={guncel.rapor.detay_sayisi} degistir={setSayfa} />
    </>}
    <p className={local.source}>Kaynak kaydı: {satir.kaynak_id}</p>
  </div>;
}

export default function TokenGonderileri({ firmaId, yenileme }: { firmaId: string; yenileme: number }) {
  const [filtre, setFiltre] = useState(() => ({ ...bugun(), rol: "", gonderen: "", arac: "tumu", sayfa: 0 }));
  const [acik, setAcik] = useState<string | null>(null);
  const [tekrar, setTekrar] = useState(0);
  const [sonuc, setSonuc] = useState<{ key: string; donem: string; rapor?: Rapor; hata?: string } | null>(null);
  const q = new URLSearchParams({ gorunum: "gonderiler", yil: filtre.yil, ay: filtre.ay, rol: filtre.rol, gonderen: filtre.gonderen, arac: filtre.arac, sayfa: String(filtre.sayfa), yenileme: String(yenileme), tekrar: String(tekrar) });
  const url = `/admin/api/firmalar/${firmaId}/token?${q}`;
  const donem = `${firmaId}:${filtre.yil}:${filtre.ay}:${yenileme}:${tekrar}`;
  useEffect(() => {
    const controller = new AbortController();
    void oku(url, controller.signal).then(rapor => { if (!controller.signal.aborted) setSonuc({ key: url, donem, rapor }); }).catch(e => { if (!controller.signal.aborted) setSonuc({ key: url, donem, hata: e instanceof Error ? e.message : "Token tüketimleri alınamadı." }); });
    return () => controller.abort();
  }, [url, donem]);
  const guncel = sonuc?.key === url ? sonuc : null;
  const rapor = guncel?.rapor;
  const ozet = sonuc?.donem === donem ? sonuc.rapor : null;
  function degistir(deger: Partial<typeof filtre>) { setAcik(null); setFiltre(f => ({ ...f, ...deger, sayfa: deger.sayfa ?? 0 })); }
  const zaman = filtre.yil ? `${filtre.ay ? `${AYLAR[Number(filtre.ay) - 1]} ` : ""}${filtre.yil}` : "Tüm Tarihler";
  return <>
    <section className={styles.card} aria-labelledby="admin-token-roller-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-token-roller-baslik"><Users />Gönderen Rollere Göre Token Tüketimi</h2><p>{zaman} · Gönderileri görmek için ilgili rolü seçin.</p></div><div className={local.controls}>
        <SadeSecim etiket="Ay" secenekler={[{ deger: "", etiket: "Tüm Aylar" }, ...AYLAR.map((a, i) => ({ deger: String(i + 1), etiket: a }))]} deger={filtre.ay} onDegistir={ay => degistir({ ay, yil: filtre.yil || bugun().yil })} aranabilir={false} className={local.control} />
        <SadeSecim etiket="Yıl" secenekler={Array.from({ length: 11 }, (_, i) => ({ deger: String(2026 + i), etiket: String(2026 + i) }))} deger={filtre.yil} placeholder="Yıl Seçin" onDegistir={yil => degistir({ yil })} aranabilir={false} className={local.year} />
        <button type="button" className={styles.button} onClick={() => degistir({ yil: "", ay: "" })}>Tüm Tarihler</button>
      </div></div>
      {guncel?.hata ? <p role="alert" className={local.message}>{guncel.hata} <button type="button" className={styles.button} onClick={() => setTekrar(n => n + 1)}>Tekrar Dene</button></p> : !ozet ? <p className={styles.empty} role="status">Rol tüketimleri yükleniyor…</p> : <>
        <div className={styles.tableWrap}><table className={`${local.table} ${local.roles}`} aria-label="Gönderen rollere göre token tüketimi"><thead><tr><th>Gönderen Rol</th><th className={local.number}>Gönderi Sayısı</th><th className={local.number}>Tüketilen Token</th><th className={local.number}>Paket Aşımı</th></tr></thead><tbody>{ozet.roller.map(r => <tr key={r.rol} data-selected={filtre.rol === r.rol}><td><button type="button" className={local.role} aria-pressed={filtre.rol === r.rol} onClick={() => degistir({ rol: r.rol, gonderen: "", arac: "tumu" })}>{rolAdi(r.rol)}</button></td><td className={local.number}>{num(r.gonderi)}</td><td className={local.number}>{num(r.token)}</td><td className={local.number}>{num(r.asim)}</td></tr>)}{!ozet.roller.length && <tr><td colSpan={4}>Seçilen tarihlerde token tüketimi yok.</td></tr>}</tbody><tfoot><tr><th colSpan={2}>Seçilen Zamanın Toplamı</th><td className={local.number}>{num(ozet.toplam.token)}</td><td className={local.number}>{num(ozet.toplam.asim)}</td></tr><tr><th colSpan={2}>Tüm Zamanların Toplamı</th><td className={local.number}>{num(ozet.genel_toplam.token)}</td><td className={local.number}>{num(ozet.genel_toplam.asim)}</td></tr></tfoot></table></div>
        <p className={local.note}>Paket aşımı, tüketilen tokenın içindeki aşım miktarıdır; toplama ayrıca eklenmez.</p>
      </>}
    </section>
    <section className={styles.card} aria-labelledby="admin-token-gonderiler-baslik">
      <div className={styles.cardHeader}><div><h2 id="admin-token-gonderiler-baslik"><History />{filtre.rol ? `${rolAdi(filtre.rol)} Gönderileri` : "Gönderi Tüketimleri"}</h2><p>Toplu gönderiler tek satırda gösterilir. Detay alanından alıcıları inceleyebilirsiniz.</p></div>{filtre.rol && <div className={local.controls}>
        <SadeSecim etiket="Gönderen" deger={filtre.gonderen} secenekler={[{ deger: "", etiket: "Tüm Gönderenler" }, ...(rapor?.gonderenler ?? []).map(s => ({ deger: s.id, etiket: s.ad }))]} onDegistir={gonderen => degistir({ gonderen })} disabled={!rapor} className={local.sender} />
        <SadeSecim etiket="Yayın Aracı" deger={filtre.arac} secenekler={ARACLAR} onDegistir={arac => degistir({ arac })} aranabilir={false} className={local.control} />
      </div>}</div>
      {!filtre.rol ? <p className={styles.empty}>Gönderileri görüntülemek için üstteki tablodan bir rol seçin.</p> : !guncel ? <p className={styles.empty} role="status">Gönderiler yükleniyor…</p> : guncel.hata ? <p className={styles.empty}>Gönderi listesi alınamadı.</p> : rapor && <>
        <div className={styles.tableWrap}><table className={`${local.table} ${local.dispatches}`} aria-label="Role göre gönderi tüketimleri"><thead><tr><th>Tarih</th><th>Saat</th><th>Gönderen</th><th>Yayın / Etkinlik</th><th>Eylem</th><th>Yayın Aracı</th><th>Alıcı Roller</th><th className={local.number}>Alıcı Sayısı</th><th className={local.number}>Tüketilen Token</th><th className={local.number}>Paket Aşımı</th><th>Detay</th></tr></thead><tbody>{rapor.satirlar.map(s => <Fragment key={s.id}><tr><td className={local.nowrap}>{gun(s.tarih)}</td><td className={local.nowrap}>{saat(s.tarih)}</td><td>{s.gonderen}</td><td>{s.etkinlik || yayin_kodu(s.firma_adi, s.talep_no)}</td><td>{ISLEMLER[s.islem_turu] ?? s.islem_turu}</td><td>{ARACLAR.find(a => a.deger === s.arac)?.etiket ?? s.arac}</td><td>{s.islem_turu === "viva_sure" ? "Daily Kullanımı" : s.alici_roller.map(rolAdi).join(", ")}</td><td className={local.number}>{s.alici_sayisi == null ? "—" : num(s.alici_sayisi)}</td><td className={local.number}>{num(s.token)}</td><td className={local.number}>{num(s.asim)}</td><td><button type="button" className={`${styles.button} ${local.detailButton}`} aria-expanded={acik === s.id} aria-controls={`token-detay-${s.id}`} onClick={() => setAcik(acik === s.id ? null : s.id)}>{acik === s.id ? <ChevronUp /> : <ChevronDown />}{acik === s.id ? "Kapat" : "Detay"}</button></td></tr>{acik === s.id && <tr><td colSpan={11} className={local.detailCell}><div id={`token-detay-${s.id}`}><GonderiDetayi satir={s} url={url} /></div></td></tr>}</Fragment>)}{!rapor.satirlar.length && <tr><td colSpan={11}>Seçilen filtrelere uygun tüketim kaydı yok.</td></tr>}</tbody><tfoot><tr><th colSpan={8}>Filtrelenen Gönderilerin Toplamı</th><td className={local.number}>{num(rapor.liste_toplam.token)}</td><td className={local.number}>{num(rapor.liste_toplam.asim)}</td><td /></tr></tfoot></table></div>
        <Sayfalama sayfa={filtre.sayfa} toplam={rapor.kayit_sayisi} degistir={sayfa => degistir({ sayfa })} />
      </>}
    </section>
  </>;
}
