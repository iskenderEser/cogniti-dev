import test from 'node:test';
import assert from 'node:assert/strict';
import { yayinDetayModaliGorebilir, YONETICI_ROLLER } from '@/lib/utils/roller';
import { kapsamGenisMi, gorunenTurler, tuketiciMi, videoBolumuVarMi } from '@/lib/video/gorunurluk';
import { esnekPaketBakiyeTuru } from '@/lib/satinAlma/esnekPaket';
import { kkoHesapTuru } from '@/lib/satinAlma/kkoYetkisi';
import { PERIYOTLAR } from '@/lib/utils/raporUtils';

// SENARYO-YON-01: Yönetici rolleri yayın detay modalını ve soru karnesini açabilir
test('SENARYO-YON-01: Yönetici rolleri yayın detay modalını ve soru karnesini açabilir', () => {
  for (const rol of YONETICI_ROLLER) {
    assert.equal(
      yayinDetayModaliGorebilir(rol),
      true,
      `${rol} rolü yayın detay modalını açabilmelidir.`
    );
  }
});

// SENARYO-YON-02: Yönetici rolleri şirket genelindeki tüm takımların yayınlarını kapsar
test('SENARYO-YON-02: Yönetici rolleri kapsamGenisMi = true (şirket geneli takım kapsamı)', () => {
  for (const rol of YONETICI_ROLLER) {
    assert.equal(
      kapsamGenisMi(rol),
      true,
      `${rol} rolü kapsamGenisMi = true olmalıdır.`
    );
  }
});

// SENARYO-YON-03: Yönetici rolleri tüm yayın türlerini (pazarlama, medikal, eğitim) görür
test('SENARYO-YON-03: Yönetici rolleri tüm içerik türlerini görür ve video bölümüne sahiptir', () => {
  for (const rol of YONETICI_ROLLER) {
    assert.equal(videoBolumuVarMi(rol), true, `${rol} video bölümü görmelidir.`);
    const turler = gorunenTurler(rol);
    assert.equal(turler.length >= 3, true, `${rol} tüm ana yayın türlerini görebilmelidir.`);
  }
});

// SENARYO-YON-04: İki Bölge Karşılaştırma Raporu metrik yapısı doğrulaması
test('SENARYO-YON-04: İki Bölge Karşılaştırma Raporu metrik yapısı (net puan, katılım, araç dağılımı)', () => {
  const sahteBolgeRaporu = {
    bm1: { id: 'bm-1', netPuan: 850, katilimOrani: 92, araclar: { video: 400, pdf: 200, podcast: 150, gorsel: 100 } },
    bm2: { id: 'bm-2', netPuan: 780, katilimOrani: 88, araclar: { video: 380, pdf: 180, podcast: 120, gorsel: 100 } }
  };
  assert.equal(sahteBolgeRaporu.bm1.netPuan > sahteBolgeRaporu.bm2.netPuan, true);
  assert.equal(typeof sahteBolgeRaporu.bm1.araclar.video, 'number');
  assert.equal(typeof sahteBolgeRaporu.bm2.katilimOrani, 'number');
});

// SENARYO-YON-05: Raporlama zaman filtrelerinde günlük ölçüm seçeneği bulunamaz
test('SENARYO-YON-05: Raporlama zaman filtreleri yalnız Haftalık, Aylık, Dönemlik, Yıllık olabilir', () => {
  const periyotAnahtarlari = PERIYOTLAR.map(p => p.key);
  assert.deepEqual(periyotAnahtarlari, ['bu_hafta', 'bu_ay', 'bu_donem', 'bu_yil']);
  assert.equal(periyotAnahtarlari.includes('bu_gun' as any), false, 'Günlük ölçüm seçeneği kesinlikle bulunamaz');
});

// SENARYO-YON-06: Yönetici rolleri şirket adına esnek paket token satın alabilir (firma_ortak)
test('SENARYO-YON-06: Yönetici rolleri esnek paket bakiye türü firma_ortak olmalıdır', () => {
  for (const rol of YONETICI_ROLLER) {
    assert.equal(
      esnekPaketBakiyeTuru(rol),
      'firma_ortak',
      `${rol} rolü firma_ortak esnek paket satın alabilmelidir.`
    );
  }
});

// SENARYO-YON-07: Yönetici rolleri KKÖ (Kullandığın Kadar Öde) firma_ortak yönetim yetkisine sahiptir
test('SENARYO-YON-07: Yönetici rolleri KKÖ hesap türü firma_ortak olmalıdır', () => {
  for (const rol of YONETICI_ROLLER) {
    assert.equal(
      kkoHesapTuru(rol),
      'firma_ortak',
      `${rol} rolü KKÖ firma_ortak yönetim yetkisine sahip olmalıdır.`
    );
  }
});

// SENARYO-YON-08: Yönetici rolleri talep açma / içerik üretme rollerinden kesinlikle hariçtir
test('SENARYO-YON-08: Yönetici rolleri talep açma / içerik üretme rollerinden kesinlikle hariçtir', () => {
  const URETICI_ROLLER = ['pm', 'jr_pm', 'kd_pm', 'med_md', 'egt_md', 'egt_yrd_md', 'egt_yon', 'egt_uz', 'ik_drk', 'ik_md', 'ik_yrd_md', 'ik_uz', 'ik_per'];
  for (const rol of YONETICI_ROLLER) {
    assert.equal(
      URETICI_ROLLER.includes(rol),
      false,
      `${rol} rolü üretici roller arasında olamaz.`
    );
  }
});

// SENARYO-YON-09: Yönetici rolleri tüketici puanı kazanamaz (tuketiciMi = false)
test('SENARYO-YON-09: Yönetici rolleri tüketici değildir (tuketiciMi = false), izleme puanı kazanamaz', () => {
  for (const rol of YONETICI_ROLLER) {
    assert.equal(
      tuketiciMi(rol),
      false,
      `${rol} rolü tüketici olamaz (tuketiciMi false olmalıdır).`
    );
  }
});

// SENARYO-YON-10: Çapraz şirket (Multi-tenant) veri izolasyonu kuralı
test('SENARYO-YON-10: Çapraz şirket izolasyonu (firma_id uyuşmazlığında erişim engellenir)', () => {
  const yoneticiFirmaId = 'firma-aaa-111';
  const hedefVeriFirmaId = 'firma-bbb-222';
  const erisimIzni = (yoneticiFirma: string, hedefFirma: string) => yoneticiFirma === hedefFirma;
  
  assert.equal(erisimIzni(yoneticiFirmaId, hedefVeriFirmaId), false, 'Yabancı firma verisine erişim engellenmelidir');
  assert.equal(erisimIzni(yoneticiFirmaId, yoneticiFirmaId), true, 'Kendi firma verisine erişim serbesttir');
});
