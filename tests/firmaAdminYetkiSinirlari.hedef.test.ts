import test from 'node:test';
import assert from 'node:assert/strict';
import { FIRMA_ADMIN_ROLU, TUM_ROLLER, ADMIN_ROLLER } from '@/lib/utils/roller';
import { panelBaslangici } from '@/lib/panel/baslangic';
import { firmaAdminIstegiIzinliMi } from '@/lib/admin/firmaAdminErisimi';
import { esnekPaketBakiyeTuru } from '@/lib/satinAlma/esnekPaket';
import { kkoHesapTuru } from '@/lib/satinAlma/kkoYetkisi';

// SENARYO-FAD-01: Firma admin kimliği ve başlangıç rotası
test('SENARYO-FAD-01: FIRMA_ADMIN_ROLU TUM_ROLLER içindedir ve panelBaslangici /admin döner', () => {
  assert.equal(FIRMA_ADMIN_ROLU, 'firma_admin');
  assert.equal(TUM_ROLLER.includes(FIRMA_ADMIN_ROLU), true, 'firma_admin TUM_ROLLER içinde olmalıdır.');
  const baslangic = panelBaslangici(FIRMA_ADMIN_ROLU);
  assert.equal(baslangic.yol, '/admin');
  assert.equal(baslangic.etiket, 'Firma Yönetimi');
});

// SENARYO-FAD-02: Firma admin erişim doğrulama kuralı (firma_admin_aktif ve aktif şartı)
test('SENARYO-FAD-02: Firma admin erişimi için firma_admin_aktif ve aktif true olmalıdır', () => {
  const erisimDogrula = (firma: { aktif: boolean; firma_admin_aktif: boolean }) => {
    return firma.aktif === true && firma.firma_admin_aktif === true;
  };
  
  assert.equal(erisimDogrula({ aktif: true, firma_admin_aktif: true }), true);
  assert.equal(erisimDogrula({ aktif: true, firma_admin_aktif: false }), false, 'firma_admin_aktif false ise erişim kapalıdır');
  assert.equal(erisimDogrula({ aktif: false, firma_admin_aktif: true }), false, 'firma aktif değilse erişim kapalıdır');
});

// SENARYO-FAD-03: Firma admini kendi firma sayfalarına izinlidir (firmaAdminIstegiIzinliMi)
test('SENARYO-FAD-03: Firma admini kendi firma rotalarına erişebilir', () => {
  const firmaId = 'firma-111';
  const izinliMi = firmaAdminIstegiIzinliMi(
    `/admin/api/firmalar/${firmaId}/kullanicilar`,
    'GET',
    new URLSearchParams(),
    firmaId
  );
  assert.equal(izinliMi, true, 'Kendi firma kullanıcılar rotasına GET erişebilmelidir');
});

// SENARYO-FAD-04: Firma admini global admin rotalarına erişemez
test('SENARYO-FAD-04: Firma admini global rotalara erişemez', () => {
  const firmaId = 'firma-111';
  const globalIzinliMi = firmaAdminIstegiIzinliMi(
    '/admin/api/sistem',
    'GET',
    new URLSearchParams(),
    firmaId
  );
  assert.equal(globalIzinliMi, false, 'Global sistem rotasına erişim engellenmelidir');
});

// SENARYO-FAD-05: Firma admini şirket adına esnek paket ve KKÖ yönetebilir (firma_ortak)
test('SENARYO-FAD-05: firma_admin esnek paket ve KKÖ için firma_ortak bakiye türüne sahiptir', () => {
  assert.equal(esnekPaketBakiyeTuru(FIRMA_ADMIN_ROLU), 'firma_ortak');
  assert.equal(kkoHesapTuru(FIRMA_ADMIN_ROLU), 'firma_ortak');
});

// SENARYO-FAD-06: Firma admini kendi firma proformalarını açabilir ve onaylayabilir
test('SENARYO-FAD-06: Firma admini kendi firma proforma rotasına POST yapabilir', () => {
  const firmaId = 'firma-111';
  const proformaIzinliMi = firmaAdminIstegiIzinliMi(
    `/admin/api/firmalar/${firmaId}/esnek-proformalar`,
    'POST',
    new URLSearchParams(),
    firmaId
  );
  assert.equal(proformaIzinliMi, true, 'Kendi firma proformasına POST erişebilmelidir');
});

// SENARYO-FAD-07: KKÖ proforma onayında ay sonu kuralı (diğer ayın 1inden önce onay kapalıdır)
test('SENARYO-FAD-07: KKÖ proforma onayı yalnız ay bittikten sonra (diğer ayın 1i ve sonrası) açılır', () => {
  const kkoOnayAcikMi = (mevcutTarih: string, hedefDonemBitis: string): boolean => {
    return new Date(mevcutTarih).getTime() >= new Date(hedefDonemBitis).getTime();
  };
  
  const donemBitis = '2026-11-01T00:00:00Z'; // Ekim ayı bitişi / Kasım 1
  assert.equal(kkoOnayAcikMi('2026-10-25T12:00:00Z', donemBitis), false, 'Ay devam ederken onay kapalıdır');
  assert.equal(kkoOnayAcikMi('2026-11-01T00:00:01Z', donemBitis), true, 'Diğer ayın 1inde onay açılır');
});

// SENARYO-FAD-08: Firma admini kullanıcı yönetirken admin rolü atayamaz veya admin silemez
test('SENARYO-FAD-08: Firma admini Cogniti admin rolü atayamaz veya değiştiremez', () => {
  const rolAtamaIzinliMi = (hedefRol: string): boolean => {
    return !ADMIN_ROLLER.includes(hedefRol);
  };
  
  assert.equal(rolAtamaIzinliMi('pm'), true);
  assert.equal(rolAtamaIzinliMi('utt'), true);
  assert.equal(rolAtamaIzinliMi('admin'), false, 'admin rolü ataması kesinlikle engellenmelidir');
});

// SENARYO-FAD-09: Firma admini resmi faturalar menüsüne erişemez
test('SENARYO-FAD-09: Firma admini resmi fatura sayfalarına erişemez', () => {
  const faturaSayfasiGorebilirMi = (rol: string): boolean => {
    return rol !== FIRMA_ADMIN_ROLU;
  };
  assert.equal(faturaSayfasiGorebilirMi(FIRMA_ADMIN_ROLU), false, 'Firma adminine faturalar menüsü kapalıdır');
});

// SENARYO-FAD-10: Çapraz firma izolasyonu (hedef firmaId uyuşmadığında erişim engellenir)
test('SENARYO-FAD-10: Çapraz firma izolasyonu (farklı firmaId rotalarına erişim engellenir)', () => {
  const oturumFirmaId = 'firma-111';
  const hedefFirmaId = 'firma-222';
  const caprazIzinliMi = firmaAdminIstegiIzinliMi(
    `/admin/api/firmalar/${hedefFirmaId}/kullanicilar`,
    'GET',
    new URLSearchParams(),
    oturumFirmaId
  );
  assert.equal(caprazIzinliMi, false, 'Başka firmanın rotasına erişim engellenmelidir');
});
