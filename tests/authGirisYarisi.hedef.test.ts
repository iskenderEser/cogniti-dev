import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React,{act} from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import {Window} from 'happy-dom';
function pending<T>(){let resolve!:(v:T)=>void;const promise=new Promise<T>(r=>{resolve=r;});return{promise,resolve};}
const user={id:'utt',email:'test@example.invalid'};
const identity={kimlik_turu:'kullanici',rol:'utt',ad:'Test',soyad:'Kişi',firma_id:'firma',telefon:null};
async function ortam(getUser:()=>Promise<unknown>,profile:()=>Promise<unknown>=async()=>({data:identity,error:null}),cache:unknown=null){
 const dom=new Window({url:'http://localhost/login'});for(const k of ['window','document','navigator','HTMLElement','Element','Node','Event'])Object.defineProperty(globalThis,k,{configurable:true,value:dom[k]});Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 const {createRoot}=await import('react-dom/client');const c=dom.document.createElement('div');dom.document.body.append(c);const root=createRoot(c);const callbacks=new Set<(e:string)=>unknown>(),timers=new Map<number,()=>void>();let next=0,reads=0,active=0,maxActive=0,cacheReads=0;const writes:unknown[]=[],paths:string[]=[];
 const client={auth:{getUser:async()=>{reads++;active++;maxActive=Math.max(maxActive,active);try{return await getUser();}finally{active--;}},onAuthStateChange:(fn:(e:string)=>unknown)=>{callbacks.add(fn);return{data:{subscription:{unsubscribe:()=>callbacks.delete(fn)}}};}},from:(table:string)=>{assert.equal(table,'v_auth_kimlik');const q={select:()=>q,eq:()=>q,single:profile};return q;}};
 const modules:Record<string,unknown>={react:React,'react/jsx-runtime':jsxRuntime,'@/lib/supabase/client':{createClient:()=>client},'next/navigation':{useRouter:()=>({push:(p:string)=>paths.push(p),replace:(p:string)=>paths.push(p)})},'@/lib/utils/beniHatirla':{oturumDusurulmeliMi:()=>false,beniHatirlaTemizle:()=>{}},'@/lib/auth/guvenliCikis':{guvenliCikisYap:async()=>{}},'@/lib/panel/panelCache':{getAuthKullaniciCache:()=>{cacheReads++;return cache;},setAuthKullaniciCache:(u:unknown)=>{cache=u;writes.push(u);},clearAuthKullaniciCache:()=>{cache=null;}}};
 const exports:Record<string,any>={};const code=ts.transpileModule(readFileSync('app/providers/AuthProvider.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:(n:string)=>{assert(n in modules,n);return modules[n];},window:dom,document:dom.document,console,Error,setTimeout:(fn:()=>void)=>{const n=++next;timers.set(n,fn);return n;},clearTimeout:(n:number)=>timers.delete(n)});
 function Probe(){const a=exports.useAuth();return React.createElement('p',{'data-loading':String(a.yukleniyor),'data-user':a.kullanici?.id??''},a.kullanici?.adSoyad??'Anonim');}
 const tick=()=>act(async()=>{await Promise.resolve();await Promise.resolve();});
 return{c,writes,paths,timers,get reads(){return reads;},get maxActive(){return maxActive;},get cacheReads(){return cacheReads;},render:async(strict=false)=>{await act(async()=>{const el=React.createElement(exports.AuthProvider,null,React.createElement(Probe));root.render(strict?React.createElement(React.StrictMode,null,el):el);});},emit:async(e:string)=>{await act(async()=>{for(const fn of callbacks)assert.equal(fn(e),undefined);});},timer:async()=>{await act(async()=>{const all=[...timers.values()];timers.clear();all.forEach(fn=>fn());});},tick,close:async()=>{await act(async()=>root.unmount());await dom.happyDOM.close();}};
}
test('ilk anonim okuma sürerken SIGNED_IN kaybolmaz; yeni oturum yenileme gerektirmeden yüklenir',async()=>{
 const p=pending<unknown>();let n=0;const o=await ortam(()=>++n===1?p.promise:Promise.resolve({data:{user}}));try{await o.render();assert.equal(o.reads,1);await o.emit('SIGNED_IN');await o.timer();assert.equal(o.reads,1);await act(async()=>p.resolve({data:{user:null}}));await o.tick();assert.equal(o.reads,2);assert.equal(o.maxActive,1);assert.equal(o.c.querySelector('p')!.getAttribute('data-user'),'utt');assert.equal(o.c.querySelector('p')!.getAttribute('data-loading'),'false');}finally{p.resolve({data:{user:null}});await o.close();}
});
test('auth bildirimi içinde Supabase çağrılmaz; yinelenen SIGNED_IN tek sıradaki okumaya dönüşür',async()=>{
 const o=await ortam(async()=>({data:{user:null}}));try{await o.render();assert.equal(o.reads,1);await o.emit('SIGNED_IN');await o.emit('SIGNED_IN');assert.equal(o.reads,1);assert.equal(o.timers.size,1);await o.timer();assert.equal(o.reads,2);assert.equal(o.maxActive,1);}finally{await o.close();}
});
test('çıkıştan sonra geç gelen kimlik yanıtı oturumu geri açamaz',async()=>{
 const p=pending<unknown>();const o=await ortam(async()=>({data:{user}}),()=>p.promise);try{await o.render();await o.emit('SIGNED_OUT');await act(async()=>p.resolve({data:identity,error:null}));await o.tick();assert.equal(o.c.querySelector('p')!.getAttribute('data-user'),'');assert.equal(o.c.querySelector('p')!.getAttribute('data-loading'),'false');assert.equal(o.writes.length,0);assert.deepEqual(o.paths,['/login']);}finally{p.resolve({data:identity});await o.close();}
});
test('login eski sekme kimliğiyle yönlendirme yapmaz; doğrulanmış kimliği bekler',async()=>{
 const p=pending<unknown>();const o=await ortam(()=>p.promise,async()=>({data:identity}),{id:'onceki',adSoyad:'Eski Kullanıcı'});try{await o.render();assert.equal(o.cacheReads,0);assert.equal(o.c.querySelector('p')!.getAttribute('data-user'),'');assert.equal(o.c.querySelector('p')!.getAttribute('data-loading'),'true');await act(async()=>p.resolve({data:{user}}));await o.tick();assert.equal(o.c.querySelector('p')!.getAttribute('data-user'),'utt');}finally{p.resolve({data:{user:null}});await o.close();}
});
test('StrictMode yeniden kurulumunda önceki yükleme beklendikten sonra aktif provider kimliği yükler',async()=>{
 const p=pending<unknown>();let n=0;const o=await ortam(()=>++n===1?p.promise:Promise.resolve({data:{user}}));try{await o.render(true);await act(async()=>p.resolve({data:{user}}));await o.tick();assert.equal(o.maxActive,1);assert.equal(o.c.querySelector('p')!.getAttribute('data-user'),'utt');assert.equal(o.c.querySelector('p')!.getAttribute('data-loading'),'false');}finally{p.resolve({data:{user:null}});await o.close();}
});
