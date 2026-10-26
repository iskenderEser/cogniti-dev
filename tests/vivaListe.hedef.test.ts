import './_viva-dom.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React, { act } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { Window } from 'happy-dom';
import * as icons from 'lucide-react';
import * as radix from 'radix-ui';
import * as buttons from '@/components/ui/button';
import * as cards from '@/components/ui/card';
import * as controls from '@/components/kontrol/SadeKontroller';
import * as refresh from '@/components/ui/yenile-butonu';
import * as heading from '@/components/ui/sayfa-yenile-basligi';
import * as list from '@/lib/viva/liste';
import * as contract from '@/lib/viva/sozlesme';
import * as detail from '@/lib/viva/detay';
import * as time from '@/lib/zaman/turkiye';
import type { VivaListeYaniti, VivaListeSorgusu } from '@/lib/viva/liste';
import type { VivaEtkinlik } from '@/lib/viva/sozlesme';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const now=new Date();
const make=(n:number,delta=1,extra:Partial<VivaEtkinlik>={}):VivaEtkinlik=>({etkinlik_id:id(n),baslik:`Etkinlik ${n}`,aciklama:'Birlikte öğreniyoruz',baslangic:new Date(now.getTime()+delta*86400000).toISOString(),bitis:new Date(now.getTime()+delta*86400000+3600000).toISOString(),durum:'planlandi',surum:1,sahip_id:id(900),sahip_adi:'Merve Duran',firma_adi:'Hepifarma',yonetebilir:true,oda_acik:true,...extra});
const sample=[make(1,-.01,{durum:'canli'}),...Array.from({length:25},(_,i)=>make(10+i,i+1)),make(50,2,{durum:'taslak'}),make(60,3,{yonetebilir:false,baslik:'Davetli buluşması'})];
function response(s:VivaListeSorgusu,create=true):VivaListeYaniti {const d=list.vivaListeHesapla(sample,s,create,now);return {...d,canlilar:d.canlilar.map(e=>({...e,katilimci_sayisi:e.yonetebilir?2:null})),etkinlikler:d.etkinlikler.map(e=>({...e,katilimci_sayisi:e.yonetebilir?2:null}))};}
function load<T>(file:string,modules:Record<string,unknown>,extra:Record<string,unknown>={}) {const exports={};const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,require:(name:string)=>{assert(name in modules,name);return modules[name]},Date,Error,Map,Set,URLSearchParams,AbortController,console,...extra});return exports as T;}

