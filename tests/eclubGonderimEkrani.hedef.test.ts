import test from 'node:test';
import assert from 'node:assert/strict';
import { gonderiIcinKalanGun, gonderimTarihiYaz, planHedefiniCoz, planTakvimSinirlari } from '@/lib/eclub/gonderimEkrani';
import type { GonderimKontrolSonucu } from '@/lib/eclub/gonderimPlanTipleri';
const simdi = new Date('2026-10-13T10:00:00+03:00');
test('yalnız gelecek bir Türkiye tarihi seçilir; saat istenmez', () => {
 assert.ok(planHedefiniCoz('', simdi).hata);
 assert.ok(planHedefiniCoz('2026-10-13', simdi).hata);
 assert.equal(planHedefiniCoz('2026-10-14', simdi).hedef, '2026-10-14');
 assert.equal(gonderimTarihiYaz('2026-10-14'), '14.10.2026');
});
test('bu hafta ve takip eden hafta içi izinli; daha ileri hafta ve hafta sonu kapalı', () => {
 assert.equal(planHedefiniCoz('2026-10-23', simdi).hata, null);
 assert.ok(planHedefiniCoz('2026-10-26', simdi).hata);
 assert.ok(planHedefiniCoz('2026-10-17', simdi).hata);
 assert.equal(planHedefiniCoz('2026-10-19', new Date('2026-10-17T10:00:00+03:00')).hata, null);
});
test('takip eden hafta yeni döneme taşsa bile yeni dönem planlanamaz', () => {
 const son = new Date('2026-10-29T10:00:00+03:00');
 assert.equal(planTakvimSinirlari(son).max, '2026-10-31');
 assert.equal(planHedefiniCoz('2026-10-30', son).hata, null);
 assert.ok(planHedefiniCoz('2026-11-02', son).hata);
});
test('Türkiye gece yarısı ve yıl sonunda bugünün tarihi planlanamaz', () => {
 const son = new Date('2026-12-30T22:00:00Z');
 assert.equal(planTakvimSinirlari(son).min, '2027-01-01');
 assert.equal(planTakvimSinirlari(son).max, '2026-12-31');
 assert.ok(planHedefiniCoz('2026-12-31', son).hata);
 assert.ok(planHedefiniCoz('2027-01-01', son).hata);
 assert.ok(planHedefiniCoz('2026-02-30', simdi).hata);
});
test('15 gün engelinde kalan süre alıcının kendi gönderim ve plan tarihinden hesaplanır', () => {
 const simdiMs = Date.parse('2026-10-14T10:00:00+03:00');
 const engel = (tarihler: Partial<GonderimKontrolSonucu>): GonderimKontrolSonucu => ({
  kisi_id: 'k', yayin_id: 'y', uygun: false, sebep: 'on_bes_gun_araligi', kaydedildi: false, ...tarihler,
 });
 assert.equal(gonderiIcinKalanGun([engel({ yeniden_gonderilebilir_at: '2026-10-16T10:00:00+03:00' })], simdiMs), 2);
 assert.equal(gonderiIcinKalanGun([engel({ sonraki_gonderim_at: '2026-10-16T10:00:00+03:00' })], simdiMs), 17);
 assert.equal(gonderiIcinKalanGun([
  engel({ yeniden_gonderilebilir_at: '2026-10-16T10:00:00+03:00' }),
  engel({ yeniden_gonderilebilir_at: '2026-10-20T10:00:00+03:00' }),
 ], simdiMs), 6);
 assert.equal(gonderiIcinKalanGun([{ ...engel({}), sebep: 'haftalik_urun_kotasi' }], simdiMs), null);
});
