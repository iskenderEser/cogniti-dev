import './_viva-dom.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React, { act } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { Window } from 'happy-dom';
import * as buttons from '@/components/ui/button';
import * as inputs from '@/components/ui/input';
import * as labels from '@/components/ui/label';
import * as icons from 'lucide-react';
import * as sozlesme from '@/lib/viva/sozlesme';

const id='00000000-0000-4000-8000-000000000001', other='00000000-0000-4000-8000-000000000002';
const bilgi={baslik:'Gerçek etkinlik',aciklama:'Uzun açıklama',baslangic:'2027-01-01T10:00:00Z',bitis:'2027-01-01T11:00:00Z',ad:'Deniz Test',eposta_maskeli:'d***@example.test',dogrulandi:false};
type Cevap={status?:number;data:unknown};
function bekleyen(){let tamamla!:(v:Cevap)=>void;const promise=new Promise<Cevap>(r=>{tamamla=r;});return{promise,tamamla};}
async function ortam(handler:(url:string,init:RequestInit)=>Cevap|Promise<Cevap>){
 const dom=new Window({url:'http://localhost/viva/davet/test'});
 for(const key of ['window','document','navigator','HTMLElement','HTMLButtonElement','HTMLInputElement','DocumentFragment','CustomEvent','Element','Node','Event','MouseEvent','KeyboardEvent','MutationObserver','getComputedStyle']as const)Object.defineProperty(globalThis,key,{configurable:true,value:key==='getComputedStyle'?dom.getComputedStyle.bind(dom):dom[key]});
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,requestAnimationFrame:dom.requestAnimationFrame.bind(dom),cancelAnimationFrame:dom.cancelAnimationFrame.bind(dom)});
 const {createRoot}=await import('react-dom/client');const c=dom.document.createElement('div');dom.document.body.append(c);const root=createRoot(c),calls:{url:string;init:RequestInit}[]=[];
 const fetcher=async(url:string,init:RequestInit)=>{calls.push({url,init});const r=await handler(url,init);return{ok:!r.status||r.status<400,status:r.status??200,json:async()=>r.data};};
 let roomUnmounted=0;function Oda(props:Record<string,unknown>){React.useEffect(()=>()=>{roomUnmounted++;},[]);return React.createElement('section',{'aria-label':'Test yayın alanı','data-props':JSON.stringify(props)},'Oda');}
 const modules:Record<string,unknown>={react:React,'react/jsx-runtime':jsxRuntime,'lucide-react':icons,'@/components/ui/button':buttons,'@/components/ui/input':inputs,'@/components/ui/label':labels,'@/lib/viva/sozlesme':sozlesme,'@/components/marka/CognitiLogo':{default:()=>React.createElement('span',null,'Cogniti')},'./viva-yardimci.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./VivaOdaAlani':{default:Oda}};
 const timers=new Map<number,()=>void>();let timerId=0;
 dom.setInterval=((fn:()=>void)=>{const n=++timerId;timers.set(n,fn);return n;}) as typeof dom.setInterval;dom.clearInterval=((n:number)=>{timers.delete(n);}) as typeof dom.clearInterval;
 function yukle(path:string){const exports:Record<string,React.ComponentType<Record<string,unknown>>>={};const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,require:(n:string)=>{assert.ok(n in modules,n);return modules[n];},fetch:fetcher,window:dom,document:dom.document,AbortController,Error,Date,encodeURIComponent});return exports;}
 modules['./VivaDurumAlani']=yukle('components/viva/VivaDurumAlani.tsx');const misafir=yukle('components/viva/VivaMisafir.tsx').default,onizleme=yukle('components/viva/VivaEntegrasyonOnizleme.tsx').default;
 const tick=async()=>{await act(async()=>{await Promise.resolve();await Promise.resolve();});};
 return{c,dom,calls,get roomUnmounted(){return roomUnmounted;},render:async(props:Record<string,unknown>,integration=false)=>{await act(async()=>root.render(React.createElement(integration?onizleme:misafir,props)));await tick();},
 click:async(text:string)=>{const b=[...c.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===text);assert.ok(b,text);await act(async()=>b.click());await tick();},
 input:async(value:string)=>{const el=c.querySelector<HTMLInputElement>('#viva-kod');assert.ok(el);await act(async()=>{Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new dom.Event('input',{bubbles:true}));});},
 submit:async()=>{const f=c.querySelector('form');assert.ok(f);await act(async()=>f.dispatchEvent(new dom.Event('submit',{bubbles:true,cancelable:true})));await tick();},
 timer:async()=>{const fn=timers.values().next().value;assert.ok(fn);await act(async()=>fn());await tick();},tick,
 close:async()=>{await act(async()=>root.unmount());await dom.happyDOM.close();}};
}

