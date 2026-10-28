import './_viva-dom.mjs';
import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React,{act} from "react";
import * as jsxRuntime from "react/jsx-runtime";
import {Window} from "happy-dom";
import * as buttons from "@/components/ui/button";
import * as icons from "lucide-react";
import * as dialogs from "@/components/ui/alert-dialog";
import styles from "@/components/viva/viva.module.css";
import {vivaGorusmeGirdisi,vivaPrebuiltBaslat,vivaPrebuiltTemasi,type VivaPrebuiltSdk,type VivaGorusmeGirdisi} from "@/lib/viva/prebuilt";
import type {DailyCall,DailyCallOptions,DailyFactoryOptions,DailyThemeConfig} from "@daily-co/daily-js";
import {vivaOnizlemeAyari} from '@/lib/viva/onizleme';

const id='00000000-0000-4000-8000-000000000001';
const girdi=():VivaGorusmeGirdisi=>({durum:'hazir',rol:'katilimci',url:`https://cogniti-viva.daily.co/viva-${id.replaceAll('-','')}-n1`,token:'sahte.token.imza',bitis:new Date(Date.now()+3600000).toISOString()});
function sdkOrtami(options:{supported?:boolean;share?:boolean;destroy?:()=>Promise<void>;join?:()=>Promise<void>}={}){
 const frames:{call:DailyCall;events:Map<string,(data?:unknown)=>void>;joins:DailyCallOptions[];themes:DailyThemeConfig[];options:DailyFactoryOptions;iframe:HTMLIFrameElement;destroyCount:number;emit:(ad:string,data?:unknown)=>void}[]=[];
 const sdk={supportedBrowser:()=>({supported:options.supported??true,supportsFullscreen:true,supportsScreenShare:options.share??true}),createFrame:(parent:HTMLElement,ayar:DailyFactoryOptions)=>{
  let destroyed=false;const events=new Map<string,(data?:unknown)=>void>();const joins:DailyCallOptions[]=[];const themes:DailyThemeConfig[]=[];const iframe=parent.ownerDocument.createElement('iframe');parent.append(iframe);
  const record={call:null as unknown as DailyCall,events,joins,themes,options:ayar,iframe,destroyCount:0,emit:(ad:string,data?:unknown)=>events.get(ad)?.(data)};
  const call={participants:()=>({local:{session_id:'test',user_id:'test',owner:false,local:true}}),sendAppMessage:()=>{},on:(ad:string,fn:(data?:unknown)=>void)=>{events.set(ad,fn);return call;},off:(ad:string)=>{events.delete(ad);return call;},iframe:()=>iframe,isDestroyed:()=>destroyed,
   join:async(p:DailyCallOptions)=>{joins.push(p);await options.join?.();},destroy:async()=>{record.destroyCount++;await options.destroy?.();destroyed=true;iframe.remove();},setTheme:async(t:DailyThemeConfig)=>{themes.push(t);return t;}};
  record.call=call as unknown as DailyCall;frames.push(record);return call;
 }} as unknown as VivaPrebuiltSdk;
 return{sdk,frames};
}
function domOlustur(){const dom=new Window({url:'https://cogniti.test/viva'});const container=dom.document.createElement('div');dom.document.body.append(container);return{dom,container:container as unknown as HTMLElement};}
function controller(o:ReturnType<typeof sdkOrtami>,container:HTMLElement,g:VivaGorusmeGirdisi=girdi()){
 const states:string[]=[],errors:string[]=[],sharing:boolean[]=[];
 const c=vivaPrebuiltBaslat({kapsayici:container,girdi:g,sdkYukle:async()=>o.sdk,durum:d=>states.push(d),hata:m=>errors.push(m),paylasimDestegi:d=>sharing.push(d)});
 return{...c,states,errors,sharing};
}

