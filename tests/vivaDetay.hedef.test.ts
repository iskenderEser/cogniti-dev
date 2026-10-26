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
import * as davetSecimi from '@/lib/viva/davetSecimi';
const id=(n=1)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const e={etkinlik_id:id(),baslik:'Buluşma',aciklama:'Açıklama',baslangic:'2027-01-01T21:30:00Z',bitis:'2027-01-01T22:00:00Z',durum:'planlandi',surum:3,sahip_id:id(),sahip_adi:'Düzenleyen',firma_adi:'Firma',yonetebilir:true,oda_acik:true,yayin_turu:'planli'};
const kisi={id:id(2),tur:'ic',ad:'İlker Test',alt:'utt',eposta:'ilker@example.invalid'};
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
 const modules:Record<string,unknown>={react:React,'react/jsx-runtime':jsxRuntime,'next/link':{default:({children,...p}:React.ComponentProps<'a'>)=>React.createElement('a',p,children)},'next/navigation':{useRouter:()=>({push:(p:string)=>paths.push(p),replace:(p:string)=>paths.push(p)})},'lucide-react':icons,'radix-ui':radix,'@/components/ui/button':buttons,'@/components/ui/card':cards,'@/components/ui/input':inputs,'@/components/ui/label':labels,'@/components/kontrol/SadeKontroller':controls,'@/components/ui/alert-dialog':dialogs,'@/components/ui/sayfa-yenile-basligi':heading,'@/components/ui/yenile-butonu':refresh,'@/lib/viva/sozlesme':contract,'@/lib/viva/eposta':eposta,'@/lib/viva/davetSecimi':davetSecimi,'@/lib/viva/detay':detail,'@/lib/utils/roller':roles,'@/lib/viva/takvim':calendar,'@/lib/viva/indirme':download,'./viva.module.css':style,'./viva-oda.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./viva-form.module.css':style,'./viva-detay.module.css':style,'./VivaOdaAlani':{default:()=>null},'./VivaEpostaAlani':{default:()=>null}};
 const context={fetch:fetcher,window:dom,document:dom.document,navigator:dom.navigator};
 const kaydirma=load('components/viva/VivaKaydirilabilirTablo.tsx',modules,context);modules['./VivaKaydirilabilirTablo']=kaydirma;
 const kayit=load('components/viva/VivaKayitlar.tsx',modules,context);
 modules['./VivaKayitlar']=kayit;modules['./VivaDetayIcerigi']=load('components/viva/VivaDetayIcerigi.tsx',modules,context);
 const components={detail:load('components/viva/VivaEkrani.tsx',modules,context).default,records:kayit.default,library:load('components/viva/VivaKayitKutuphanesi.tsx',modules,context).default,scroll:kaydirma.default};
 return{c,doc:dom.document,requests,paths,links,
 render:async(kind:keyof typeof components='detail',props:Record<string,unknown>={})=>act(async()=>root.render(React.createElement(components[kind],kind==='detail'?{gorunum:'detay',etkinlikId:id(),...props}:props))),
 click:async(text:string,dialog=false)=>{const b=[...dom.document.querySelectorAll<HTMLButtonElement>(dialog?'[role=alertdialog] button':'button')].find(x=>x.textContent===text||x.getAttribute('aria-label')===text);assert(b,text);await act(async()=>b.click())},
 tab:async(text:string)=>{const b=[...c.querySelectorAll('[role=tab]')].find(x=>x.textContent===text);assert(b,text);await act(async()=>b.dispatchEvent(new dom.KeyboardEvent('keydown',{key:'Enter',bubbles:true})))},
 input:async(selector:string,value:string)=>{const el=c.querySelector<HTMLInputElement>(selector);assert(el,selector);await act(async()=>{Object.getOwnPropertyDescriptor(dom.HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new dom.Event('input',{bubbles:true}))})},
 close:async()=>{await act(async()=>root.unmount());await dom.happyDOM.close()}
 };
}
test('detay bölüm ve giriş dönüş yolları yalnız izinli Viva adreslerine açılır',()=>{
 assert.equal(detail.vivaDetayBolumu(['kayitlar']),'katilimcilar');assert.equal(detail.vivaDetayBolumu('ozet'),'katilimcilar');assert.equal(detail.vivaDetayBolumu('yanlis'),'katilimcilar');assert.equal(detail.vivaDetayYolu(id()),`/viva/${id()}?bolum=katilimcilar`);assert.equal(detail.vivaDetayBolumu('anket'),'katilimcilar');
 for(const p of [`/viva/${id()}?bolum=katilimcilar`,'/viva/kayitlar','/viva/yeni?tur=anlik',`/viva/${id()}?kaynak=gecmis-duzenlediklerim`,`/viva/${id()}?bolum=kayitlar&kaynak=canli-davetlerim`,'/viva/yayinlar?kaynak=gecmis-duzenlediklerim','/viva/yayinlar','/viva?tur=anlik','/viva?tur=planli'])assert.equal(contract.vivaDonusYolu(`?viva=${encodeURIComponent(p)}`),p);
 for(const p of [`/viva/${id()}?bolum=ozet`,`/viva/${id()}?bolum=yanlis`,`/viva/${id()}?bolum=anket`,`/viva/${id()}?bolum=anket&next=https://evil.test`,`/viva/${id()}?bolum=anket&bolum=kayitlar`,`/viva/${id()}?kaynak=gecmis-davetlerim&next=https://evil.test`,`/viva/${id()}?kaynak=taslak-davetlerim`,'/viva?kaynak=gecmis-yanlis','/viva/yayinlar?kaynak=taslak-davetlerim','/viva/yayinlar?next=https://evil.test','/viva?tur=anlik&next=https://evil.test','/viva/../../admin','//evil.test'])assert.equal(contract.vivaDonusYolu(`?viva=${encodeURIComponent(p)}`),null);
 assert.equal(contract.vivaDonusYolu('?viva='+encodeURIComponent('/viva?kaynak=gecmis-duzenlediklerim')),'/viva/yayinlar?kaynak=gecmis-duzenlediklerim');
 assert.throws(()=>detail.vivaKayitSayfasi(new URLSearchParams('offset=-1')));assert.throws(()=>detail.vivaKayitSayfasi(new URLSearchParams('offset=1.5')));
});
test('Detay başlığı liste seçimini gösterir ve sekmelerde korur; alt geri dönüş bağlantısı yoktur',async()=>{
 const source=detail.vivaListeKaynagi('gecmis-duzenlediklerim');
 assert.equal(detail.vivaListeKaynakEtiketi(source!),'Geçmiş Düzenledikleriniz');
 assert.equal(detail.vivaListeKaynakEtiketi(detail.vivaListeKaynagi('canli-davetlerim')!),'Başlayan Yayınlar · Davet Edildikleriniz');
 assert.equal(detail.vivaListeKaynagi('gecmis-davetlerim<script>'),null);
 assert.equal(detail.vivaDetayYolu(id(),'kayitlar',source),`/viva/${id()}?bolum=kayitlar&kaynak=gecmis-duzenlediklerim`);
 const o=await ortam(url=>({data:url.includes('baglam')?baglam:url.includes('/api/kayit?')?{kayitlar:[],indirme_bitis:null,suresi_doldu:false}:detay}));try{
  await o.render('detail',{listeKaynagi:source});
  assert.equal(o.c.querySelector('.sourceContext')?.textContent,'Geçmiş Düzenledikleriniz');
  const breadcrumb=o.c.querySelector('nav[aria-label="İçerik konumu"]')!;assert.equal([...breadcrumb.querySelectorAll('a')].find(a=>a.textContent==='Viva')?.getAttribute('href'),'/viva');assert.equal([...breadcrumb.querySelectorAll('a')].find(a=>a.textContent==='Viva Yayınlar')?.getAttribute('href'),'/viva/yayinlar?kaynak=gecmis-duzenlediklerim');
  assert(!o.c.textContent!.includes('Viva etkinliklerine dön'));
  assert(!o.c.querySelector('.backLink'));
  await o.tab('Yayın kayıtları');
  await o.tab('Katılımcılar ve davetler');
  assert.equal(o.paths.at(-1),`/viva/${id()}?bolum=katilimcilar&kaynak=gecmis-duzenlediklerim`);
 }finally{await o.close()}
});
test('sahip iki bölümü değiştirir; genel bakış yoktur ve doğrudan kayıt bağlantısı yalnız kayıt verisini yükler',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?baglam:url.includes('/api/kayit?')?{kayitlar:[],indirme_bitis:null,suresi_doldu:false}:detay}));
 try{await o.render('detail',{ilkBolum:'kayitlar'});assert.equal(o.c.querySelectorAll('[role=tab]').length,2);assert(!o.c.textContent!.includes('Genel bakış'));assert(o.c.querySelector('[aria-label="Viva kayıtları"]'));await o.tab('Katılımcılar ve davetler');assert.match(o.c.textContent!,/İlker Test/);assert.equal(o.paths.at(-1),`/viva/${id()}?bolum=katilimcilar`);await o.input('[aria-label="Etkinlik katılımcılarını ara"]','ilker');assert.match(o.c.textContent!,/İlker Test/);await o.click('Yenile');assert.equal(o.c.querySelector<HTMLInputElement>('[aria-label="Etkinlik katılımcılarını ara"]')!.value,'ilker');assert.equal(o.c.querySelector('[role=tab][aria-selected=true]')!.textContent,'Katılımcılar ve davetler');}finally{await o.close()}
});
test('davetli yönetim bölümüne yönlendirilse de yalnız etkinlik özetini görür',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?{...baglam,olusturabilir:false}:{...detay,etkinlik:{...e,yonetebilir:false}}}));
 try{await o.render('detail',{ilkBolum:'kayitlar'});assert(!o.c.querySelector('[role=tab]'));assert(!o.c.textContent!.includes('İlker Test'));assert(!o.c.querySelector('a[href="/viva/kayitlar"]'));assert(!o.requests.some(r=>r.url.includes('/api/kayit')));assert(o.c.textContent!.includes('Etkinlik detayları'))}finally{await o.close()}
});
test('üç kapalı durumda katılımcı düzenleme gizlenir; üst kartın düzenle ve iptal düğmeleri pasiftir',async()=>{
 const now=Date.now(), zaman=(dakika:number)=>new Date(now+dakika*60_000).toISOString();
 const senaryolar=[
  {durum:'planlandi',baslangic:zaman(-10),bitis:zaman(20),acik:false},
  {durum:'planlandi',baslangic:zaman(-40),bitis:zaman(-10),acik:false},
  {durum:'sona_erdi',baslangic:zaman(-10),bitis:zaman(20),acik:false},
  {durum:'sona_erdi',baslangic:zaman(-40),bitis:zaman(-10),acik:false},
  {durum:'planlandi',baslangic:zaman(10),bitis:zaman(40),acik:true},
 ] as const;
 for(const senaryo of senaryolar){
  const o=await ortam(url=>({data:url.includes('baglam')?baglam:{...detay,etkinlik:{...e,...senaryo}}}));
  try{
   await o.render();
   const baglantilar=[...o.c.querySelectorAll('a')];
   assert.equal(baglantilar.some(a=>a.textContent==='Katılımcıları düzenle'),senaryo.acik);
   assert.equal(baglantilar.some(a=>a.textContent==='Düzenle'),senaryo.acik);
   const iptal=[...o.c.querySelectorAll<HTMLButtonElement>('.summaryCard button')].find(b=>b.textContent==='Etkinliği iptal et');assert(iptal);assert.equal(iptal.disabled,!senaryo.acik);
   if(!senaryo.acik){const duzenle=[...o.c.querySelectorAll<HTMLButtonElement>('.summaryCard button')].find(b=>b.textContent==='Düzenle');assert(duzenle?.disabled);await o.click('Etkinliği iptal et');assert(!o.doc.querySelector('[role=alertdialog]'));}
  }finally{await o.close()}
 }
});
test('üst kart pill ifadeleri gerçek yayın durumu ve beş dakika sınırına göre hesaplanır',()=>{
 const simdi=Date.parse('2026-10-26T14:00:00Z');
 const zaman=(fark:number)=>new Date(simdi+fark).toISOString();
 const etkinlik={...e,baslangic:zaman(-3600_000),bitis:zaman(3600_000)} as contract.VivaEtkinlik;
 for(const [degisiklik,etiket,pasif] of [
  [{durum:'planlandi',baslangic:zaman(60_000)},'Planlandı',false],
  [{durum:'planlandi',yayin_basladi:false},'Gerçekleşmedi',true],
  [{durum:'iptal'},'İptal Edildi',true],
  [{durum:'canli',yayin_baslangici:zaman(-299_999)},'Başladı',false],
  [{durum:'canli',yayin_baslangici:zaman(-300_000)},'Devam ediyor',false],
  [{durum:'canli',yayin_baslangici:zaman(-120_000)},'Başladı',false],
  [{durum:'canli',yayin_baslangici:null},'Başladı',false],
  [{durum:'sona_erdi',yayin_basladi:true},'Gerçekleşti',true],
  [{durum:'sona_erdi',yayin_basladi:true,bitis:zaman(-60_000)},'Gerçekleşti',true],
  [{durum:'sona_erdi',yayin_basladi:false,bitis:zaman(-60_000)},'Gerçekleşmedi',true],
  [{durum:'canli',yayin_basladi:true,bitis:zaman(-1)},'Gerçekleşti',true],
 ] as const){const durum=detail.vivaDetayKartDurumu({...etkinlik,...degisiklik},simdi);assert.equal(durum.etiket,etiket);assert.equal(durum.eylemlerKapali,pasif);}
});
test('üst kart gerçek etiketini basar; bitmiş yayında iki düğme pasif kalır',async()=>{
 const simdi=Date.now();
 for(const [etkinlik,etiket] of [
  [{...e,durum:'planlandi',baslangic:new Date(simdi-600_000).toISOString(),bitis:new Date(simdi-300_000).toISOString(),oda_acik:false},'Gerçekleşmedi'],
  [{...e,durum:'sona_erdi',yayin_basladi:true,oda_acik:false},'Gerçekleşti'],
  [{...e,durum:'canli',yayin_baslangici:new Date(simdi-600_000).toISOString()},'Devam ediyor'],
 ] as const){const o=await ortam(url=>({data:url.includes('baglam')?baglam:{...detay,etkinlik}}));try{await o.render();assert.equal(o.c.querySelector('.summaryCard .pill')?.textContent,etiket);}finally{await o.close()}}
});
test('katılımcı tablosu eczane adı, ad soyad, unvan ve kayıtlı e-postayı dört sütunda gösterir',async()=>{
 const eclubKisi={...kisi,tur:'eclub',alt:'eczaci',eczane_adi:'Örnek Eczanesi'};
 const o=await ortam(url=>({data:url.includes('baglam')?baglam:{...detay,katilimcilar:[eclubKisi]}}));try{
  await o.render();
  const tablo=o.c.querySelector('table[aria-label="Etkinlik katılımcıları"]');assert(tablo);
  assert.deepEqual([...tablo.querySelectorAll('th')].map(x=>x.textContent),['Eczane Adı','Ad Soyad','Unvan','E-posta']);
  const hucreler=[...tablo.querySelectorAll('tbody tr:first-child td')];assert.equal(hucreler.length,4);
  assert.equal(hucreler[0].textContent,eclubKisi.eczane_adi);assert.match(hucreler[1].textContent!,/İlker Test/);assert.equal(hucreler[2].textContent,roles.ROL_ADLARI.eczaci);assert.equal(hucreler[3].textContent,kisi.eposta);
  assert(o.c.querySelector('.participantHead input[aria-label="Etkinlik katılımcılarını ara"]'));
  await o.input('[aria-label="Etkinlik katılımcılarını ara"]','  ÖRNEK  ');
  assert.equal(o.c.querySelectorAll('table[aria-label="Etkinlik katılımcıları"] tbody tr').length,1);
  await o.input('[aria-label="Etkinlik katılımcılarını ara"]','olmayan eczane');
  assert.equal(o.c.querySelectorAll('table[aria-label="Etkinlik katılımcıları"] tbody tr').length,1);assert(o.c.querySelector('table[aria-label="Etkinlik katılımcıları"] td[colspan="4"]'));
  assert.match(o.c.textContent!,/Eşleşen katılımcı bulunmuyor/);
 }finally{await o.close()}
});
test('özel davetliler dört sütunda gösterilir ve ad veya kurum adına göre aranır',async()=>{
 const davetler=[{davet_id:id(8),ad:'Deniz Test',eposta:'deniz@example.invalid',iptal:false,kurum_adi:'Örnek Kurum',unvan:'Eğitmen'},
  {davet_id:id(9),ad:'Ece Test',eposta:'ece@example.invalid',iptal:true}];
 const o=await ortam(url=>({data:url.includes('baglam')?baglam:{...detay,davetler}}));try{
  await o.render();
  const tablo=o.c.querySelector('table[aria-label="Özel davetliler"]');assert(tablo);
  assert.deepEqual([...tablo.querySelectorAll('th')].map(x=>x.textContent),['Kurum Adı','Ad Soyad','Unvan','E-posta']);
  const satirlar=[...tablo.querySelectorAll('tbody tr')];assert.equal(satirlar.length,2);
  const hucreler=satirlar[0].querySelectorAll('td');assert.equal(hucreler[0].textContent,'Örnek Kurum');assert.match(hucreler[1].textContent!,/Deniz Test/);assert.equal(hucreler[2].textContent,'Eğitmen');assert.equal(hucreler[3].textContent,'deniz@example.invalid');
  assert.equal(satirlar[1].querySelectorAll('td')[0].textContent,'—');assert.equal(satirlar[1].querySelectorAll('td')[2].textContent,'—');
  assert(o.c.querySelector('.participantHead input[aria-label="Özel davetlileri ara"]'));
  await o.input('[aria-label="Özel davetlileri ara"]',' ÖRNEK ');assert.equal(o.c.querySelectorAll('table[aria-label="Özel davetliler"] tbody tr').length,1);
  await o.input('[aria-label="Özel davetlileri ara"]','ece');assert.match(o.c.querySelector('table[aria-label="Özel davetliler"]')!.textContent!,/Ece Test/);
  await o.input('[aria-label="Özel davetlileri ara"]','olmayan kurum');assert.match(o.c.textContent!,/Eşleşen özel davetli bulunmuyor/);
 }finally{await o.close()}
});
test('özel davetli listesi boşken de dört sütun başlığı görünür',async()=>{
 const o=await ortam();try{
  await o.render();
  const tablo=o.c.querySelector('table[aria-label="Özel davetliler"]');assert(tablo);
  assert.deepEqual([...tablo.querySelectorAll('th')].map(x=>x.textContent),['Kurum Adı','Ad Soyad','Unvan','E-posta']);
  assert.equal(tablo.querySelector('td[colspan="4"]')?.textContent,'Henüz özel davetli bulunmuyor.');
  assert(!o.c.textContent!.includes('Misafir, bağlantıyla'));assert(!o.c.textContent!.includes('Davet listesi'));
 }finally{await o.close()}
});
test('on satırdan sonra iki kartın da listesi içeride kaydırılır; aramada sınır yeniden hesaplanır',async()=>{
 const katilimcilar=Array.from({length:12},(_,i)=>({...kisi,id:id(100+i),ad:`Katılımcı ${i}`}));
 const davetler=Array.from({length:12},(_,i)=>({davet_id:id(200+i),ad:`Misafir ${i}`,eposta:`misafir${i}@example.invalid`,iptal:false}));
 const o=await ortam(url=>({data:url.includes('baglam')?baglam:{...detay,katilimcilar,davetler}}));try{
  await o.render();assert.equal(o.c.querySelectorAll('.participantTableWrap[data-scrollable="true"]').length,2);
  assert.equal(o.c.querySelectorAll('table[aria-label="Etkinlik katılımcıları"] tbody tr').length,12);
  assert.equal(o.c.querySelectorAll('table[aria-label="Özel davetliler"] tbody tr').length,12);
  await o.input('[aria-label="Etkinlik katılımcılarını ara"]','Katılımcı 11');
  assert.equal(o.c.querySelector('[aria-label="Etkinlik katılımcıları listesi"]')?.hasAttribute('data-scrollable'),false);
  assert.equal(o.c.querySelectorAll('.participantTableWrap[data-scrollable="true"]').length,1);
 }finally{await o.close()}
});
test('kaydırma alanı değişken yükseklikteki ilk on satırı ölçer; on satıra dönünce sınırı kaldırır',async()=>{
 const tablo=(adet:number)=>React.createElement('table',{ref:(el:HTMLTableElement|null)=>{
  if(!el)return;el.tHead!.getBoundingClientRect=()=>({height:30} as DOMRect);
  el.querySelectorAll('tbody > tr').forEach((r,i)=>{r.getBoundingClientRect=()=>({height:i===0?60:40} as DOMRect)});
 }},React.createElement('thead',null,React.createElement('tr',null,React.createElement('th',null,'Başlık'))),React.createElement('tbody',null,Array.from({length:adet},(_,i)=>React.createElement('tr',{key:i},React.createElement('td',null,`Satır ${i}`)))));
 const o=await ortam();try{
  await o.render('scroll',{satirSayisi:11,etiket:'Deneme',children:tablo(11)});
  const alan=o.c.querySelector<HTMLElement>('[role=region]')!;assert.equal(alan.style.maxHeight,'450px');assert.equal(alan.tabIndex,0);
  alan.scrollTop=100;await o.render('scroll',{satirSayisi:11,etiket:'Deneme',arama:'yeni',children:tablo(11)});assert.equal(alan.scrollTop,0);
  await o.render('scroll',{satirSayisi:10,etiket:'Deneme',children:tablo(10)});assert.equal(alan.style.maxHeight,'');assert(!alan.hasAttribute('tabindex'));
 }finally{await o.close()}
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
 try{await o.render();assert.match(o.c.querySelector('.detailMeta')!.textContent!,/23:30 – 2 Ocak 2027 · 00:30/);assert(!o.c.querySelector('.compactDetails'));}finally{await o.close();}
});
test('aynı Türkiye gününde biten etkinlik detayında zaman satırı tarihi yinelemez',async()=>{
 const o=await ortam();try{await o.render();assert.match(o.c.querySelector('.detailMeta')!.textContent!,/00:30 – 01:00 · 30 dakika/);assert(!o.c.querySelector('.compactDetails'));}finally{await o.close();}
});

