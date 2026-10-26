import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createVivaDailyApi, vivaDailyAyar, vivaDailyOdaAdi, vivaDailyOdaAyarlari, VivaDailyHatasi, type VivaDailyApi } from "@/lib/viva/daily";
import { vivaDailyOdaHazirla, type VivaOdaDeposu } from "@/lib/viva/oda";
import * as odaModul from "@/lib/viva/oda";
import * as dailyModul from "@/lib/viva/daily";
import * as sozlesme from "@/lib/viva/sozlesme";
import { VivaHatasi, vivaGirdi, vivaHata, vivaYanit } from "@/lib/viva/sunucu";

const id="00000000-0000-4000-8000-000000000001", kira="00000000-0000-4000-8000-000000000002";
const env={DAILY_DOMAIN:"cogniti-viva.daily.co",DAILY_API_KEY:"yalniz-sahte-test-anahtari"};
const v={domain:env.DAILY_DOMAIN,oda_adi:vivaDailyOdaAdi(id),baslangic:new Date(Date.now()+3600000).toISOString(),bitis:new Date(Date.now()+7200000).toISOString()};
const oda=()=>({id:"daily-sentetik-oda",name:v.oda_adi,url:`https://${v.domain}/${v.oda_adi}`,privacy:"private" as const,config:vivaDailyOdaAyarlari(v)});
const durum=()=>({etkinlik_id:id,domain:v.domain,oda_adi:v.oda_adi,oda_id:null,nesil:1,durum:"hazirlaniyor",guncel:false,islem_suruyor:true,kapanmis:false,hata_kodu:null});
const claim=()=>({oda:durum(),istek:{...v,kira_anahtari:kira}});
function tasima(handler:(url:string,init:RequestInit)=>Response|Promise<Response>){const calls:{url:string;init:RequestInit}[]=[];const api=createVivaDailyApi({env,fetcher:(async(url,init)=>{calls.push({url:String(url),init:init!});return handler(String(url),init!);}) as typeof fetch});return{api,calls};}
const ok=(data:unknown)=>Response.json(data);

