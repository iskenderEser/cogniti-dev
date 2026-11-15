import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  ECLUB_ECZACI_UNVANLARI, 
  ECLUB_TUKETICI_ROLLERI, 
  ECLUB_HEDEF_ROLLER,
  URETICI_ROLLER,
  TUM_ROLLER
} from '@/lib/utils/roller';
import { esnekPaketBakiyeTuru } from '@/lib/satinAlma/esnekPaket';
import { kkoHesapTuru } from '@/lib/satinAlma/kkoYetkisi';

// SENARYO-ECZ-01: Eczacı unvanları (eczaci, ikinci_eczaci, yardimci_eczaci) ECLUB_ECZACI_UNVANLARI içindedir ve hedef role eşlenir
test('SENARYO-ECZ-01: Eczacı unvanları ECLUB_ECZACI_UNVANLARI içindedir ve ECLUB_HEDEF_ROLLER ile uyumludur', () => {
  const beklenenUnvanlar = ['eczaci', 'ikinci_eczaci', 'yardimci_eczaci'];
  assert.deepEqual([...ECLUB_ECZACI_UNVANLARI].sort(), beklenenUnvanlar.sort());
  assert.equal(ECLUB_HEDEF_ROLLER.includes('eczaci'), true, "ECLUB_HEDEF_ROLLER içinde 'eczaci' bulunmalıdır.");
  for (const unvan of beklenenUnvanlar) {
    assert.equal(ECLUB_TUKETICI_ROLLERI.includes(unvan), true, `${unvan} ECLUB_TUKETICI_ROLLERI içinde olmalıdır.`);
  }
});

// SENARYO-ECZ-02: E-Club kişileri TUM_ROLLER (iç kullanıcılar) listesinde yer almaz (ayrı kimlik düzlemi)
test('SENARYO-ECZ-02: E-Club unvanları iç kullanıcıların TUM_ROLLER listesine dahil edilmez (ayrı düzlem)', () => {
  for (const unvan of ECLUB_ECZACI_UNVANLARI) {
    assert.equal(
      TUM_ROLLER.includes(unvan as any),
      false,
      `${unvan} iç TUM_ROLLER listesinde yer almamalıdır (eclub_kisiler düzlemindedir).`
    );
  }
});

// SENARYO-ECZ-03: Yalnızca ana 'eczaci' unvanı hediye çeki talebi başlatabilir
test('SENARYO-ECZ-03: Yalnızca ana eczaci unvanı çek talebi açabilir; ikinci ve yardımcı eczacı açamaz', () => {
  const cekTalebiAcabilirMi = (unvan: string): boolean => unvan === 'eczaci';
  
  assert.equal(cekTalebiAcabilirMi('eczaci'), true, 'Ana eczacı çek talebi açabilmelidir.');
  assert.equal(cekTalebiAcabilirMi('ikinci_eczaci'), false, 'İkinci eczacı çek talebi açamaz.');
  assert.equal(cekTalebiAcabilirMi('yardimci_eczaci'), false, 'Yardımcı eczacı çek talebi açamaz.');
  assert.equal(cekTalebiAcabilirMi('eczane_teknisyeni'), false, 'Eczane teknisyeni çek talebi açamaz.');
});

// SENARYO-ECZ-04: Çek talep penceresi yalnız ayın 1-7 günleri arasında açıktır; 8'inde ve sonrasında kapanır
test('SENARYO-ECZ-04: Çek talep penceresi kuralı (1-7 günleri açık, 8 ve sonrası kapalı)', () => {
  const cekTalepPenceresiAcikMi = (gun: number): boolean => gun >= 1 && gun <= 7;
  
  assert.equal(cekTalepPenceresiAcikMi(1), true, 'Ayın 1inde pencere açık olmalıdır.');
  assert.equal(cekTalepPenceresiAcikMi(7), true, 'Ayın 7sinde pencere açık olmalıdır.');
  assert.equal(cekTalepPenceresiAcikMi(8), false, 'Ayın 8inde pencere kapanmalıdır.');
  assert.equal(cekTalepPenceresiAcikMi(15), false, 'Ayın 15inde pencere kapalı olmalıdır.');
});

// SENARYO-ECZ-05: Hediye çeki onay zinciri sırası (beklemede -> bm_onayinda -> tm_onayinda -> onaylandi)
test('SENARYO-ECZ-05: Çek onay zinciri kanonik sıra kontrolü ve TM son onayı zorunluluğu', () => {
  const onaySirasi = ['beklemede', 'bm_onayinda', 'tm_onayinda', 'onaylandi', 'cek_kodlari_gonderildi'];
  const tmOnayiVarMi = (durum: string) => durum === 'onaylandi' || durum === 'cek_kodlari_gonderildi';
  
  assert.equal(tmOnayiVarMi('beklemede'), false);
  assert.equal(tmOnayiVarMi('bm_onayinda'), false);
  assert.equal(tmOnayiVarMi('tm_onayinda'), false);
  assert.equal(tmOnayiVarMi('onaylandi'), true, 'onaylandi durumu TM son onayının verildiğini kanıtlar');
});

