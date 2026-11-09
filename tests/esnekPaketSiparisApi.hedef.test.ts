import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {partnerJsonOku,partnerYanit} from '@/lib/agora/partnerHttp';
import {esnekPaketSiparisIstegiGecerli} from '@/lib/satinAlma/esnekPaket';
import {firmaAdminIstegiIzinliMi} from '@/lib/admin/firmaAdminErisimi';
const body={tokenAdedi:2500,tarifeSurumu:7,birimFiyat:8.5,islemAnahtari:'00000000-0000-4000-8000-000000000001',hesapTuru:'kisisel'};
function setup(){
 const calls:unknown[][]=[];const state={sonuc:{ok:true,siparisId:body.islemAnahtari} as Record<string,unknown>};const exports={} as {POST:(request:Request)=>Promise<Response>};
 const deps:Record<string,unknown>={
  '@/lib/agora/partnerHttp':{partnerJsonOku,partnerYanit},
  '@/lib/satinAlma/esnekPaket':{esnekPaketSiparisIstegiGecerli},
  '@/lib/satinAlma/esnekPaketSunucu':{esnekPaketSiparisiOlustur:async(...args:unknown[])=>{calls.push(args);return state.sonuc;}},
 };
 vm.runInNewContext(ts.transpileModule(readFileSync('app/api/satin-alma/esnek-paket/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:(n:string)=>deps[n]??assert.fail(n)});
 return {calls,state,post:(veri:unknown=body,origin='http://localhost',type='application/json')=>exports.POST(new Request('http://localhost/api/satin-alma/esnek-paket',{method:'POST',headers:{origin,'content-type':type},body:JSON.stringify(veri)}))};
}
test('sipariş route onaylanan hesapla sunucuya bağlanır, kimlik kabul etmez',async()=>{
 const s=setup();const r=await s.post();assert.equal(r.status,200);assert.match(r.headers.get('cache-control')??'',/no-store/);
 assert.equal(s.calls[0][1],'kisisel');assert.equal(Object.keys(s.calls[0][0] as object).length,4);
 for(const v of [{...body,firmaId:'x'},{...body,hesapTuru:'other'},{...body,tokenAdedi:1}])assert.equal((await s.post(v)).status,400);
 assert.equal(s.calls.length,1);
});
test('köken, içerik ve boyut kapıları sipariş yaratmaz',async()=>{
 const s=setup();assert.equal((await s.post(body,'https://foreign.example')).status,403);
 assert.equal((await s.post(body,'http://localhost','text/plain')).status,415);
 assert.equal((await s.post({...body,uzun:'x'.repeat(5000)})).status,413);assert.equal(s.calls.length,0);
});
test('sunucu başarısızlıkları başarıya dönüştürülmez',async()=>{
 const s=setup();for(const status of [400,401,403,409,503]){s.state.sonuc={ok:false,status,hata:'test'};assert.equal((await s.post()).status,status);}
});
test('firma admini yalnız esnek sipariş POST ucuna erişir',()=>{
 const p=new URLSearchParams();const path='/api/satin-alma/esnek-paket';
 assert.equal(firmaAdminIstegiIzinliMi(path,'POST',p,'firma'),true);
 for(const method of ['GET','DELETE','PATCH','PUT'])assert.equal(firmaAdminIstegiIzinliMi(path,method,p,'firma'),false);
 assert.equal(firmaAdminIstegiIzinliMi('/api/satin-alma/abonelik','POST',p,'firma'),false);
});
