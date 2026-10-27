import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = readFileSync(new URL('../lib/cclub/topluGonderim.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function scenario(result) {
  const notifications = [], calls = [], exports = {};
  vm.runInNewContext(code, { exports, require: id => {
    if (id === '@/lib/utils/bildirimOlustur') return { bildirimOlustur: async p => notifications.push(p) };
    if (id === '@/lib/cclub/bildirimMesajlari') return { challengeGeldiMesaji: (ad,video) => `${ad}: ${video}` };
    throw new Error(id);
  } });
  return { calls, notifications, run: () => exports.challengeTopluOlustur({ rpc: async (name,params) => {
    calls.push({name,params}); return result;
  } }, { gonderen_id: 'bm-1', yayin_id: 'pub-1', alan_idler: ['bm-2','bm-3'] }, { gonderenAdi: 'Bir BM', videoAdi: 'İçerik' }) };
}

test('C-Club alıcıları tek RPC ile gönderilir; başarılı challenge kimlikleriyle bildirim oluşur', async () => {
  const s=scenario({data:{gonderilen:[{alan_id:'bm-2',challenge_id:'c1'},{alan_id:'bm-3',challenge_id:'c2'}],atlanan:[]},error:null});
  const result=await s.run();
  assert.equal(result.ok,true); assert.equal(s.calls.length,1);
  assert.equal(s.calls[0].name,'cogniti_token_cclub_toplu_gonder');
  assert.deepEqual(JSON.parse(JSON.stringify(s.calls[0].params.p_alan_idler)),['bm-2','bm-3']);
  assert.deepEqual(s.notifications.map(r=>r.kayit_id),['c1','c2']);
});
for(const reason of ['bakiye_yetersiz','hesap_yok']) test(`Token hatası ${reason}: hiçbir bildirim oluşturulmaz`,async()=>{
  const s=scenario({data:null,error:{code:'P0001',message:`COGNITI_TOKEN:${reason}`}});
  const result=await s.run();assert.equal(result.ok,false);assert.equal(result.tokenHatasi,true);
  assert.equal(s.notifications.length,0);assert.match(result.hata,/Hiçbir challenge gönderilmedi/);
});
test('Kota veya alıcı kuralıyla atlanan kişi için bildirim oluşmaz', async()=>{
  const s=scenario({data:{gonderilen:[{alan_id:'bm-2',challenge_id:'c1'}],atlanan:[{alan_id:'bm-3',sebep:'Kota doldu'}]},error:null});
  const result=await s.run();assert.equal(result.ok,true);assert.equal(result.atlanan.length,1);
  assert.deepEqual(s.notifications.map(r=>r.alici_id),['bm-2']);
});
test('Bozuk veya bilinmeyen sonuçta başarı bildirimi üretilmez',async()=>{
  const s=scenario({data:{gonderilen:[{alan_id:'bm-2'}],atlanan:[]},error:null});
  const result=await s.run();assert.equal(result.ok,false);assert.equal(s.notifications.length,0);
  assert.match(result.hata,/listenizi kontrol edin/);
});
test('Beklenmedik veritabanı hatası token hatası olarak gösterilmez',async()=>{
  const s=scenario({data:null,error:{code:'23514',message:'internal detail'}});
  const result=await s.run();assert.equal(result.ok,false);assert.equal(result.tokenHatasi,false);
  assert.equal(s.notifications.length,0);assert.doesNotMatch(result.hata,/internal detail/);
});
