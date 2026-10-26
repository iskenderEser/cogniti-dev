import assert from 'node:assert/strict';
import test from 'node:test';
import {createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {vivaWebhookDogrula,vivaWebhookOlayi} from '@/lib/viva/webhook';
import {createVivaDailyApi,type VivaDailyYasamApi} from '@/lib/viva/daily';
import {vivaYasamMutabakat} from '@/lib/viva/yasam';
import {vivaDailyTokenAyarlari,type VivaKatilimBaglami} from '@/lib/viva/katilim';
const secret=Buffer.alloc(32,7).toString('base64'), timestamp=String(Math.floor(Date.now()/1000));
const imza=(o:unknown)=>createHmac('sha256',Buffer.from(secret,'base64')).update(`${timestamp}.${JSON.stringify(o)}`).digest('base64');
const domain='cogniti-viva.daily.co',oda='viva-00000000000040008000000000000001-n1',id='00000000-0000-4000-8000-000000000001',sid='00000000-0000-4000-8000-000000000002';
test('HMAC ilk testi doğrular; değiştirilmiş içerik ve eski zaman reddedilir',()=>{
 const o={test:'test'};assert.ok(vivaWebhookDogrula(o,timestamp,imza(o),secret));
 assert.equal(vivaWebhookDogrula({test:'farkli'},timestamp,imza(o),secret),false);
 assert.equal(vivaWebhookDogrula(o,timestamp,imza(o),secret,Date.now()+600000),false);
 assert.equal(vivaWebhookDogrula(o,timestamp,null,secret),false);
});
test('katılımcı oturumu tekrar teslimi tekildir; özel alanlar saklanmaz',()=>{
 const p={room:oda,session_id:sid,user_name:'Gizli',userData:{eposta:'gizli'},share_token:'gizli'};
 const a=vivaWebhookOlayi({id:'ilk',type:'participant.joined',payload:p})!;
 const b=vivaWebhookOlayi({id:'ikinci',type:'participant.joined',payload:p})!;
 assert.equal(a.anahtar,b.anahtar);assert.deepEqual(Object.keys(a.veri).sort(),['room','session_id']);
 assert.notEqual(a.anahtar,vivaWebhookOlayi({id:'ucuncu',type:'participant.left',payload:p})!.anahtar);
});
test('webhook ilk testi DB çağırmaz; gerçek olay kalıcı yazılamazsa 503 döner',async()=>{
 let writes=0,fail=false;const exports:Record<string,(r:Request)=>Promise<Response>>={};
 const modules:Record<string,unknown>={
  '@/lib/viva/webhook':{vivaWebhookDogrula:(o:unknown,t:string,s:string)=>vivaWebhookDogrula(o,t,s,secret),vivaWebhookOlayi},
  '@/lib/viva/daily':{vivaDailyAyar:()=>({domain})},
  '@/lib/supabase/server':{createAdminClient:()=>({rpc:async()=>{writes++;return {error:fail?{}:null};}})},
 };
 const code=ts.transpileModule(readFileSync('app/api/viva/daily-webhook/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:(n:string)=>{assert.ok(n in modules,n);return modules[n];},Buffer,Response});
 const req=(o:unknown,s=imza(o))=>new Request('https://test/api/viva/daily-webhook',{method:'POST',headers:{'x-webhook-timestamp':timestamp,'x-webhook-signature':s},body:JSON.stringify(o)});
 assert.equal((await exports.POST(req({test:'test'}))).status,200);assert.equal(writes,0);
 assert.equal((await exports.POST(req({test:'test'},'x'))).status,401);assert.equal(writes,0);
 const o={id:'ready',type:'recording.ready-to-download',payload:{recording_id:id,room_name:oda}};
 fail=true;assert.equal((await exports.POST(req(o))).status,503);assert.equal(writes,1);
 fail=false;assert.equal((await exports.POST(req(o))).status,200);assert.equal(writes,2);
});
test('kayıt API oturum/oda eşleştirir; erişim linki süreli ve HTTPS olur',async()=>{
 const urls:string[]=[];let yanlis=false;
 const api=createVivaDailyApi({env:{DAILY_DOMAIN:domain,DAILY_API_KEY:'test'},fetcher:(async(u:unknown)=>{
  const url=String(u);urls.push(url);return Response.json(url.includes('access-link')?{download_link:yanlis?'https://evil.test/a':'https://b.daily.co/kayit?Signature=test',expires:Math.floor(Date.now()/1000)+60}:url.includes('/meetings/')?{id:sid,room:oda}:{id,mtgSessionId:sid,start_ts:1700000000,status:'finished',duration:40,share_token:'saklanmaz'});
 }) as typeof fetch});
 const k=await api.kayitOku(id);assert.equal(k.oda_adi,oda);assert.equal(k.oturum_id,sid);assert.equal(k.durum,'hazir');assert.ok(!('share_token' in k));
 assert.ok((await api.kayitLinki(id)).url.startsWith('https://b.daily.co/'));yanlis=true;await assert.rejects(api.kayitLinki(id));
 assert.ok(urls.some(u=>u.endsWith(`/meetings/${sid}`)));
});
test('kapanışta kayıt durmadan oda kapatılmaz; hata kalıcı işte yeniden denenir',async()=>{
 const calls:string[]=[];let fail=false;
 const api={domain,kayitDurdur:async()=>{calls.push('stop');if(fail)throw Error('stop');},erisimEngelle:async()=>{calls.push('ban');},odaKapat:async()=>{calls.push('close');}} as unknown as VivaDailyYasamApi;
 const rpc=async(i:string)=>{calls.push(i);return i==='ayir'?{domain,oda_adi:oda,user_ids:[],kapat:true,kira:'k'}:{};};
 await vivaYasamMutabakat(rpc,api);assert.deepEqual(calls,['ayir','stop','ban','close','tamamla']);
 calls.length=0;fail=true;await assert.rejects(vivaYasamMutabakat(rpc,api));assert.deepEqual(calls,['ayir','stop','hata']);
});
test('yalnız sunucu cloud kayıt yetkisi alır; otomatik başlangıç her rolde kapalıdır',()=>{
 const d={baslangic:new Date(Date.now()-60000).toISOString(),bitis:new Date(Date.now()+60000).toISOString(),oturum_bitis:null,kimlik:`uye:${id}`,ad:'Test',oda:{guncel:true,kapanmis:false,oda_adi:oda}};
 for(const rol of ['sunucu','katilimci','izleyici'] as const){const a=vivaDailyTokenAyarlari({...d,rol} as VivaKatilimBaglami);assert.equal(a.enable_recording,rol==='sunucu'?'cloud':false);assert.equal(a.enable_recording_ui,false);assert.equal(a.start_cloud_recording,false);}
});
