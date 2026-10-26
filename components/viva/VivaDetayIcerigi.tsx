'use client';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { CalendarDays, Clock3, Pencil, Search, Users, UserRoundMinus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SadeSekmeler } from '@/components/kontrol/SadeKontroller';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ROL_ADLARI } from '@/lib/utils/roller';
import { type VivaDetay, type VivaKisi } from '@/lib/viva/sozlesme';
import { VIVA_DETAY_BOLUMLERI, vivaDetayKartDurumu, type VivaDetayBolumu } from '@/lib/viva/detay';
import VivaKayitlar from './VivaKayitlar';
import VivaKaydirilabilirTablo from './VivaKaydirilabilirTablo';
import styles from './viva-detay.module.css';

function Onay({ baslik, aciklama, eylem, disabled, onOnay, kompakt = false }: { kompakt?: boolean; baslik: string; aciklama: string; eylem: string; disabled: boolean; onOnay: () => void }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button variant={kompakt ? "ghost" : "outline"} size={kompakt ? "icon" : "default"} disabled={disabled} title={kompakt ? baslik : undefined}>{kompakt ? <><UserRoundMinus aria-hidden="true" /><span className="sr-only">{eylem}</span></> : eylem}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{baslik}</AlertDialogTitle><AlertDialogDescription>{aciklama}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction disabled={disabled} onClick={onOnay}>{eylem}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
export default function VivaDetayIcerigi({ detay, bolum, onBolum, busy, onIptal, onCikar, davetler, yenilemeSayaci }: { yenilemeSayaci: number;
  detay: VivaDetay; bolum: VivaDetayBolumu; onBolum: (v: VivaDetayBolumu) => void; busy: boolean;
  onIptal: () => void; onCikar: (k: VivaKisi) => void; takvim: ReactNode; davetler: ReactNode;
}) {
  const [arama, setArama] = useState('');
  const [simdi, setSimdi] = useState(Date.now);
  const e = detay.etkinlik, sahibi = e.yonetebilir;
  useEffect(() => {
    const timer = window.setInterval(() => setSimdi(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const kartDurumu = vivaDetayKartDurumu(e, simdi);
  const duzenlenebilir = sahibi && e.yayin_turu !== 'anlik' && ['taslak', 'planlandi'].includes(e.durum);
  const duzenleGorunur = duzenlenebilir || (sahibi && e.yayin_turu !== 'anlik' && e.durum === 'sona_erdi');
  const katilimciDuzenlenebilir = duzenlenebilir && Date.parse(e.baslangic) > simdi;
  const oda = e.oda_acik && ['planlandi', 'canli'].includes(e.durum);
  const saat = (d: string) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(new Date(d));
  const tarihBicimi = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
  const tarih = tarihBicimi.format(new Date(e.baslangic));
  const bitisTarihi = tarihBicimi.format(new Date(e.bitis));
  const bitisSaati = `${tarih === bitisTarihi ? '' : `${bitisTarihi} · `}${saat(e.bitis)}`;
  const sorgu = arama.trim().toLocaleLowerCase('tr-TR');
  const eclubVar = detay.katilimcilar.some(k => k.tur === 'eclub');
  const firmaVar = detay.katilimcilar.some(k => k.tur === 'ic');
  const kurumBasligi = firmaVar ? eclubVar ? 'Eczane / Firma Adı' : 'Firma Adı' : 'Eczane Adı';
  const aramaIpucu = firmaVar ? eclubVar ? 'Ad soyad, eczane veya firma adı…' : 'Ad soyad veya firma adı…' : 'Ad soyad veya eczane adı…';
  const kisiler = detay.katilimcilar.filter(k => [k.ad, k.tur === 'eclub' ? k.eczane_adi ?? '' : k.firma_adi ?? ''].some(ad => ad.toLocaleLowerCase('tr-TR').includes(sorgu)));
  const icerik = sahibi ? <div className={styles.detailGrid}><section className={styles.sectionColumn}>
    {bolum === 'katilimcilar' && <><Card className={styles.pane}><div className={`${styles.paneHead} ${styles.participantHead}`}><div className={styles.participantHeading}><h2>Katılımcılar <span>({detay.katilimcilar.length})</span></h2>{katilimciDuzenlenebilir && <Button variant="ghost" asChild><Link href={`/viva/${e.etkinlik_id}/duzenle`}>Katılımcıları düzenle</Link></Button>}</div>
      <label className={styles.search}><Search aria-hidden="true" /><input type="search" aria-label="Etkinlik katılımcılarını ara" value={arama} onChange={x => setArama(x.target.value)} placeholder={aramaIpucu} /></label></div>
      <VivaKaydirilabilirTablo satirSayisi={kisiler.length} etiket="Etkinlik katılımcıları" arama={arama}><table className={styles.participantTable} aria-label="Etkinlik katılımcıları"><thead><tr><th scope="col">{kurumBasligi}</th><th scope="col">Ad Soyad</th><th scope="col">Unvan</th><th scope="col">E-posta</th></tr></thead><tbody>{!kisiler.length && <tr><td colSpan={4} className={styles.emptyText}>{arama ? 'Eşleşen katılımcı bulunmuyor.' : 'Henüz katılımcı seçilmedi.'}</td></tr>}{kisiler.map(k => <tr key={`${k.tur}:${k.id}`}><td>{(k.tur === 'eclub' ? k.eczane_adi : k.firma_adi) || '—'}</td><td><div className={styles.participantIdentity}><strong>{k.ad}</strong>{oda && <div className={styles.rowActions}><Onay kompakt eylem="Katılımcıyı çıkar" baslik="Katılımcı çıkarılsın mı?" aciklama={`${k.ad} adlı kişinin bu görüşmeye erişimi kapatılacak.`} disabled={busy} onOnay={() => onCikar(k)} /></div>}</div></td><td>{ROL_ADLARI[k.alt] ?? k.alt}</td><td>{k.eposta || '—'}</td></tr>)}</tbody></table></VivaKaydirilabilirTablo>
    </Card><Card className={styles.pane}>{davetler}</Card></>}
    {bolum === 'kayitlar' && <VivaKayitlar key={e.etkinlik_id} etkinlikId={e.etkinlik_id} canli={oda} detayTasarimi yenilemeSayaci={yenilemeSayaci} />}
  </section></div> : null;
  return <>
    <Card className={styles.summaryCard}><div className={styles.detailTitleRow}><div>
      <span className={`${styles.pill} ${styles.statusPill}`} data-status={kartDurumu.etiket}>{kartDurumu.canli && <i />}{kartDurumu.etiket}</span>
      <h2>{e.baslik}</h2><p className={styles.summaryDescription}>{e.firma_adi} · {sahibi ? 'Düzenlediğiniz etkinlik' : 'Davet edildiğiniz etkinlik'}</p></div><div className={styles.detailActions}>{oda && <Button asChild><Link href={`/viva/${e.etkinlik_id}/oda`}><Video aria-hidden="true" />Yayını Açın</Link></Button>}{duzenleGorunur && (busy || kartDurumu.eylemlerKapali ? <Button variant="outline" disabled><Pencil aria-hidden="true" />Düzenle</Button> : <Button asChild variant="outline"><Link href={`/viva/${e.etkinlik_id}/duzenle`}><Pencil aria-hidden="true" />Düzenle</Link></Button>)}{sahibi && ['taslak', 'planlandi', 'sona_erdi'].includes(e.durum) && <Onay baslik="Etkinlik iptal edilsin mi?" aciklama="Katılımcıların oda erişimi ve özel davet bağlantıları kapanacak." eylem="Etkinliği iptal et" disabled={busy || kartDurumu.eylemlerKapali} onOnay={onIptal} />}</div></div><div className={styles.detailMeta}><span><CalendarDays aria-hidden="true" />{tarih}</span><span><Clock3 aria-hidden="true" />{saat(e.baslangic)} – {bitisSaati} · {Math.round((Date.parse(e.bitis) - Date.parse(e.baslangic)) / 60000)} dakika</span><span><Users aria-hidden="true" />{e.sahip_adi}</span></div></Card>
    {e.durum === 'iptal' && <p className={`${styles.note} ${styles.warning}`} role="status">Etkinlik iptal edildi. Yayın odası ve özel davet bağlantıları kapalıdır.</p>}
    {sahibi && <SadeSekmeler className={styles.tabs} etiket="Etkinlik bölümleri" deger={bolum} onDegistir={v => onBolum(v as VivaDetayBolumu)} secenekler={VIVA_DETAY_BOLUMLERI.map(b => ({ ...b, icerik: b.deger === bolum ? icerik : null }))} />}
  </>;
}
