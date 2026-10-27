import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = readFileSync(new URL('../lib/eczanem/gonderim.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function scenario(result, denied) {
  const pushes=[], calls=[], checks=[], exports={};
  vm.runInNewContext(code, {exports, console, require: id => {
    if (id === '@/lib/push/orkestrasyon') return {pushYayinlaEczanemMusterilereArkada: (...args)=>pushes.push(args)};
    if (id === '@/lib/eczanem/erisim') return {eczaneYayinErisimiDogrula: async (_db,eczane,pub)=>{
      checks.push({eczane,pub});return pub===denied ? {ok:false,hata:'Erişim kapalı.'} : {ok:true};
    }};
    if(id.startsWith('@/lib/')) return {};
    throw new Error(id);
  }});
  return {pushes,calls,checks,run: (pubs=['pub1','pub2'],customers=['m1','m2'])=>exports.musterilereTopluGonder({rpc:async(name,params)=>{
    calls.push({name,params});return result;
  }},'eczane','personel',pubs,customers)};
}
test('Çoklu yayın ve müşteriler tek RPC ile gönderilir; push yalnız gerçekten eklenen hedeflere gider',async()=>{
  const s=scenario({data:{ok:true,gonderilen:1,atlanan:3,sonuclar:[{yayin_id:'pub1',musteri_idler:['m2']},{yayin_id:'pub2',musteri_idler:[]}]},error:null});
  const result=await s.run();
  assert.equal(result.ok,true);assert.equal(result.gonderilenYayin,1);assert.equal(result.atlanan,3);
  assert.equal(s.calls.length,1);assert.equal(s.calls[0].name,'cogniti_token_eczanem_toplu_gonder');
  assert.deepEqual(JSON.parse(JSON.stringify(s.calls[0].params)),{p_eczane_id:'eczane',p_gonderen_kisi_id:'personel',p_yayin_idler:['pub1','pub2'],p_musteri_idler:['m1','m2']});
  assert.equal(s.pushes.length,1);assert.deepEqual(JSON.parse(JSON.stringify(s.pushes[0].slice(1))),['eczanem_gonderim',['m2'],{yayinId:'pub1'}]);
});
for(const reason of ['bakiye_yetersiz','hesap_yok']) test(`Token hatası ${reason}: başarı veya push üretilmez`,async()=>{
  const s=scenario({data:null,error:{code:'P0001',message:`COGNITI_TOKEN:${reason}`}});
  const result=await s.run();assert.equal(result.ok,false);assert.equal(result.gonderilen,0);assert.equal(s.pushes.length,0);
  assert.match(result.hata,/Yayın sahibi firmanın/);assert.match(result.hata,/hiçbiri yapılmadı/);
});
test('İkinci yayında erişim kapalıysa hiçbir yazma RPCsi çağrılmaz',async()=>{
  const s=scenario({},'pub2');const result=await s.run();
  assert.equal(result.ok,false);assert.equal(s.checks.length,2);assert.equal(s.calls.length,0);assert.equal(s.pushes.length,0);
});
test('Teknik tekrarlar aynı istekte ayıklanır',async()=>{
  const s=scenario({data:{ok:true,gonderilen:0,atlanan:1,sonuclar:[{yayin_id:'pub1',musteri_idler:[]}]},error:null});
  assert.equal((await s.run(['pub1','pub1'],['m1','m1'])).ok,true);
  assert.equal(s.calls[0].params.p_yayin_idler.length,1);assert.equal(s.calls[0].params.p_musteri_idler.length,1);assert.equal(s.pushes.length,0);
});
test('Bozuk sonuçta başarı ve push üretilmez',async()=>{
  const s=scenario({data:{ok:true,gonderilen:1,atlanan:0,sonuclar:[{yayin_id:'pub1',musteri_idler:null}]},error:null});
  const result=await s.run();assert.equal(result.ok,false);assert.equal(s.pushes.length,0);assert.match(result.hata,/listenizi kontrol edin/);
});
test('Boş seçim ve teknik istek sınırı yazma yapmadan reddedilir',async()=>{
  const s=scenario({});assert.equal((await s.run([],['m1'])).ok,false);
  assert.equal((await s.run(['pub1'],Array.from({length:10001},(_,i)=>`m${i}`))).ok,false);
  assert.equal(s.calls.length,0);assert.equal(s.checks.length,0);
});
test('Beklenmedik veritabanı hatasında teknik ayrıntılar kullanıcıya aktarılmaz',async()=>{
  const s=scenario({data:null,error:{code:'23514',message:'internal detail'}});const result=await s.run();
  assert.equal(result.ok,false);assert.doesNotMatch(result.hata,/internal detail/);assert.equal(s.pushes.length,0);
});
