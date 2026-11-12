import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
import {vivaAlimTutari,vivaAlimToplamlari,vivaAlimDonemiGecerli,type VivaAlimSatiri} from '@/lib/satinAlma/vivaAlimlari';
import {firmaAdminIstegiIzinliMi} from '@/lib/admin/firmaAdminErisimi';
import {partnerYanit} from '@/lib/agora/partnerHttp';import {uuidGecerliMi} from '@/lib/uretim/rpcTemel';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
test('kişi-saniye TLye çevrilir; token yuvarlaması kullanılmaz; aylık KDV toplamdan hesaplanır',()=>{
 assert.deepEqual(vivaAlimTutari(100*60*60,.004,55,1.5),{birim_fiyat:.33,tutar:1980});
 assert.deepEqual(vivaAlimTutari(1,.004,55,1.5),{birim_fiyat:.33,tutar:.01});
 assert.deepEqual(vivaAlimToplamlari([{tutar:.03},{tutar:.03}] as VivaAlimSatiri[]),{toplam_tutar:.06,kdv:.01,genel_tutar:.07});
 for(const n of [-1,NaN,Infinity])assert.throws(()=>vivaAlimTutari(n,.004,55,1.5));
 assert.equal(vivaAlimDonemiGecerli('2026-13'),false);
});
function setup(){
 const s={allowed:true,foreign:false,badPrice:false,many:false,secondMonth:false};const calls:{table:string;filters:Record<string,unknown>;range?:number[]}[]=[];
 const db={from(table:string){const call={table,filters:{} as Record<string,unknown>,range:undefined as number[]|undefined};calls.push(call);
 const q={select(){return q;},eq(k:string,v:unknown){call.filters[k]=v;return q;},gt(k:string,v:unknown){call.filters[k]=v;return q;},order(){return q;},range(a:number,b:number){call.range=[a,b];return q;},in(k:string,v:unknown){call.filters[k]=v;return q;},then(resolve:(v:unknown)=>unknown){
 if(table==='kullanicilar')return Promise.resolve({data:[{kullanici_id:id(2),ad:'Merve',soyad:'Duran'}],error:null}).then(resolve);
 const count=s.many?(call.range?.[0]===0?500:1):s.secondMonth?2:1;
 return Promise.resolve({data:Array.from({length:count},(_,i)=>({etkinlik_id:id(100+(call.range?.[0]??0)+i),sahip_id:id(2),firma_id:s.foreign?id(9):id(1),donem:s.secondMonth&&i===1?'2026-10-01':'2026-11-01',toplam_saniye:600,katilim_sayisi:2,usd_dakika:s.badPrice?null:.004,kur:55,katsayi:1.5,etkinlik:{baslik:'Viva Örneği',baslangic:'2026-11-10T12:00:00Z',firma_id:id(1)}})),error:null}).then(resolve);
 }};return q;}};
 const exports:{GET?:(r:Request,c:unknown)=>Promise<Response>}={};
 const deps:Record<string,unknown>={'@/lib/admin/firmaYonetimOkuma':{firmaYonetimOkumaKontrol:async()=>s.allowed?{gecerli:true}:{gecerli:false,yanit:Response.json({}, {status:403})}},'@/lib/supabase/server':{createAdminClient:()=>db},'@/lib/agora/partnerHttp':{partnerYanit},'@/lib/uretim/rpcTemel':{uuidGecerliMi},'@/lib/satinAlma/vivaAlimlari':{vivaAlimDonemiGecerli,vivaAlimTutari,vivaAlimToplamlari}};
 vm.runInNewContext(ts.transpileModule(readFileSync('app/admin/api/firmalar/[firma_id]/viva-alimlari/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,AbortSignal,Error,Map,Set,Number,require:(n:string)=>deps[n]??assert.fail(n)});
 return {s,calls,get:(q='')=>exports.GET!(new Request('http://localhost/admin/api/firmalar/'+id(1)+'/viva-alimlari'+q),{params:Promise.resolve({firma_id:id(1)})})};
}
test('firma kapsamı hem kullanımda hem isim sorgusunda korunur; tutarlar doğru döner',async()=>{
 const {calls,get}=setup();const r=await get();assert.equal(r.status,200);const d=await r.json();assert.equal(d.belgeler[0].satirlar.length,1);assert.equal(d.belgeler[0].satirlar[0].duzenleyen,'Merve Duran');assert.equal(d.belgeler[0].satirlar[0].tutar,3.3);assert.equal(d.belgeler[0].kdv,.66);
 assert.equal(calls[0].filters.firma_id,id(1));assert.equal(calls[0].filters['etkinlik.firma_id'],id(1));assert.equal(calls[0].filters.donem,undefined);assert.equal(calls[0].filters.durum,'tamam');assert.equal(calls[1].filters.firma_id,id(1));
});
test('500 satır sınırı sonraki sayfayı kesmez',async()=>{const t=setup();t.s.many=true;const r=await t.get();assert.equal(r.status,200);assert.equal((await r.json()).belgeler[0].satirlar.length,501);assert.equal(t.calls.filter(c=>c.table==='cogniti_viva_tuketim_isleri').length,2);});
test('yetkisiz istek, bozuk arama, yanlış firma ve eksik fiyat reddedilir',async()=>{
 const t=setup();t.s.allowed=false;assert.equal((await t.get()).status,403);assert.equal(t.calls.length,0);t.s.allowed=true;
 for(const q of ['?q='+ 'a'.repeat(81),'?q=a&q=b'])assert.equal((await t.get(q)).status,400);
 t.s.foreign=true;assert.equal((await t.get()).status,503);t.s.foreign=false;t.s.badPrice=true;assert.equal((await t.get()).status,503);
});
test('firma admini yalnız kendi Viva alımını okuyabilir; yazma yolu açılmaz',()=>{
 const yol=`/admin/api/firmalar/${id(1)}/viva-alimlari`;
 for(const method of ['GET','HEAD'])assert.equal(firmaAdminIstegiIzinliMi(yol,method,new URLSearchParams(),id(1)),true);
 for(const method of ['POST','PUT','DELETE'])assert.equal(firmaAdminIstegiIzinliMi(yol,method,new URLSearchParams(),id(1)),false);
 assert.equal(firmaAdminIstegiIzinliMi(yol,'GET',new URLSearchParams(),id(2)),false);
});

test('ay seçimi olmadan tüm aylar ayrı belgelerde ve ayrı toplamlarla döner; standart arama uygulanır',async()=>{
 const t=setup();t.s.secondMonth=true;const r=await t.get();const d=await r.json();assert.equal(d.belgeler.length,2);
 assert.deepEqual(d.belgeler.map((b:{donem:string})=>b.donem),['2026-11','2026-10']);
 assert.equal(d.belgeler[0].toplam_tutar,3.3);assert.equal(d.belgeler[1].toplam_tutar,3.3);
 assert.equal((await (await t.get('?q=MERVE')).json()).belgeler.length,2);
 assert.equal((await (await t.get('?q=bulunmayan')).json()).belgeler.length,0);
});