test('Filtreler: Türkiye takvimi, olmayan gün ve geçersiz sınırlar doğrulanır',()=>{assert.equal(list.vivaBugun(new Date('2026-10-25T21:00:00Z')),'2026-10-26');for(const values of [{ay:'2026-13'},{ay:'2026-02',gun:'2026-02-31'},{ay:'2026-10',gun:'2026-11-01'},{bolum:'yok'},{offset:'-1'},{offset:'2.2'},{offset:'1000001'}])assert.throws(()=>list.vivaListeSorgusu(new URLSearchParams(values)));assert.equal(list.vivaAyKaydir('2026-12',1),'2027-01');assert.equal(list.vivaTakvimGunleri('2026-10').filter(Boolean).length,31)});
test('Uyumluluk: ilk 20 dışındaki canlı/arama/tarih ve tam takvim korunur',()=>{const s=list.vivaListeSorgusu(new URLSearchParams({bolum:'yaklasan'})),r=response(s);assert.equal(r.canlilar.length,1);assert.equal(r.etkinlikler.length,20);assert.equal(r.toplam,26);assert(r.devam_var);const found=response({...s,arama:'Etkinlik 34'});assert.equal(found.toplam,1);const day=list.vivaBugun(new Date(sample[1].baslangic)),month=day.slice(0,7);const f=response({...s,ay:month,gun:day});assert.deepEqual(f.takvim,response({...s,ay:month}).takvim);assert(f.etkinlikler.every(e=>list.vivaBugun(new Date(e.baslangic))===day))});
function server(db:unknown){return load<typeof import('@/lib/viva/listeSunucu')>('lib/viva/listeSunucu.ts',{'server-only':{},'./sunucu':{vivaKullanici:async()=>({db,user:{id:id(900)}}),VivaHatasi:class extends Error{}},'./liste':list});}
test('Eksik yeni RPC tüm eski sayfaları okur; erişim reddinde fallback çalışmaz',async()=>{const calls:{name:string;args:Record<string,unknown>}[]=[];let fail=false;const db={rpc:async(name:string,args:Record<string,unknown>)=>{calls.push({name,args});if(name==='viva_liste_ekrani')return {data:null,error:{code:fail?'42501':'PGRST202'}};if(args.p_islem==='baglam')return{data:{olusturabilir:true},error:null};const offset=(args.p_veri as {offset:number}).offset;return{data:{etkinlikler:sample.slice(offset,offset+20),devam_var:sample.length>offset+20},error:null}}};const s=list.vivaListeSorgusu(new URLSearchParams({bolum:'yaklasan'})),m=server(db),r=await m.vivaListeEkraniOku(s);assert.equal(r.toplam,26);assert.equal(calls.filter(c=>c.args.p_islem==='liste').length,2);assert(calls.every(c=>c.args.p_auth===id(900)));assert(r.etkinlikler.every(e=>e.katilimci_sayisi===null));fail=true;calls.length=0;await assert.rejects(m.vivaListeEkraniOku(s));assert.equal(calls.length,1)});
test('Yeni RPC doğrudan kullanılır; tekrar eden eski sayfa ve iptal eksik sonuç döndürmez',async()=>{let mode='new',calls=0;const db={rpc:async(name:string,args:Record<string,unknown>)=>{calls++;if(name==='viva_liste_ekrani')return mode==='new'?{data:{ok:true},error:null}:{data:null,error:{code:'PGRST202'}};if(args.p_islem==='baglam')return{data:{olusturabilir:true},error:null};return{data:{etkinlikler:[sample[0]],devam_var:true},error:null}}};const m=server(db),s=list.vivaListeSorgusu(new URLSearchParams({bolum:'yaklasan'}));await m.vivaListeEkraniOku(s);assert.equal(calls,1);mode='old';await assert.rejects(m.vivaListeEkraniOku(s),/Etkinlikler değişti/);const c=new AbortController();c.abort();await assert.rejects(m.vivaListeEkraniOku(s,c.signal))});

