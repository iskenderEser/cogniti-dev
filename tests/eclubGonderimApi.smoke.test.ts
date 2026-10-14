import test from 'node:test';
import assert from 'node:assert/strict';
import { gonderimIsteginiOku, planTarihiniRpcGirdisineCevir, planTarihAdaylari, sayfalamaOku } from '@/lib/eclub/gonderimApi';
const yayin = '11111111-1111-4111-8111-111111111111';
const kisi = '22222222-2222-4222-8222-222222222222';
const anahtar = '33333333-3333-4333-8333-333333333333';
const temel = { yayin_idler: [yayin], kisi_idler: [kisi] };
test('eski tek yayın isteği ve yeni çoklu seçim aynı sözleşmeye dönüşür', () => {
  assert.deepEqual(gonderimIsteginiOku({ yayin_id: yayin, kisi_idler: [kisi] }), gonderimIsteginiOku(temel));
  assert.deepEqual(gonderimIsteginiOku({ ...temel, yayin_idler: [yayin, yayin] }).yayin_idler, [yayin]);
});
test('plan yalnız tarih alır; saatli eski sözleşme reddedilir', () => {
  assert.throws(() => gonderimIsteginiOku({ ...temel, islem: 'planla' }));
  assert.throws(() => gonderimIsteginiOku({ ...temel, islem: 'planla', hedef_gonderim_tarihi: '2026-10-14' }));
  assert.throws(() => gonderimIsteginiOku({ ...temel, hedef_gonderim_tarihi: '2026-10-14' }));
  assert.throws(() => gonderimIsteginiOku({ ...temel, islem: 'kontrol', hedef_gonderim_tarihi: '2026-10-14T09:00:00+03:00' }));
  assert.throws(() => gonderimIsteginiOku({ ...temel, islem: 'kontrol', hedef_gonderim_tarihi: '2026-02-30' }));
  assert.throws(() => gonderimIsteginiOku({ ...temel, islem: 'kontrol', hedef_gonderim_at: '2026-10-14T09:00:00+03:00' }));
  assert.equal(gonderimIsteginiOku({ ...temel, islem: 'planla', islem_anahtari: anahtar,
    hedef_gonderim_tarihi: '2026-10-14' }).hedef_gonderim_tarihi, '2026-10-14');
  assert.equal(planTarihiniRpcGirdisineCevir('2026-10-14'), '2026-10-13T21:00:00.000Z');
});
test('toplu istek boyutu sınırlıdır; istemci araç bilgisi kota girdisi değildir', () => {
  assert.throws(() => gonderimIsteginiOku({ ...temel, kisi_idler: Array(101).fill(kisi) }));
  assert.throws(() => gonderimIsteginiOku({ ...temel, yayin_idler: ['gecersiz'] }));
  assert.deepEqual(gonderimIsteginiOku({ ...temel, arac_id: 'gecersiz' }), gonderimIsteginiOku(temel));
});
test('tarih adayları yarından başlar; hafta sonu ve ikinci ileri hafta yoktur', () => {
  const tarihler = planTarihAdaylari(new Date('2026-10-13T08:00:00+03:00'));
  assert.equal(tarihler.length, 8);
  assert.equal(tarihler.at(-1), '2026-10-23');
  assert.ok(tarihler.every(t => /^\d{4}-\d{2}-\d{2}$/.test(t) && new Date(`${t}T00:00:00Z`).getUTCDay() >= 1 && new Date(`${t}T00:00:00Z`).getUTCDay() <= 5));
});
test('takip eden hafta mevcut iki aylık dönemi aşarsa adaylar dönem sonunda kesilir', () => {
  assert.deepEqual(planTarihAdaylari(new Date('2026-02-27T08:00:00+03:00')), []);
  assert.deepEqual(planTarihAdaylari(new Date('2026-12-31T10:00:00+03:00')), []);
});
test('hafta sonu plan oluşturulabilir; hedef adayları takip eden haftanın iş günleridir', () => {
  const tarihler = planTarihAdaylari(new Date('2026-10-17T12:00:00+03:00'));
  assert.equal(tarihler.length, 5);
  assert.equal(tarihler[0], '2026-10-19');
});
test('sayfalama negatif/kesirli/aşırı boyutları reddeder', () => {
  assert.deepEqual(sayfalamaOku(new URLSearchParams('sayfa=2&sayfa_boyutu=20')), { sayfa: 2, sayfa_boyutu: 20, baslangic: 20 });
  for (const p of ['sayfa=0', 'sayfa=1.5', 'sayfa_boyutu=101', 'sayfa_boyutu=-1', 'sayfa=NaN']) assert.throws(() => sayfalamaOku(new URLSearchParams(p)));
});
