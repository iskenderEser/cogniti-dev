'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Search, Users, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SadeKapsulFiltre, SadeSekmeler } from '@/components/kontrol/SadeKontroller';
import { YenileButonu } from '@/components/ui/yenile-butonu';
import { TR_SAAT_DILIMI } from '@/lib/zaman/turkiye';
import { VIVA_DURUMLARI } from '@/lib/viva/sozlesme';
import { vivaDetayYolu, vivaListeKaynagi, type VivaListeKaynagi } from '@/lib/viva/detay';
import { vivaAyKaydir, vivaBugun, vivaListeUrl, vivaTakvimGunleri, type VivaListeBolumu, type VivaListeKapsami, type VivaListeKarti, type VivaListeSorgusu, type VivaListeYaniti } from '@/lib/viva/liste';
import styles from './viva-liste.module.css';

const tarih = (value: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('tr-TR', { ...options, timeZone: TR_SAAT_DILIMI }).format(new Date(value));
const saat = (value: string) => tarih(value, { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
const gunTarihi = (gun: string) => tarih(`${gun}T12:00:00+03:00`, { day: 'numeric', month: 'long', weekday: 'long' });
const basHarfler = (ad: string) => ad.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(a => a[0]).join('').toLocaleUpperCase('tr-TR');
const bolumler: { deger: VivaListeBolumu; etiket: string }[] = [{ deger: 'ileri', etiket: 'İleri Tarihli Yayınlar' }, { deger: 'canli', etiket: 'Başlayan Yayınlar' }, { deger: 'gecmis', etiket: 'Geçmiş' }, { deger: 'taslak', etiket: 'Taslaklar' }];
const kapsamlar: { deger: VivaListeKapsami; etiket: string }[] = [{ deger: 'duzenlediklerim', etiket: 'Düzenlediklerim' }, { deger: 'davetlerim', etiket: 'Davet edildiklerim' }];

function Durum({ e }: { e: VivaListeKarti }) {
  return <span className={`${styles.pill} ${e.durum === 'canli' ? styles.live : ['taslak', 'sona_erdi'].includes(e.durum) ? styles.neutral : e.durum === 'iptal' ? styles.cancelled : ''}`}>
    {e.durum === 'canli' && <span className={styles.dot} />}{VIVA_DURUMLARI[e.durum]}
  </span>;
}
function Zaman({ e }: { e: VivaListeKarti }) {
  const ayniGun = vivaBugun(new Date(e.baslangic)) === vivaBugun(new Date(e.bitis));
  return <span>{saat(e.baslangic)} – {ayniGun ? '' : `${tarih(e.bitis, { day: 'numeric', month: 'short' })} · `}{saat(e.bitis)}</span>;
}
function CanliKart({ e, kaynak }: { e: VivaListeKarti; kaynak: VivaListeKaynagi | null }) {
  return <Card className={styles.liveCard}>
    <div className={styles.liveMain}><div className={styles.liveCopy}><Durum e={e} /><h3>{e.baslik}</h3>
      <p className={styles.summary}>{e.firma_adi}{e.aciklama ? ` · ${e.aciklama}` : ''}</p>
      <div className={styles.meta}><Clock3 aria-hidden="true" /><Zaman e={e} /></div>
      <div className={styles.meta}><span className={styles.miniAvatar} aria-hidden="true">{basHarfler(e.sahip_adi)}</span><span>{e.sahip_adi} · {e.yonetebilir ? 'Düzenleyen sizsiniz' : 'Davet edildiniz'}</span></div>
    </div><div className={styles.roomArt} aria-hidden="true"><div className={styles.artCircle} /><div className={styles.artTile}><span className={styles.avatar}>{basHarfler(e.sahip_adi)}</span><span>Birlikte öğreniyoruz</span></div><div className={styles.artTile}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/marka/viva/viva-mavi-ribon-simge.svg" alt="" width={35} height={28} style={{ objectFit: 'contain' }} /><span>Viva</span></div><div className={styles.wave}><i /><i /><i /><i /></div></div></div>
    <div className={styles.liveFooter}><div className={styles.people}><Users aria-hidden="true" /><span>{e.katilimci_sayisi === null ? 'Ekibinizle buluşmaya hazır' : `${e.katilimci_sayisi} davetli katılımcı`}</span></div>
      <div className={styles.footerActions}><Button asChild variant="ghost"><Link href={vivaDetayYolu(e.etkinlik_id, 'katilimcilar', kaynak)}>Detayları aç</Link></Button><Button asChild><Link href={`/viva/${e.etkinlik_id}/oda`}><Video aria-hidden="true" />Yayına katıl</Link></Button></div>
    </div>
  </Card>;
}
function EtkinlikKarti({ e, kaynak }: { e: VivaListeKarti; kaynak: VivaListeKaynagi | null }) {
  return <Card className={styles.eventCard}><div className={styles.dateBlock} aria-hidden="true"><span>{tarih(e.baslangic, { month: 'short' })}</span><strong>{tarih(e.baslangic, { day: 'numeric' })}</strong></div>
    <div className={styles.eventBody}><div className={styles.eventTop}><Durum e={e} /><span>{e.yonetebilir ? 'Düzenleyen sizsiniz' : 'Davet edildiniz'}</span></div><h3>{e.baslik}</h3>
      <div className={styles.eventMeta}><span><Clock3 aria-hidden="true" /><Zaman e={e} /></span>{e.katilimci_sayisi !== null && <span><Users aria-hidden="true" />{e.katilimci_sayisi} katılımcı</span>}<span>{e.sahip_adi}</span></div>
      <span className={styles.srOnly}>{tarih(e.baslangic, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    </div><Button asChild variant="outline" className={styles.eventOpen}><Link href={vivaDetayYolu(e.etkinlik_id, 'katilimcilar', kaynak)} aria-label={`${e.baslik} — Etkinliği aç`}>Etkinliği aç<ArrowRight aria-hidden="true" /></Link></Button>
  </Card>;
}
export default function VivaListeEkrani() {
  const [bugun] = useState(() => vivaBugun());
  const [bolum, setBolum] = useState<VivaListeBolumu>('ileri');
  const [kapsam, setKapsam] = useState<VivaListeKapsami>('duzenlediklerim');
  useEffect(() => {
    const kaynak = vivaListeKaynagi(new URLSearchParams(window.location.search).get('kaynak'));
    if (!kaynak) return;
    const [ilkBolum, ilkKapsam] = kaynak.split('-') as [VivaListeBolumu, VivaListeKapsami];
    setBolum(ilkBolum); setKapsam(ilkKapsam);
  }, []);
  const [arama, setArama] = useState(''), [sorguMetni, setSorguMetni] = useState('');
  const [ay, setAy] = useState(bugun.slice(0, 7)), [gun, setGun] = useState<string | null>(null);
  const [yenileme, setYenileme] = useState(0), [yukleniyor, setYukleniyor] = useState(true), [ekYukleniyor, setEkYukleniyor] = useState(false);
  const [yanit, setYanit] = useState<{ anahtar: string; veri: VivaListeYaniti } | null>(null), [hata, setHata] = useState('');
  const sonIstek = useRef(0), ekKontrol = useRef<AbortController | null>(null);
  const etiketId = useId();
  const kaynak = vivaListeKaynagi(`${bolum}-${kapsam}`);
  const sorgu: VivaListeSorgusu = { bolum, kapsam, arama: sorguMetni, ay, gun, offset: 0 };
  const anahtar = vivaListeUrl(sorgu);
  const veri = yanit?.anahtar === anahtar ? yanit.veri : null;
  const gorunenBugun = veri ? vivaBugun(new Date(veri.simdi)) : bugun;
  useEffect(() => { const timer = window.setTimeout(() => setSorguMetni(arama.trim()), 250); return () => window.clearTimeout(timer); }, [arama]);
  useEffect(() => {
    const id = ++sonIstek.current, kontrol = new AbortController();
    ekKontrol.current?.abort(); setEkYukleniyor(false); setYukleniyor(true); setHata('');
    void (async () => {
      try {
        const res = await fetch(anahtar, { cache: 'no-store', signal: kontrol.signal });
        const d = await res.json();
        if (!res.ok) throw Error(d.hata ?? 'Etkinlikler yüklenemedi.');
        if (!kontrol.signal.aborted && id === sonIstek.current) setYanit({ anahtar, veri: d as VivaListeYaniti });
      } catch (err) { if (!kontrol.signal.aborted && id === sonIstek.current) { setYanit(null); setHata(err instanceof Error ? err.message : 'Etkinlikler yüklenemedi.'); } }
      finally { if (!kontrol.signal.aborted && id === sonIstek.current) setYukleniyor(false); }
    })();
    return () => kontrol.abort();
  }, [anahtar, yenileme]);
  useEffect(() => () => ekKontrol.current?.abort(), []);
  useEffect(() => {
    const yenile = () => { if (document.visibilityState === 'visible') setYenileme(n => n + 1); };
    const timer = window.setInterval(yenile, 30_000); document.addEventListener('visibilitychange', yenile);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', yenile); };
  }, []);
  async function dahaFazla() {
    if (!veri || ekYukleniyor || yukleniyor) return;
    const onceki = veri, id = sonIstek.current, kontrol = new AbortController(); ekKontrol.current = kontrol;
    setEkYukleniyor(true); setHata('');
    try {
      const res = await fetch(vivaListeUrl({ ...sorgu, offset: onceki.etkinlikler.length }), { cache: 'no-store', signal: kontrol.signal });
      const d = await res.json(); if (!res.ok) throw Error(d.hata ?? 'Etkinlikler yüklenemedi.');
      if (kontrol.signal.aborted || id !== sonIstek.current) return;
      const yeni = d as VivaListeYaniti;
      setYanit({ anahtar, veri: { ...yeni, etkinlikler: [...onceki.etkinlikler, ...yeni.etkinlikler.filter(e => !onceki.etkinlikler.some(x => x.etkinlik_id === e.etkinlik_id))] } });
    } catch (err) { if (!kontrol.signal.aborted && id === sonIstek.current) { setYanit(null); setHata(err instanceof Error ? err.message : 'Etkinlikler yüklenemedi.'); } }
    finally { if (!kontrol.signal.aborted && id === sonIstek.current) setEkYukleniyor(false); }
  }
  function temizle() { setArama(''); setSorguMetni(''); setGun(null); }
  const baslik = bolum === 'ileri' ? 'İleri Tarihli Yayınlar' : bolum === 'canli' ? 'Başlayan Yayınlar' : bolum === 'taslak' ? 'Taslaklarınız' : 'Geçmiş etkinlikler';
  const listeIcerigi = <div className={styles.contentGrid}>
    <section aria-label="Etkinlikler" aria-busy={yukleniyor}>
      {hata && <div className={styles.error} role="alert"><h2>Etkinlikler yüklenemedi.</h2><p>{hata}</p><Button variant="outline" onClick={() => setYenileme(n => n + 1)}>Yeniden dene</Button></div>}
      {!veri && !hata && <div className={styles.skeletons} role="status" aria-label="Etkinlikler yükleniyor"><div /><div /><span className={styles.srOnly}>Viva yükleniyor…</span></div>}
      {veri && <>
        {veri.canlilar.length > 0 && <section className={styles.liveSection} aria-label="Şu anda canlı"><div className={styles.sectionTitle}><h2>Şu anda canlı</h2><span>{gunTarihi(gorunenBugun)}</span></div>{veri.canlilar.map(e => <CanliKart key={e.etkinlik_id} e={e} kaynak={kaynak} />)}</section>}
        <div className={styles.sectionTitle}><h2 id={etiketId}>{baslik}</h2><span aria-live="polite">{veri.toplam} etkinlik</span></div>
      </>}
      <div className={styles.filterRow}><SadeKapsulFiltre etiket="Etkinlik kapsamı" deger={kapsam} onDegistir={setKapsam} secenekler={kapsamlar} />
        <label className={styles.search}><Search aria-hidden="true" /><input aria-label="Etkinlik ara" type="search" maxLength={160} value={arama} placeholder="Etkinlik ara…" onChange={e => setArama(e.target.value)} /></label>
      </div>
      {gun && <div className={styles.dateFilter}><span>{gunTarihi(gun)}</span><Button variant="ghost" size="sm" onClick={() => setGun(null)}><X aria-hidden="true" />Tarihi temizle</Button></div>}
      {veri && <div aria-labelledby={etiketId}>
        {bolum === 'taslak' && <p className={styles.privateNote}>Taslaklar yalnızca size görünür.</p>}
        {veri.etkinlikler.length ? <div className={styles.eventList}>{veri.etkinlikler.map(e => bolum === 'canli' ? <CanliKart key={e.etkinlik_id} e={e} kaynak={kaynak} /> : <EtkinlikKarti key={e.etkinlik_id} e={e} kaynak={kaynak} />)}</div> : <div className={styles.empty}><CalendarDays aria-hidden="true" /><h3>{bolum === 'taslak' ? 'Henüz taslağınız yok' : 'Gösterilecek etkinlik yok'}</h3><p>{gun || sorguMetni ? 'Seçtiğiniz filtrelerle eşleşen etkinlik bulunamadı.' : kapsam === 'duzenlediklerim' ? 'Oluşturduğunuz etkinlikler burada görünür.' : 'Davet edildiğiniz etkinlikler burada görünür.'}</p>{gun || sorguMetni ? <Button variant="link" onClick={temizle}>Filtreleri temizle</Button> : veri.olusturabilir && <Button asChild><Link href="/viva">Etkinlik oluştur</Link></Button>}</div>}
        {veri.devam_var && <Button variant="outline" disabled={ekYukleniyor || yukleniyor} onClick={() => void dahaFazla()} className={styles.loadMore}>{ekYukleniyor ? 'Yükleniyor…' : 'Daha fazla göster'}</Button>}
      </div>}
    </section>
    <aside className={styles.rightColumn} aria-label="Takvim ve yardım">
      <Card className={styles.calendar}><div className={styles.calendarHeading}><h2>{tarih(`${ay}-01T12:00:00+03:00`, { month: 'long', year: 'numeric' })}</h2><div><Button variant="ghost" size="icon" aria-label="Önceki ay" disabled={ay === '1900-01'} onClick={() => { setAy(vivaAyKaydir(ay, -1)); setGun(null); }}><ChevronLeft aria-hidden="true" /></Button><Button variant="ghost" size="icon" aria-label="Sonraki ay" disabled={ay === '2200-12'} onClick={() => { setAy(vivaAyKaydir(ay, 1)); setGun(null); }}><ChevronRight aria-hidden="true" /></Button></div></div>
        <div className={styles.weekdays} aria-hidden="true">{['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(g => <span key={g}>{g}</span>)}</div>
        <div className={styles.days} aria-busy={yukleniyor}>{vivaTakvimGunleri(ay).map((d, i) => d ? <button type="button" key={d} className={`${d === gorunenBugun ? styles.today : ''} ${d === gun ? styles.picked : ''}`} aria-label={`${gunTarihi(d)}${veri?.takvim.some(t => t.gun === d) ? ', etkinlik var' : ''}`} aria-current={d === gorunenBugun ? 'date' : undefined} aria-pressed={d === gun} onClick={() => setGun(d === gun ? null : d)}>{Number(d.slice(-2))}{veri?.takvim.some(t => t.gun === d) && <span className={styles.dayDot} />}</button> : <span key={`bos-${i}`} />)}</div>
        <div className={styles.calendarLegend}><span><i />Etkinlik var</span><Button variant="link" onClick={() => { setAy(gorunenBugun.slice(0, 7)); setGun(null); }}>Bugüne dön</Button></div>
      </Card>
      <Card className={styles.agenda}><h2>{gun ? gunTarihi(gun) : 'Sırdaki Etkinlik'}</h2>{veri?.siradaki ? <Link href={vivaDetayYolu(veri.siradaki.etkinlik_id, 'katilimcilar', kaynak)} className={styles.agendaEntry}><span>{saat(veri.siradaki.baslangic)}</span><div><h3>{veri.siradaki.baslik}</h3><p>{tarih(veri.siradaki.baslangic, { day: 'numeric', month: 'long', weekday: 'long' })}</p><p>{Math.round((Date.parse(veri.siradaki.bitis) - Date.parse(veri.siradaki.baslangic)) / 60000)} dakika · {veri.siradaki.sahip_adi}</p></div></Link> : <p className={styles.noAgenda}>{yukleniyor ? 'Yükleniyor…' : hata ? 'Etkinlik bilgileri alınamadı.' : 'Bu seçimde yaklaşan etkinlik yok.'}</p>}</Card>
    </aside>
  </div>;
  return <div className={styles.screen}>
    <header className={styles.pageHeader}>
      <nav className={styles.breadcrumb} aria-label="İçerik konumu"><span>Cogniti</span><ChevronRight aria-hidden="true" /><Link href="/viva">Viva</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Viva Yayınlar</span></nav>
      <YenileButonu yenileniyor={yukleniyor} onYenile={() => setYenileme(n => n + 1)} />
    </header>
    <div className={styles.toolbar}>
      <SadeSekmeler etiket="Etkinlik görünümü" deger={bolum} onDegistir={setBolum} className={styles.tabs}
        secenekler={bolumler.filter(b => b.deger !== 'taslak' || veri?.olusturabilir || bolum === 'taslak').map(b => ({ ...b, icerik: b.deger === bolum ? listeIcerigi : null }))} />
    </div><footer className={styles.pageFooter}>{veri?.olusturabilir && <Link href="/viva/kayitlar">Yayın kayıtlarım</Link>}<span>© {gorunenBugun.slice(0, 4)} Cogniti · bilgi taşır</span><span>Tüm saatler Türkiye saatine göredir (UTC+3).</span></footer>
  </div>;
}
