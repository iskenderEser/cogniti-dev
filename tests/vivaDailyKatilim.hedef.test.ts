import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as crypto from "node:crypto";
import * as sozlesme from "@/lib/viva/sozlesme";
import * as eposta from "@/lib/viva/eposta";
import * as roller from "@/lib/utils/roller";
import { createVivaDailyApi, VivaDailyHatasi, vivaDailyOdaAdi } from "@/lib/viva/daily";
import { vivaKatilimHazirla, vivaKatilimBaglami, vivaDailyKisiKimligi, vivaDailyTokenAyarlari, type VivaKatilimBaglami } from "@/lib/viva/katilim";
import type { VivaDailyKatilimApi } from "@/lib/viva/daily";

const id='00000000-0000-4000-8000-000000000001', sahip='00000000-0000-4000-8000-000000000002', kisi='00000000-0000-4000-8000-000000000003';
const domain='cogniti-viva.daily.co', env={DAILY_DOMAIN:domain,DAILY_API_KEY:'sahte-api-anahtari'};
function baglam(rol:VivaKatilimBaglami['rol']='katilimci'):VivaKatilimBaglami {
 return {etkinlik_id:id,sahip_id:sahip,surum:2,kimlik:rol==='izleyici'?`davet:${kisi}`:`uye:${rol==='sunucu'?sahip:kisi}`,ad:'Sunucu kaynaklı ad',rol,
  baslangic:new Date(Date.now()-60000).toISOString(),bitis:new Date(Date.now()+3600000).toISOString(),oturum_bitis:rol==='izleyici'?new Date(Date.now()+1800000).toISOString():null,
  oda:{etkinlik_id:id,domain,oda_adi:vivaDailyOdaAdi(id),oda_id:'sahte-daily-oda',nesil:1,durum:'hazir',guncel:true,islem_suruyor:false,kapanmis:false,hata_kodu:null}};
}
function apiMock(ek:Partial<VivaDailyKatilimApi>={}) {
 let tokenSayisi=0,presenceSayisi=0;
 const api:VivaDailyKatilimApi={domain,odaHazirla:async()=>{throw Error('Beklenmeyen oda isteği');},sunucuOdada:async()=>{presenceSayisi++;return true;},tokenOlustur:async()=>{tokenSayisi++;return'sahte.token.imza';},...ek};
 return {api,sayim:()=>({tokenSayisi,presenceSayisi})};
}
function yukle<T>(path:string,modules:Record<string,unknown>):T {
 const exports:Record<string,unknown>={};
 const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:(n:string)=>{if(n in modules)return modules[n];throw Error('İzin verilmeyen test bağımlılığı: '+n);},Buffer,URL,Date,console,process,setTimeout,AbortSignal,fetch,Response});
 return exports as T;
}
function sunucuYukle(db:unknown={},user:unknown=null) {
 return yukle<typeof import('@/lib/viva/sunucu')>('lib/viva/sunucu.ts',{'node:crypto':crypto,'next/server':{NextResponse:{json:(d:unknown,i:ResponseInit)=>Response.json(d,i)}},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user},error:null})}}),createAdminClient:()=>db},'@/lib/utils/rolCozucu':{rolCozucu:async()=> 'utt'},'@/lib/utils/roller':roller,'./sozlesme':sozlesme,'./eposta':eposta});
}