test('Dört yayın filtresi aynı detay, sekme ve dört sütunlu kart yapısını açar; izinler duruma göre korunur',async()=>{
 const gelecek=new Date(Date.now()+86400000).toISOString(),gecmis=new Date(Date.now()-86400000).toISOString();
 const durumlar=[
  {kaynak:'ileri-duzenlediklerim',durum:'planlandi',baslangic:gelecek,oda_acik:true,yayin_turu:'planli',duzenle:true},
  {kaynak:'canli-duzenlediklerim',durum:'canli',baslangic:new Date().toISOString(),oda_acik:true,yayin_turu:'planli',duzenle:false},
  {kaynak:'gecmis-duzenlediklerim',durum:'sona_erdi',baslangic:gecmis,oda_acik:false,yayin_turu:'anlik',duzenle:false},
  {kaynak:'taslak-duzenlediklerim',durum:'taslak',baslangic:gelecek,oda_acik:false,yayin_turu:'planli',duzenle:true},
 ];
 for(const d of durumlar){
  const etkinlik={...e,...d,bitis:new Date(Date.parse(d.baslangic)+3600000).toISOString()};
  const o=await ortam(url=>({data:url.includes('baglam')?baglam:{...detay,etkinlik,katilimcilar:d.durum==='taslak'?[]:[kisi]}}));
  try{await o.render('detail',{listeKaynagi:d.kaynak});
   assert.equal(o.c.querySelectorAll('.summaryCard').length,1,d.kaynak);assert.equal(o.c.querySelectorAll('.pane').length,2,d.kaynak);
   assert.deepEqual([...o.c.querySelectorAll('[role=tab]')].map(x=>x.textContent),['Katılımcılar ve davetler','Yayın kayıtları']);
   for(const label of ['Etkinlik katılımcıları','Özel davetliler'])assert.equal(o.c.querySelectorAll(`table[aria-label="${label}"] th`).length,4,d.kaynak);
   assert.equal(o.c.querySelector('form'),null,d.kaynak);assert.equal(o.c.querySelector('#viva-misafir-ad'),null,d.kaynak);
   assert.equal([...o.c.querySelectorAll('a')].some(x=>x.textContent==='Katılımcıları düzenle'),d.duzenle,d.kaynak);
   assert.equal(o.c.querySelectorAll('.participantAction').length,0,d.kaynak);
  }finally{await o.close()}
 }
});

