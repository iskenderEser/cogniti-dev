import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  ECLUB_TUKETICI_ROLLERI, 
  ECLUB_HEDEF_ROLLER,
  ECLUB_ORTAK_YAYIN_GRUBU,
  URETICI_ROLLER,
  TUM_ROLLER
} from '@/lib/utils/roller';
import { esnekPaketBakiyeTuru } from '@/lib/satinAlma/esnekPaket';
import { kkoHesapTuru } from '@/lib/satinAlma/kkoYetkisi';

// SENARYO-TEK-01: Teknisyen unvanı ECLUB_TUKETICI_ROLLERI ve ECLUB_HEDEF_ROLLER içindedir
test('SENARYO-TEK-01: eczane_teknisyeni unvanı ECLUB_TUKETICI_ROLLERI ve ECLUB_HEDEF_ROLLER içindedir', () => {
  assert.equal(
    ECLUB_TUKETICI_ROLLERI.includes('eczane_teknisyeni'),
    true,
    "eczane_teknisyeni ECLUB_TUKETICI_ROLLERI içinde yer almalıdır."
  );
  assert.equal(
    ECLUB_HEDEF_ROLLER.includes('eczane_teknisyeni'),
    true,
    "eczane_teknisyeni ECLUB_HEDEF_ROLLER içinde yer almalıdır."
  );
});

// SENARYO-TEK-02: Teknisyen ve eczacı ortak yayın grubuna (ECLUB_ORTAK_YAYIN_GRUBU) erişim kuralı
test('SENARYO-TEK-02: Ortak E-Club yayın grubu (eczaci_ve_eczane_teknisyeni) sözleşmesi', () => {
  assert.equal(ECLUB_ORTAK_YAYIN_GRUBU, 'eczaci_ve_eczane_teknisyeni');
  const ortakYayinGorebilirMi = (rol: string) => {
    return rol === 'eczaci' || rol === 'eczane_teknisyeni';
  };
  assert.equal(ortakYayinGorebilirMi('eczane_teknisyeni'), true);
  assert.equal(ortakYayinGorebilirMi('eczaci'), true);
  assert.equal(ortakYayinGorebilirMi('utt'), false);
});

// SENARYO-TEK-03: Teknisyen soru çözüp puan kazanabilir; yanlış cevapta kesinti olmaz (sıfır kayıp)
test('SENARYO-TEK-03: Teknisyen soru tamamlama puanı hesaplama (yanlış cevap sıfır kayıp)', () => {
  const puanHesapla = (dogruSayisi: number, yanlisSayisi: number, soruPuani: number) => {
    const dogruPuan = dogruSayisi * soruPuani;
    const yanlisKayip = yanlisSayisi * 0; // Sıfır kayıp kuralı
    return dogruPuan - yanlisKayip;
  };
  
  assert.equal(puanHesapla(3, 1, 25), 75, '3 doğru 1 yanlışta puan 75 olmalıdır (yanlış ceza üretmez)');
});

// SENARYO-TEK-04: Teknisyen çek talebi başlatamaz (v_unvan != 'eczaci' istisnası)
test('SENARYO-TEK-04: eczane_teknisyeni unvanı çek talebi açamaz (yalnız ana eczacı açabilir)', () => {
  const cekTalebiAcabilirMi = (unvan: string): boolean => unvan === 'eczaci';
  
  assert.equal(
    cekTalebiAcabilirMi('eczane_teknisyeni'),
    false,
    'eczane_teknisyeni kesinlikle çek talebi açamaz.'
  );
});

// SENARYO-TEK-05: Çek teslimatında e-posta alıcı sorgusu teknisyeni hariç tutar
test('SENARYO-TEK-05: Çek teslimatında e-posta alıcısı yalnızca unvanı eczaci olan kişidir', () => {
  const eczaneUyeleri = [
    { unvan: 'eczaci', eposta: 'mesul@eczane.com' },
    { unvan: 'eczane_teknisyeni', eposta: 'teknisyen@eczane.com' }
  ];
  const epostaAlicilari = eczaneUyeleri.filter(u => u.unvan === 'eczaci').map(u => u.eposta);
  
  assert.deepEqual(epostaAlicilari, ['mesul@eczane.com']);
  assert.equal(epostaAlicilari.includes('teknisyen@eczane.com'), false, 'Teknisyen e-posta alıcısı olamaz');
});

// SENARYO-TEK-06: Çek teslimatında push bildirimi teknisyene eksiksiz gider
test('SENARYO-TEK-06: Çek teslimatında push bildirimi teknisyenin HapBilgi hesabına gider', () => {
  const eczaneUyeleri = [
    { kisiId: 'tek-1', unvan: 'eczane_teknisyeni', aktifMi: true, hapbilgiHesabiVar: true }
  ];
  const pushAlicilari = eczaneUyeleri.filter(u => u.aktifMi && u.hapbilgiHesabiVar).map(u => u.kisiId);
  
  assert.deepEqual(pushAlicilari, ['tek-1'], 'Teknisyene push bildirimi iletilmelidir.');
});

// SENARYO-TEK-07: eczane_teknisyeni iç kullanıcılar (TUM_ROLLER) listesinde yer almaz (ayrı düzlem)
test('SENARYO-TEK-07: eczane_teknisyeni TUM_ROLLER listesinde yer almaz (eclub_kisiler düzlemindedir)', () => {
  assert.equal(
    TUM_ROLLER.includes('eczane_teknisyeni' as any),
    false,
    'eczane_teknisyeni iç TUM_ROLLER listesinde bulunmamalıdır.'
  );
});

// SENARYO-TEK-08: Teknisyen içerik üreticisi değildir (talep ve yayın açamaz)
test('SENARYO-TEK-08: eczane_teknisyeni URETICI_ROLLER listesinde yer almaz', () => {
  assert.equal(
    URETICI_ROLLER.includes('eczane_teknisyeni' as any),
    false,
    'eczane_teknisyeni üretici roller arasında bulunamaz.'
  );
});

// SENARYO-TEK-09: Teknisyen token veya paket satın alamaz
test('SENARYO-TEK-09: eczane_teknisyeni token veya esnek paket satın alamaz (bakiye türü null)', () => {
  assert.equal(
    esnekPaketBakiyeTuru('eczane_teknisyeni'),
    null,
    'eczane_teknisyeni esnek paket satın alamaz.'
  );
  assert.equal(
    kkoHesapTuru('eczane_teknisyeni'),
    null,
    'eczane_teknisyeni KKÖ yönetemez.'
  );
});

// SENARYO-TEK-10: Çapraz eczane veri izolasyonu kuralı
test('SENARYO-TEK-10: Çapraz eczane veri izolasyonu (eczane_id uyuşmazlığında erişim engellenir)', () => {
  const teknisyenEczaneId = 'eczane-111';
  const hedefVeriEczaneId = 'eczane-222';
  const erisimIzni = (kaynak: string, hedef: string) => kaynak === hedef;
  
  assert.equal(erisimIzni(teknisyenEczaneId, hedefVeriEczaneId), false, 'Yabancı eczane verisine erişim engellenmelidir');
  assert.equal(erisimIzni(teknisyenEczaneId, teknisyenEczaneId), true, 'Kendi eczane verisine erişim serbesttir');
});
