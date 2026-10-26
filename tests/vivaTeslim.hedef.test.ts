import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {vivaIndirmeAcik} from '@/lib/viva/indirme';
const id='00000000-0000-4000-8000-000000000001',sid='00000000-0000-4000-8000-000000000002',oda='viva-00000000000040008000000000000001-n1';
function yukle(path:string,modules:Record<string,unknown>){const exports:Record<string,Function>={};const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,require:(n:string)=>{assert.ok(n in modules,n);return modules[n];},URL,Date,Response,console});return exports;}
class Hata extends Error{status=403;}
function kayitApi(rpc:(i:string)=>Promise<unknown>){let provider=0;const route=yukle('app/(panel)/viva/api/kayit/route.ts',{
 '@/lib/viva/sunucu':{vivaKullanici:async()=>({db:{},user:{id}}),VivaHatasi:Hata,vivaYanit:(d:unknown,s=200)=>Response.json(d,{status:s}),vivaHata:()=>Response.json({hata:'Yetki yok'},{status:403})},
 '@/lib/viva/indirme':{vivaIndirmeAcik},
 '@/lib/viva/sozlesme':{vivaUuidMu:(s:string)=>s===id},
 '@/lib/viva/daily':{VivaDailyHatasi:Hata,createVivaDailyApi:()=>{provider++;return{kayitOku:async()=>({oda_adi:oda,oturum_id:sid,durum:'hazir'}),kayitLinki:async()=>({url:'https://b.daily.co/test?Signature=secret',bitis:9999999999})};}},
 '@/lib/viva/kayitSunucu':{vivaKayitRpc:()=>rpc},
 });return{route,provider:()=>provider};}
test('yetkisiz kayıt indirmesi Daily çağrısı yapmaz',async()=>{const a=kayitApi(async()=>{throw new Hata('red');});const r=await a.route.GET(new Request(`https://cogniti.test/viva/api/kayit?etkinlik_id=${id}&id=${id}`));assert.equal(r.status,403);assert.equal(a.provider(),0);assert.equal(JSON.stringify(await r.json()).includes('Signature'),false);});
test('link üretilirken yetki kalkarsa imzalı adres dışarı verilmez',async()=>{let n=0;const a=kayitApi(async()=>{if(++n===2)throw new Hata('red');return{oda_adi:oda,oturum_id:sid};});const r=await a.route.GET(new Request(`https://cogniti.test/viva/api/kayit?etkinlik_id=${id}&id=${id}`));assert.equal(r.status,403);assert.equal(n,2);assert.equal(a.provider(),1);assert.equal(JSON.stringify(await r.json()).includes('Signature'),false);});
test('ready bildirimi dosya hazır değilse yeniden denenir; API hazır deyince tamamlanır',async()=>{
 const calls:{islem:string;veri:Record<string,unknown>}[]=[];let hazir=false,alinan=false;
 const db={rpc:async(_fn:string,p:{p_islem:string;p_veri:Record<string,unknown>})=>{calls.push({islem:p.p_islem,veri:p.p_veri});let data:unknown={};if(p.p_islem==='olay_ayir'){data=alinan?null:{anahtar:'a',kira:'k',domain:'cogniti-viva.daily.co',tur:'recording.ready-to-download',veri:{recording_id:id}};alinan=true;}if(p.p_islem==='oda')data={etkinlik_id:id,nesil:1};if(p.p_islem==='tarama_ayir')data=null;return{data,error:null};}};
 const m=yukle('lib/viva/kayitSunucu.ts',{'server-only':{},'@/lib/supabase/server':{createAdminClient:()=>db},'./daily':{VivaDailyHatasi:Hata},'./yasam':{},'./yasamSunucu':{}});
 const api={domain:'cogniti-viva.daily.co',kayitOku:async()=>({id,oda_adi:oda,oturum_id:sid,baslangic:1700000000,durum:hazir?'hazir':'kaydediliyor',sure:10})};
 await m.vivaKayitMutabakat(db,api);assert.ok(calls.some(c=>c.islem==='olay_hata'));assert.ok(!calls.some(c=>c.islem==='olay_tamam'));
 calls.length=0;alinan=false;hazir=true;await m.vivaKayitMutabakat(db,api);assert.ok(calls.some(c=>c.islem==='olay_tamam'));assert.equal(calls.find(c=>c.islem==='esle')!.veri.durum,'hazir');
});
