import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import type {DailyCall} from '@daily-co/daily-js';
import {vivaKaliciAnketBagla,type VivaAnketArsivi} from '@/lib/viva/anketArsiv';
import {vivaAnketTaslagi,type VivaAnketDurumu} from '@/lib/viva/anket';
const id='00000000-0000-4000-8000-000000000001';
const aktif={soru:{id,question:'Konu?',options:['A','B']},acik:true,sayilar:[0,1],secim:null,surum:2,acildi:'2026-10-25T10:00:00Z',kapandi:null};
function call(owner:boolean){const events=new Map<string,Function>(),sent:unknown[]=[];return{events,sent,api:{participants:()=>({local:{local:true,owner,session_id:'local'},host:{owner:true,session_id:'host'}}),on:(s:string,f:Function)=>events.set(s,f),off:(s:string)=>events.delete(s),sendAppMessage:(d:unknown)=>sent.push(d)} as unknown as DailyCall};}
const tick=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
test('yeniden bağlanan yayıncı açık soruyu ve kalıcı sayıları geri alır',async()=>{
 const a=call(true),states:VivaAnketDurumu[]=[];const c=vivaKaliciAnketBagla(a.api,'sunucu',d=>states.push(d),{istek:async()=>({aktif}),hata:()=>assert.fail('hata')});
 try{a.events.get('joined-meeting')!();await tick();assert.deepEqual(states.at(-1)?.sayilar,[0,1]);assert.equal(states.at(-1)?.soru?.id,id);assert.ok(a.sent.length>0);}finally{c.temizle();}
});
test('kayıt başarılı olmadan soru Daily üzerinden yayınlanmaz; hata sessizce belleğe düşmez',async()=>{
 const a=call(true);let resolve!:(d:VivaAnketArsivi)=>void;
 const c=vivaKaliciAnketBagla(a.api,'sunucu',()=>{},{istek:()=>new Promise(r=>{resolve=r;}),hata:()=>{}});
 try{const p=c.ac({id,question:'Konu?',options:['A','B']});assert.equal(a.sent.length,0);resolve({aktif});await p;assert.equal(a.sent.length,1);}finally{c.temizle();}
 const b=call(true),d=vivaKaliciAnketBagla(b.api,'sunucu',()=>{},{istek:async()=>{throw Error('DB yazılamadı');},hata:()=>{}});
 try{await assert.rejects(d.ac({id,question:'Konu?',options:['A','B']}),/DB yazılamadı/);assert.equal(b.sent.length,0);}finally{d.temizle();}
});
test('cevap kalıcı APIye gider; onay ve yeniden açılıştaki seçim sunucu kaydından gelir',async()=>{
 const a=call(false),states:VivaAnketDurumu[]=[];let secim:number|null=null;const calls:string[]=[];
 const depo={istek:async(is:string,p?:Record<string,unknown>)=>{calls.push(is);if(is==='cevap')secim=Number(p!.secim);return{aktif:{...aktif,sayilar:[],secim}};},hata:()=>assert.fail('hata')};
 const c=vivaKaliciAnketBagla(a.api,'katilimci',d=>states.push(d),depo);
 try{a.events.get('joined-meeting')!();await tick();await c.cevapla(1);assert.equal(secim,1);assert.equal(states.at(-1)?.secim,1);assert.ok(calls.includes('cevap'));}finally{c.temizle();}
 const b=call(false),restored:VivaAnketDurumu[]=[];const d=vivaKaliciAnketBagla(b.api,'katilimci',s=>restored.push(s),depo);
 try{b.events.get('joined-meeting')!();await tick();assert.equal(restored.at(-1)?.secim,1);await d.cevapla(0);assert.equal(secim,1);}finally{d.temizle();}
});
function route(){const calls:Record<string,unknown>[]=[],exports:Record<string,Function>={};let oturum=true;
 class Hata extends Error{status:number;constructor(s:string,status=400){super(s);this.status=status;}}
 const modules:Record<string,unknown>={
 '@/lib/viva/sunucu':{VivaHatasi:Hata,vivaGirdi:(r:Request)=>r.json(),vivaKullanici:async()=>{if(!oturum)throw new Hata('Giriş gerekli',401);return{user:{id},db:{rpc:async(_f:string,p:Record<string,unknown>)=>{calls.push(p);return{data:{aktif:null},error:null};}}};},vivaYanit:(v:unknown)=>Response.json(v),vivaHata:(e:Hata)=>Response.json({hata:e.message},{status:e.status??500})},
 '@/lib/viva/sozlesme':{vivaUuidMu:(s:unknown)=>s===id},'@/lib/viva/anket':{vivaAnketTaslagi}};
 vm.runInNewContext(ts.transpileModule(readFileSync('app/(panel)/viva/api/anket/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:(n:string)=>modules[n],URL,Response});
 return{exports,calls,cikis:()=>{oturum=false;}};
}
test('API cevabı giriş yapan kimlikle yazar; istemcinin kimlik iddiası yetki oluşturmaz',async()=>{
 const a=route();const r=await a.exports.POST(new Request('https://test/viva/api/anket',{method:'POST',body:JSON.stringify({etkinlik_id:id,islem:'cevap',oturum_id:id,secim:1,p_auth:'sahte'})}));
 assert.equal(r.status,200);assert.equal(a.calls[0].p_auth,id);assert.equal(a.calls[0].p_islem,'cevap');
 a.cikis();const red=await a.exports.GET(new Request(`https://test/viva/api/anket?etkinlik_id=${id}`));assert.equal(red.status,401);assert.equal(a.calls.length,1);
});