test('misafir ilk adımda gerçek bilgiler ve maskeli adresi görür; panel veya örnek kişi eklenmez',async()=>{
 const o=await ortam(()=>({data:bilgi}));try{await o.render({token:'A'.repeat(43)});assert.match(o.c.textContent!,/Gerçek etkinlik/);assert.match(o.c.textContent!,/d\*\*\*@example.test/);assert.equal(o.c.querySelector('input'),null);assert.equal(o.c.querySelector('[aria-label="Test yayın alanı"]'),null);assert.equal(o.c.querySelector('a[href="/viva"]'),null);assert.doesNotMatch(o.c.textContent!,/Merve Duran|Hepifarma|123456/);assert.equal(o.c.querySelector('[aria-current=step]')?.textContent,'1. E-posta doğrulama');assert.equal(o.calls[0].init.cache,'no-store');assert.equal(o.calls[0].init.credentials,'same-origin');}finally{await o.close();}
});
test('kod gönderme adımı yalnız başarılı yanıtla ilerler; alıcı/kod istemciden gönderilmez',async()=>{
 let basarili=false;const o=await ortam((_u,i)=>i.method==='POST'?(basarili?{data:{mesaj:'Kod gönderildi'}}:{status:429,data:{hata:'Yeni kod için bir dakika bekleyin.'}}):{data:bilgi});
 try{await o.render({token:'test-token'});await o.click('E-posta doğrulama kodu gönder');assert.match(o.c.textContent!,/bir dakika bekleyin/);assert.equal(o.c.querySelector('input'),null);basarili=true;await o.click('E-posta doğrulama kodu gönder');assert.ok(o.c.querySelector('#viva-kod'));assert.equal(o.c.querySelector('[aria-current=step]')?.textContent,'2. Kodu doğrulayın');for(const c of o.calls.filter(c=>c.init.method==='POST'))assert.deepEqual(JSON.parse(String(c.init.body)),{islem:'kod'});}finally{await o.close();}
});
test('hatalı veya süresi dolmuş kod daveti kapatmaz; düzeltme ve yeniden gönderme kullanılabilir',async()=>{
 const bodies:Record<string,unknown>[]=[];const o=await ortam((_u,i)=>{if(i.method!=='POST')return{data:bilgi};const b=JSON.parse(String(i.body));bodies.push(b);return b.islem==='kod'?{data:{mesaj:'Gönderildi'}}:{status:403,data:{hata:'Kodun süresi doldu veya deneme hakkı bitti. Yeni kod isteyin.'}};});
 try{await o.render({token:'token'});await o.click('Kodum var');await o.input('12a3456');assert.equal(o.c.querySelector<HTMLInputElement>('#viva-kod')!.value,'123456');await o.submit();assert.equal(bodies.length,1);assert.match(o.c.textContent!,/Yeni kod isteyin/);assert.doesNotMatch(o.c.textContent!,/artık kullanılamıyor/);assert.equal(o.c.querySelector<HTMLInputElement>('#viva-kod')!.value,'123456');await o.click('Kodu yeniden gönder');assert.equal(o.c.querySelector<HTMLInputElement>('#viva-kod')!.value,'');assert.equal(o.c.querySelector('[role=alert]'),null);}finally{await o.close();}
});
test('doğrulanmış cookie sonucu üçüncü adımı açar; misafir oda yalnız davetToken alır',async()=>{
 const o=await ortam(()=>({data:{...bilgi,dogrulandi:true}}));try{await o.render({token:'token'});assert.match(o.c.textContent!,/E-posta doğrulandı · İzleyici/);assert.equal(o.c.querySelector('form'),null);await o.click('Yayın odasını aç');const room=o.c.querySelector('[aria-label="Test yayın alanı"]');assert.ok(room);const p=JSON.parse(room.getAttribute('data-props')!);assert.deepEqual(p,{davetToken:'token'});assert.match(o.c.textContent!,/Yalnız izleme/);for(const s of ['Kaydı başlat','Herkes için bitir','Kamera','Mikrofon'])assert.equal([...o.c.querySelectorAll('button')].some(b=>b.textContent===s),false);await o.click('Etkinlik bilgilerine dön');assert.equal(o.roomUnmounted,1);}finally{await o.close();}
});
test('iptal veya süre dolumu bilgisinde açık oda ve önceki etkinlik bilgileri kaldırılır',async()=>{
 let iptal=false;const o=await ortam(()=>iptal?{status:403,data:{hata:'Davet geçersiz, iptal edilmiş veya süresi dolmuş.'}}:{data:{...bilgi,dogrulandi:true}});
 try{await o.render({token:'token'});await o.click('Yayın odasını aç');iptal=true;await o.click('Daveti yeniden kontrol et');assert.equal(o.roomUnmounted,1);assert.equal(o.c.querySelector('[aria-label="Test yayın alanı"]'),null);assert.doesNotMatch(o.c.textContent!,/Gerçek etkinlik|Deniz Test/);assert.match(o.c.textContent!,/Bu davet artık kullanılamıyor/);assert.equal(o.c.querySelector('form'),null);}finally{await o.close();}
});
test('doğrulama oturumu kaybolunca oda kapanır ve yeniden doğrulama gerekir',async()=>{
 let verified=true;const o=await ortam(()=>({data:{...bilgi,dogrulandi:verified}}));try{await o.render({token:'token'});await o.click('Yayın odasını aç');verified=false;await o.click('Daveti yeniden kontrol et');assert.equal(o.roomUnmounted,1);assert.match(o.c.textContent!,/Davetiniz size özel/);assert.equal([...o.c.querySelectorAll('button')].some(b=>b.textContent==='Yayın odasını aç'),false);}finally{await o.close();}
});
test('ağ hatası gönderildi/doğrulandı mesajı üretmez; formdaki kod korunur',async()=>{
 const o=await ortam((_u,i)=>{if(i.method==='POST')throw new Error('RAW SECRET');return{data:bilgi};});try{await o.render({token:'token'});await o.click('Kodum var');await o.input('123456');await o.submit();assert.equal(o.c.querySelector<HTMLInputElement>('#viva-kod')!.value,'123456');assert.match(o.c.textContent!,/Bağlantınızı kontrol/);assert.doesNotMatch(o.c.textContent!,/RAW SECRET|E-posta adresiniz doğrulandı/);}finally{await o.close();}
});
test('eski bilgi yanıtı doğrulama başarısını geri alamaz; çift gönderim tek POST üretir',async()=>{
 const eski=bekleyen(),post=bekleyen();let get=0;const o=await ortam((_u,i)=>i.method==='POST'?post.promise:++get===1?{data:bilgi}:eski.promise);
 try{await o.render({token:'token'});await o.click('Kodum var');await o.input('123456');await o.click('Daveti yeniden kontrol et');await o.submit();await o.submit();assert.equal(o.calls.filter(c=>c.init.method==='POST').length,1);await act(async()=>post.tamamla({data:{...bilgi,dogrulandi:true}}));await o.tick();await act(async()=>eski.tamamla({data:bilgi}));await o.tick();assert.match(o.c.textContent!,/E-posta doğrulandı · İzleyici/);assert.equal(o.c.querySelector('form'),null);}finally{eski.tamamla({data:bilgi});post.tamamla({data:bilgi});await o.close();}
});
test('token değişince bekleyen doğrulama iptal edilir; eski davet yeni ekranı doğrulayamaz',async()=>{
 const p=bekleyen();const o=await ortam((_u,i)=>i.method==='POST'?p.promise:{data:bilgi});try{await o.render({token:'ilk'});await o.click('Kodum var');await o.input('123456');await o.submit();const req=o.calls.find(c=>c.init.method==='POST')!;await o.render({token:'yeni'});assert.equal(req.init.signal?.aborted,true);await act(async()=>p.tamamla({data:{...bilgi,dogrulandi:true}}));await o.tick();assert.match(o.c.textContent!,/Davetiniz size özel/);assert.doesNotMatch(o.c.textContent!,/Hoş geldiniz/);}finally{p.tamamla({data:bilgi});await o.close();}
});
test('davet ilk yükleme/ağ hatası/yeniden deneme ve bozuk veri durumları erişim açmaz',async()=>{
 const p=bekleyen();let ilk=true;const o=await ortam(()=>ilk?p.promise:{data:{...bilgi,dogrulandi:'true'}});try{await o.render({token:'token'});assert.match(o.c.textContent!,/Davet kontrol ediliyor/);assert.equal(o.c.querySelector('[aria-busy=true]')?.getAttribute('role'),'status');await act(async()=>p.tamamla({status:503,data:{hata:'Servis kullanılamıyor'}}));await o.tick();assert.match(o.c.textContent!,/Davet açılamadı/);assert.doesNotMatch(o.c.textContent!,/artık kullanılamıyor/);ilk=false;await o.click('Daveti yeniden kontrol et');assert.equal(o.c.querySelector('form'),null);assert.equal(o.c.querySelector('[aria-label="Test yayın alanı"]'),null);}finally{p.tamamla({data:bilgi});await o.close();}
});
test('entegrasyon yalnız gerçek yönetim yetkisinde içerik örneğini gösterir; tekrar kontrol eski sonucu kaldırır',async()=>{
 let izin=true;const p=bekleyen();let gecikme=false;const o=await ortam(()=>gecikme?p.promise:{data:{etkinlik:{yonetebilir:izin}}});try{await o.render({etkinlikId:id},true);assert.match(o.c.textContent!,/etkinlik yetkiniz doğrulandı/);assert.match(o.c.textContent!,/Öğrenme, buluşmanın/);izin=false;await o.render({etkinlikId:other},true);assert.match(o.c.textContent!,/Cogniti oturumu doğrulanamadı/);assert.doesNotMatch(o.c.textContent!,/Öğrenme, buluşmanın/);gecikme=true;await o.click('Yeniden dene');assert.match(o.c.textContent!,/Cogniti oturumu kontrol/);const a=o.c.querySelector('a')!;assert.equal(a.getAttribute('href'),`/viva/${other}`);assert.equal(a.getAttribute('target'),'_blank');await act(async()=>p.tamamla({status:403,data:{}}));await o.tick();assert.match(o.c.textContent!,/Cogniti oturumu doğrulanamadı/);}finally{p.tamamla({data:{}});await o.close();}
});
test('entegrasyon eski etkinlik yanıtını yok sayar; geçersiz kimlikte API çağrısı yapılmaz',async()=>{
 const p=bekleyen();const o=await ortam(u=>u.includes(id)?p.promise:{status:401,data:{}});try{await o.render({etkinlikId:id},true);await o.render({etkinlikId:other},true);await act(async()=>p.tamamla({data:{etkinlik:{yonetebilir:true}}}));await o.tick();assert.doesNotMatch(o.c.textContent!,/Öğrenme, buluşmanın/);const n=o.calls.length;await o.render({etkinlikId:'bozuk'},true);assert.equal(o.calls.length,n);assert.match(o.c.textContent!,/Geçersiz etkinlik/);assert.equal(o.c.querySelector('a'),null);}finally{p.tamamla({data:{}});await o.close();}
});