async function environment(handler:(url:string,init?:RequestInit)=>Promise<{status?:number;data:unknown}>|{status?:number;data:unknown}, pageUrl='http://localhost/viva/yayinlar'){
 const dom=new Window({url:pageUrl});
 for(const key of ['window','document','navigator','HTMLElement','HTMLButtonElement','HTMLInputElement','Element','Node','Event','MouseEvent','KeyboardEvent','MutationObserver','ResizeObserver','getComputedStyle'] as const)Object.defineProperty(globalThis,key,{configurable:true,value:key==='getComputedStyle'?dom.getComputedStyle.bind(dom):dom[key]});
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,requestAnimationFrame:dom.requestAnimationFrame.bind(dom),cancelAnimationFrame:dom.cancelAnimationFrame.bind(dom)});const {createRoot}=await import('react-dom/client');const c=dom.document.createElement('div');dom.document.body.append(c);const root=createRoot(c),requests:string[]=[];
 const fetcher=async(url:string,init?:RequestInit)=>{requests.push(url);const r=await handler(String(url),init);return{ok:!r.status||r.status<400,status:r.status??200,json:async()=>r.data}};
 const componentModule=load<{default:React.ComponentType}>('components/viva/VivaListeEkrani.tsx',{'react':React,'react/jsx-runtime':jsxRuntime,'next/link':{default:({children,...props}:React.ComponentProps<'a'>)=>React.createElement('a',props,children)},'lucide-react':icons,'radix-ui':radix,'@/components/ui/button':buttons,'@/components/ui/card':cards,'@/components/kontrol/SadeKontroller':controls,'@/components/ui/yenile-butonu':refresh,'@/components/ui/sayfa-yenile-basligi':heading,'@/lib/zaman/turkiye':time,'@/lib/viva/sozlesme':contract,'@/lib/viva/liste':list,'@/lib/viva/detay':detail,'./viva-liste.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})}},{window:dom,document:dom.document,fetch:fetcher});
 return{c,requests,render:()=>act(async()=>root.render(React.createElement(componentModule.default))),click:async(text:string)=>{const el=[...c.querySelectorAll('button')].find(b=>b.textContent===text||b.getAttribute('aria-label')===text);assert(el,text);await act(async()=>{if(el.getAttribute('role')==='tab')el.dispatchEvent(new dom.MouseEvent('mousedown',{bubbles:true,button:0,ctrlKey:false}));el.click()})},input:async(value:string)=>{const el=c.querySelector<HTMLInputElement>('[aria-label="Etkinlik ara"]')!;await act(async()=>{Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new dom.Event('input',{bubbles:true}))});await act(async()=>{await new Promise(resolve=>setTimeout(resolve,270))})},close:async()=>{await act(async()=>root.unmount());await dom.happyDOM.close()}};
}
const standard=(url:string)=>({data:response(list.vivaListeSorgusu(new URLSearchParams(url.split('?')[1])))});
test('İleri tarihli ve başlayan yayınlar ayrı sekmelerde filtrelenir ve sayfalanır',async()=>{const o=await environment(standard);try{await o.render();assert.equal(o.c.querySelectorAll('.eventCard').length,20);assert.equal(o.c.querySelectorAll('.liveCard').length,0);assert(![...o.c.querySelectorAll("a")].some(a=>["Şimdi başlat","Etkinlik planla"].includes(a.textContent??"")));await o.click('Daha fazla göster');assert.equal(o.c.querySelectorAll('.eventCard').length,25);await o.click('Başlayan Yayınlar');assert.equal(o.c.querySelectorAll('.eventCard').length,0);assert.equal(o.c.querySelectorAll('.liveCard').length,1);assert(o.c.querySelector(`a[href="/viva/${id(1)}/oda"]`));assert(o.c.textContent!.includes('1 etkinlik'));assert(!o.c.textContent!.includes('Gösterilecek etkinlik yok'));await o.click('İleri Tarihli Yayınlar');assert.equal(o.c.querySelectorAll('.eventCard').length,20);assert.equal(o.c.querySelectorAll('.liveCard').length,0)}finally{await o.close()}});
test('Liste seçimi etkinlik bağlantısına taşınır ve geri dönüşte yeniden seçilir',async()=>{
 const o=await environment(standard);try{
  await o.render();
  assert(o.c.querySelector(`a[href="/viva/${id(10)}?bolum=katilimcilar&kaynak=ileri-duzenlediklerim"]`));
  await o.click('Davet edildiklerim');
  assert(o.c.querySelector(`a[href="/viva/${id(60)}?bolum=katilimcilar&kaynak=ileri-davetlerim"]`));
  await o.click('Düzenlediklerim');
  await o.click('Başlayan Yayınlar');
  assert(o.c.querySelector(`a[href="/viva/${id(1)}?bolum=katilimcilar&kaynak=canli-duzenlediklerim"]`));
 }finally{await o.close()}
});
test('Listeye dönüş adresi Geçmiş ve Davet edildiklerim seçimini geri yükler',async()=>{
 const o=await environment(standard,'http://localhost/viva/yayinlar?kaynak=gecmis-davetlerim');try{
  await o.render();
  assert.equal(o.c.querySelector('[role=tab][aria-selected=true]')?.textContent,'Geçmiş');
  assert.equal(o.c.querySelector('[aria-label="Etkinlik kapsamı"] [aria-pressed=true]')?.textContent,'Davet edildiklerim');
  assert(o.requests.some(u=>u.includes('bolum=gecmis')&&u.includes('kapsam=davetlerim')));
 }finally{await o.close()}
});
test('Davetli görünümü oluşturma/taslak ve bilinmeyen katılımcı sayısını göstermez',async()=>{const o=await environment(url=>{const d=standard(url).data;return{data:{...d,olusturabilir:false,canlilar:d.canlilar.map(e=>({...e,yonetebilir:false,katilimci_sayisi:null})),etkinlikler:d.etkinlikler.map(e=>({...e,yonetebilir:false,katilimci_sayisi:null}))}}});try{await o.render();assert(!o.c.querySelector('a[href^="/viva/yeni"]'));assert(![...o.c.querySelectorAll('[role="tab"]')].some(b=>b.textContent==='Taslaklar'));assert(!o.c.textContent!.includes('0 katılımcı'));assert(!o.c.textContent!.includes('2 katılımcı'))}finally{await o.close()}});
test('Arama, yenilede seçimi koruma, ay ve tarih filtreleri APIye taşınır',async()=>{const o=await environment(standard);try{await o.render();await o.input('Etkinlik 34');assert.equal(o.c.querySelectorAll('.eventCard').length,1);await o.click('Yenile');assert.equal(o.c.querySelector<HTMLInputElement>('[aria-label="Etkinlik ara"]')!.value,'Etkinlik 34');assert(o.requests.at(-1)!.includes('arama=Etkinlik+34'));await o.click('Sonraki ay');const day=o.c.querySelector<HTMLButtonElement>('.days button')!;await act(async()=>day.click());assert(o.requests.at(-1)!.includes('gun='));assert(o.c.textContent!.includes('Tarihi temizle'))}finally{await o.close()}});
test('Yetki reddinde eski liste, takvim ve yönetim eylemleri kaldırılır',async()=>{let fail=false;const o=await environment(url=>fail?{status:403,data:{hata:'Erişim kapalı'}}:standard(url));try{await o.render();assert(o.c.textContent!.includes('Etkinlik 10'));fail=true;await o.click('Yenile');assert(o.c.textContent!.includes('Erişim kapalı'));assert(!o.c.textContent!.includes('Etkinlik 10'));assert(!o.c.querySelector('.dayDot'));assert(!o.c.querySelector('a[href^="/viva/yeni"]'))}finally{await o.close()}});
test('Eski filtre yanıtı güncel seçimi ezemez',async()=>{let pending:((r:{data:VivaListeYaniti})=>void)|undefined;const o=await environment(url=>url.includes('kapsam=davetlerim')?new Promise(resolve=>{pending=resolve}):standard(url));try{await o.render();await o.click('Davet edildiklerim');await o.click('Düzenlediklerim');assert(o.c.textContent!.includes('Etkinlik 10'));await act(async()=>pending?.({data:{...standard('/viva/api').data,etkinlikler:[],canlilar:[],toplam:0}}));assert(o.c.textContent!.includes('Etkinlik 10'));assert.equal(o.c.querySelector('[aria-pressed="true"]')?.textContent,'Düzenlediklerim')}finally{await o.close()}});