test('katılım yanıtı Daily HTTPS odası ve geçerli süreyle sınırlıdır',()=>{
 const valid=girdi();assert.deepEqual(vivaGorusmeGirdisi(valid),valid);
 for(const change of [{url:'https://daily.co.evil.test/oda'},{url:girdi().url+'?t=sahte.token.imza'},{url:girdi().url+'#token'},{url:girdi().url.replace('https:','http:')},{url:'https://user:pass@cogniti-viva.daily.co/viva-'+id.replaceAll('-','')+'-n1'},{url:girdi().url.replace('.co/','.co:444/')},{token:'ham-gizli-anahtar'},{rol:'admin'},{bitis:'bozuk'},{bitis:new Date(Date.now()-1000).toISOString()}])assert.throws(()=>vivaGorusmeGirdisi({...girdi(),...change}));
});
test('tek iframe oluşturulur; token yalnız join parametresidir, Türkçe ve native çıkış kullanılır',async()=>{
 const {dom,container}=domOlustur(),o=sdkOrtami(),c=controller(o,container);
 try{await c.hazir;assert.equal(o.frames.length,1);const f=o.frames[0];assert.equal(f.options.lang,'tr');assert.equal(f.options.showLeaveButton,true);assert.equal(f.options.showFullscreenButton,true);assert.equal('token'in f.options,false);assert.equal('url'in f.options,false);assert.equal(f.joins[0].token,girdi().token);assert.equal(f.joins[0].url,girdi().url);assert.equal(container.innerHTML.includes(girdi().token),false);assert.equal(f.iframe.title,'Viva canlı görüşme');assert.equal(f.iframe.referrerPolicy,'no-referrer');f.emit('joined-meeting');assert.deepEqual(c.states,['gorusmede']);}
 finally{await c.kapat();await dom.happyDOM.close();}
});
test('izleyici kamera/mikrofon kaynağı açmaz; normal katılımcı kaynağı kapatılmaz',async()=>{
 for(const rol of ['izleyici','katilimci','sunucu'] as const){const {dom,container}=domOlustur(),o=sdkOrtami(),c=controller(o,container,{...girdi(),rol});try{await c.hazir;const p=o.frames[0].joins[0];assert.equal(p.audioSource,rol==='izleyici'?false:undefined);assert.equal(p.videoSource,rol==='izleyici'?false:undefined);assert.equal(p.startAudioOff,true);assert.equal(p.startVideoOff,true);}finally{await c.kapat();await dom.happyDOM.close();}}
});
test('desteklenmeyen tarayıcıda iframe açılmaz ve anlaşılır sonuç verilir',async()=>{
 const {dom,container}=domOlustur(),o=sdkOrtami({supported:false}),c=controller(o,container);try{await c.hazir;assert.equal(o.frames.length,0);assert.match(c.errors[0],/tarayıcı canlı görüşmeyi desteklemiyor/);}finally{await c.kapat();await dom.happyDOM.close();}
});
test('mobil paylaşım başlatma desteği izleme yetkisinden ayrı taşınır',async()=>{
 const {dom,container}=domOlustur(),o=sdkOrtami({share:false}),c=controller(o,container);try{await c.hazir;assert.deepEqual(c.sharing,[false]);assert.equal(o.frames[0].joins[0].videoSource,undefined);}finally{await c.kapat();await dom.happyDOM.close();}
});
test('kapatma idempotenttir; tüm dinleyiciler ve iframe temizlenir',async()=>{
 const {dom,container}=domOlustur(),o=sdkOrtami(),c=controller(o,container);try{await c.hazir;assert.equal(o.frames[0].events.size,5);await Promise.all([c.kapat(),c.kapat()]);assert.equal(o.frames[0].destroyCount,1);assert.equal(o.frames[0].events.size,0);assert.equal(container.querySelectorAll('iframe').length,0);o.frames[0].emit('joined-meeting');assert.equal(c.states.length,0);}finally{await c.kapat();await dom.happyDOM.close();}
});
test('StrictMode gibi SDK yüklenirken kaldırma eski iframe veya join bırakmaz',async()=>{
 const {dom,container}=domOlustur(),o=sdkOrtami();let resolve!:(v:VivaPrebuiltSdk)=>void;
 const pending=new Promise<VivaPrebuiltSdk>(r=>{resolve=r;});const c=vivaPrebuiltBaslat({kapsayici:container,girdi:girdi(),sdkYukle:()=>pending,durum:()=>{},hata:()=>{},paylasimDestegi:()=>{}});
 try{await c.kapat();resolve(o.sdk);await c.hazir;assert.equal(o.frames.length,0);}finally{await c.kapat();await dom.happyDOM.close();}
});
test('önceki destroy bitmeden yeni frame oluşturulmaz',async()=>{
 const {dom,container}=domOlustur();let release!:()=>void;const p=new Promise<void>(r=>{release=r;});const a=sdkOrtami({destroy:()=>p}),ca=controller(a,container);await ca.hazir;const clean=ca.kapat();const b=sdkOrtami(),cb=controller(b,container);
 try{await Promise.resolve();await Promise.resolve();assert.equal(b.frames.length,0);release();await clean;await cb.hazir;assert.equal(b.frames.length,1);assert.equal(container.querySelectorAll('iframe').length,1);}finally{release();await ca.kapat();await cb.kapat();await dom.happyDOM.close();}
});
test('yerel ayrılma SDKdan gelir, temizlikten sonra yeniden bağlanılabilir',async()=>{
 const {dom,container}=domOlustur(),o=sdkOrtami(),c=controller(o,container);try{await c.hazir;o.frames[0].emit('left-meeting');await c.kapat();assert.deepEqual(c.states,['ayrildi']);assert.equal(o.frames[0].destroyCount,1);const d=controller(o,container);await d.hazir;assert.equal(o.frames.length,2);await d.kapat();}finally{await c.kapat();await dom.happyDOM.close();}
});
test('SDK hatası ham mesaj/tokenı sızdırmaz ve frame temizlenir',async()=>{
 const {dom,container}=domOlustur(),o=sdkOrtami({join:async()=>{throw Error('RAW SECRET sahte.token.imza');}}),c=controller(o,container);try{await c.hazir;await Promise.resolve();await c.kapat();assert.equal(c.errors.length,1);assert.equal(c.errors[0].includes('SECRET'),false);assert.equal(c.errors[0].includes(girdi().token),false);assert.equal(o.frames[0].destroyCount,1);}finally{await c.kapat();await dom.happyDOM.close();}
});
test('tema Cogniti CSS kaynağından gelir; değişim framei yeniden kurmaz',async()=>{
 const {dom,container}=domOlustur();container.style.setProperty('--tema-eylem','#2563eb');container.style.setProperty('--tema-metin','#123456');const theme=vivaPrebuiltTemasi(container);assert.ok('colors'in theme);assert.equal(theme.colors.accent,'#2563eb');assert.equal(theme.colors.baseText,'#123456');assert.equal('cssText'in theme,false);
 const o=sdkOrtami(),c=controller(o,container);try{await c.hazir;container.style.setProperty('--tema-eylem','#1d7943');container.setAttribute('data-tema','yesil');await new Promise(r=>setTimeout(r,5));assert.equal(o.frames.length,1);assert.equal(o.frames[0].themes.length,1);assert.ok('colors'in o.frames[0].themes[0]);assert.equal(o.frames[0].themes[0].colors.accent,'#1d7943');await c.kapat();container.setAttribute('data-tema','mavi');await new Promise(r=>setTimeout(r,5));assert.equal(o.frames[0].themes.length,1);}finally{await c.kapat();await dom.happyDOM.close();}
});