test('Daily ayarları eksik, dış domain veya örnek anahtar olduğunda kapalı kalır',()=>{
 for(const e of [{},{...env,DAILY_DOMAIN:'cogniti-viva.daily.co.evil.test'},{...env,DAILY_DOMAIN:'https://cogniti-viva.daily.co'},{...env,DAILY_API_KEY:'buraya_kopyaladigin_anahtar'}])assert.throws(()=>vivaDailyAyar(e));
 assert.equal(vivaDailyAyar(env).domain,env.DAILY_DOMAIN);
});
test('oda adı etkinlik ve nesille sabittir; geçersiz kimlik kabul edilmez',()=>{
 assert.equal(vivaDailyOdaAdi(id),vivaDailyOdaAdi(id));assert.notEqual(vivaDailyOdaAdi(id,2),v.oda_adi);
 for(const n of [0,-1,1.5])assert.throws(()=>vivaDailyOdaAdi(id,n));assert.throws(()=>vivaDailyOdaAdi('hata'));
});
test('geçerli özel oda tekrar oluşturulmaz; anahtar sabit Daily API dışında gönderilmez',async()=>{
 const o=tasima(()=>ok(oda()));const a=await o.api.odaHazirla(v);const b=await o.api.odaHazirla(v);
 assert.equal(a.id,b.id);assert.equal(o.calls.length,2);
 for(const c of o.calls){assert.equal(c.url,`https://api.daily.co/v1/rooms/${v.oda_adi}`);assert.equal(c.init.method,'GET');assert.equal(c.init.redirect,'error');assert.equal(c.init.cache,'no-store');assert.ok(c.init.signal);}
});
test('olmayan oda private oluşturulur ve kayıt otomatik başlatılmaz',async()=>{
 let varMi=false;const o=tasima((_u,i)=>{if(i.method==='POST'){const b=JSON.parse(String(i.body));assert.equal(b.privacy,'private');assert.equal(b.name,v.oda_adi);assert.equal(b.properties.enable_knocking,false);assert.equal('start_cloud_recording' in b.properties,false);varMi=true;return ok(oda());}return varMi?ok(oda()):new Response(null,{status:404});});
 await o.api.odaHazirla(v);assert.deepEqual(o.calls.map(c=>c.init.method),['GET','POST','GET']);
});
test('oda oluşturma yarışı 409 olduğunda var olan oda okunarak toparlanır',async()=>{
 let n=0;const o=tasima((_u,i)=>i.method==='POST'?new Response(null,{status:409}):++n===1?new Response(null,{status:404}):ok(oda()));
 assert.equal((await o.api.odaHazirla(v)).id,oda().id);assert.equal(o.calls.length,3);
});
test('başka 400 hatası var olmayan oda gibi başarılı sayılmaz',async()=>{
 const o=tasima((_u,i)=>new Response(null,{status:i.method==='POST'?400:404}));await assert.rejects(o.api.odaHazirla(v),VivaDailyHatasi);
});
test('public veya başka domainli oda sessizce sahiplenilmez',async()=>{
 for(const ek of [{privacy:'public'},{url:`https://other.daily.co/${v.oda_adi}`}]){
  const o=tasima(()=>ok({...oda(),...ek}));await assert.rejects(o.api.odaHazirla(v),/eşleşmiyor/);assert.equal(o.calls.length,1);
 }
});
test('tarih değişikliğinde aynı odaya yeni zamanlar uygulanır ve geri okunur',async()=>{
 const yeni={...v,bitis:new Date(Date.parse(v.bitis)+3600000).toISOString()};let config=oda().config;
 const o=tasima((_u,i)=>{if(i.method==='POST'){config=JSON.parse(String(i.body)).properties;return ok({...oda(),config});}return ok({...oda(),config});});
 const sonuc=await o.api.odaHazirla(yeni);assert.equal(sonuc.config.exp,Math.ceil(Date.parse(yeni.bitis)/1000));assert.equal(sonuc.id,oda().id);assert.deepEqual(o.calls.map(c=>c.init.method),['GET','POST','GET']);
});
test('hazır eski odanın eksik veya kapalı ek özellikleri aynı odada açılıp doğrulanır',async()=>{
 for(const onceki of [undefined,false]){
  let config:Record<string,unknown>={...oda().config};
  const ekOzellikler=['enable_video_processing_ui','enable_breakout_rooms','enable_pip_ui','enable_emoji_reactions'] as const;
  for(const k of ekOzellikler){if(onceki===undefined)delete config[k];else config[k]=onceki;}
  const o=tasima((_u,i)=>{
   if(i.method==='POST'){
    const b=JSON.parse(String(i.body));assert.equal(b.privacy,'private');
    for(const k of ekOzellikler)assert.equal(b.properties[k],true,k);
    assert.equal(b.properties.enable_screenshare,true);assert.equal(b.properties.enable_knocking,false);
    config=b.properties;
   }
   return ok({...oda(),config});
  });
  const sonuc=await o.api.odaHazirla(v);
  assert.equal(sonuc.id,oda().id);assert.deepEqual(o.calls.map(c=>c.init.method),['GET','POST','GET']);
  for(const k of ekOzellikler)assert.equal(sonuc.config[k],true,k);
 }
});
test('sağlayıcı ayarı uygulamadıysa eşleşme başarılı sayılmaz',async()=>{
 const o=tasima(()=>ok({...oda(),config:{}}));await assert.rejects(o.api.odaHazirla(v),/henüz eşleşmedi/);
});
test('geçersiz isim, domain veya tarih Daily isteği yapmadan reddedilir',async()=>{
 const o=tasima(()=>{throw Error('Beklenmiyor');});for(const ek of [{domain:'other.daily.co'},{oda_adi:'../secret'},{bitis:v.baslangic},{bitis:'hata'},{baslangic:'2000-01-01',bitis:'2000-01-02'}])await assert.rejects(o.api.odaHazirla({...v,...ek}));assert.equal(o.calls.length,0);
});
test('ağ, 401 ve bozuk yanıt hatası anahtarı veya ham sağlayıcı mesajını açmaz',async()=>{
 const kaynaklar=[()=>{throw Error(env.DAILY_API_KEY);},()=>new Response(env.DAILY_API_KEY,{status:401}),()=>new Response(env.DAILY_API_KEY,{status:200})];
 for(const h of kaynaklar){const o=tasima(h);try{await o.api.odaHazirla(v);assert.fail('Hata bekleniyordu');}catch(e){assert.ok(e instanceof VivaDailyHatasi);assert.equal(e.message.includes(env.DAILY_API_KEY),false);}}
});
test('aktif oda işi varken ikinci işlem Daily çağrısı yapmaz ve kira anahtarını dönmez',async()=>{
 let c=0;const api:VivaDailyApi={domain:v.domain,odaHazirla:async()=>{c++;return oda();}};
 const sonuc=await vivaDailyOdaHazirla({islem:async()=>({...claim(),bekle:true})},api);assert.equal(sonuc.bekle,true);assert.equal(c,0);assert.equal('istek' in sonuc,false);assert.equal(JSON.stringify(sonuc).includes(kira),false);
});
test('sağlayıcı başarısı yalnız geçerli DB tamamlama sonucuyla hazır olur',async()=>{
 const calls:{islem:string;veri?:Record<string,unknown>}[]=[];
 const depo:VivaOdaDeposu={islem:async(islem,veri)=>{calls.push({islem,veri});return islem==='ayir'?claim():{oda:{...durum(),oda_id:oda().id,durum:'hazir',guncel:true,islem_suruyor:false}};}};
 const sonuc=await vivaDailyOdaHazirla(depo,{domain:v.domain,odaHazirla:async()=>oda()});assert.equal(sonuc.oda?.guncel,true);assert.deepEqual(calls.map(x=>x.islem),['ayir','tamamla']);assert.equal(calls[1].veri?.kira_anahtari,kira);assert.equal(calls[1].veri?.oda_id,oda().id);assert.equal(JSON.stringify(sonuc).includes(kira),false);
});
test('Daily hatasında iş kiraya bağlı hata kaydıyla bırakılır',async()=>{
 const calls:{islem:string;veri?:Record<string,unknown>}[]=[];const depo:VivaOdaDeposu={islem:async(islem,veri)=>{calls.push({islem,veri});return claim();}};
 await assert.rejects(vivaDailyOdaHazirla(depo,{domain:v.domain,odaHazirla:async()=>{throw new VivaDailyHatasi('Kesildi','AG_HATASI');}}),/Kesildi/);assert.deepEqual(calls.map(x=>x.islem),['ayir','hata']);assert.equal(calls[1].veri?.hata_kodu,'AG_HATASI');
});
test('Daily başarılı ama DB sonucu kaybolduğunda tamamlandı denmez; yeniden deneme aynı oda kimliğini korur',async()=>{
 let kayip=true;let claims=0;const ids:string[]=[];
 const depo:VivaOdaDeposu={islem:async(islem,veri)=>{if(islem==='ayir'){claims++;return claim();}if(islem==='tamamla'){ids.push(String(veri?.oda_id));if(kayip)throw Error('DB yanıtı kayıp');return{oda:{...durum(),oda_id:oda().id,durum:'hazir',guncel:true}};}return{oda:durum()};}};
 const api={domain:v.domain,odaHazirla:async()=>oda()};await assert.rejects(vivaDailyOdaHazirla(depo,api),/yanıtı kayıp/);kayip=false;assert.equal((await vivaDailyOdaHazirla(depo,api)).oda?.guncel,true);assert.equal(claims,2);assert.deepEqual(ids,[oda().id,oda().id]);
});
test('iş sürerken etkinlik değişirse eski sağlayıcı başarısı 409 ile reddedilir',async()=>{
 const depo:VivaOdaDeposu={islem:async(islem)=>islem==='ayir'?claim():islem==='tamamla'?{hata:'Etkinlik değişti',status:409}:{oda:durum()}};
 await assert.rejects(vivaDailyOdaHazirla(depo,{domain:v.domain,odaHazirla:async()=>oda()}),(e:unknown)=>e instanceof VivaDailyHatasi&&e.status===409);
});
test('geçersiz kira veya domainli depo yanıtı sağlayıcıya ulaşmaz',async()=>{
 let n=0;for(const ek of [{domain:'other.daily.co'},{kira_anahtari:'hata'}]){await assert.rejects(vivaDailyOdaHazirla({islem:async()=>({...claim(),istek:{...claim().istek,...ek}})},{domain:v.domain,odaHazirla:async()=>{n++;return oda();}}));}assert.equal(n,0);
});