test('Liste API sınırı bozuk filtreyi DB çağrısından önce reddeder, yeni okumayı kullanıcı kapsamıyla yönlendirir',async()=>{
 let queries=0;let got:VivaListeSorgusu|undefined;
 class ApiError extends Error {status:number;constructor(message:string,status=400){super(message);this.status=status}}
 const m=load<{GET:(request:Request)=>Promise<Response>}>('app/(panel)/viva/api/route.ts',{'@/lib/viva/liste':list,'@/lib/viva/listeSunucu':{vivaListeEkraniOku:async(q:VivaListeSorgusu)=>{queries++;got=q;return response(q)}},'@/lib/viva/sunucu':{VivaHatasi:ApiError,vivaYanit:(d:unknown,status=200)=>Response.json(d,{status}),vivaHata:(e:ApiError)=>Response.json({hata:e.message},{status:e.status||500})},'@/lib/viva/yasamSunucu':{},'@/lib/viva/sozlesme':contract},{URL,Response});
 const bad=await m.GET(new Request('http://localhost/viva/api?islem=liste_ekrani&ay=2026-13'));assert.equal(bad.status,400);assert.equal(queries,0);
 const good=await m.GET(new Request('http://localhost/viva/api?islem=liste_ekrani&bolum=gecmis&kapsam=davetlerim&ay=2026-10'));assert.equal(good.status,200);assert.equal(queries,1);assert.equal(got?.bolum,'gecmis');assert.equal(got?.kapsam,'davetlerim');
});

