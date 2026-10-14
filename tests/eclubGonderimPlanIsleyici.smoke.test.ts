import test from 'node:test';
import assert from 'node:assert/strict';
import { cronYetkiliMi, eclubPlanIsleriniTuket, type PlanIslemSonucu } from '@/lib/eclub/gonderimPlanIsleyici';
const basarili: PlanIslemSonucu = {
  plan_id: 'plan-1', kisi_id: 'uye-1', utt_id: 'utt-1', yayin_id: 'yayin-1',
  durum: 'gerceklesti', oneri_id: 'oneri-1', sebep: null,
};
test('eksik/yanlış cron yetkisi ve boş ortam anahtarı reddedilir', () => {
  assert.equal(cronYetkiliMi('Bearer anahtar', 'anahtar'), true);
  for (const [header, secret] of [[null, 'anahtar'], ['Bearer farkli', 'anahtar'], ['anahtar', 'anahtar'], ['Bearer ', ''], ['Bearer undefined', undefined]] as const)
    assert.equal(cronYetkiliMi(header, secret), false);
});
test('boş veya meşgul kuyrukta bildirim veya gönderim yeniden denenmez', async () => {
  let bildirim = 0;
  const sonuc = await eclubPlanIsleriniTuket({ isAl: async () => null, bildir: async () => { bildirim++; } });
  assert.equal(sonuc.islenen_adet, 0);
  assert.equal(bildirim, 0);
});
test('başarılı gerçek öneri bir kez bildirilir; sonuçlanmış plan tekrar alınmaz', async () => {
  const kuyruk = [basarili, null];
  const bildirilen: string[] = [];
  const bag = { isAl: async () => kuyruk.shift() ?? null, bildir: async (s: PlanIslemSonucu) => { bildirilen.push(s.oneri_id!); } };
  assert.equal((await eclubPlanIsleriniTuket(bag)).gerceklesen_adet, 1);
  assert.equal((await eclubPlanIsleriniTuket(bag)).islenen_adet, 0);
  assert.deepEqual(bildirilen, ['oneri-1']);
});
test('günü geçmiş veya yetkisi kalmamış planın nedeni korunur ve bildirim yapılmaz', async () => {
  const kuyruk: (PlanIslemSonucu | null)[] = ['plan_gunu_gecersiz', 'utt_yetkisiz', 'yayin_aktif_degil'].map((sebep, i) => ({
    ...basarili, plan_id: `plan-${i}`, durum: 'gerceklesmedi', oneri_id: null, sebep,
  }));
  let bildirilen = 0;
  const sonuc = await eclubPlanIsleriniTuket({ isAl: async () => kuyruk.shift() ?? null, bildir: async () => { bildirilen++; } });
  assert.equal(sonuc.gerceklesmeyen_adet, 3);
  assert.equal(bildirilen, 0);
  assert.equal(sonuc.sonuclar[0].sebep, 'plan_gunu_gecersiz');
});
test('bildirim hatası gerçek öneriyi yeniden göndermeye yol açmaz; sonraki plan işlenir', async () => {
  const kuyruk = [basarili, { ...basarili, plan_id: 'plan-2', oneri_id: 'oneri-2' }, null];
  const sonuc = await eclubPlanIsleriniTuket({ isAl: async () => kuyruk.shift() ?? null, bildir: async () => { throw new Error('Bildirim hatası'); } });
  assert.equal(sonuc.gerceklesen_adet, 2);
  assert.equal(sonuc.bildirim_hatasi, 2);
});
test('RPC hatası boş kuyruk sayılmaz; geçersiz başarı sonucu bildirilmez', async () => {
  await assert.rejects(eclubPlanIsleriniTuket({ isAl: async () => { throw new Error('RPC bağlantı hatası'); }, bildir: async () => {} }), /RPC bağlantı/);
  let bildirim = 0;
  await assert.rejects(eclubPlanIsleriniTuket({ isAl: async () => ({ ...basarili, oneri_id: null }), bildir: async () => { bildirim++; } }), /SQL sonucu geçersiz/);
  assert.equal(bildirim, 0);
});
test('iş adedi ve süre bütçesi aşıldığında yeni plan alınmaz', async () => {
  let sayac = 0;
  const bag = { isAl: async () => { sayac++; return basarili; }, bildir: async () => {} };
  assert.equal((await eclubPlanIsleriniTuket({ ...bag, maxIsSayisi: 2 })).islenen_adet, 2);
  assert.equal(sayac, 2);
  let simdi = 0;
  sayac = 0;
  const sonuc = await eclubPlanIsleriniTuket({ ...bag, maxSureMs: 10, saat: () => simdi,
    bildir: async () => { simdi = 11; } });
  assert.equal(sonuc.islenen_adet, 1);
  assert.equal(sayac, 1);
});