test('Katılımcı türüne göre ilk sütun firma, eczane veya karma başlık kullanır; her satır kendi kurumunu gösterir',async()=>{
 const calisan={...kisi,firma_adi:'Örnek İlaç',eczane_adi:'Yanlış eczane'};
 const uye={...kisi,id:id(7),tur:'eclub',alt:'eczaci',ad:'Ece Test',eczane_adi:'Umut Eczanesi',firma_adi:'Yanlış firma'};
 for(const [katilimcilar,baslik,degerler] of [
  [[calisan],'Firma Adı',['Örnek İlaç']],
  [[uye],'Eczane Adı',['Umut Eczanesi']],
  [[calisan,uye],'Eczane / Firma Adı',['Örnek İlaç','Umut Eczanesi']],
 ] as const){
  const o=await ortam(url=>({data:url.includes('baglam')?baglam:{...detay,katilimcilar}}));
  try{await o.render();const tablo=o.c.querySelector('table[aria-label="Etkinlik katılımcıları"]')!;
   assert.equal(tablo.querySelector('th')?.textContent,baslik);assert.deepEqual([...tablo.querySelectorAll('tbody tr td:first-child')].map(x=>x.textContent),degerler);
   await o.input('[aria-label="Etkinlik katılımcılarını ara"]',katilimcilar[0].tur==='ic'?'İLAÇ':'UMUT');
   assert.equal(tablo.querySelectorAll('tbody tr').length,1);assert.equal(tablo.querySelector('tbody td')?.textContent,degerler[0]);assert.equal(tablo.querySelector('th')?.textContent,baslik);
  }finally{await o.close()}
 }
});