test('Viva ana adresi oluşturma formunu açar; yayın listesi ve eski adresler doğru yere gider',async()=>{
 const form=()=>null,liste=()=>null;
 const redirect=(path:string):never=>{throw new Error(`REDIRECT:${path}`)};
 const modules={'react/jsx-runtime':jsxRuntime,'next/navigation':{redirect},'@/components/viva/VivaEkrani':{default:form},'@/lib/viva/detay':detail};
 type Page={default:(props:{searchParams:Promise<{tur?:string|string[];kaynak?:string}>})=>Promise<React.ReactElement<{ilkTur:string;gorunum:string}>>};
 const page=load<Page>('app/(panel)/viva/page.tsx',modules);
 for(const tur of [undefined,'planli','anlik','bad',['anlik']]){
  const el=await page.default({searchParams:Promise.resolve({tur})});assert.equal(el.type,form);assert.equal(el.props.gorunum,'yeni');assert.equal(el.props.ilkTur,tur==='anlik'?'anlik':'planli');
 }
 await assert.rejects(page.default({searchParams:Promise.resolve({kaynak:'gecmis-davetlerim'})}),/REDIRECT:\/viva\/yayinlar\?kaynak=gecmis-davetlerim/);
 const old=load<Page>('app/(panel)/viva/yeni/page.tsx',modules);
 for(const tur of [undefined,'planli','anlik','bad'])await assert.rejects(old.default({searchParams:Promise.resolve({tur})}),e=>e instanceof Error&&e.message===`REDIRECT:${tur==='anlik'?'/viva?tur=anlik':'/viva'}`);
 const listPage=load<{default:()=>React.ReactElement}>('app/(panel)/viva/yayinlar/page.tsx',{'react/jsx-runtime':jsxRuntime,'@/components/viva/VivaListeEkrani':{default:liste}});
 assert.equal(listPage.default().type,liste);
});
test('Viva Yayınlar breadcrumb ana girişe bağlanır ve liste sayfasını adlandırır',async()=>{
 const o=await environment(standard);try{await o.render();const nav=o.c.querySelector('nav[aria-label="İçerik konumu"]')!;assert.equal(nav.querySelector('a')?.getAttribute('href'),'/viva');assert.equal(nav.querySelector('[aria-current=page]')?.textContent,'Viva Yayınlar');assert.equal(o.c.querySelector("h1"),null);assert.equal(o.c.querySelector('img[alt="Viva"]'),null);assert(!o.c.textContent!.includes("Cogniti canlı yayın platformu."));}finally{await o.close();}
});

test('İleri tarihli: başlangıç sınırı; başlayan: canlı durum ve bitiş sınırı; kapsam ayrımı',()=>{
 const s=list.vivaListeSorgusu(new URLSearchParams());
 const items=[make(1,1),make(2,-.01),make(3,0),make(4,-.01,{durum:'canli'}),make(5,-1,{durum:'canli'}),make(6,1,{durum:'taslak'}),make(7,1,{durum:'iptal'}),make(8,1,{yonetebilir:false})];
 assert.deepEqual(list.vivaListeHesapla(items,s,true,now).etkinlikler.map(e=>e.etkinlik_id),[id(1),id(8)]);
 assert.deepEqual(list.vivaListeHesapla(items,{...s,bolum:'canli'},true,now).etkinlikler.map(e=>e.etkinlik_id),[id(4)]);
 assert.deepEqual(list.vivaListeHesapla(items,{...s,kapsam:'davetlerim'},true,now).etkinlikler.map(e=>e.etkinlik_id),[id(8)]);
});
test('Yeni filtreler mevcut RPC tüm sayfalarından doğru sayaç, davetli sayısı ve takvim üretir',async()=>{
 const calls:Record<string,unknown>[]=[];
 const db={rpc:async(_name:string,args:Record<string,unknown>)=>{const q=args.p_veri as VivaListeSorgusu;calls.push(q as unknown as Record<string,unknown>);return {data:response(q),error:null}}};
 const m=server(db),s=list.vivaListeSorgusu(new URLSearchParams());
 const future=await m.vivaListeEkraniOku(s);assert.equal(future.toplam,26);assert.equal(future.etkinlikler.length,20);assert.equal(future.etkinlikler[0].katilimci_sayisi,2);assert(calls.every(q=>q.bolum==='yaklasan'));assert.equal(calls.length,2);
 const live=await m.vivaListeEkraniOku({...s,bolum:'canli'});assert.equal(live.toplam,1);assert.equal(live.etkinlikler[0].etkinlik_id,id(1));assert.equal(live.devam_var,false);
 const next=await m.vivaListeEkraniOku({...s,offset:20});assert.equal(next.etkinlikler.length,6);assert.equal(next.toplam,26);
});

test('Taslak da diğer yayınlar gibi ortak detay sayfasına açılır; filtre kaynağı korunur',async()=>{
 const o=await environment(standard);try{await o.render();await o.click('Taslaklar');
  assert(o.c.querySelector(`a[href="/viva/${id(50)}?bolum=katilimcilar&kaynak=taslak-duzenlediklerim"]`));assert.equal(o.c.querySelector(`a[href="/viva/${id(50)}/duzenle"]`),null);
 }finally{await o.close()}
});