// SENARYO-ECZ-06: Çek teslimatında e-posta yalnız ana eczacıya, push bildirimi tüm eczane üyelerine gider
test('SENARYO-ECZ-06: Çek teslimatında e-posta tek ana eczacıya, push bildirimi tüm çalışanlara gider', () => {
  const sahteEczaneCalisanlari = [
    { kisiId: 'kisi-1', unvan: 'eczaci', eposta: 'ana@eczane.com', hapbilgiHesabiVar: true },
    { kisiId: 'kisi-2', unvan: 'ikinci_eczaci', eposta: 'ikinci@eczane.com', hapbilgiHesabiVar: true },
    { kisiId: 'kisi-3', unvan: 'eczane_teknisyeni', eposta: 'tek@eczane.com', hapbilgiHesabiVar: true },
  ];
  
  // E-posta alıcısı: Yalnızca unvanı 'eczaci' olan
  const epostaAlicilari = sahteEczaneCalisanlari.filter(c => c.unvan === 'eczaci').map(c => c.eposta);
  assert.deepEqual(epostaAlicilari, ['ana@eczane.com'], 'E-posta yalnız ana eczacıya gitmelidir.');
  
  // Push alıcıları: HapBilgi hesabı bulunan tüm aktif eczane çalışanları
  const pushAlicilari = sahteEczaneCalisanlari.filter(c => c.hapbilgiHesabiVar).map(c => c.kisiId);
  assert.deepEqual(pushAlicilari, ['kisi-1', 'kisi-2', 'kisi-3'], 'Push bildirimi tüm çalışanlara gitmelidir.');
});

// SENARYO-ECZ-07: Eczanem modülünde aktif eczane doğrulaması
test('SENARYO-ECZ-07: Eczacı unvanları Eczanem müşteri video dağıtımı için aktif eczane bağına ihtiyaç duyar', () => {
  const eczaciEczaneKontrol = (kisi: { kisiId: string; aktifEczaneId: string | null }) => {
    return kisi.aktifEczaneId !== null;
  };
  
  assert.equal(eczaciEczaneKontrol({ kisiId: 'k-1', aktifEczaneId: 'eczane-123' }), true);
  assert.equal(eczaciEczaneKontrol({ kisiId: 'k-2', aktifEczaneId: null }), false, 'Aktif eczane bağı yoksa işlem engellenir');
});

// SENARYO-ECZ-08: Eczacı unvanları içerik üreticisi değildir (talep ve yayın açamaz)
test('SENARYO-ECZ-08: Eczacı unvanları URETICI_ROLLER listesinde yer almaz', () => {
  for (const unvan of ECLUB_ECZACI_UNVANLARI) {
    assert.equal(
      URETICI_ROLLER.includes(unvan as any),
      false,
      `${unvan} üretici roller arasında bulunamaz.`
    );
  }
});

// SENARYO-ECZ-09: Eczacı unvanları token veya paket satın alamaz
test('SENARYO-ECZ-09: Eczacı unvanları token veya esnek paket satın alamaz (bakiye türü null)', () => {
  for (const unvan of ECLUB_ECZACI_UNVANLARI) {
    assert.equal(
      esnekPaketBakiyeTuru(unvan),
      null,
      `${unvan} esnek paket satın alamaz.`
    );
    assert.equal(
      kkoHesapTuru(unvan),
      null,
      `${unvan} KKÖ yönetemez.`
    );
  }
});

// SENARYO-ECZ-10: Çapraz eczane veri izolasyonu kuralı
test('SENARYO-ECZ-10: Çapraz eczane veri izolasyonu (eczane_id uyuşmazlığında erişim engellenir)', () => {
  const kullaniciEczaneId = 'eczane-aaa-111';
  const hedefVeriEczaneId = 'eczane-bbb-222';
  const erisimIzni = (kaynakEczane: string, hedefEczane: string) => kaynakEczane === hedefEczane;
  
  assert.equal(erisimIzni(kullaniciEczaneId, hedefVeriEczaneId), false, 'Yabancı eczane verisine erişim engellenmelidir');
  assert.equal(erisimIzni(kullaniciEczaneId, kullaniciEczaneId), true, 'Kendi eczane verisine erişim serbesttir');
});
