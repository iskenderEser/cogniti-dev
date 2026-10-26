'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChartNoAxesColumn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { YenileButonu } from '@/components/ui/yenile-butonu';
import { vivaAnketArsivIstek, type VivaArsivAnketi } from '@/lib/viva/anketArsiv';
import { vivaTarih } from '@/lib/viva/sozlesme';
import styles from './viva-detay.module.css';
export default function VivaAnketArsivi({ etkinlikId, odaAcik = false, yenilemeSayaci = 0 }: { etkinlikId: string; odaAcik?: boolean; yenilemeSayaci?: number }) {
  const [oturumlar, setOturumlar] = useState<VivaArsivAnketi[]>([]), [hata, setHata] = useState('');
  const [hazirSayi, setHazirSayi] = useState(0);
  const [yenileme, setYenileme] = useState(0), [tamamlananIstek, setTamamlananIstek] = useState('');
  const istekAnahtari = `${etkinlikId}:${yenileme}:${yenilemeSayaci}`;
  const yukleniyor = tamamlananIstek !== istekAnahtari;
  useEffect(() => {
    const kontrol = new AbortController();
    void vivaAnketArsivIstek(etkinlikId, 'liste', {}, kontrol.signal).then(d => {
      if (!kontrol.signal.aborted) { setOturumlar(d.oturumlar ?? []); setHazirSayi(d.sorular?.length ?? 0); setHata(''); }
    }).catch(e => { if (!kontrol.signal.aborted) { setOturumlar([]); setHazirSayi(0); setHata(e instanceof Error ? e.message : 'Anket arşivi alınamadı.'); } })
      .finally(() => { if (!kontrol.signal.aborted) setTamamlananIstek(istekAnahtari); });
    return () => kontrol.abort();
  }, [etkinlikId, istekAnahtari]);
  return <Card className={styles.pane}><section aria-label="Anket arşivi">
    <div className={styles.paneHead}><h2>Soru / Anket</h2><YenileButonu yenileniyor={yukleniyor} etiket="Sonuçları yenile" onYenile={() => setYenileme(n => n + 1)} /></div>
    <p className={styles.sectionDescription}>Sorular ve cevaplar bu etkinliğe bağlı saklanır. Yayına açılmış soruların sonuçları burada görünür.</p>
    {odaAcik && <Button variant="outline" asChild><Link href={`/viva/${etkinlikId}/oda`}>Soruları hazırla</Link></Button>}
    {yukleniyor && <p role="status" className={styles.emptyText}>Anket arşivi yükleniyor…</p>}{hata && <p role="alert" className={styles.error}>{hata}</p>}
    {!yukleniyor && !hata && !oturumlar.length && <div className={styles.empty}><ChartNoAxesColumn aria-hidden="true" /><h3>Henüz yayına açılmış soru yok</h3><p>{hazirSayi ? `${hazirSayi} soru yayın odasında hazır bekliyor.` : 'Yayın odasında sorularınızı hazırlayıp katılımcılara açabilirsiniz.'}</p></div>}
    {!hata && oturumlar.map(a => {
      const toplam = a.sayilar.reduce((x, y) => x + y, 0);
      return <article key={a.soru.id} className={styles.questionCard}><span className={`${styles.pill} ${a.acik ? styles.live : styles.neutral}`}>{a.acik ? 'Cevaplara açık' : 'Cevaplama kapandı'}</span><h3>{a.soru.question}</h3><p className={styles.help}>{vivaTarih(a.acildi)} · {toplam} cevap · Etkinlik anketi</p>
        <ul className={styles.resultList}>{a.soru.options.map((s, i) => { const sayi = a.sayilar[i] ?? 0, oran = toplam ? sayi / toplam * 100 : 0; return <li key={i} className={styles.barItem}><div className={styles.barLabel}><span>{s}</span><strong>{sayi} <span>· %{Math.round(oran)}</span></strong></div><div className={styles.barTrack} role="meter" aria-label={s} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(oran)} aria-valuetext={`${sayi} cevap, yüzde ${Math.round(oran)}`}><div className={styles.barFill} style={{ width: `${oran}%` }} /></div></li>; })}</ul>
      </article>;
    })}
  </section></Card>;
}