async function arayuz(handler:(url:string,init:RequestInit)=>Promise<{status:number;data:unknown}>|{status:number;data:unknown},sdkOptions:Parameters<typeof sdkOrtami>[0]={},kalici=false){
 const {dom}=domOlustur();for(const key of ['window','document','navigator','HTMLElement','HTMLButtonElement','HTMLInputElement','HTMLTextAreaElement','HTMLDivElement','HTMLSelectElement','DocumentFragment','CustomEvent','NodeFilter','Element','Node','Event','MouseEvent','KeyboardEvent','MutationObserver','getComputedStyle']as const)Object.defineProperty(globalThis,key,{configurable:true,value:key==='getComputedStyle'?dom.getComputedStyle.bind(dom):dom[key]});Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,requestAnimationFrame:dom.requestAnimationFrame.bind(dom),cancelAnimationFrame:dom.cancelAnimationFrame.bind(dom)});
 const {createRoot}=await import('react-dom/client');const container=dom.document.createElement('div');dom.document.body.append(container);const root=createRoot(container);const o=sdkOrtami(sdkOptions),calls:{url:string;init:RequestInit}[]=[];const timers=new Map<number,()=>void>();let timerId=0;
 const modules:Record<string,unknown>={react:React,'react/jsx-runtime':jsxRuntime,'next/image':{default:({alt,...props}:React.ComponentProps<'img'>)=>React.createElement('img',{...props,alt})},'next/link':{default:({children,...props}:React.ComponentProps<'a'>)=>React.createElement('a',props,children)},'@/components/ui/button':buttons,'lucide-react':icons,'@/components/ui/alert-dialog':dialogs,'./viva-oda.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./viva.module.css':{default:styles},'@/lib/viva/onizleme':{vivaOnizlemeAyari},'@/lib/viva/prebuilt':{vivaGorusmeGirdisi,vivaPrebuiltBaslat:(v:Parameters<typeof vivaPrebuiltBaslat>[0])=>vivaPrebuiltBaslat({...v,sdkYukle:async()=>o.sdk})}};
 const eskiFetch=globalThis.fetch;
 const fetcher=async(url:string,init:RequestInit)=>{calls.push({url,init});const r=await handler(url,init);return{ok:r.status<400,status:r.status,json:async()=>r.data};};
 globalThis.fetch=fetcher as typeof fetch;
 const exports:Record<string,React.ComponentType<Record<string,unknown>>>={};const code=ts.transpileModule(readFileSync('components/viva/VivaOdaAlani.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:(n:string)=>{assert.ok(n in modules,n);return modules[n];},AbortController,window:dom,URL,Date,encodeURIComponent,setTimeout:(fn:()=>void)=>{const i=++timerId;timers.set(i,fn);return i;},clearTimeout:(i:number)=>timers.delete(i),fetch:fetcher});
 let kimlik: { id: string; kimlik_turu: string } | null = { id: 'kullanici', kimlik_turu: 'kullanici' };
 const intervals = new Map<number, () => void>(); let intervalId=0;
 let provider:React.ComponentType<{children:React.ReactNode}>|null=null;
 let slot:React.ComponentType<Record<string,unknown>>|null=null;
 if(kalici){
  modules['@/app/providers/AuthProvider']={useAuth:()=>({kullanici:kimlik})};
  modules['./VivaOdaAlani']=exports;
  const pe:Record<string,unknown>={};
  const pcode=ts.transpileModule(readFileSync('components/viva/VivaGorusmeSaglayici.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(pcode,{exports:pe,require:(n:string)=>{assert.ok(n in modules,n);return modules[n];},window:{addEventListener:dom.addEventListener.bind(dom),removeEventListener:dom.removeEventListener.bind(dom),setInterval:(fn:()=>void)=>{const i=++intervalId;intervals.set(i,fn);return i;},clearInterval:(i:number)=>intervals.delete(i)},document:dom.document,ResizeObserver:dom.ResizeObserver,AbortController,encodeURIComponent,fetch:fetcher});
  provider=pe.VivaGorusmeSaglayici as typeof provider;slot=pe.VivaKaliciOdaYeri as typeof slot;
 }
 const tick=async()=>{await act(async()=>{await Promise.resolve();await Promise.resolve();});};
 return{c:container,o,calls,timers,dom,intervals,logout:()=>{kimlik=null;},render:async(props:Record<string,unknown>,strict=false)=>{await act(async()=>{const child=kalici?(props.etkinlikId?React.createElement(slot!,props):React.createElement('p',null,'Cogniti başka sayfa')):React.createElement(exports.default,props);const el=kalici?React.createElement(provider!,null,child):child;root.render(strict?React.createElement(React.StrictMode,null,el):el);});await tick();},click:async(text:string)=>{const b=[...container.querySelectorAll('button')].find(x=>x.textContent===text);assert.ok(b,text);await act(async()=>b.click());await tick();},confirm:async(text:string)=>{const b=[...dom.document.querySelectorAll<HTMLButtonElement>('[role=alertdialog] button')].find(x=>x.textContent===text);assert.ok(b,text);await act(async()=>b.click());await tick();},emit:async(ad:string,data?:unknown)=>{await act(async()=>o.frames.at(-1)?.emit(ad,data));await tick();},timer:async()=>{const item=timers.entries().next().value;assert.ok(item);timers.delete(item[0]);await act(async()=>item[1]());await tick();},tick,close:async()=>{await act(async()=>root.unmount());await tick();await dom.happyDOM.close();globalThis.fetch=eskiFetch;}};
}
test('katılmadan token alınmaz; hiçbir özel medya kontrolü üretilmez',async()=>{
 const a=await arayuz(()=>({status:200,data:girdi()}));try{await a.render({etkinlikId:id});assert.equal(a.calls.length,0);assert.equal(a.o.frames.length,0);assert.match(a.c.textContent!,/Görüşmeye katıl/);for(const label of ['Kamera','Mikrofon','Sohbet','El kaldır','Herkes için bitir'])assert.equal([...a.c.querySelectorAll('button')].some(x=>x.textContent===label),false);}finally{await a.close();}
});
test('üye doğru uçtan token alır; token DOM/depolama/URLye yazılmaz',async()=>{
 const a=await arayuz(()=>({status:200,data:girdi()}));try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');assert.equal(a.calls.length,1);assert.equal(a.calls[0].url,'/viva/api/katilim');assert.deepEqual(JSON.parse(String(a.calls[0].init.body)),{etkinlik_id:id});assert.equal(a.calls[0].init.cache,'no-store');assert.equal(a.calls[0].init.credentials,'same-origin');assert.equal(a.c.innerHTML.includes(girdi().token),false);assert.equal(a.dom.localStorage.length,0);assert.equal(a.dom.sessionStorage.length,0);assert.equal(a.o.frames.length,1);assert.equal(a.o.frames[0].joins[0].token,girdi().token);await a.emit('joined-meeting');assert.equal(a.c.querySelector('iframe')?.parentElement?.hidden,false);}finally{await a.close();}
});
test('misafir aynı bileşeni ve cookie tabanlı özel katılım ucunu kullanır',async()=>{
 let back=0;const a=await arayuz(()=>({status:200,data:{...girdi(),rol:'izleyici'}}));try{await a.render({davetToken:'A'.repeat(43),onDonus:()=>back++});await a.click('Görüşmeye katıl');assert.equal(a.calls[0].url,`/viva/davet/${'A'.repeat(43)}/katilim`);assert.deepEqual(JSON.parse(String(a.calls[0].init.body)),{});assert.equal(a.o.frames[0].joins[0].audioSource,false);await a.emit('left-meeting');await a.click('Etkinlik bilgilerine dön');assert.equal(back,1);}finally{await a.close();}
});
test('sunucuyu beklerken iframe kurulmaz; hazır olunca tek frame ve tek join oluşur',async()=>{
 let ready=false;const a=await arayuz(()=>ready?{status:200,data:girdi()}:{status:202,data:{durum:'bekliyor',neden:'sunucu'}});try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');assert.match(a.c.textContent!,/Sunucunun görüşmeye katılması bekleniyor/);assert.equal(a.o.frames.length,0);assert.equal(a.timers.size,1);ready=true;await a.timer();assert.equal(a.o.frames.length,1);assert.equal(a.o.frames[0].joins.length,1);assert.equal(a.timers.size,1);}finally{await a.close();}
});
test('başlangıç/oda beklemesi anlaşılırdır; kaldırılınca tekrar isteği durur',async()=>{
 for(const neden of ['zaman','oda']){const a=await arayuz(()=>({status:202,data:{durum:'bekliyor',neden}}));await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');assert.equal(a.timers.size,1);const signal=a.calls[0].init.signal!;await a.close();assert.equal(a.timers.size,0);assert.equal(signal.aborted,true);assert.equal(a.o.frames.length,0);}
});
test('yetki reddinde veya bozuk yanıtta iframe açılmaz; yeniden katılım mümkündür',async()=>{
 for(const r of [{status:403,data:{hata:'Davet iptal edildi'}},{status:200,data:{...girdi(),url:'https://evil.test/oda'}}]){const a=await arayuz(()=>r);try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');assert.ok(a.c.querySelector('[role="alert"]'));assert.equal(a.o.frames.length,0);assert.match(a.c.textContent!,/Yeniden katıl/);}finally{await a.close();}}
});
test('geç dönen katılım yanıtı kaldırılmış odada görüşme başlatmaz',async()=>{
 let resolve!:(r:{status:number;data:unknown})=>void;const pending=new Promise<{status:number;data:unknown}>(r=>{resolve=r;});const a=await arayuz(()=>pending);await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');await a.close();resolve({status:200,data:girdi()});await Promise.resolve();await Promise.resolve();assert.equal(a.o.frames.length,0);
});
test('React yeniden çizimi ve StrictMode ikinci frame bırakmaz; çıkış yeniden token ister',async()=>{
 const a=await arayuz(()=>({status:200,data:girdi()}));try{await a.render({etkinlikId:id},true);await a.click('Görüşmeye katıl');assert.equal(a.o.frames.length,1);await a.render({etkinlikId:id},true);assert.equal(a.o.frames.length,1);await a.emit('left-meeting');assert.match(a.c.textContent!,/Görüşmeden ayrıldınız/);await a.click('Yeniden katıl');assert.equal(a.calls.length,2);assert.equal(a.o.frames.length,2);assert.equal(a.o.frames[0].destroyCount,1);}finally{await a.close();}
});
test('pagehide görüşmeyi temizler ve eski framee geri dönülmez',async()=>{
 const a=await arayuz(()=>({status:200,data:girdi()}));try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');await act(async()=>a.dom.dispatchEvent(new a.dom.Event('pagehide')));await a.tick();assert.equal(a.o.frames[0].destroyCount,1);assert.match(a.c.textContent!,/Görüşmeden ayrıldınız/);}finally{await a.close();}
});
test('mobilde paylaşımı başlatma desteği yokken izleme olanağı açıklanır',async()=>{
 const a=await arayuz(()=>({status:200,data:girdi()}),{share:false});try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');assert.match(a.c.textContent!,/paylaşılan ekranları izleyebilirsiniz/);assert.equal(a.o.frames.length,1);}finally{await a.close();}
});

test('önizleme yalnız sunucuya ve açık isteğe bağlıdır; token entegrasyon adresine girmez',async()=>{
 const ayar=vivaOnizlemeAyari('https://cogniti.test',id);
 assert.equal(ayar.cognitiOnizleme.controlledBy,'owners');assert.equal(ayar.cognitiOnizleme.shared,false);
 assert.equal(ayar.cognitiOnizleme.src,`https://cogniti.test/viva/entegrasyon-onizleme?etkinlik_id=${id}`);
 assert.throws(()=>vivaOnizlemeAyari('http://evil.test',id));
 for(const rol of ['sunucu','katilimci','izleyici'] as const){const {dom,container}=domOlustur(),o=sdkOrtami();const c=vivaPrebuiltBaslat({kapsayici:container,girdi:{...girdi(),rol},sdkYukle:async()=>o.sdk,durum:()=>{},hata:()=>{},paylasimDestegi:()=>{},entegrasyonlar:ayar});
 try{await c.hazir;assert.equal(Boolean(o.frames[0].options.customIntegrations),rol==='sunucu');assert.equal(JSON.stringify(o.frames[0].options).includes(girdi().token),false);}finally{await c.kapat();await dom.happyDOM.close();}}
});
test('başlangıç yetkisi reddedilirse sonsuz tekrar yapılmaz; kayıt hatası görüşmeyi kapatmaz',async()=>{
 const a=await arayuz(url=>url==='/viva/api/yasam'?{status:403,data:{hata:'Yetki yok'}}:{status:200,data:{...girdi(),rol:'sunucu'}});
 try{await a.render({etkinlikId:id,surum:1});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');assert.equal(a.timers.size,1);assert.match(a.c.textContent!,/Yayın başlangıcı doğrulanamadı/);await a.emit('recording-error');assert.equal(a.c.querySelector('iframe')?.parentElement?.hidden,false);assert.equal(a.o.frames[0].destroyCount,0);}finally{await a.close();}
});

test('yayını bitirmek sohbet indirmeye bağlı değildir',async()=>{
 const a=await arayuz(url=>url.startsWith('/viva/api?')?{status:200,data:{etkinlik:{yonetebilir:true,surum:2}}}:url==='/viva/api/yasam'?{status:200,data:{}}:{status:200,data:{...girdi(),rol:'sunucu'}});
 try{a.dom.confirm=()=>true;await a.render({etkinlikId:id,surum:1});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');
  assert.equal(a.c.textContent!.includes('yayın bitmeden'),false);assert.equal(a.c.textContent!.includes('Sohbeti aç / metni indir'),false);
  await a.emit('custom-button-click',{button_id:'cognitiHerkesIcinBitir'});assert.equal(a.calls.some(c=>c.url==='/viva/api/yasam'&&JSON.parse(String(c.init.body)).islem==='bitir'),false);await a.confirm('Herkes için bitir');assert.ok(a.calls.some(c=>c.url==='/viva/api/yasam'&&JSON.parse(String(c.init.body)).islem==='bitir'));
  assert.equal(a.c.querySelector('[aria-label="Yayını bitirmeden önce"]'),null);
 }finally{await a.close();}
});

test('Prebuilt onaylı CSS ve uyarlanabilir grid ayarını alır; native araçları gizleyen kural eklenmez',async()=>{
 const {dom,container}=domOlustur(),o=sdkOrtami(),c=controller(o,container);
 try{await c.hazir;const ayar=o.frames[0].options;assert.equal(ayar.bodyClass,'cogniti-viva');assert.match(ayar.cssText!,/daily-video-tile/);assert.match(ayar.cssText!,/border-radius: 12px/);assert.equal(ayar.layoutConfig?.grid?.maxTilesPerPage,9);assert(!/display\s*:\s*none|visibility\s*:\s*hidden/.test(ayar.cssText!));assert.equal(ayar.showLeaveButton,true)}finally{await c.kapat();await dom.happyDOM.close()}
});
test('ağ kesintisi mevcut iframei korur; tüm kesilen kanallar dönmeden bağlı sayılmaz',async()=>{
 const {dom,container}=domOlustur(),o=sdkOrtami(),ag:boolean[]=[];
 const c=vivaPrebuiltBaslat({kapsayici:container,girdi:girdi(),sdkYukle:async()=>o.sdk,durum:()=>{},hata:()=>assert.fail('hata'),paylasimDestegi:()=>{},baglanti:k=>ag.push(k)});
 try{await c.hazir;const f=o.frames[0];f.emit('network-connection',{type:'sfu',event:'interrupted'});assert.equal(ag.length,0);f.emit('joined-meeting');f.emit('network-connection',{type:'signaling',event:'interrupted'});f.emit('network-connection',{type:'sfu',event:'interrupted'});f.emit('network-connection',{type:'signaling',event:'connected'});assert.equal(ag.at(-1),true);f.emit('network-connection',{type:'sfu',event:'connected'});assert.equal(ag.at(-1),false);assert.equal(o.frames.length,1);assert.equal(f.joins.length,1);assert.equal(f.destroyCount,0);await c.kapat();assert.equal(f.events.size,0)}finally{await c.kapat();await dom.happyDOM.close()}
});
test('oda hazırlığı örnek kişi veya çalışmayan cihaz seçimi üretmez; anlık otomatik katılım tek kez doğrulanır',async()=>{
 const a=await arayuz(()=>({status:200,data:girdi()}));try{await a.render({etkinlikId:id});assert.match(a.c.textContent!,/Buluşmaya hazır mısınız/);assert.equal(a.c.querySelector('select'),null);assert.equal(a.c.querySelector('video'),null);assert.equal(a.o.frames.length,0);assert(!a.c.textContent!.includes('Merve'));await a.render({etkinlikId:id,otomatikKatil:true});assert.equal(a.calls.length,0)}finally{await a.close()}
 const b=await arayuz(()=>({status:200,data:girdi()}));try{await b.render({etkinlikId:id,otomatikKatil:true});assert.equal(b.calls.length,1);assert.equal(b.o.frames.length,1)}finally{await b.close()}
});
test('zaman ve oda bekleme açıklamaları API nedenini izler; manuel kontrol eski zamanlayıcıyı çoğaltmaz',async()=>{
 for(const neden of ['zaman','oda']){const a=await arayuz(()=>({status:202,data:{durum:'bekliyor',neden}}));try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');assert.match(a.c.textContent!,neden==='zaman'?/Buluşmanızın saati bekleniyor/:/Görüşme odası hazırlanıyor/);assert.equal(a.timers.size,1);await a.click('Yeniden kontrol et');assert.equal(a.calls.length,2);assert.equal(a.timers.size,1);await a.click('Beklemeyi bırak');assert.equal(a.timers.size,0);assert.equal(a.o.frames.length,0);assert.match(a.c.textContent!,/Buluşmaya hazır mısınız/)}finally{await a.close()}}
});
test('bağlantı uyarısı sırasında SDK görüşmesi korunur, ikinci token alınmaz ve bitirme düğmesi kapanır',async()=>{
 const a=await arayuz(url=>url==='/viva/api/yasam'?{status:200,data:{}}:{status:200,data:{...girdi(),rol:'sunucu'}});
 try{await a.render({etkinlikId:id,surum:1});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');const once=a.calls.length;await a.emit('network-connection',{type:'sfu',event:'interrupted'});assert.match(a.c.textContent!,/Bağlantı yeniden kuruluyor/);assert.equal(a.o.frames[0].destroyCount,0);await a.emit('custom-button-click',{button_id:'cognitiHerkesIcinBitir'});assert.equal(a.dom.document.querySelector('[role=alertdialog]'),null);await a.emit('network-connection',{type:'sfu',event:'connected'});assert.equal(a.calls.length,once);await a.emit('custom-button-click',{button_id:'cognitiHerkesIcinBitir'});assert(a.dom.document.querySelector('[role=alertdialog]'));await a.confirm('Vazgeç');assert.equal(a.o.frames.length,1)}finally{await a.close()}
});
test('normal ayrılma herkesi bitir API çağrısı yapmaz ve yeniden katılmayı sunar',async()=>{
 const a=await arayuz(()=>({status:200,data:girdi()}));try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');await a.emit('left-meeting');assert.match(a.c.textContent!,/diğer katılımcılar için bitirmez/);assert.equal(a.calls.filter(c=>c.url==='/viva/api/yasam').length,0);assert([...a.c.querySelectorAll('button')].some(b=>b.textContent==='Yeniden katıl'))}finally{await a.close()}
});
test('herkesi bitir onaydan sonra güncel sürümü kullanır; 202 sonucu tamamlandı diye göstermez veya yeniden katılmaz',async()=>{
 const a=await arayuz((url,init)=>url.startsWith('/viva/api?')?{status:200,data:{etkinlik:{yonetebilir:true,surum:9}}}:url==='/viva/api/yasam'&&JSON.parse(String(init.body)).islem==='bitir'?{status:202,data:{mesaj:'Erişim kapatıldı; işlem tamamlanıyor.',tekrar_gerekli:true}}:url==='/viva/api/yasam'?{status:200,data:{}}:{status:200,data:{...girdi(),rol:'sunucu'}});
 try{await a.render({etkinlikId:id,surum:1});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');await a.emit('custom-button-click',{button_id:'cognitiHerkesIcinBitir'});assert(!a.calls.some(c=>c.url.startsWith('/viva/api?')));await a.confirm('Herkes için bitir');const post=a.calls.find(c=>c.url==='/viva/api/yasam'&&JSON.parse(String(c.init.body)).islem==='bitir');assert(post);assert.equal(JSON.parse(String(post.init.body)).surum,9);assert.match(a.c.textContent!,/Etkinliğe erişim kapatıldı/);assert(!a.c.textContent!.includes('Buluşma sona erdi'));assert(![...a.c.querySelectorAll('button')].some(b=>b.textContent==='Yeniden katıl'));assert.equal(a.o.frames[0].destroyCount,1)}finally{await a.close()}
});
test('katılımcı ve izleyici herkesi bitir ve kayıt yetkisi kazanmaz',async()=>{
 for(const rol of ['katilimci','izleyici'] as const){const a=await arayuz(()=>({status:200,data:{...girdi(),rol}}));try{await a.render({etkinlikId:id,surum:1});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');for(const text of ['Herkes için bitir','Kaydı başlat'])assert(![...a.c.querySelectorAll('button')].some(b=>b.textContent===text));if(rol==='izleyici')assert(![...a.c.querySelectorAll('button')].some(b=>b.textContent==='Arka plan'))}finally{await a.close()}}
});

// Daily'nin yerleşik araçları için ikinci bir Viva arayüzü oluşturulmaz.
test('arka plan ve kayıt kontrolleri Dailyde kalır; Viva ikinci panel veya kayıt rozeti üretmez',async()=>{
 for(const rol of ['sunucu','katilimci','izleyici'] as const){
  const a=await arayuz(url=>url==='/viva/api/yasam'?{status:200,data:{}}:{status:200,data:{...girdi(),rol}});
  try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');
   for(const text of ['Arka plan','Bulanıklaştır','Görsel seç','Efekti kaldır','Kaydı başlat','Kaydı durdur'])assert(![...a.c.querySelectorAll('button')].some(b=>b.textContent===text));
   assert.equal(a.c.querySelector('input[type="file"]'),null);assert.equal(a.c.querySelector('[aria-label="Arka plan ayarları"]'),null);assert.equal(a.c.querySelector('.connectionBadge'),null);assert.equal(a.c.querySelector('.role'),null);assert.equal(a.c.querySelector('[aria-label="Yayın odası yardımı"]'),null);assert.equal(a.dom.document.querySelector('[role=dialog]'),null);
   await a.emit('recording-started');assert(!a.c.textContent!.includes('Kayıt sürüyor'));assert.equal(a.o.frames.length,1);
  }finally{await a.close();}
 }
});
test('Daily yerel kayıt durma olayı yalnız sunucuda Viva arşivine bildirilir',async()=>{
 for(const rol of ['sunucu','katilimci','izleyici'] as const){
  const a=await arayuz(url=>url==='/viva/api/yasam'||url==='/viva/api/kayit'?{status:200,data:{}}:{status:200,data:{...girdi(),rol}});
  try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');await a.emit('recording-stopped',{instanceId:id});
   const calls=a.calls.filter(c=>c.url==='/viva/api/kayit');assert.equal(calls.length,rol==='sunucu'?1:0);
   if(calls.length)assert.deepEqual(JSON.parse(String(calls[0].init.body)),{islem:'durdu',etkinlik_id:id,instance_id:id});
   assert.equal(a.o.frames[0].destroyCount,0);
  }finally{await a.close();}
 }
});


test('alt çubuk güç ikonu yalnız sunucuya eklenir; katılmadan veya temizlikten sonra işlem tetiklemez',async()=>{
 for(const rol of ['sunucu','katilimci','izleyici'] as const){
  const {dom,container}=domOlustur(),o=sdkOrtami();let istek=0;
  const c=vivaPrebuiltBaslat({kapsayici:container,girdi:{...girdi(),rol},sdkYukle:async()=>o.sdk,durum:()=>{},hata:()=>{},paylasimDestegi:()=>{},bitirmeIstegi:()=>istek++});
  try{await c.hazir;const f=o.frames[0],buton=f.options.customTrayButtons?.cognitiHerkesIcinBitir;
   assert.equal(Boolean(buton),rol==='sunucu');
   if(buton){assert.equal(buton.label,'Yayını bitir');assert.equal(buton.tooltip,'Yayını bitir');assert.equal(buton.visualState,'active');assert.equal(new URL(buton.iconPath).searchParams.get('color'),'#ffffff');assert.equal(new URL(buton.iconPath).protocol,'https:');}
   f.emit('custom-button-click',{button_id:'cognitiHerkesIcinBitir'});assert.equal(istek,0);
   f.emit('joined-meeting');f.emit('custom-button-click',{button_id:'baska'});assert.equal(istek,0);
   f.emit('custom-button-click',{button_id:'cognitiHerkesIcinBitir'});assert.equal(istek,rol==='sunucu'?1:0);
   const dinleyici=f.events.get('custom-button-click');await c.kapat();dinleyici?.({button_id:'cognitiHerkesIcinBitir'});assert.equal(istek,rol==='sunucu'?1:0);assert.equal(f.events.size,0);
  }finally{await c.kapat();await dom.happyDOM.close();}
 }
});
test('üst düğme ve bant kaldırılır; alt güç ikonu aynı onayla ve güncel sürümle bitirir',async()=>{
 const a=await arayuz((url)=>url.startsWith('/viva/api?')?{status:200,data:{etkinlik:{yonetebilir:true,surum:9}}}:url==='/viva/api/yasam'?{status:200,data:{}}:{status:200,data:{...girdi(),rol:'sunucu'}});
 const bitirCagrilari=()=>a.calls.filter(c=>c.url==='/viva/api/yasam'&&JSON.parse(String(c.init.body)).islem==='bitir');
 try{await a.render({etkinlikId:id,surum:1});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');
  assert.equal(a.c.querySelector('.toolbar'),null);assert.equal(a.c.querySelectorAll('button').length,0);
  assert(a.o.frames[0].options.customTrayButtons?.cognitiHerkesIcinBitir);
  await a.emit('custom-button-click',{button_id:'cognitiHerkesIcinBitir'});assert(a.dom.document.querySelector('[role=alertdialog]'));assert.equal(bitirCagrilari().length,0);
  await a.confirm('Vazgeç');assert.equal(bitirCagrilari().length,0);
  await a.emit('network-connection',{type:'sfu',event:'interrupted'});await a.emit('custom-button-click',{button_id:'cognitiHerkesIcinBitir'});assert.equal(a.dom.document.querySelector('[role=alertdialog]'),null);
  await a.emit('network-connection',{type:'sfu',event:'connected'});await a.emit('custom-button-click',{button_id:'cognitiHerkesIcinBitir'});await a.confirm('Herkes için bitir');
  assert.equal(bitirCagrilari().length,1);assert.equal(JSON.parse(String(bitirCagrilari()[0].init.body)).surum,9);assert.equal(a.o.frames[0].destroyCount,1);
 }finally{await a.close();}
});

test('son beş dakika herkes için görünür; son dakika kırmızı, sıfırda frame kapanır ve Viva logosu kalır',async()=>{
 const gercekSimdi=Date.now;let simdi=gercekSimdi();Date.now=()=>simdi;
 try{for(const rol of ['sunucu','katilimci','izleyici'] as const){
  const bitis=simdi+301000;let bildirilen=0;
  const a=await arayuz(url=>url==='/viva/api/yasam'?{status:200,data:{}}:{status:200,data:{...girdi(),rol,bitis:new Date(bitis).toISOString(),yayin_bitis:new Date(bitis).toISOString(),sunucu_zamani:new Date(simdi).toISOString()}});
  try{await a.render(rol==='izleyici'?{davetToken:'A'.repeat(43),onSureDoldu:()=>bildirilen++}:{etkinlikId:id,onSureDoldu:()=>bildirilen++});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');
   assert.equal(a.c.querySelector('[role=timer]'),null);
   simdi+=1000;await a.timer();assert.match(a.c.querySelector('[role=timer]')!.textContent!,/05:00/);assert.equal(a.c.querySelector('[role=timer]')!.getAttribute('data-urgent'),'false');
   simdi+=240000;await a.timer();assert.match(a.c.querySelector('[role=timer]')!.textContent!,/01:00/);assert.equal(a.c.querySelector('[role=timer]')!.getAttribute('data-urgent'),'true');
   simdi+=59000;await a.timer();assert.match(a.c.querySelector('[role=timer]')!.textContent!,/00:01/);
   simdi+=1000;await a.timer();assert.equal(a.o.frames[0].destroyCount,1);assert.equal(a.c.querySelector('iframe'),null);assert(a.c.querySelector('img[alt=Viva]'));assert.match(a.c.textContent!,/Buluşma sona erdi/);assert.equal([...a.c.querySelectorAll('button')].some(b=>b.textContent==='Yeniden katıl'),false);assert.equal(a.timers.size,0);assert.equal(bildirilen,1);
  }finally{await a.close();}
 }}finally{Date.now=gercekSimdi;}
});
test('geri sayım tarayıcı saatinden sapmış sunucu saatini kullanır',async()=>{
 const gercekSimdi=Date.now;let simdi=gercekSimdi();Date.now=()=>simdi;
 const sunucu=simdi+600000,bitis=sunucu+300000;
 const a=await arayuz(()=>({status:200,data:{...girdi(),bitis:new Date(bitis).toISOString(),yayin_bitis:new Date(bitis).toISOString(),sunucu_zamani:new Date(sunucu).toISOString()}}));
 try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');assert.match(a.c.querySelector('[role=timer]')!.textContent!,/05:00/);simdi+=300000;await a.timer();assert(a.c.querySelector('img[alt=Viva]'));assert.equal(a.o.frames[0].destroyCount,1);}finally{await a.close();Date.now=gercekSimdi;}
});
test('erken biten misafir doğrulaması toplantı bitişi olarak gösterilmez',async()=>{
 const gercekSimdi=Date.now;let simdi=gercekSimdi();Date.now=()=>simdi;const bas=simdi;
 const a=await arayuz(()=>({status:200,data:{...girdi(),rol:'izleyici',bitis:new Date(bas+60000).toISOString(),yayin_bitis:new Date(bas+600000).toISOString(),sunucu_zamani:new Date(bas).toISOString()}}));
 try{await a.render({davetToken:'A'.repeat(43)});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');assert.equal(a.c.querySelector('[role=timer]'),null);simdi+=60000;await a.timer();assert.equal(a.c.querySelector('img[alt=Viva]'),null);assert.match(a.c.textContent!,/Katılım oturumunuzun süresi doldu/);assert.equal(a.o.frames[0].destroyCount,1);}finally{await a.close();Date.now=gercekSimdi;}
});
test('Daily tam süre sonunda ayrılma bildirirse yeniden katıl seçeneği açılmaz',async()=>{
 const gercekSimdi=Date.now;let simdi=gercekSimdi();Date.now=()=>simdi;const bitis=simdi+60000;
 const a=await arayuz(()=>({status:200,data:{...girdi(),bitis:new Date(bitis).toISOString()}}));
 try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');simdi=bitis;await a.emit('left-meeting');assert(a.c.querySelector('img[alt=Viva]'));assert.equal(a.timers.size,0);assert.equal(a.o.frames[0].destroyCount,1);}finally{await a.close();Date.now=gercekSimdi;}
});

test('arka planda bekleyen sekme süre sonunda görünür olunca bağlantıyı hemen kapatır',async()=>{
 const gercekSimdi=Date.now;let simdi=gercekSimdi();Date.now=()=>simdi;const bitis=simdi+60000;
 const a=await arayuz(()=>({status:200,data:{...girdi(),bitis:new Date(bitis).toISOString()}}));
 try{await a.render({etkinlikId:id});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');simdi=bitis+5000;
  await act(async()=>{a.dom.document.dispatchEvent(new a.dom.Event('visibilitychange'));});await a.tick();
  assert(a.c.querySelector('img[alt=Viva]'));assert.equal(a.o.frames[0].destroyCount,1);assert.equal(a.timers.size,0);
 }finally{await a.close();Date.now=gercekSimdi;}
});


test('yayıncı ve katılımcı Cogniti sayfalarında gezerken aynı Daily iframe ve oturum korunur',async()=>{
 for(const rol of ['sunucu','katilimci'] as const){
  const a=await arayuz(url=>url==='/viva/api/yasam'?{status:200,data:{}}:{status:200,data:{...girdi(),rol}}, {},true);
  try{
   await a.render({etkinlikId:id,surum:1},true);await a.click('Görüşmeye katıl');await a.emit('joined-meeting');
   const f=a.o.frames[0], iframe=f.iframe, parent=iframe.parentElement;
   for(let i=0;i<3;i++){
    await a.render({},true);assert.match(a.c.textContent!,/Cogniti başka sayfa/);
    assert.equal(f.destroyCount,0);assert.equal(iframe.isConnected,true);assert.equal(iframe.parentElement,parent);
    assert.equal(a.c.querySelector('[data-viva-kalici-oda]')?.getAttribute('aria-hidden'),'true');
    await a.render({etkinlikId:id,surum:2+i},true);
    assert.equal(a.c.querySelector('[data-viva-kalici-oda]')?.getAttribute('aria-hidden'),'false');
    assert.equal(a.o.frames.length,1);assert.equal(f.joins.length,1);assert.equal(f.destroyCount,0);
   }
   assert.equal(a.calls.filter(x=>x.url==='/viva/api/katilim').length,1);
   await a.render({etkinlikId:'baska-yayin',surum:1},true);
   assert.match(a.c.textContent!,/Başka bir görüşmeniz açık/);assert.equal(f.destroyCount,0);assert.equal(a.o.frames.length,1);
   await a.render({etkinlikId:id,surum:5},true);await a.emit('left-meeting');assert.equal(f.destroyCount,1);
   await a.click('Yeniden katıl');assert.equal(a.o.frames.length,2);
   await a.render({},true);a.logout();await a.render({},true);assert.equal(a.o.frames[1].destroyCount,1);
  }finally{await a.close();}
 }
});

test('oda sayfası kapalıyken erişim kontrolü sürer; geçici ağ hatası korur, iptal bağlantıyı kapatır',async()=>{
 let status=500;
 const a=await arayuz(url=>url==='/viva/api/katilim'?{status:200,data:girdi()}:{status,data:{etkinlik:{oda_acik:false}}},{},true);
 try{
  await a.render({etkinlikId:id,surum:1});await a.click('Görüşmeye katıl');await a.emit('joined-meeting');await a.render({});
  assert.equal(a.intervals.size,1);
  await act(async()=>{a.intervals.values().next().value!();});await a.tick();assert.equal(a.o.frames[0].destroyCount,0);
  status=403;await act(async()=>{a.intervals.values().next().value!();});await a.tick();
  assert.equal(a.o.frames[0].destroyCount,1);assert.equal(a.intervals.size,0);
 }finally{await a.close();}
});
