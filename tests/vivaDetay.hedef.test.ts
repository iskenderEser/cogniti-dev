import './_viva-dom.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React, { act } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { Window } from 'happy-dom';
import { webcrypto } from 'node:crypto';
import * as icons from 'lucide-react';
import * as radix from 'radix-ui';
import * as buttons from '@/components/ui/button';
import * as cards from '@/components/ui/card';
import * as inputs from '@/components/ui/input';
import * as labels from '@/components/ui/label';
import * as controls from '@/components/kontrol/SadeKontroller';
import * as dialogs from '@/components/ui/alert-dialog';
import * as heading from '@/components/ui/sayfa-yenile-basligi';
import * as refresh from '@/components/ui/yenile-butonu';
import * as contract from '@/lib/viva/sozlesme';
import * as detail from '@/lib/viva/detay';
import * as roles from '@/lib/utils/roller';
import * as calendar from '@/lib/viva/takvim';
import * as download from '@/lib/viva/indirme';
import * as eposta from '@/lib/viva/eposta';
const id=(n=1)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const e={etkinlik_id:id(),baslik:'Buluşma',aciklama:'Açıklama',baslangic:'2027-01-01T21:30:00Z',bitis:'2027-01-01T22:00:00Z',durum:'planlandi',surum:3,sahip_id:id(),sahip_adi:'Düzenleyen',firma_adi:'Firma',yonetebilir:true,oda_acik:true,yayin_turu:'planli'};
const kisi={id:id(2),tur:'ic',ad:'İlker Test',alt:'utt'};
const detay={etkinlik:e,katilimcilar:[kisi],davetler:[]};
const baglam={olusturabilir:true,kapsam:'Firma',kisiler:[kisi]};
type ResponseData={status?:number;data:unknown};
function load(file:string,modules:Record<string,unknown>,context:Record<string,unknown>) {
 const exports:Record<string,React.ComponentType<any>>={};
 const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:(n:string)=>{assert(n in modules,n);return modules[n]},Date,Error,URL,URLSearchParams,AbortController,crypto:webcrypto,encodeURIComponent,setTimeout,clearTimeout,console,...context});return exports;
}
async function ortam(handler:(url:string,init?:RequestInit)=>ResponseData|Promise<ResponseData> = (url)=>({data:url.includes('baglam')?baglam:detay})) {
 const dom=new Window({url:'http://localhost/viva'});
 for(const k of ['window','document','navigator','HTMLElement','HTMLButtonElement','HTMLInputElement','HTMLSelectElement','HTMLTextAreaElement','HTMLDivElement','DocumentFragment','Element','Node','NodeFilter','Event','MouseEvent','KeyboardEvent','CustomEvent','MutationObserver','ResizeObserver','getComputedStyle'] as const)Object.defineProperty(globalThis,k,{configurable:true,value:k==='getComputedStyle'?dom.getComputedStyle.bind(dom):dom[k]});
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,requestAnimationFrame:dom.requestAnimationFrame.bind(dom),cancelAnimationFrame:dom.cancelAnimationFrame.bind(dom)});
 Object.defineProperty(dom.document,'hidden',{configurable:true,value:false});
 const {createRoot}=await import('react-dom/client');const c=dom.document.createElement('div');dom.document.body.append(c);const root=createRoot(c),requests:{url:string;init?:RequestInit}[]=[],paths:string[]=[],links:string[]=[];
 dom.HTMLAnchorElement.prototype.click=function(){links.push(this.href)};
 const fetcher=async(url:string,init?:RequestInit)=>{requests.push({url:String(url),init});const r=await handler(String(url),init);return{ok:!r.status||r.status<400,status:r.status??200,json:async()=>r.data}};
 const style={default:new Proxy({},{get:(_,k)=>String(k)})};
 const modules:Record<string,unknown>={react:React,'react/jsx-runtime':jsxRuntime,'next/link':{default:({children,...p}:React.ComponentProps<'a'>)=>React.createElement('a',p,children)},'next/navigation':{useRouter:()=>({push:(p:string)=>paths.push(p),replace:(p:string)=>paths.push(p)})},'lucide-react':icons,'radix-ui':radix,'@/components/ui/button':buttons,'@/components/ui/card':cards,'@/components/ui/input':inputs,'@/components/ui/label':labels,'@/components/kontrol/SadeKontroller':controls,'@/components/ui/alert-dialog':dialogs,'@/components/ui/sayfa-yenile-basligi':heading,'@/components/ui/yenile-butonu':refresh,'@/lib/viva/sozlesme':contract,'@/lib/viva/eposta':eposta,'@/lib/viva/detay':detail,'@/lib/utils/roller':roles,'@/lib/viva/takvim':calendar,'@/lib/viva/indirme':download,'./viva.module.css':style,'./viva-oda.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./viva-form.module.css':style,'./viva-detay.module.css':style,'./VivaOdaAlani':{default:()=>null},'./VivaEpostaAlani':{default:()=>null}};
 const context={fetch:fetcher,window:dom,document:dom.document,navigator:dom.navigator};
 modules['@/lib/viva/anketArsiv']=load('lib/viva/anketArsiv.ts',modules,context);
 const arsiv=load('components/viva/VivaAnketArsivi.tsx',modules,context),kayit=load('components/viva/VivaKayitlar.tsx',modules,context);
 modules['./VivaAnketArsivi']=arsiv;modules['./VivaKayitlar']=kayit;modules['./VivaDetayIcerigi']=load('components/viva/VivaDetayIcerigi.tsx',modules,context);
 const components={detail:load('components/viva/VivaEkrani.tsx',modules,context).default,archive:arsiv.default,records:kayit.default,library:load('components/viva/VivaKayitKutuphanesi.tsx',modules,context).default};
 return{c,doc:dom.document,requests,paths,links,
 render:async(kind:keyof typeof components='detail',props:Record<string,unknown>={})=>act(async()=>root.render(React.createElement(components[kind],kind==='detail'?{gorunum:'detay',etkinlikId:id(),...props}:props))),
 click:async(text:string,dialog=false)=>{const b=[...dom.document.querySelectorAll<HTMLButtonElement>(dialog?'[role=alertdialog] button':'button')].find(x=>x.textContent===text||x.getAttribute('aria-label')===text);assert(b,text);await act(async()=>b.click())},
 tab:async(text:string)=>{const b=[...c.querySelectorAll('[role=tab]')].find(x=>x.textContent===text);assert(b,text);await act(async()=>b.dispatchEvent(new dom.KeyboardEvent('keydown',{key:'Enter',bubbles:true})))},
 input:async(selector:string,value:string)=>{const el=c.querySelector<HTMLInputElement>(selector);assert(el,selector);await act(async()=>{Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new dom.Event('input',{bubbles:true}))})},
 close:async()=>{await act(async()=>root.unmount());await dom.happyDOM.close()}
 };
}
test('detay bölüm ve giriş dönüş yolları yalnız izinli Viva adreslerine açılır',()=>{
 assert.equal(detail.vivaDetayBolumu(['kayitlar']),'ozet');assert.equal(detail.vivaDetayBolumu('yanlis'),'ozet');assert.equal(detail.vivaDetayYolu(id(),'anket'),`/viva/${id()}?bolum=anket`);
 for(const p of [`/viva/${id()}?bolum=katilimcilar`,'/viva/kayitlar','/viva/yeni?tur=anlik'])assert.equal(contract.vivaDonusYolu(`?viva=${encodeURIComponent(p)}`),p);
 for(const p of [`/viva/${id()}?bolum=yanlis`,`/viva/${id()}?bolum=anket&next=https://evil.test`,`/viva/${id()}?bolum=anket&bolum=kayitlar`,'/viva/../../admin','//evil.test'])assert.equal(contract.vivaDonusYolu(`?viva=${encodeURIComponent(p)}`),null);
 assert.throws(()=>detail.vivaKayitSayfasi(new URLSearchParams('offset=-1')));assert.throws(()=>detail.vivaKayitSayfasi(new URLSearchParams('offset=1.5')));
});
test('sahip dört bölümü değiştirir; doğrudan kayıt bağlantısı yalnız kayıt verisini yükler',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?baglam:url.includes('/api/kayit?')?{kayitlar:[],indirme_bitis:null,suresi_doldu:false}:detay}));
 try{await o.render('detail',{ilkBolum:'kayitlar'});assert.equal(o.c.querySelectorAll('[role=tab]').length,4);assert(o.c.querySelector('[aria-label="Viva kayıtları"]'));assert(!o.requests.some(r=>r.url.includes('/api/anket')));await o.tab('Katılımcılar ve davetler');assert.match(o.c.textContent!,/İlker Test/);assert.equal(o.paths.at(-1),`/viva/${id()}?bolum=katilimcilar`);await o.input('[aria-label="Etkinlik katılımcılarını ara"]','ilker');assert.match(o.c.textContent!,/İlker Test/);await o.click('Yenile');assert.equal(o.c.querySelector<HTMLInputElement>('[aria-label="Etkinlik katılımcılarını ara"]')!.value,'ilker');assert.equal(o.c.querySelector('[role=tab][aria-selected=true]')!.textContent,'Katılımcılar ve davetler');}finally{await o.close()}
});
test('davetli yönetim bölümüne yönlendirilse de yalnız genel bakış görür',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?{...baglam,olusturabilir:false}:{...detay,etkinlik:{...e,yonetebilir:false}}}));
 try{await o.render('detail',{ilkBolum:'anket'});assert(!o.c.querySelector('[role=tab]'));assert(!o.c.textContent!.includes('İlker Test'));assert(!o.c.querySelector('a[href="/viva/kayitlar"]'));assert(!o.requests.some(r=>r.url.includes('/api/anket')||r.url.includes('/api/kayit')));assert(o.c.textContent!.includes('Bu buluşma hakkında'))}finally{await o.close()}
});
test('katılımcı çıkarma onaydan önce yazmaz; sürümü ve gerçek kişi kimliğini gönderir',async()=>{
 const posts:Record<string,unknown>[]=[];const o=await ortam((url,init)=>{if(init?.method==='POST'){posts.push(JSON.parse(String(init.body)));return{data:{mesaj:'Erişim kapandı'}}}return{data:url.includes('baglam')?baglam:detay}});
 try{await o.render('detail',{ilkBolum:'katilimcilar'});await o.click('Katılımcıyı çıkar');assert.equal(posts.length,0);await o.click('Vazgeç',true);assert.equal(posts.length,0);await o.click('Katılımcıyı çıkar');await o.click('Katılımcıyı çıkar',true);assert.equal(posts.length,1);assert.equal(posts[0].surum,3);assert.equal(posts[0].kisi_id,kisi.id);assert.equal(posts[0].islem,'katilimci_cikar');assert.equal(posts[0].tur,'ic')}finally{await o.close()}
});
test('etkinlik iptal onayı güncel sürümü gönderir ve oda eylemlerini kaldırır',async()=>{
 const posts:Record<string,unknown>[]=[];const o=await ortam((url,init)=>{if(init?.method==='POST'){posts.push(JSON.parse(String(init.body)));return{data:{...detay,etkinlik:{...e,durum:'iptal',oda_acik:false,surum:4}}}}return{data:url.includes('baglam')?baglam:detay}});
 try{await o.render();await o.click('Etkinliği iptal et');assert.equal(posts.length,0);await o.click('Etkinliği iptal et',true);assert.equal(posts[0].surum,3);assert.equal(posts[0].islem,'iptal');assert.match(o.c.textContent!,/Etkinlik iptal edildi/);assert(!o.c.querySelector(`a[href="/viva/${id()}/oda"]`))}finally{await o.close()}
});
test('sona eren etkinlikte davet geçmişi okunur, yeni davet veya iptal işlemi açılmaz',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?baglam:{...detay,etkinlik:{...e,durum:'sona_erdi',oda_acik:false},davetler:[{davet_id:id(8),ad:'Eski Misafir',eposta:'sentetik@example.invalid',iptal:true}]}}));
 try{await o.render('detail',{ilkBolum:'katilimcilar'});assert.match(o.c.textContent!,/Eski Misafir/);assert(!o.c.querySelector('#viva-misafir-ad'));assert(![...o.c.querySelectorAll('button')].some(b=>b.textContent==='Daveti iptal et'||b.textContent==='Katılımcıyı çıkar'))}finally{await o.close()}
});
test('detay yenilemesinde erişim reddi önceki kişileri ve yönetim bağlantılarını kaldırır',async()=>{
 let kapali=false;const o=await ortam(url=>kapali?{status:403,data:{hata:'Erişim kapalı'}}:{data:url.includes('baglam')?baglam:detay});
 try{await o.render('detail',{ilkBolum:'katilimcilar'});assert.match(o.c.textContent!,/İlker Test/);kapali=true;await o.click('Yenile');assert(!o.c.textContent!.includes('İlker Test'));assert(!o.c.querySelector('[role=tab]'));assert.match(o.c.textContent!,/Erişim kapalı/)}finally{await o.close()}
});
const anket={soru:{id:id(9),question:'Konu anlaşılır mı?',options:['Evet','Kısmen']},acik:false,sayilar:[3,1],secim:null,surum:3,acildi:'2026-10-25T21:30:00Z',kapandi:'2026-10-25T22:00:00Z'};
test('anket arşivi gerçek sayılardan yüzdeleri çıkarır, Türkiye tarihini gösterir ve yetki reddinde sonuçları temizler',async()=>{
 let kapali=false;const o=await ortam(()=>kapali?{status:403,data:{hata:'Anket erişimi yok'}}:{data:{oturumlar:[anket],sorular:[]}});
 try{await o.render('archive',{etkinlikId:id()});const meters=o.c.querySelectorAll('[role=meter]');assert.equal(meters.length,2);assert.equal(meters[0].getAttribute('aria-valuenow'),'75');assert.match(o.c.textContent!,/4 cevap/);assert.match(o.c.textContent!,/26 Eki 2026/);kapali=true;await o.click('Sonuçları yenile');assert.equal(o.c.querySelectorAll('[role=meter]').length,0);assert.match(o.c.textContent!,/Anket erişimi yok/)}finally{await o.close()}
});
test('anket boş ve sıfır cevap durumunda hayali cevap veya NaN üretmez',async()=>{
 const o=await ortam(()=>({data:{oturumlar:[{...anket,sayilar:[0,0]}],sorular:[]}}));try{await o.render('archive',{etkinlikId:id()});assert.match(o.c.textContent!,/0 cevap/);assert(!o.c.textContent!.includes('NaN'));assert.equal(o.c.querySelector('[role=meter]')!.getAttribute('aria-valuenow'),'0')}finally{await o.close()}
 const b=await ortam(()=>({data:{oturumlar:[],sorular:[{id:id(9)}]}}));try{await b.render('archive',{etkinlikId:id()});assert.match(b.c.textContent!,/1 soru yayın odasında hazır bekliyor/)}finally{await b.close()}
});
const kayit={anahtar:'daily:test',id:id(20),baslangic:'2026-10-25T10:00:00Z',sure:125,durum:'hazir'};
test('kayıt parçaları hazır/hazırlanıyor/hata durumlarını ayırır; video ve sohbet mevcut APIden ayrı istenir',async()=>{
 const o=await ortam(url=>({data:url.includes('&id=')?{url:`https://b.daily.co/${url.includes('tur=sohbet')?'chat.vtt':'video'}`}:{kayitlar:[kayit,{...kayit,anahtar:'prepare',id:null,durum:'hazirlaniyor'},{...kayit,anahtar:'error',id:null,durum:'hata'}],indirme_bitis:null,suresi_doldu:false}}));
 try{await o.render('records',{etkinlikId:id(),canli:false,detayTasarimi:true});assert.match(o.c.textContent!,/Dosya hazırlanıyor/);assert.match(o.c.textContent!,/Kayıt hatası/);assert.equal([...o.c.querySelectorAll('button')].filter(b=>b.textContent?.includes('indir')).length,2);await o.click('Videoyu indir');await o.click('Sohbet metnini indir');assert.equal(o.links.length,2);assert(o.requests.some(r=>r.url.includes(`id=${id(20)}&tur=video`)));assert(o.requests.some(r=>r.url.includes(`id=${id(20)}&tur=sohbet`)));assert.match(o.c.textContent!,/3 dakika/)}finally{await o.close()}
});
test('sunucunun süre doldu yanıtı iki indirmeyi de kapatır; süresi dolmuş kayıtta dosya isteği yapılmaz',async()=>{
 const o=await ortam(()=>({data:{kayitlar:[kayit],indirme_bitis:'2026-01-01T10:00:00Z',suresi_doldu:true}}));try{await o.render('records',{etkinlikId:id(),canli:false,detayTasarimi:true});assert.match(o.c.textContent!,/7 günlük indirme süresi doldu/);assert(o.c.querySelectorAll('button')[1].disabled);await o.click('Videoyu indir');assert.equal(o.requests.length,1)}finally{await o.close()}
});
test('indirme sırasında 410 yanıtında süre doldu görünür ve dosya açılmaz',async()=>{
 const o=await ortam(url=>url.includes('&id=')?{status:410,data:{hata:'7 günlük indirme süresi doldu'}}:{data:{kayitlar:[kayit],indirme_bitis:null,suresi_doldu:false}});
 try{await o.render('records',{etkinlikId:id(),canli:false,detayTasarimi:true});await o.click('Videoyu indir');assert.equal(o.links.length,0);assert.match(o.c.textContent!,/7 günlük indirme süresi doldu/);assert(!o.c.querySelector('button')!.disabled)}finally{await o.close()}
});
test('kayıt yenileme eski dosyaları yetki hatasında göstermeye devam etmez',async()=>{
 let kapali=false;const o=await ortam((_url,init)=>init?.method==='POST'?{data:{}}:kapali?{status:403,data:{hata:'Kayıt erişimi yok'}}:{data:{kayitlar:[kayit],indirme_bitis:null,suresi_doldu:false}});
 try{await o.render('records',{etkinlikId:id(),canli:false,detayTasarimi:true});assert.match(o.c.textContent!,/Parça 1/);kapali=true;await o.click('Kayıtları güncelle');assert(!o.c.textContent!.includes('Parça 1'));assert.match(o.c.textContent!,/Kayıt erişimi yok/)}finally{await o.close()}
});
test('birleşik kayıt listesi 20+1 sayfalar; gerçek bölüm bağlantısı üretir ve erişim reddinde temizlenir',async()=>{
 let kapali=false;const list=Array.from({length:21},(_,i)=>({etkinlik:{...e,etkinlik_id:id(i+50),baslik:`Kayıt ${i}`},kayit_sayisi:2,indirme_bitis:null,suresi_doldu:false}));
 const o=await ortam(url=>kapali?{status:403,data:{hata:'Erişim kapalı'}}:{data:{olusturabilir:true,toplam:21,devam_var:!url.includes('offset=20'),etkinlikler:url.includes('offset=20')?list.slice(20):list.slice(0,20)}});
 try{await o.render('library');assert.equal(o.c.querySelectorAll('.recordCard').length,20);assert(o.c.querySelector(`a[href="/viva/${id(50)}?bolum=kayitlar"]`));await o.click('Daha fazla göster');assert.equal(o.c.querySelectorAll('.recordCard').length,21);kapali=true;await o.click('Yenile');assert.equal(o.c.querySelectorAll('.recordCard').length,0);assert.match(o.c.textContent!,/Erişim kapalı/)}finally{await o.close()}
});
test('birleşik kayıt listesinde E-Club üyesi dosya bağlantısı görmez; boş sahip listesi açık anlatılır',async()=>{
 for(const owner of [true,false]){const o=await ortam(()=>({data:{olusturabilir:owner,toplam:0,devam_var:false,etkinlikler:[]}}));try{await o.render('library');assert.match(o.c.textContent!,owner?/Henüz kayıt bulunmuyor/:/Kayıtlar düzenleyene aittir/);assert(!o.c.querySelector('a[href*="bolum=kayitlar"]'))}finally{await o.close()}}
});
test('kütüphane API bozuk sayfayı DBden önce reddeder; sunucu okuması kullanıcı kapsamını taşır ve eksik kurulum açık hata verir',async()=>{
 const calls:unknown[]=[];class Hata extends Error{status:number;constructor(s:string,status=400){super(s);this.status=status}}
 const modules:Record<string,unknown>={'server-only':{},'./sunucu':{vivaKullanici:async()=>({user:{id:id()},db:{rpc:async(n:string,p:unknown)=>{calls.push([n,p]);return{data:{olusturabilir:true,etkinlikler:[],devam_var:false,toplam:0},error:null}}}}),VivaHatasi:Hata}};
 const server=load('lib/viva/kayitKutuphaneSunucu.ts',modules,{});await (server.vivaKayitKutuphanesiOku as any)(20);assert.deepEqual(JSON.parse(JSON.stringify(calls)),[['viva_kayit_kutuphanesi',{p_auth:id(),p_offset:20}]]);
 modules['./sunucu']={vivaKullanici:async()=>({user:{id:id()},db:{rpc:async()=>({data:null,error:{code:'PGRST202'}})}}),VivaHatasi:Hata};
 const missing=load('lib/viva/kayitKutuphaneSunucu.ts',modules,{});await assert.rejects((missing.vivaKayitKutuphanesiOku as any)(0),/SQL kurulumu bekleniyor/);
 let dbCalls=0;const route=load('app/(panel)/viva/api/kayit-kutuphanesi/route.ts',{'@/lib/viva/detay':detail,'@/lib/viva/kayitKutuphaneSunucu':{vivaKayitKutuphanesiOku:async()=>{dbCalls++;return{}}},'@/lib/viva/sunucu':{VivaHatasi:Hata,vivaYanit:(v:unknown)=>Response.json(v),vivaHata:(e:Hata)=>Response.json({hata:e.message},{status:e.status})}},{Request,Response});
 const get=route.GET as any;assert.equal((await get(new Request('http://localhost/viva/api/kayit-kutuphanesi?offset=-1'))).status,400);assert.equal(dbCalls,0);await get(new Request('http://localhost/viva/api/kayit-kutuphanesi'));assert.equal(dbCalls,1);
});
test('kayıt bölümünden ayrıldıktan sonra geciken indirme yanıtı dosya açamaz',async()=>{
 let cevap:((r:ResponseData)=>void)|undefined;
 const o=await ortam(url=>url.includes('&id=')?new Promise(resolve=>{cevap=resolve}):url.includes('kayit-kutuphanesi')?{data:{olusturabilir:true,etkinlikler:[],devam_var:false,toplam:0}}:{data:{kayitlar:[kayit],indirme_bitis:null,suresi_doldu:false}});
 try{await o.render('records',{etkinlikId:id(),canli:false,detayTasarimi:true});await o.click('Videoyu indir');assert(cevap);await o.render('library');await act(async()=>cevap?.({data:{url:'https://b.daily.co/late-file'}}));assert.equal(o.links.length,0)}finally{await o.close()}
});


test('gece yarısını aşan etkinlik detayında Türkiye bitiş günü her iki zaman alanında görünür',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?baglam:{...detay,etkinlik:{...e,baslangic:'2027-01-01T20:30:00Z',bitis:'2027-01-01T21:30:00Z'}}}));
 try{await o.render();assert.match(o.c.querySelector('.detailMeta')!.textContent!,/23:30 – 2 Ocak 2027 · 00:30/);assert.match(o.c.querySelector('.compactDetails')!.textContent!,/23:30 – 2 Ocak 2027 · 00:30/);}finally{await o.close();}
});
test('aynı Türkiye gününde biten etkinlik detayında zaman satırı tarihi yinelemez',async()=>{
 const o=await ortam();try{await o.render();assert.match(o.c.querySelector('.detailMeta')!.textContent!,/00:30 – 01:00 · 30 dakika/);assert.match(o.c.querySelector('.compactDetails')!.textContent!,/00:30 – 01:00 · Türkiye saati/);}finally{await o.close();}
});