function apiOrtami(auth=true,yetki=true) {
 const rpc:string[]=[];let daily=0;
 const modules:Record<string,unknown>={
  '@/lib/viva/sunucu':{VivaHatasi,vivaGirdi,vivaHata,vivaYanit,vivaKullanici:async()=>{if(!auth)throw new VivaHatasi('Oturum açmanız gerekiyor.',401);return{user:{id},db:{rpc:async(_name:string,p:{p_auth:string;p_islem:string;p_veri:Record<string,unknown>})=>{rpc.push(p.p_islem);assert.equal(p.p_auth,id);if(!yetki)return{error:{code:'42501'},data:null};return{error:null,data:p.p_islem==='ayir'?claim():{oda:durum()}};}}};}},
  '@/lib/viva/sozlesme':sozlesme,'@/lib/viva/daily':dailyModul,
  '@/lib/viva/oda':{...odaModul,vivaDailyOdaHazirla:(d:VivaOdaDeposu)=>vivaDailyOdaHazirla(d,{domain:v.domain,odaHazirla:async()=>{daily++;return oda();}})},
 };
 const exports:Record<string,(r:Request)=>Promise<Response>>={};const code=ts.transpileModule(readFileSync('app/(panel)/viva/api/oda/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:(n:string)=>{assert.ok(n in modules,n);return modules[n];},URL});return{exports,rpc,daily:()=>daily};
}
const req=(extra:Record<string,unknown>={},origin='https://cogniti.test')=>new Request('https://cogniti.test/viva/api/oda',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({etkinlik_id:id,...extra})});
test('oda API kimliksiz veya sahibi olmayan kişiyi Daily çağrısı yapmadan reddeder',async()=>{
 for(const [auth,yetki,status]of[[false,true,401],[true,false,403]]as const){const o=apiOrtami(auth,yetki);assert.equal((await o.exports.POST(req())).status,status);assert.equal(o.daily(),0);}
});
test('oda API yabancı origin ve bozuk kimliği depo/sağlayıcı çağrısı yapmadan reddeder',async()=>{
 for(const r of[req({},'https://other.test'),req({etkinlik_id:'hata'})]){const o=apiOrtami();assert.ok((await o.exports.POST(r)).status>=400);assert.equal(o.rpc.length,0);assert.equal(o.daily(),0);}
});
test('oda API domaini istemciden almaz; GET yalnız eşleştirme durumunu okur',async()=>{
 const o=apiOrtami();assert.equal((await o.exports.POST(req({domain:'evil.test'}))).status,200);assert.equal(o.daily(),1);
 assert.equal((await o.exports.GET(new Request(`https://cogniti.test/viva/api/oda?etkinlik_id=${id}`))).status,200);assert.equal(o.rpc.at(-1),'durum');assert.equal(o.daily(),1);
});

test('Daily varsayılan true ekran paylaşımını config yanıtında atladığında gereksiz güncelleme yapılmaz',async()=>{
 const config:Record<string,unknown>={...oda().config};delete config.enable_screenshare;
 const o=tasima(()=>ok({...oda(),config}));await o.api.odaHazirla(v);assert.equal(o.calls.length,1);assert.equal(o.calls[0].init.method,'GET');
});
