'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Clock3, LockKeyhole, Play, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SayfaYenileBasligi } from '@/components/ui/sayfa-yenile-basligi';
import { YenileButonu } from '@/components/ui/yenile-butonu';
import { vivaDetayYolu, type VivaKayitKutuphanesi as VivaKayitKutuphanesiYaniti } from '@/lib/viva/detay';
import { vivaTarih } from '@/lib/viva/sozlesme';
import styles from './viva-detay.module.css';
export default function VivaKayitKutuphanesi() {
  const [veri, setVeri] = useState<VivaKayitKutuphanesiYaniti | null>(null);
  const [hata, setHata] = useState(''), [yukleniyor, setYukleniyor] = useState(true);
  const [offset, setOffset] = useState(0), [yenileme, setYenileme] = useState(0);
  useEffect(() => {
    const kontrol = new AbortController(); setYukleniyor(true);
    void (async () => {
      try {
        const r = await fetch(`/viva/api/kayit-kutuphanesi?offset=${offset}`, { cache: 'no-store', signal: kontrol.signal });
        const d = await r.json(); if (!r.ok) throw new Error(d.hata ?? 'Kayıt listesi alınamadı.');
        if (!kontrol.signal.aborted) { setVeri(eski => ({ ...d, etkinlikler: offset && eski && d.olusturabilir ? [...eski.etkinlikler, ...d.etkinlikler.filter((e: VivaKayitKutuphanesiYaniti['etkinlikler'][number]) => !eski.etkinlikler.some(x => x.etkinlik.etkinlik_id === e.etkinlik.etkinlik_id))] : d.etkinlikler })); setHata(''); }
      } catch (e) { if (!kontrol.signal.aborted) { setVeri(null); setHata(e instanceof Error ? e.message : 'Kayıt listesi alınamadı.'); } }
      finally { if (!kontrol.signal.aborted) setYukleniyor(false); }
    })();
    return () => kontrol.abort();
  }, [offset, yenileme]);
  function yenile() { setOffset(0); setYenileme(n => n + 1); }
  return <main className={styles.screen}><SayfaYenileBasligi ustBilgi={<nav className={styles.breadcrumb} aria-label="İçerik konumu"><span>Cogniti</span><ChevronRight aria-hidden="true" /><Link href="/viva">Viva</Link><ChevronRight aria-hidden="true" /><Link href="/viva/yayinlar">Viva Yayınlar</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Yayın kayıtları</span></nav>} baslik={<h1 className={styles.pageTitle}>Yayın kayıtları</h1>} aciklama={<p className={styles.description}>Buluşmalarınıza yeniden dönün. Video ve sohbet kayıtları aynı yerde.</p>} aksiyon={<YenileButonu yenileniyor={yukleniyor} onYenile={yenile} />} />
    <p className={styles.note}><Clock3 aria-hidden="true" />Kayıtlar etkinlik bittikten sonra 7 gün indirilebilir. Dosyalar yalnız düzenleyen kişiye açıktır.</p>
    {hata && <div role="alert" className={styles.error}><p>{hata}</p><Button variant="outline" onClick={yenile}>Yeniden dene</Button></div>}
    {yukleniyor && <p role="status" className={styles.loading}>Yayın kayıtları yükleniyor…</p>}
    {veri && !veri.olusturabilir && <Card className={styles.empty}><LockKeyhole aria-hidden="true" /><h2>Kayıtlar düzenleyene aittir</h2><p>Bu görünümde kayıt indirme yetkiniz bulunmuyor.</p></Card>}
    {veri?.olusturabilir && <section className={styles.library} aria-label="Kayıtlı buluşmalar">{!veri.etkinlikler.length && !yukleniyor && <Card className={styles.empty}><Video aria-hidden="true" /><h2>Henüz kayıt bulunmuyor</h2><p>Düzenlediğiniz etkinliklerin kayıt parçaları burada görünecek.</p></Card>}{veri.etkinlikler.map(k => <Card key={k.etkinlik.etkinlik_id} className={styles.recordCard}><span className={styles.recordThumb}><Play aria-hidden="true" /></span><div className={styles.recordContent}><h2>{k.etkinlik.baslik}</h2><p>{vivaTarih(k.etkinlik.baslangic)} · {k.kayit_sayisi} kayıt parçası</p><span className={styles.expiry}>{k.suresi_doldu || Boolean(k.indirme_bitis && Date.now() >= Date.parse(k.indirme_bitis)) ? 'İndirme süresi doldu' : k.indirme_bitis ? `${vivaTarih(k.indirme_bitis)} tarihine kadar indirilebilir` : 'Kayıtlar yayın bittikten sonra 7 gün indirilebilir.'}</span></div><Button variant="ghost" asChild><Link href={vivaDetayYolu(k.etkinlik.etkinlik_id, 'kayitlar')}>Kayıtları aç<ArrowRight aria-hidden="true" /></Link></Button></Card>)}
      {veri.devam_var && <Button className={styles.loadMore} variant="outline" disabled={yukleniyor} onClick={() => setOffset(n => n + 20)}>Daha fazla göster</Button>}
    </section>}
    <Link href="/viva/yayinlar" className={styles.backLink}><ArrowLeft aria-hidden="true" />Viva Yayınlar’a dön</Link>
  </main>;
}