test('üç rolün yetkileri korunur; ikinci katılım önizlemesi ve otomatik kayıt kapalıdır',()=>{
 for(const rol of ['sunucu','katilimci','izleyici'] as const){const d=baglam(rol),p=vivaDailyTokenAyarlari(d);
  assert.equal(p.is_owner,rol==='sunucu');assert.equal(p.permissions.canAdmin,rol==='sunucu');assert.equal(p.enable_recording_ui,rol==='sunucu');assert.equal(p.enable_recording,rol==='sunucu'?'cloud':false);assert.equal(p.permissions.canSend,rol!=='izleyici');assert.equal(p.enable_screenshare,rol!=='izleyici');assert.equal(p.permissions.canReceive.base,true);assert.equal(p.start_cloud_recording,false);assert.equal(p.auto_start_transcription,false);assert.equal(p.knocking,false);assert.equal(p.enable_prejoin_ui,false);
 }
});
test('token odası, kimliği ve süre sonu sunucu bağlamından gelir; e-posta içermez',()=>{
 const d=baglam(),p=vivaDailyTokenAyarlari(d);assert.equal(p.room_name,d.oda!.oda_adi);assert.equal(p.user_name,d.ad);assert.equal(p.user_id,vivaDailyKisiKimligi(d.kimlik));assert.equal(p.exp,Math.floor(Date.parse(d.bitis)/1000));assert.equal(p.eject_at_token_exp,true);assert.equal(JSON.stringify(p).includes(kisi),false);assert.equal(JSON.stringify(p).includes('@'),false);
});
test('Daily kimliği kullanıcı ve davet için ayrıdır; aynı kimlik sabittir',()=>{
 assert.equal(vivaDailyKisiKimligi(`uye:${kisi}`),vivaDailyKisiKimligi(`uye:${kisi}`));assert.notEqual(vivaDailyKisiKimligi(`uye:${kisi}`),vivaDailyKisiKimligi(`davet:${kisi}`));
});
test('özel davetli tokenı doğrulanmış oturum bitişini aşmaz',()=>{
 const d=baglam('izleyici');assert.equal(vivaDailyTokenAyarlari(d).exp,Math.floor(Date.parse(d.oturum_bitis!)/1000));d.oturum_bitis=new Date(Date.now()+7200000).toISOString();assert.equal(vivaDailyTokenAyarlari(d).exp,Math.floor(Date.parse(d.bitis)/1000));
});
test('sunucu istemci isteğiyle değil sahip kimliğiyle eşleşmelidir',()=>{
 for(const change of [{rol:'sunucu'},{kimlik:`uye:${sahip}`},{rol:'bilinmeyen'},{kimlik:`davet:${kisi}`},{surum:0},{ad:''},{oturum_bitis:'bozuk'},{etkinlik_id:'bozuk'}])assert.throws(()=>vivaKatilimBaglami({...baglam(),...change}));
 assert.throws(()=>vivaKatilimBaglami({...baglam('izleyici'),oturum_bitis:null}));
});
test('başlangıç öncesinde bekler; token veya presence isteği olmaz',async()=>{
 const d=baglam();d.baslangic=new Date(Date.now()+60000).toISOString();const a=apiMock();const r=await vivaKatilimHazirla({oku:async()=>d},a.api);assert.equal(r.durum,'bekliyor');assert.equal('token'in r,false);assert.deepEqual(a.sayim(),{tokenSayisi:0,presenceSayisi:0});
});
test('etkinlik veya misafir oturumu bittiğinde token üretilmez',async()=>{
 for(const d of [baglam(),baglam('izleyici')]){if(d.rol==='izleyici')d.oturum_bitis=new Date(Date.now()-1000).toISOString();else{d.baslangic=new Date(Date.now()-120000).toISOString();d.bitis=new Date(Date.now()-1000).toISOString();}const a=apiMock();await assert.rejects(vivaKatilimHazirla({oku:async()=>d},a.api),(e:unknown)=>e instanceof VivaDailyHatasi&&e.status===403);assert.equal(a.sayim().tokenSayisi,0);}
});
test('üye ve misafir sunucu yokken token veya oda adresi alamaz',async()=>{
 for(const rol of ['katilimci','izleyici'] as const){const a=apiMock({sunucuOdada:async()=>false}),d=baglam(rol);const r=await vivaKatilimHazirla({oku:async()=>d},a.api);assert.equal(r.durum,'bekliyor');assert.equal('token'in r,false);assert.equal('url'in r,false);assert.equal(a.sayim().tokenSayisi,0);}
});
test('sunucu varlığı istemci isminden değil imzalı sabit kullanıcı kimliğinden kontrol edilir',async()=>{
 const d=baglam(),a=apiMock({sunucuOdada:async(o,u)=>{assert.equal(o,d.oda!.oda_adi);assert.equal(u,vivaDailyKisiKimligi(`uye:${sahip}`));return true;}});const r=await vivaKatilimHazirla({oku:async()=>d},a.api);assert.equal(r.durum,'hazir');
});
test('sunucu hazır odanın ayarlarını token öncesinde uzlaştırır; presence beklemez ve yetki tekrar okunur',async()=>{
 let n=0;const d=baglam('sunucu'),islemler:string[]=[];
 const a=apiMock({odaHazirla:async(v)=>{islemler.push('daily');assert.equal(v.oda_adi,d.oda!.oda_adi);return{id:d.oda!.oda_id!,name:v.oda_adi,url:`https://${domain}/${v.oda_adi}`,privacy:'private',config:{}};},tokenOlustur:async()=>{islemler.push('token');return'sahte.token.imza';}});
 const r=await vivaKatilimHazirla({oku:async()=>{n++;return d;},odaDeposu:{islem:async(i)=>{islemler.push(i);return i==='ayir'?{oda:d.oda,istek:{domain,oda_adi:d.oda!.oda_adi,baslangic:d.baslangic,bitis:d.bitis,kira_anahtari:id}}:{oda:d.oda};}}},a.api);
 assert.equal(r.durum,'hazir');assert.equal(n,3);assert.equal(a.sayim().presenceSayisi,0);assert.deepEqual(islemler,['ayir','daily','tamamla','token']);
});
test('hazır odanın yeni ayarları uygulanamazsa sunucuya token verilmez',async()=>{
 const d=baglam('sunucu'),islemler:string[]=[];
 const a=apiMock({odaHazirla:async()=>{throw new VivaDailyHatasi('Ayarlar uygulanamadı');}});
 await assert.rejects(vivaKatilimHazirla({oku:async()=>d,odaDeposu:{islem:async(i)=>{islemler.push(i);return i==='ayir'?{oda:d.oda,istek:{domain,oda_adi:d.oda!.oda_adi,baslangic:d.baslangic,bitis:d.bitis,kira_anahtari:id}}:{oda:d.oda};}}},a.api),/Ayarlar uygulanamadı/);
 assert.equal(a.sayim().tokenSayisi,0);assert.deepEqual(islemler,['ayir','hata']);
});
test('oda hazır değilken katılımcı ve misafir oda oluşturamaz',async()=>{
 for(const rol of ['katilimci','izleyici'] as const){const d=baglam(rol);d.oda=null;const a=apiMock();const r=await vivaKatilimHazirla({oku:async()=>d},a.api);assert.equal(r.durum,'bekliyor');assert.equal(a.sayim().tokenSayisi,0);}
});
test('sunucu eksik odasını 2.1 lease akışından geçirir',async()=>{
 const d=baglam('sunucu');let hazir=false;const islemler:string[]=[];
 const a=apiMock({odaHazirla:async(v)=>{assert.equal(v.oda_adi,d.oda!.oda_adi);return{id:'daily',name:v.oda_adi,url:`https://${domain}/${v.oda_adi}`,privacy:'private',config:{}};}});
 const r=await vivaKatilimHazirla({oku:async()=>({...d,oda:hazir?d.oda:null}),odaDeposu:{islem:async(i)=>{islemler.push(i);if(i==='ayir')return{oda:d.oda,istek:{domain,oda_adi:d.oda!.oda_adi,baslangic:d.baslangic,bitis:d.bitis,kira_anahtari:id}};hazir=true;return{oda:d.oda};}}},a.api);
 assert.equal(r.durum,'hazir');assert.deepEqual(islemler,['ayir','tamamla']);
});
test('başka oda hazırlama işi sürerken bekler ve token üretmez',async()=>{
 const d=baglam('sunucu');d.oda!.guncel=false;const a=apiMock();const r=await vivaKatilimHazirla({oku:async()=>d,odaDeposu:{islem:async()=>({oda:d.oda,bekle:true})}},a.api);assert.equal(r.durum,'bekliyor');assert.equal(a.sayim().tokenSayisi,0);
});
test('kapalı, yanlış domain veya farklı etkinlik odası token alamaz',async()=>{
 for(const change of [{kapanmis:true},{durum:'kapali'},{domain:'other.daily.co'},{etkinlik_id:kisi},{oda_adi:vivaDailyOdaAdi(kisi)}]){const d=baglam();Object.assign(d.oda!,change);const a=apiMock();await assert.rejects(vivaKatilimHazirla({oku:async()=>d},a.api));assert.equal(a.sayim().tokenSayisi,0);}
});
test('token hazırlanırken sürüm, tarih, rol veya davet oturumu değişirse token teslim edilmez',async()=>{
 for(const change of [{surum:3},{bitis:new Date(Date.now()+7200000).toISOString()},{ad:'Değişti'}]){let n=0;const d=baglam(),a=apiMock();await assert.rejects(vivaKatilimHazirla({oku:async()=>++n===1?d:{...d,...change}},a.api),(e:unknown)=>e instanceof VivaDailyHatasi&&e.status===409);}
 let n=0;const d=baglam('izleyici'),a=apiMock();await assert.rejects(vivaKatilimHazirla({oku:async()=>++n===1?d:{...d,oturum_bitis:new Date(Date.now()+300000).toISOString()}},a.api));
});
test('son yetki okumasında erişim kalkarsa üretilmiş token dışarı çıkmaz',async()=>{
 let n=0;const d=baglam(),a=apiMock();await assert.rejects(vivaKatilimHazirla({oku:async()=>{if(++n===2)throw{code:'42501'};return d;}},a.api));assert.equal(a.sayim().tokenSayisi,1);
});
test('presence ağı başarısızsa güvenli tarafta kalır ve token üretmez',async()=>{
 const d=baglam(),a=apiMock({sunucuOdada:async()=>{throw new VivaDailyHatasi('Sunucu doğrulanamadı');}});await assert.rejects(vivaKatilimHazirla({oku:async()=>d},a.api));assert.equal(a.sayim().tokenSayisi,0);
});
test('Daily taşıması yalnız sabit APIye no-store ve redirect kapalı token POST yapar',async()=>{
 const p=vivaDailyTokenAyarlari(baglam());const calls:RequestInit[]=[];const api=createVivaDailyApi({env,fetcher:(async(u,i)=>{assert.equal(String(u),'https://api.daily.co/v1/meeting-tokens');calls.push(i!);assert.deepEqual(JSON.parse(String(i?.body)),{properties:p});return Response.json({token:'sahte.token.imza'});}) as typeof fetch});assert.equal(await api.tokenOlustur(p),'sahte.token.imza');assert.equal(calls[0].cache,'no-store');assert.equal(calls[0].redirect,'error');assert.equal(calls[0].method,'POST');assert.ok(calls[0].signal);
});
test('presence yanıtında userId ve oda eşleşir; ad veya başka kullanıcı yeterli olmaz',async()=>{
 const u=vivaDailyKisiKimligi(`uye:${sahip}`),oda=vivaDailyOdaAdi(id);
 for(const [data,expected]of [[[],false],[[{room:oda,userId:'other',userName:'Sunucu kaynaklı ad'}],false],[[{room:'other',userId:u}],false],[[{room:oda,userId:u}],true]] as const){const api=createVivaDailyApi({env,fetcher:(async(url)=>{assert.ok(String(url).endsWith(`presence?userId=${u}&limit=1`));return Response.json({total_count:data.length,data});}) as typeof fetch});assert.equal(await api.sunucuOdada(oda,u),expected);}
});
test('Daily hataları veya bozuk yanıtlar gizli bilgi sızdırmadan reddedilir',async()=>{
 for(const response of [()=>new Response('SECRET RAW BODY',{status:401}),()=>Response.json({token:'SECRET RAW BODY'}),()=>new Response('bozuk',{status:200})]){const api=createVivaDailyApi({env,fetcher:(async()=>response()) as typeof fetch});await assert.rejects(api.tokenOlustur(vivaDailyTokenAyarlari(baglam())),(e:unknown)=>e instanceof VivaDailyHatasi&&!e.message.includes('SECRET')&&!e.message.includes(env.DAILY_API_KEY));}
 const api=createVivaDailyApi({env,fetcher:(async()=>Response.json({data:{},total_count:1})) as typeof fetch});await assert.rejects(api.sunucuOdada(vivaDailyOdaAdi(id),vivaDailyKisiKimligi('x')));
});
test('yanlış kimlik ve süresi dolmuş token ayarı HTTPden önce reddedilir',async()=>{
 let n=0;const api=createVivaDailyApi({env,fetcher:(async()=>{n++;return Response.json({});}) as typeof fetch});await assert.rejects(api.sunucuOdada('evil','x'));for(const change of [{exp:0},{room_name:'evil'},{user_id:'evil'}])await assert.rejects(api.tokenOlustur({...vivaDailyTokenAyarlari(baglam()),...change}));assert.equal(n,0);
});
test('üye RPC sunucu oturumunun auth kimliğini kullanır; ziyaretçi ve geçersiz etkinlik reddedilir',async()=>{
 const calls:{name:string;p:Record<string,unknown>}[]=[];const db={rpc:async(name:string,p:Record<string,unknown>)=>{calls.push({name,p});return{data:baglam(),error:null};}};
 const server=sunucuYukle(db,{id:kisi});const m=yukle<typeof import('@/lib/viva/katilimSunucu')>('lib/viva/katilimSunucu.ts',{'server-only':{},'@/lib/supabase/server':{createAdminClient:()=>db},'./sunucu':server,'./sozlesme':sozlesme});const dep=await m.vivaUyeKatilimDeposu(id);await dep.oku();assert.equal(calls[0].p.p_auth,kisi);assert.equal(calls[0].p.p_davet_hash,null);assert.equal(calls[0].name,'viva_daily_katilim_baglam');await assert.rejects(m.vivaUyeKatilimDeposu('evil'));
 const s2=sunucuYukle(db);const m2=yukle<typeof import('@/lib/viva/katilimSunucu')>('lib/viva/katilimSunucu.ts',{'server-only':{},'@/lib/supabase/server':{createAdminClient:()=>db},'./sunucu':s2,'./sozlesme':sozlesme});await assert.rejects(m2.vivaUyeKatilimDeposu(id),(e:unknown)=>!!e&&typeof e==='object'&&'status'in e&&e.status===401);
});
test('misafir yalnız doğrulanmış cookie hashini kullanır; ham bağlantı veya boş cookie yetmez',async()=>{
 const calls:{name:string;p:Record<string,unknown>}[]=[];const db={rpc:async(name:string,p:Record<string,unknown>)=>{calls.push({name,p});return{data:baglam('izleyici'),error:null};}};const server=sunucuYukle();const m=yukle<typeof import('@/lib/viva/katilimSunucu')>('lib/viva/katilimSunucu.ts',{'server-only':{},'@/lib/supabase/server':{createAdminClient:()=>db},'./sunucu':server,'./sozlesme':sozlesme});const token='A'.repeat(43),cookie='B'.repeat(43);
 for(const o of [undefined,'bozuk'])assert.throws(()=>m.vivaMisafirKatilimDeposu(token,o));await m.vivaMisafirKatilimDeposu(token,cookie).oku();assert.equal(calls[0].p.p_auth,null);assert.equal(calls[0].p.p_etkinlik,null);assert.equal(calls[0].p.p_oturum_hash,server.vivaHash(cookie));assert.equal(calls[0].p.p_davet_hash,server.vivaHash(token));assert.equal(JSON.stringify(calls).includes(token),false);
});
test('katılım uçları GET açmaz; üye rol/domainini ve misafir gövde oturumunu yetki kaynağı saymaz',async()=>{
 const server=sunucuYukle();let hazirlama=0;let uyeId:unknown;let guestArgs:unknown[]=[];const shared={'@/lib/viva/sunucu':server,'@/lib/viva/daily':{VivaDailyHatasi},'@/lib/viva/katilim':{vivaKatilimHazirla:async()=>{hazirlama++;return{durum:'hazir',token:'sahte.token.imza'};}},'@/lib/viva/katilimSunucu':{vivaUyeKatilimDeposu:async(id:unknown)=>{uyeId=id;return{};},vivaMisafirKatilimDeposu:(...args:unknown[])=>{guestArgs=args;return{};}}};
 const u=yukle<typeof import('../app/(panel)/viva/api/katilim/route')>('app/(panel)/viva/api/katilim/route.ts',shared),g=yukle<typeof import('../app/viva/davet/[token]/katilim/route')>('app/viva/davet/[token]/katilim/route.ts',{...shared,'next/headers':{cookies:async()=>({get:()=>({value:'B'.repeat(43)})})}});
 assert.equal(u.GET,undefined);assert.equal(g.GET,undefined);
 const req=(body:unknown,origin='https://cogniti.test')=>new Request('https://cogniti.test/viva/api/katilim',{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify(body)});
 const r=await u.POST(req({etkinlik_id:id,rol:'sunucu',domain:'evil.test'}));assert.equal(r.status,200);assert.equal(uyeId,id);assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal(r.headers.get('Referrer-Policy'),'no-referrer');assert.equal((await r.json()).token,'sahte.token.imza');
 await g.POST(req({rol:'sunucu',oturum:'FORGED'}),{params:Promise.resolve({token:'A'.repeat(43)})});assert.deepEqual(guestArgs,['A'.repeat(43),'B'.repeat(43)]);
 const red=await u.POST(req({etkinlik_id:id},'https://evil.test'));assert.equal(red.status,403);assert.equal(hazirlama,2);
});
test('katılım API bekleme durumunu 202, erişim reddini 403 olarak döndürür',async()=>{
 const server=sunucuYukle();let red=false;const u=yukle<typeof import('../app/(panel)/viva/api/katilim/route')>('app/(panel)/viva/api/katilim/route.ts',{'@/lib/viva/sunucu':server,'@/lib/viva/daily':{VivaDailyHatasi},'@/lib/viva/katilim':{vivaKatilimHazirla:async()=>{if(red)throw{code:'42501'};return{durum:'bekliyor',neden:'sunucu'};}},'@/lib/viva/katilimSunucu':{vivaUyeKatilimDeposu:async()=>({})}});const req=()=>new Request('https://cogniti.test/viva/api/katilim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({etkinlik_id:id})});assert.equal((await u.POST(req())).status,202);red=true;const r=await u.POST(req());assert.equal(r.status,403);assert.equal('token'in await r.json(),false);
});

test('yayın bitişi, misafir token bitişinden ayrı ve sunucu saatiyle döner',async()=>{
 const d=baglam('izleyici'),a=apiMock();const once=Date.now();
 const r=await vivaKatilimHazirla({oku:async()=>d},a.api);assert.equal(r.durum,'hazir');
 if(r.durum!=='hazir')return;
 assert.equal(r.yayin_bitis,d.bitis);assert.equal(Date.parse(r.bitis),Math.floor(Date.parse(d.oturum_bitis!)/1000)*1000);
 assert.ok(Date.parse(r.sunucu_zamani)>=once&&Date.parse(r.sunucu_zamani)<=Date.now());
});
