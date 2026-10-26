'use client';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Clock3, Pencil, Play, Search, Users, Video, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SadeSekmeler } from '@/components/kontrol/SadeKontroller';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ROL_ADLARI } from '@/lib/utils/roller';
import { VIVA_DURUMLARI, type VivaDetay, type VivaKisi } from '@/lib/viva/sozlesme';
import { VIVA_DETAY_BOLUMLERI, vivaDetayYolu, type VivaDetayBolumu } from '@/lib/viva/detay';
import VivaKayitlar from './VivaKayitlar';
import styles from './viva-detay.module.css';

function Onay({ baslik, aciklama, eylem, disabled, onOnay }: { baslik: string; aciklama: string; eylem: string; disabled: boolean; onOnay: () => void }) {
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={disabled}>{eylem}</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{baslik}</AlertDialogTitle><AlertDialogDescription>{aciklama}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction onClick={onOnay}>{eylem}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
function Rehber({ bolum }: { bolum: VivaDetayBolumu }) {
  return <section className={styles.guide}><h3><BookOpen aria-hidden="true" />Viva yardım</h3><p>{bolum === 'katilimcilar' ? 'Misafirler yalnız bu etkinliği izleyebilir. Erişim etkinlik bitiminde kapanır.' : bolum === 'kayitlar' ? 'Kayıtlar yayın bittikten sonra 7 gün indirilebilir.' : 'Planlama, katılım ve yayın yönetimi hakkında kısa rehber.'}</p>
    <Dialog.Root><Dialog.Trigger asChild><Button variant="ghost">Kılavuzu aç<ArrowRight aria-hidden="true" /></Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.guideModal}><Dialog.Title>Etkinliğinizi yönetin</Dialog.Title><Dialog.Description>Viva’da buluşma, katılım ve kayıt işlemleri.</Dialog.Description><ul><li>Planlanmış etkinlik ve taslak bilgilerini Düzenle bağlantısından güncelleyin.</li><li>Firma içi ve E-Club katılımcılarını yetkili kapsamınızdan seçin. Özel davetliler e-posta doğrulamasıyla yalnız izleyici olarak katılır.</li><li>Video ve sohbet kayıtlarını yayın odasında yönetin. Hazır parçaları yalnız düzenleyen kişi, indirme süresi içinde indirebilir.</li><li>Etkinliği iptal etmek katılımcı ve misafirlerin oda erişimini kapatır.</li></ul><Dialog.Close asChild><Button variant="outline"><X aria-hidden="true" />Kapat</Button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
  </section>;
}
export default function VivaDetayIcerigi({ detay, bolum, onBolum, busy, onIptal, onCikar, takvim, davetler, yenilemeSayaci }: { yenilemeSayaci: number;
  detay: VivaDetay; bolum: VivaDetayBolumu; onBolum: (v: VivaDetayBolumu) => void; busy: boolean;
  onIptal: () => void; onCikar: (k: VivaKisi) => void; takvim: ReactNode; davetler: ReactNode;
}) {
  const [arama, setArama] = useState('');
  const e = detay.etkinlik, sahibi = e.yonetebilir;
  const aktifBolum = sahibi ? bolum : 'ozet';
  const duzenlenebilir = sahibi && e.yayin_turu !== 'anlik' && ['taslak', 'planlandi'].includes(e.durum);
  const oda = e.oda_acik && ['planlandi', 'canli'].includes(e.durum);
  const saat = (d: string) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(new Date(d));
  const tarihBicimi = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' });
  const tarih = tarihBicimi.format(new Date(e.baslangic));
  const bitisTarihi = tarihBicimi.format(new Date(e.bitis));
  const bitisSaati = `${tarih === bitisTarihi ? '' : `${bitisTarihi} · `}${saat(e.bitis)}`;
  const kisiler = detay.katilimcilar.filter(k => k.ad.toLocaleLowerCase('tr-TR').includes(arama.trim().toLocaleLowerCase('tr-TR')));
  const icerik = <div className={styles.detailGrid}><section className={styles.sectionColumn}>
    {aktifBolum === 'ozet' && <Card className={styles.pane}><div className={styles.paneHead}><h2>Bu buluşma hakkında</h2></div><p className={styles.descriptionText}>{e.aciklama || 'Henüz açıklama eklenmedi.'}</p>
      <div className={styles.compactDetails}><div className={styles.detailRow}><CalendarDays aria-hidden="true" /><div><strong>{tarih}</strong><p>{saat(e.baslangic)} – {bitisSaati} · Türkiye saati</p></div></div><div className={styles.detailRow}><Users aria-hidden="true" /><div><strong>{e.sahip_adi}</strong><p>{e.firma_adi} · {sahibi ? 'Düzenleyen sizsiniz' : 'Düzenleyen'}</p></div></div><div className={styles.detailRow}><Video aria-hidden="true" /><div><strong>{e.yayin_turu === 'anlik' ? 'Anlık yayın' : 'Planlanmış yayın'}</strong><p>{e.durum === 'taslak' ? 'Bu taslak yalnız size görünür.' : e.durum === 'sona_erdi' ? 'Bu buluşma sona erdi.' : e.durum === 'iptal' ? 'Bu etkinlik iptal edildi.' : 'Katılım, etkinliğe erişiminiz doğrulanarak açılır.'}</p></div></div></div>
      {e.durum === 'planlandi' && e.yayin_turu !== 'anlik' && oda && <><h3 className={styles.subheading}>Takviminizde yer ayırın</h3>{takvim}<p className={styles.help}>Viva’da yapılan değişiklikler dış takvimdeki kaydı otomatik güncellemez.</p></>}
    </Card>}
    {aktifBolum === 'katilimcilar' && <><Card className={styles.pane}><div className={styles.paneHead}><h2>Katılımcılar <span>({detay.katilimcilar.length})</span></h2>{duzenlenebilir && <Button variant="ghost" asChild><Link href={`/viva/${e.etkinlik_id}/duzenle`}>Katılımcıları düzenle</Link></Button>}</div>
      <label className={styles.search}><Search aria-hidden="true" /><input type="search" aria-label="Etkinlik katılımcılarını ara" value={arama} onChange={x => setArama(x.target.value)} placeholder="Katılımcı adıyla arayın…" /></label>
      {kisiler.length ? <ul className={styles.dataList}>{kisiler.map(k => <li key={`${k.tur}:${k.id}`} className={styles.dataRow}><div className={styles.identity}><span className={styles.avatar} aria-hidden="true">{k.ad.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('')}</span><div><strong>{k.ad}</strong><span>{k.tur === 'eclub' ? 'E-Club' : 'Firma içi'} · {ROL_ADLARI[k.alt] ?? k.alt}</span></div></div>{oda && <Onay eylem="Katılımcıyı çıkar" baslik="Katılımcı çıkarılsın mı?" aciklama={`${k.ad} adlı kişinin bu görüşmeye erişimi kapatılacak.`} disabled={busy} onOnay={() => onCikar(k)} />}</li>)}</ul> : <p className={styles.emptyText}>{arama ? 'Eşleşen katılımcı bulunmuyor.' : 'Henüz katılımcı seçilmedi.'}</p>}
    </Card><Card className={styles.pane}>{davetler}</Card></>}
    {aktifBolum === 'kayitlar' && <VivaKayitlar key={e.etkinlik_id} etkinlikId={e.etkinlik_id} canli={oda} detayTasarimi yenilemeSayaci={yenilemeSayaci} />}
  </section><aside className={styles.summarySide} aria-label="Etkinlik özeti ve yardım"><Card className={styles.sideCard}><h3>{e.durum === 'canli' ? 'Buluşma devam ediyor' : e.durum === 'taslak' ? 'Hazır olduğunuzda planlayın' : e.durum === 'planlandi' ? 'Buluşmaya hazırlanırken' : 'Buluşmadan sonra'}</h3><p>{e.durum === 'canli' ? 'Yayın odasına katılın; kamera ve mikrofonunuzu önizlemede kontrol edin.' : e.durum === 'taslak' ? 'Başlık, zaman ve katılımcıları gözden geçirerek etkinliğinizi planlayabilirsiniz.' : e.durum === 'planlandi' ? 'Yayın saati geldiğinde bu sayfadan odaya geçebilirsiniz. Başlangıçta kamera ve mikrofonunuz kapalıdır.' : 'Kayıtlar etkinliğin düzenleyeni tarafından görüntülenir.'}</p>{oda ? <Button variant="ghost" asChild><Link href={`/viva/${e.etkinlik_id}/oda`}>Yayın odasını aç<ArrowRight aria-hidden="true" /></Link></Button> : duzenlenebilir && <Button variant="ghost" asChild><Link href={`/viva/${e.etkinlik_id}/duzenle`}>Düzenlemeye devam et<ArrowRight aria-hidden="true" /></Link></Button>}</Card>
    {sahibi && aktifBolum === 'ozet' && <Card className={styles.sideCard}><h3>Etkinlik yönetimi</h3><div className={styles.featureList}><Link href={vivaDetayYolu(e.etkinlik_id, 'katilimcilar')}><Users aria-hidden="true" />{detay.katilimcilar.length} katılımcı · {detay.davetler.filter(d => !d.iptal).length} özel davet</Link><Link href={vivaDetayYolu(e.etkinlik_id, 'kayitlar')}><Play aria-hidden="true" />Kayıt parçaları</Link><Link href="/viva/kayitlar"><Video aria-hidden="true" />Tüm yayın kayıtlarım</Link></div></Card>}
    <Rehber bolum={aktifBolum} />
  </aside></div>;
  return <>
    <Card className={styles.summaryCard}><div className={styles.detailTitleRow}><div><span className={`${styles.pill} ${e.durum === 'canli' ? styles.live : styles.neutral}`}>{e.durum === 'canli' && <i />}{VIVA_DURUMLARI[e.durum]}</span><h2>{e.baslik}</h2><p className={styles.summaryDescription}>{e.firma_adi} · {sahibi ? 'Düzenlediğiniz etkinlik' : 'Davet edildiğiniz etkinlik'}</p></div><div className={styles.detailActions}>{oda && <Button asChild><Link href={`/viva/${e.etkinlik_id}/oda`}><Video aria-hidden="true" />{e.durum === 'canli' ? 'Yayına katıl' : 'Yayın odasını aç'}</Link></Button>}{duzenlenebilir && <Button asChild variant="outline"><Link href={`/viva/${e.etkinlik_id}/duzenle`}><Pencil aria-hidden="true" />Düzenle</Link></Button>}{sahibi && ['taslak', 'planlandi'].includes(e.durum) && <Onay baslik="Etkinlik iptal edilsin mi?" aciklama="Katılımcıların oda erişimi ve özel davet bağlantıları kapanacak." eylem="Etkinliği iptal et" disabled={busy} onOnay={onIptal} />}</div></div><div className={styles.detailMeta}><span><CalendarDays aria-hidden="true" />{tarih}</span><span><Clock3 aria-hidden="true" />{saat(e.baslangic)} – {bitisSaati} · {Math.round((Date.parse(e.bitis) - Date.parse(e.baslangic)) / 60000)} dakika</span><span><Users aria-hidden="true" />{e.sahip_adi}</span></div></Card>
    {e.durum === 'iptal' && <p className={`${styles.note} ${styles.warning}`} role="status">Etkinlik iptal edildi. Yayın odası ve özel davet bağlantıları kapalıdır.</p>}
    {sahibi ? <SadeSekmeler className={styles.tabs} etiket="Etkinlik bölümleri" deger={aktifBolum} onDegistir={v => onBolum(v as VivaDetayBolumu)} secenekler={VIVA_DETAY_BOLUMLERI.map(b => ({ ...b, icerik: b.deger === aktifBolum ? icerik : null }))} /> : icerik}
    <Link href="/viva" className={styles.backLink}><ArrowLeft aria-hidden="true" />Viva etkinliklerine dön</Link>
  </>;
}
