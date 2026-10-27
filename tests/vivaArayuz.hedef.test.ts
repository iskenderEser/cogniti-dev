import './_viva-dom.mjs';
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import React, { act } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { webcrypto } from "node:crypto";
import { Window } from "happy-dom";
import * as sozlesme from "@/lib/viva/sozlesme";
import * as eposta from "@/lib/viva/eposta";
import * as davetSecimi from "@/lib/viva/davetSecimi";
import * as takvim from "@/lib/viva/takvim";
import * as buttons from "@/components/ui/button";
import * as cards from "@/components/ui/card";
import * as inputs from "@/components/ui/input";
import * as labels from "@/components/ui/label";
import * as kontroller from "@/components/kontrol/SadeKontroller";
import * as dialogs from "@/components/ui/alert-dialog";
import * as icons from "lucide-react";
import vivaStyles from "@/components/viva/viva.module.css";
import * as heading from "@/components/ui/sayfa-yenile-basligi";
import * as refresh from "@/components/ui/yenile-butonu";
import * as detayHelper from "@/lib/viva/detay";
import * as roles from "@/lib/utils/roller";
import * as radix from "radix-ui";

const id="00000000-0000-4000-8000-000000000001";
const e={etkinlik_id:id,baslik:"Tanıtım",aciklama:"Açıklama",baslangic:"2027-01-01T21:30:00Z",bitis:"2027-01-01T22:00:00Z",durum:"planlandi",surum:1,sahip_id:id,sahip_adi:"Örnek Kişi",firma_adi:"Firma",yonetebilir:true,oda_acik:true};
async function ortam(handler:(url:string,init?:RequestInit)=>{status?:number;data:unknown}|Promise<{status?:number;data:unknown}>) {
 const dom=new Window({url:"http://localhost/viva"});
 for(const key of ["window","document","navigator","HTMLElement","HTMLButtonElement","HTMLInputElement","HTMLTextAreaElement","HTMLSelectElement","HTMLDivElement","DocumentFragment","CustomEvent","NodeFilter","Element","Node","Event","MouseEvent","KeyboardEvent","MutationObserver","ResizeObserver","getComputedStyle"] as const) Object.defineProperty(globalThis,key,{configurable:true,value:key==='getComputedStyle'?dom.getComputedStyle.bind(dom):dom[key]});
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true,requestAnimationFrame:dom.requestAnimationFrame.bind(dom),cancelAnimationFrame:dom.cancelAnimationFrame.bind(dom)});
 const {createRoot}=await import('react-dom/client');const c=dom.document.createElement('div');dom.document.body.append(c);const root=createRoot(c);const paths:string[]=[];
 const fetcher=async(url:string,init?:RequestInit)=>{const r=await handler(String(url),init);return{ok:!r.status||r.status<400,status:r.status??200,json:async()=>r.data};};
 const acilan:string[]=[];dom.open=(url:string)=>{acilan.push(String(url));return null;};
 const indirilen:string[]=[];const dosyalar:Blob[]=[];
 dom.HTMLAnchorElement.prototype.click=function(){indirilen.push(this.download);};
 class TestURL extends URL { static createObjectURL(blob:Blob){dosyalar.push(blob);return 'blob:viva-test';}static revokeObjectURL(){} }
 const modules:Record<string,unknown>={react:React,'react/jsx-runtime':jsxRuntime,'next/link':{default:({children,...props}:React.ComponentProps<'a'>)=>React.createElement('a',props,children)},'next/navigation':{useRouter:()=>({push:(path:string)=>paths.push(path),replace:(path:string)=>paths.push(path)})},
 '@/components/ui/button':buttons,'@/components/ui/card':cards,'@/components/ui/input':inputs,'@/components/ui/label':labels,'@/components/kontrol/SadeKontroller':kontroller,'@/components/ui/alert-dialog':dialogs,'lucide-react':icons,'@/lib/viva/sozlesme':sozlesme,
 './VivaOdaAlani':{default:(props:{etkinlikId?:string;davetToken?:string;otomatikKatil?:boolean})=>React.createElement('section',{'aria-label':'Viva yayın alanı','data-etkinlik':props.etkinlikId,'data-misafir':!!props.davetToken,'data-otomatik':!!props.otomatikKatil},'Görüşmeye katıl')},
 './VivaKayitlar':{default:()=>null},'@/lib/viva/takvim':takvim,
 '@/components/ui/sayfa-yenile-basligi':heading,'@/components/ui/yenile-butonu':refresh,'@/lib/viva/detay':detayHelper,'@/lib/utils/roller':roles,'radix-ui':radix,'./viva-detay.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./viva-yardimci.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./viva-oda.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./viva-form.module.css':{default:new Proxy({},{get:(_,k)=>String(k)})},'./viva.module.css':{default:vivaStyles},'@/components/marka/CognitiLogo':{default:()=>React.createElement('span',null,'Cogniti')}};
 function yukle(file:string){const exports:Record<string,React.ComponentType<Record<string,unknown>>>= {};const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:(name:string)=>{assert.ok(name in modules,name);return modules[name];},window:dom,document:dom.document,navigator:dom.navigator,fetch:fetcher,AbortController,crypto:webcrypto,Error,URL:TestURL,Blob,setTimeout:(fn:()=>void)=>{fn();return 0;},encodeURIComponent,console});return exports;}
 modules['./VivaDurumAlani']=yukle('components/viva/VivaDurumAlani.tsx');
 modules['./VivaKaydirilabilirTablo']=yukle('components/viva/VivaKaydirilabilirTablo.tsx');
 modules['./VivaDetayIcerigi']=yukle('components/viva/VivaDetayIcerigi.tsx');
 modules['@/lib/viva/eposta']=eposta;modules['@/lib/viva/davetSecimi']=davetSecimi;
 modules['./viva-eposta.module.css']={default:new Proxy({},{get:(_,k)=>String(k)})};
 modules['./VivaEpostaAlani']=yukle('components/viva/VivaEpostaAlani.tsx');
 modules['./viva-saat.module.css']={default:new Proxy({},{get:(_,k)=>String(k)})};
 modules['./VivaSaatSecimi']=yukle('components/viva/VivaSaatSecimi.tsx');
 const viva=yukle('components/viva/VivaEkrani.tsx');modules['./VivaEkrani']=viva;
 return{c,doc:dom.document,paths,acilan,indirilen,dosyalar,render:async(props:Record<string,unknown>,guest=false)=>{const comp=guest?yukle('components/viva/VivaMisafir.tsx').default:viva.default;await act(async()=>{root.render(React.createElement(comp,props));});},
 confirm:async(text:string)=>{const b=[...dom.document.querySelectorAll('[role=alertdialog] button')].find(x=>x.textContent===text);assert.ok(b,text);await act(async()=>(b as HTMLElement).click());},
 click:async(text:string)=>{const b=[...c.querySelectorAll('button')].find(x=>x.textContent===text);assert.ok(b,text);await act(async()=>b.click());},
 input:async(selector:string,value:string)=>{const el=c.querySelector<HTMLInputElement>(selector) ?? dom.document.querySelector<HTMLInputElement>(`[role=dialog] ${selector}`);assert.ok(el,selector);await act(async()=>{const setter=Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?dom.HTMLTextAreaElement.prototype:dom.HTMLInputElement.prototype,'value')!.set!;setter.call(el,value);el.dispatchEvent(new dom.Event('input',{bubbles:true}));});},
  submit:async(selector='form')=>{const form=c.querySelector(selector) ?? dom.document.querySelector(`[role=dialog] ${selector}`);assert.ok(form);await act(async()=>form.dispatchEvent(new dom.Event('submit',{bubbles:true,cancelable:true})));},
 close:async()=>{await act(async()=>root.unmount());await dom.happyDOM.close();}};
}
test('üye Viva listesinde etkinlik görebilir; oluşturma eylemi sunulmaz',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?{olusturabilir:false,kapsam:'Davetler',kisiler:[]}:{etkinlikler:[{...e,yonetebilir:false}],devam_var:false}}));
 try{await o.render({gorunum:'liste'});assert.match(o.c.textContent!,/Tanıtım/);assert.equal([...o.c.querySelectorAll('a')].some(x=>x.getAttribute('href')==='/viva/yeni'),false);}finally{await o.close();}
});
test('form Türkiye saatini gönderir; yanıt kaybında aynı işlem anahtarını korur',async()=>{
 const istekler:Record<string,unknown>[]=[];
 const o=await ortam((_url,init)=>{if(init?.method==='POST'){const body=JSON.parse(String(init.body));istekler.push(body);return istekler.length===1?{status:503,data:{hata:'Bağlantı kesildi'}}:{data:{etkinlik:{...e,etkinlik_id:body.etkinlik_id},katilimcilar:[],davetler:[]}};}return{data:{olusturabilir:true,kapsam:'Kendi takımınız',kisiler:[]}};});
 try{await o.render({gorunum:'yeni'});await o.click('Planlı Etkinlik');await o.input('#viva-baslik','Eğitim');await o.input('#viva-tarih','2027-01-02');await o.input('#viva-saat','00:30');await o.input('#viva-sure','30');await o.submit();assert.match(o.c.textContent!,/Bağlantı kesildi/);await o.submit();assert.equal(istekler.length,2);assert.equal(istekler[0].baslangic,'2027-01-01T21:30:00.000Z');assert.equal(istekler[0].bitis,'2027-01-01T22:00:00.000Z');assert.equal(istekler[0].etkinlik_id,istekler[1].etkinlik_id);assert.equal(o.paths.length,1);}finally{await o.close();}
});
test('yayın odası kamera, mikrofon veya sohbet kontrollerini yeniden üretmez',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?{olusturabilir:false,kapsam:'Davet',kisiler:[]}:{etkinlik:{...e,yonetebilir:false},katilimcilar:[],davetler:[]}}));
 try{await o.render({gorunum:'oda',etkinlikId:id});assert.ok(o.c.querySelector('[aria-label="Viva yayın alanı"]'));assert.match(o.c.textContent!,/Görüşmeye katıl/);assert.equal(o.c.querySelector('header'),null);assert.equal(o.c.querySelector('h1'),null);assert(!o.c.textContent!.includes('Tanıtım'));assert(!o.c.textContent!.includes('Etkinlik bilgileri'));assert.equal(o.c.querySelector('button[aria-label="Yenile"]'),null);for(const text of ['Mikrofon','Kamera','Sohbet','El kaldır'])assert.equal([...o.c.querySelectorAll('button')].some(x=>x.textContent===text),false);}finally{await o.close();}
});
test('erişim kontrolü başarısız olduğunda önceki etkinlik verisi kaldırılır',async()=>{
 let kapali=false;const o=await ortam(url=>kapali?{status:403,data:{hata:'Erişim kapalı'}}:{data:url.includes('baglam')?{olusturabilir:false,kapsam:'Davet',kisiler:[]}:{etkinlik:e,katilimcilar:[],davetler:[]}});
 try{await o.render({gorunum:'oda',etkinlikId:id});assert.ok(o.c.querySelector('[aria-label="Viva yayın alanı"]'));kapali=true;Object.defineProperty(o.doc,'visibilityState',{configurable:true,value:'visible'});await act(async()=>o.doc.dispatchEvent(new o.doc.defaultView!.Event('visibilitychange')));assert.match(o.c.textContent!,/Erişim kapalı/);assert.equal(o.c.querySelector('[aria-label="Viva yayın alanı"]'),null);}finally{await o.close();}
});
test('misafir e-posta koduyla doğrulanır; iptal kontrolünde oda kapanır',async()=>{
 let iptal=false;const bodyler:Record<string,unknown>[]=[];const b={baslik:'Tanıtım',aciklama:'',baslangic:e.baslangic,bitis:e.bitis,ad:'Misafir',eposta_maskeli:'m***@example.test',dogrulandi:false};
 const o=await ortam((_url,init)=>{if(iptal)return{status:403,data:{hata:'Davet iptal edildi'}};if(init?.method==='POST'){const body=JSON.parse(String(init.body));bodyler.push(body);return{data:body.islem==='kod'?{mesaj:'Kod gönderildi'}:{...b,dogrulandi:true}};}return{data:b};});
 try{await o.render({token:'test-token'},true);assert.equal(o.c.querySelector('[aria-label="Viva yayın alanı"]'),null);await o.click('E-posta doğrulama kodu gönder');assert.match(o.c.textContent!,/Kod gönderildi/);await o.input('#viva-kod','123456');await o.submit();await o.click('Yayın odasını aç');assert.ok(o.c.querySelector('[aria-label="Viva yayın alanı"]'));assert.deepEqual(bodyler.map(x=>x.islem),['kod','dogrula']);iptal=true;await o.click('Daveti yeniden kontrol et');assert.equal(o.c.querySelector('[aria-label="Viva yayın alanı"]'),null);}finally{await o.close();}
});

test('iç kullanıcı planlanmış etkinlik oluşturur ve detayına yönlenir',async()=>{
 const istekler:Record<string,unknown>[]=[];
 const o=await ortam((_url,init)=>{if(init?.method==='POST'){const body=JSON.parse(String(init.body));istekler.push(body);return{data:{etkinlik:{...e,etkinlik_id:body.etkinlik_id},katilimcilar:[],davetler:[]}};}return{data:{olusturabilir:true,kapsam:'Kendi bölgeniz',kisiler:[]}};});
 try{await o.render({gorunum:'yeni'});await o.click('Planlı Etkinlik');await o.input('#viva-baslik','Planlanmış tanıtım');await o.input('#viva-tarih','2027-01-02');await o.input('#viva-saat','00:30');await o.input('#viva-sure','30');await o.submit();assert.equal(istekler.length,1);assert.equal(istekler[0].islem,'olustur');assert.equal(istekler[0].durum,'planlandi');assert.equal(o.paths[0],`/viva/${istekler[0].etkinlik_id}`);}finally{await o.close();}
});
test('önce yayın türü seçilir; tarih değiştirmek saat atamaz veya seçili saati değiştirmez',async()=>{
 const istekler:unknown[]=[];const o=await ortam((_url,init)=>{if(init?.method==='POST')istekler.push(init.body);return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}};});
 try{await o.render({gorunum:'yeni'});assert.equal(o.c.querySelector('#viva-tarih'),null);assert.equal(o.c.querySelector('#viva-saat'),null);
  await o.click('Planlı Etkinlik');await o.input('#viva-baslik','Plan');await o.input('#viva-tarih','2027-01-02');assert.equal(o.c.querySelector<HTMLInputElement>('#viva-saat')!.value,'');
  await o.submit();assert.equal(istekler.length,0);assert.match(o.c.textContent!,/tarih ve saat seçin/);
  await o.input('#viva-saat','14:20');await o.input('#viva-tarih','2027-01-03');assert.equal(o.c.querySelector<HTMLInputElement>('#viva-saat')!.value,'14:20');
  await o.click('Anlık Etkinlik');assert.equal(o.c.querySelector('#viva-tarih'),null);assert.equal(o.c.querySelector('#viva-saat'),null);
 }finally{await o.close();}
});
test('anlık yayında tarih gönderilmez; yanıt kaybında aynı anahtarla yeniden denenir ve oda açılır',async()=>{
 const istekler:Record<string,unknown>[]=[];const o=await ortam((_url,init)=>{if(init?.method==='POST'){const b=JSON.parse(String(init.body));istekler.push(b);return istekler.length===1?{status:503,data:{hata:'Yanıt kayboldu'}}:{data:{etkinlik:{...e,yayin_turu:'anlik',etkinlik_id:b.etkinlik_id},katilimcilar:[],davetler:[]}};}return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}};});
 try{await o.render({gorunum:'yeni'});await o.click('Anlık Etkinlik');await o.input('#viva-baslik','Anlık');await o.input('#viva-sure','45');await o.submit();await o.submit();
  assert.equal(istekler.length,2);assert.equal(istekler[0].yayin_turu,'anlik');assert.equal(istekler[0].sure_dakika,45);assert.equal('baslangic' in istekler[0],false);assert.equal('bitis' in istekler[0],false);assert.equal(istekler[0].etkinlik_id,istekler[1].etkinlik_id);assert.equal(o.paths[0],`/viva/${istekler[0].etkinlik_id}/oda?baslat=1`);
 }finally{await o.close();}
});
test('planlanan yayın iki takvim düğmesi sunar; aynı tarih ve Viva bağlantısı aktarılır',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?{olusturabilir:false,kapsam:'Davet',kisiler:[]}:{etkinlik:{...e,yonetebilir:false},katilimcilar:[],davetler:[]}}));
 try{await o.render({gorunum:'detay',etkinlikId:id});assert.equal(o.c.querySelector('[aria-label="Yayını takvime ekle"]')!.querySelectorAll('button').length,2);await o.click('Google Takvim’e ekle');const g=new URL(o.acilan[0]);assert.equal(g.searchParams.get('text'),e.baslik);assert.equal(g.searchParams.get('location'),`http://localhost/viva/${id}`);
  await o.click('Outlook Takvim’e ekle');assert.deepEqual(o.indirilen,[`viva-${id}.ics`]);const ics=await o.dosyalar[0].text();assert.match(ics,/DTSTART:20270101T213000Z/);assert.ok(ics.includes(`URL:http://localhost/viva/${id}`));
 }finally{await o.close();}
});
test('anlık, taslak ve iptal edilmiş yayınlarda takvim düğmeleri yoktur',async()=>{
 for(const ek of [{yayin_turu:'anlik'},{durum:'taslak'},{durum:'iptal'}]){const o=await ortam(url=>({data:url.includes('baglam')?{olusturabilir:false,kapsam:'Davet',kisiler:[]}:{etkinlik:{...e,...ek,yonetebilir:false},katilimcilar:[],davetler:[]}}));try{await o.render({gorunum:'detay',etkinlikId:id});assert.equal(o.c.querySelector('[aria-label="Yayını takvime ekle"]'),null);}finally{await o.close();}}
});
test('anlık başlangıç yalnız etkinlik sahibinin anlık yayınında otomatik katılıma dönüşür',async()=>{
 for(const [sahip,tur,beklenen] of [[true,'anlik','true'],[false,'anlik','false'],[true,'planli','false']] as const){
  const o=await ortam(url=>({data:url.includes('baglam')?{olusturabilir:sahip,kapsam:'Firma',kisiler:[]}:{etkinlik:{...e,yonetebilir:sahip,yayin_turu:tur},katilimcilar:[],davetler:[]}}));
  try{await o.render({gorunum:'oda',etkinlikId:id,anlikBaslat:true});assert.equal(o.c.querySelector('[aria-label="Viva yayın alanı"]')!.getAttribute('data-otomatik'),beklenen);}finally{await o.close();}
 }
});
test('taslak kaydetme ayrı bir eylemdir; planlanmış yayının durumu yanlışlıkla taslağa dönmez',async()=>{
 const istekler:Record<string,unknown>[]=[];
 const o=await ortam((_url,init)=>{if(init?.method==='POST'){const b=JSON.parse(String(init.body));istekler.push(b);return{data:{etkinlik:{...e,durum:'taslak'},katilimcilar:[],davetler:[]}};}return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}};});
 try{await o.render({gorunum:'yeni'});await o.click('Planlı Etkinlik');await o.input('#viva-baslik','Taslak');await o.input('#viva-tarih','2027-01-02');await o.input('#viva-saat','12:00');await o.click('Taslak olarak kaydet');assert.equal(istekler.length,1);assert.equal(istekler[0].durum,'taslak');assert.equal(istekler[0].yayin_turu,'planli');}finally{await o.close();}
});
test('düzenlemede kapsamdan çıkan katılımcı kaldırılmadan kayıt gönderilmez',async()=>{
 const istekler:Record<string,unknown>[]=[];const detay={etkinlik:e,katilimcilar:[{id,tur:'eclub',ad:'Eski katılımcı',alt:'Eczacı'}],davetler:[]};
 const o=await ortam((url,init)=>{if(init?.method==='POST'){istekler.push(JSON.parse(String(init.body)));return{data:{...detay,katilimcilar:[]}};}return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Kendi bölgeniz',kisiler:[]}:detay};});
 try{await o.render({gorunum:'duzenle',etkinlikId:id});await o.submit();assert.equal(istekler.length,0);assert.match(o.c.textContent!,/Artık kapsamınızda olmayan seçimleri kaldırın/);await o.click('Geçersiz seçimleri kaldır');await o.submit();assert.equal(istekler[0].islem,'kaydet');assert.equal(istekler[0].surum,1);assert.deepEqual(istekler[0].katilimcilar,[]);}finally{await o.close();}
});
test('düzenleme çakışmasında hata görünür ve kullanıcının yazdığı başlık korunur',async()=>{
 const o=await ortam((url,init)=>init?.method==='POST'?{status:409,data:{hata:'Etkinlik değişti. Güncel halini açıp yeniden deneyin.'}}:{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:{etkinlik:e,katilimcilar:[],davetler:[]}});
 try{await o.render({gorunum:'duzenle',etkinlikId:id});await o.input('#viva-baslik','Yeni başlık');await o.submit();assert.match(o.c.textContent!,/Etkinlik değişti/);assert.equal(o.c.querySelector<HTMLInputElement>('#viva-baslik')?.value,'Yeni başlık');assert.equal(o.paths.length,0);}finally{await o.close();}
});
test('özel davet bağlantısı oluşturulur; davet iptali güncel sürümü gönderir',async()=>{
 const istekler:Record<string,unknown>[]=[];
 const detay={etkinlik:e,katilimcilar:[],davetler:[] as {davet_id:string;ad:string;eposta:string;iptal:boolean}[]};
 const o=await ortam((url,init)=>{if(init?.method==='POST'){const b=JSON.parse(String(init.body));istekler.push(b);if(b.islem==='davet_ekle')return{data:{...detay,etkinlik:{...e,surum:2},davetler:[{davet_id:id,ad:'Test Misafiri',eposta:'viva@example.invalid',iptal:false}],davet_yolu:'/viva/davet/sentetik-token'}};return{data:{...detay,etkinlik:{...e,surum:3},davetler:[{davet_id:id,ad:'Test Misafiri',eposta:'viva@example.invalid',iptal:true}]}};}return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:detay};});
 try{await o.render({gorunum:'detay',etkinlikId:id,ilkBolum:'katilimcilar'});assert.equal(o.c.querySelector('form'),null);await o.click('Özel davetli ekle');assert(o.doc.querySelector('[role=dialog]'));await o.input('#viva-misafir-ad','Test Misafiri');await o.input('#viva-misafir-mail','viva@example.invalid');await o.submit();assert.equal(o.doc.querySelector<HTMLInputElement>('[role=dialog] #viva-davet-link')?.value,'http://localhost/viva/davet/sentetik-token');await act(async()=>o.doc.querySelector<HTMLButtonElement>('[role=dialog] button[aria-label=Kapat]')!.click());assert.equal(o.doc.querySelector('[role=dialog]'),null);await o.click('Daveti iptal et');assert.equal(istekler.length,1);await o.confirm('Daveti iptal et');assert.deepEqual(istekler.map(x=>[x.islem,x.surum]),[['davet_ekle',1],['davet_iptal',2]]);assert.match(o.c.textContent!,/Davet iptal edildi/);assert.equal(o.c.querySelector('#viva-davet-link'),null);}finally{await o.close();}
});
test('otomatik davetlerin gönderim durumu görünür; yalnız bekleyen ve hatalı kayıt yeniden kuyruğa alınır',async()=>{
 const davet=(n:number,durum:string)=>({davet_id:`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,ad:`Davetli ${n}`,eposta:`kisi${n}@example.invalid`,iptal:false,durum,deneme_sayisi:durum==='hata'?1:0,son_deneme:null,gonderim_zamani:null,hata_kodu:null});
 const kayitlar=[davet(10,'bekliyor'),davet(11,'hata'),davet(12,'gonderildi'),davet(13,'kontrol')];
 let detay={etkinlik:e,katilimcilar:[],davetler:kayitlar.map(x=>({davet_id:x.davet_id,ad:x.ad,eposta:x.eposta,iptal:x.iptal})),eposta_davetleri:kayitlar};
 const istekler:Record<string,unknown>[]=[];
 const o=await ortam((url,init)=>{if(init?.method==='POST'){const b=JSON.parse(String(init.body));istekler.push(b);detay={...detay,eposta_davetleri:detay.eposta_davetleri.map(x=>x.davet_id===b.davet_id?{...x,durum:'bekliyor'}:x)};return{data:detay};}return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:detay};});
 try{await o.render({gorunum:'detay',etkinlikId:id,ilkBolum:'katilimcilar'});
  assert.match(o.c.textContent!,/Gönderim bekliyor/);assert.match(o.c.textContent!,/Gönderilemedi/);
  assert.match(o.c.textContent!,/Gönderildi/);assert.match(o.c.textContent!,/Gönderim kontrolü gerekli/);
  assert.equal([...o.c.querySelectorAll('button')].filter(x=>x.textContent==='Yeniden dene').length,2);
  await o.click('Yeniden dene');assert.deepEqual(istekler,[{islem:'davet_yeniden_dene',etkinlik_id:id,surum:1,davet_id:kayitlar[0].davet_id}]);
  assert.match(o.c.textContent!,/yeniden gönderim kuyruğuna alındı/);
 }finally{await o.close();}
});
test('yetkisiz kullanıcı düzenleme formunu ve yönetim bağlantılarını göremez',async()=>{
 const o=await ortam(url=>({data:url.includes('baglam')?{olusturabilir:false,kapsam:'Davetler',kisiler:[]}:{etkinlik:{...e,yonetebilir:false},katilimcilar:[],davetler:[]}}));
 try{await o.render({gorunum:'duzenle',etkinlikId:id});assert.equal(o.c.querySelector('form'),null);assert.match(o.c.textContent!,/düzenleme yetkiniz yok/);await o.render({gorunum:'detay',etkinlikId:id});assert.equal(o.c.querySelector('#viva-misafir-mail'),null);assert.equal([...o.c.querySelectorAll('a')].some(a=>a.getAttribute('href')?.endsWith('/duzenle')),false);}finally{await o.close();}
});

// Adım 3: onaylı form yerleşiminin gerçek işlemlerle bağı.
test('form türü bağlantıdan açılır; girilen bilgiler korunur ve önizleme kartı gösterilmez',async()=>{
 const istekler:string[]=[];const o=await ortam((url)=>{istekler.push(url);return{data:{olusturabilir:true,kapsam:'Kendi takımınız',kisiler:[]}}});
 try{await o.render({gorunum:'yeni',ilkTur:'planli'});assert.ok(o.c.querySelector('#viva-tarih'));assert.equal(o.c.querySelector('button[aria-label="Yenile"]'),null);
  const nav=o.c.querySelector('nav[aria-label="İçerik konumu"]')!;assert.equal(nav.querySelector('[aria-current=page]')?.textContent,'Viva');assert.equal(o.c.querySelector('h1'),null);assert(o.c.querySelector('header a[href="/viva/yayinlar"]'));assert.equal([...o.c.querySelectorAll('a')].find(a=>a.textContent==='Vazgeç')?.getAttribute('href'),'/viva/yayinlar');
  const aciklama=o.c.querySelector<HTMLTextAreaElement>('#viva-aciklama')!;let yazininYuksekligi=240;Object.defineProperty(aciklama,'scrollHeight',{configurable:true,get:()=>yazininYuksekligi});
  await o.input('#viva-aciklama','Uzun açıklama\nİkinci satır');assert.equal(aciklama.style.height,'240px');yazininYuksekligi=40;await o.input('#viva-aciklama','Kısa açıklama');assert.equal(aciklama.style.height,'88px');
  await o.input('#viva-baslik','Yeni ekip buluşması');await o.input('#viva-aciklama','Hazırlık notlarımız');await o.input('#viva-tarih','2027-01-02');await o.input('#viva-saat','14:20');await o.input('#viva-sure','45');
  assert.equal(o.c.querySelector('[aria-label="Etkinlik önizlemesi"]'),null);assert.equal(o.c.querySelector('aside'),null);assert.equal(o.c.querySelector<HTMLInputElement>('#viva-baslik')!.value,'Yeni ekip buluşması');assert.equal(o.c.querySelector<HTMLInputElement>('#viva-saat')!.value,'14:20');
  assert.equal(o.c.querySelectorAll('form section h2').length,3);assert.deepEqual(istekler,['/viva/api?islem=baglam']);
 }finally{await o.close();}
});
test('anlık form derin bağlantıda tarih, taslak veya önizleme sunmaz',async()=>{
 const o=await ortam(()=>({data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}}));
 try{await o.render({gorunum:'yeni',ilkTur:'anlik'});assert.equal(o.c.querySelector('#viva-tarih'),null);assert.equal(o.c.querySelector('button[value="taslak"]'),null);assert.equal(o.c.querySelector('[aria-label="Etkinlik önizlemesi"]'),null);}finally{await o.close();}
});
test('taslak mevcut verileriyle açılır; planlandığında aynı kimlik ve sürüm gönderilir',async()=>{
 const istekler:Record<string,unknown>[]=[];const detay={etkinlik:{...e,durum:'taslak',surum:7},katilimcilar:[],davetler:[]};
 const o=await ortam((url,init)=>{if(init?.method==='POST'){const b=JSON.parse(String(init.body));istekler.push(b);return{data:{...detay,etkinlik:{...e,surum:8}}};}return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:detay};});
 try{await o.render({gorunum:'duzenle',etkinlikId:id});assert.match(o.c.textContent!,/Taslak · Yalnız size görünür/);assert.equal(o.c.querySelector<HTMLInputElement>('#viva-tarih')!.value,'2027-01-02');assert.equal(o.c.querySelector<HTMLInputElement>('#viva-saat')!.value,'00:30');assert.equal(o.c.querySelector<HTMLInputElement>('#viva-sure')!.value,'30');assert.ok(o.c.querySelector('button[value="taslak"]'));await o.click('Etkinliği planla');assert.equal(istekler[0].islem,'kaydet');assert.equal(istekler[0].etkinlik_id,id);assert.equal(istekler[0].surum,7);assert.equal(istekler[0].durum,'planlandi');assert.equal(o.paths[0],`/viva/${id}`);}finally{await o.close();}
});
test('planlanmış etkinlik düzenlenirken taslağa dönmez ve seçili katılımcılar korunur',async()=>{
 const istekler:Record<string,unknown>[]=[];const detay={etkinlik:e,katilimcilar:[{id,tur:'ic',ad:'Test Katılımcısı',alt:'Takım'}],davetler:[]};
 const o=await ortam((url,init)=>{if(init?.method==='POST'){istekler.push(JSON.parse(String(init.body)));return{data:detay}}return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:detay.katilimcilar}:detay}});
 try{await o.render({gorunum:'duzenle',etkinlikId:id});assert.equal(o.c.querySelector('button[value="taslak"]'),null);assert.match(o.c.querySelector('[aria-label="Seçili katılımcılar"]')!.textContent!,/Test Katılımcısı/);await o.input('#viva-baslik','Güncellenen buluşma');await o.click('Değişiklikleri kaydet');assert.equal(istekler[0].durum,'planlandi');assert.deepEqual(istekler[0].katilimcilar,[{tur:'ic',id}]);assert.equal(istekler[0].baslik,'Güncellenen buluşma');}finally{await o.close();}
});
test('form geçersiz süre ve geçmiş planı engeller; hata halinde yazılan alanları korur',async()=>{
 const istekler:Record<string,unknown>[]=[];const o=await ortam((_url,init)=>{if(init?.method==='POST')istekler.push(JSON.parse(String(init.body)));return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}}});
 try{await o.render({gorunum:'yeni',ilkTur:'planli'});await o.input('#viva-baslik','Korunan başlık');await o.input('#viva-aciklama','Korunan açıklama');await o.input('#viva-tarih','2027-01-02');await o.input('#viva-saat','12:00');
  for(const sure of ['0','1441','1.5']){await o.input('#viva-sure',sure);await o.submit();assert.match(o.c.querySelector('[role="alert"]')!.textContent!,/1–1440/);assert.equal(istekler.length,0);}
  await o.input('#viva-sure','60');await o.input('#viva-tarih','2026-10-24');await o.submit();assert.match(o.c.querySelector('[role="alert"]')!.textContent!,/gelecekte/);assert.equal(istekler.length,0);assert.equal(o.c.querySelector<HTMLInputElement>('#viva-baslik')!.value,'Korunan başlık');assert.equal(o.c.querySelector<HTMLTextAreaElement>('#viva-aciklama')!.value,'Korunan açıklama');assert.equal(o.c.querySelector<HTMLInputElement>('#viva-saat')!.value,'12:00');
 }finally{await o.close();}
});
test('kapsam dışındaki seçimin kaldırılması chip ve uyarıyı temizler',async()=>{
 const detay={etkinlik:e,katilimcilar:[{id,tur:'eclub',ad:'Eski katılımcı',alt:'Eczacı'}],davetler:[]};
 const o=await ortam(url=>({data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:detay}));
 try{await o.render({gorunum:'duzenle',etkinlikId:id});assert.match(o.c.querySelector('[aria-label="Seçili katılımcılar"]')!.textContent!,/Eski katılımcı/);await o.click('Geçersiz seçimleri kaldır');assert.equal(o.c.querySelector('[aria-label="Seçili katılımcılar"]'),null);assert.equal(o.c.querySelector('[role="alert"]'),null);}finally{await o.close();}
});
test('canlı, sona ermiş, iptal edilmiş ve anlık etkinlik düzenleme formu açamaz',async()=>{
 for(const ek of [{durum:'canli'},{durum:'sona_erdi'},{durum:'iptal'},{yayin_turu:'anlik'}]){
  const o=await ortam(url=>({data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:{etkinlik:{...e,...ek},katilimcilar:[],davetler:[]}}));
  try{await o.render({gorunum:'duzenle',etkinlikId:id});assert.equal(o.c.querySelector('form'),null);assert.match(o.c.textContent!,/düzenleme yetkiniz yok/);}finally{await o.close();}
 }
});
test('oluşturma yetkisi olmayan E-Club üyesi yeni formu veya önizlemesini göremez',async()=>{
 const o=await ortam(()=>({data:{olusturabilir:false,kapsam:'Davetler',kisiler:[]}}));
 try{await o.render({gorunum:'yeni',ilkTur:'planli'});assert.equal(o.c.querySelector('form'),null);assert.equal(o.c.querySelector('[aria-label="Etkinlik önizlemesi"]'),null);assert.match(o.c.textContent!,/oluşturma veya düzenleme yetkiniz yok/);}finally{await o.close();}
});
test('yanıt beklenirken yinelenen gönderim engellenir; form alanları kilitlenir',async()=>{
 let bitir:((data:{data:unknown})=>void)|undefined;let postlar=0;
 const o=await ortam((_url,init)=>{if(init?.method==='POST'){postlar++;return new Promise(resolve=>{bitir=resolve});}return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}}});
 try{await o.render({gorunum:'yeni',ilkTur:'anlik'});await o.input('#viva-baslik','Tek gönderim');await o.submit();await o.submit();assert.equal(postlar,1);assert.equal(o.c.querySelector('fieldset')!.disabled,true);assert.equal(o.c.querySelector('form')!.getAttribute('aria-busy'),'true');await act(async()=>bitir?.({data:{etkinlik:{...e,yayin_turu:'anlik'},katilimcilar:[],davetler:[]}}));assert.equal(o.paths.length,1);}finally{await o.close();}
});
test('başarısız kayıttan sonra form içeriği değişirse yeni oluşturma anahtarı kullanılır',async()=>{
 const istekler:Record<string,unknown>[]=[];const o=await ortam((_url,init)=>{if(init?.method==='POST'){istekler.push(JSON.parse(String(init.body)));return{status:503,data:{hata:'Bağlantı kesildi'}}}return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}}});
 try{await o.render({gorunum:'yeni',ilkTur:'anlik'});await o.input('#viva-baslik','İlk başlık');await o.submit();await o.input('#viva-baslik','Düzeltilen başlık');await o.submit();assert.equal(istekler.length,2);assert.notEqual(istekler[0].etkinlik_id,istekler[1].etkinlik_id);assert.equal(o.c.querySelector<HTMLInputElement>('#viva-baslik')!.value,'Düzeltilen başlık');}finally{await o.close();}
});


test('Davetliler: iki liste kendi seçimlerini değiştirir; diğer grubun davetlileri korunur',async()=>{
 for(const [liste,kalanTur,aranan,diger] of [['Firmanız','eclub','Firma Kişisi','E-Club Kişisi'],['E-Club Üyeleri','ic','E-Club Kişisi','Firma Kişisi']] as const){
  const kisiler=[{id,tur:'ic',ad:'Firma Kişisi',alt:'bm'},{id,tur:'eclub',ad:'E-Club Kişisi',alt:'eczaci'}];
  const istekler:Record<string,unknown>[]=[];
  const detay={etkinlik:e,katilimcilar:kisiler,davetler:[]};
  const o=await ortam((url,init)=>{if(init?.method==='POST'){istekler.push(JSON.parse(String(init.body)));return{data:detay};}return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler,eclub_davet_edebilir:true}:detay};});
  try{
   await o.render({gorunum:'duzenle',etkinlikId:id});
   assert.match(o.c.querySelector('#viva-katilimci-baslik')!.textContent!,/Davetliler/);
   const trigger=o.c.querySelector<HTMLButtonElement>(`button[aria-label="${liste}"]`)!;
   const other=o.c.querySelector<HTMLButtonElement>(`button[aria-label="${liste==='Firmanız'?'E-Club Üyeleri':'Firmanız'}"]`)!;
   assert.match(trigger.textContent!,/1 davetli seçildi/);assert.match(other.textContent!,/1 davetli seçildi/);
   await act(async()=>trigger.click());
   const menu=o.doc.querySelector(`[aria-label="${liste} seçimi"]`)!;
   assert(menu);assert(menu.textContent!.includes(aranan));assert(!menu.textContent!.includes(diger));
   await act(async()=>menu.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
   await act(async()=>trigger.click());
   assert(trigger.textContent!.includes(liste));assert.match(other.textContent!,/1 davetli seçildi/);
   await o.submit();assert.deepEqual(istekler[0].katilimcilar,[{tur:kalanTur,id}]);
  }finally{await o.close();}
 }
});
test('Davetliler: boş seçimde placeholder Firmanız; E-Club adayı yoksa ikinci liste görünmez',async()=>{
 const o=await ortam(()=>({data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}}));
 try{await o.render({gorunum:'yeni'});assert.equal(o.c.querySelector('button[aria-label="Firmanız"]')?.textContent,'Firmanız');assert.equal(o.c.querySelector('button[aria-label="E-Club Üyeleri"]'),null);}finally{await o.close();}
});


test('Davetliler: üye olmasa da yetkili rol E-Club listesini görür; açık ret üyeyi gizler',async()=>{
 for(const [izin,kisiler,gorunur] of [[true,[],true],[false,[{id,tur:'eclub',ad:'Eski Üye',alt:'eczaci'}],false]] as const){
  const o=await ortam(()=>({data:{olusturabilir:true,kapsam:'Firma',kisiler,eclub_davet_edebilir:izin}}));
  try{await o.render({gorunum:'yeni'});assert.equal(!!o.c.querySelector('button[aria-label="E-Club Üyeleri"]'),gorunur);}finally{await o.close();}
 }
});


test('E-posta alanı: virgül, noktalı virgül ve Enter pill üretir; × adresi siler',async()=>{
 const istekler:string[]=[];const o=await ortam(url=>{istekler.push(url);return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}}});
 try{
  await o.render({gorunum:'yeni',ilkTur:'anlik'});
  const alan=o.c.querySelector<HTMLTextAreaElement>('textarea[aria-label="E-posta ile davet"]')!;
  assert(alan);const win=alan.ownerDocument.defaultView!;
  const pilller=()=>[...o.c.querySelectorAll<HTMLButtonElement>('button[aria-label$=" adresini kaldır"]')];
  for(const [adres,key] of [['bir@example.com',','],['iki@example.com',';'],['uc@example.com','Enter']]){
   await o.input('textarea[aria-label="E-posta ile davet"]',adres);
   await act(async()=>{const keyEvent=new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true});alan.dispatchEvent(keyEvent);assert.equal(keyEvent.defaultPrevented,true);});
  }
  assert.equal(pilller().length,3);assert.equal(alan.value,'');assert.equal(istekler.length,1);
  await act(async()=>pilller()[1].click());assert.equal(pilller().length,2);
  assert(!pilller().some(b=>b.getAttribute('aria-label')?.startsWith('iki@')));
 }finally{await o.close();}
});
test('E-posta alanı: toplu yapıştırma geçerli adresleri alır; hata ve tekrarlar korunur',async()=>{
 const o=await ortam(()=>({data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}}));
 try{
  await o.render({gorunum:'yeni',ilkTur:'anlik'});
  const alan=o.c.querySelector<HTMLTextAreaElement>('textarea[aria-label="E-posta ile davet"]')!;
  const win=alan.ownerDocument.defaultView!;
  await act(async()=>{const paste=new win.Event('paste',{bubbles:true,cancelable:true});Object.defineProperty(paste,'clipboardData',{value:{getData:()=> 'A@example.com;hatalı\nb@example.com,a@example.com'}});alan.dispatchEvent(paste);assert.equal(paste.defaultPrevented,true);});
  assert.equal(o.c.querySelectorAll('button[aria-label$=" adresini kaldır"]').length,2);
  assert.equal(alan.value,'hatalı');assert.equal(alan.getAttribute('aria-invalid'),'true');
  await o.input('textarea[aria-label="E-posta ile davet"]','duzeldi@example.com,');
  assert.equal(o.c.querySelectorAll('button[aria-label$=" adresini kaldır"]').length,3);
  assert.equal(alan.getAttribute('aria-invalid'),null);assert.equal(alan.value,'');
 }finally{await o.close();}
});
test('E-posta isteği: pill ve son geçerli adres isteğe taşınır; sunucu hatasında korunur',async()=>{
 const istekler:Record<string,unknown>[]=[];const o=await ortam((_url,init)=>{
  if(init?.method==='POST'){istekler.push(JSON.parse(String(init.body)));return{status:503,data:{hata:'Kayıt bağlantısı henüz hazır değil.'}};}
  return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}};
 });
 try{
  await o.render({gorunum:'yeni',ilkTur:'anlik'});
  await o.input('#viva-baslik','Eğitim');
  await o.input('textarea[aria-label="E-posta ile davet"]','bir@example.com,');
  await o.input('textarea[aria-label="E-posta ile davet"]',' IKI@EXAMPLE.COM ');
  await o.submit();assert.equal(istekler.length,1);
  assert.deepEqual(istekler[0].davet_epostalari,['bir@example.com','iki@example.com']);
  assert.equal(istekler[0].islem,'olustur');assert.equal(istekler[0].yayin_turu,'anlik');
  assert.match(o.c.textContent!,/Kayıt bağlantısı henüz hazır değil/);
  assert(o.c.querySelector('button[aria-label="bir@example.com adresini kaldır"]'));
  assert(o.c.querySelector('button[aria-label="iki@example.com adresini kaldır"]'));
  assert.equal(o.c.querySelector<HTMLTextAreaElement>('textarea[aria-label="E-posta ile davet"]')!.value,'');
  assert.equal(o.paths.length,0);
 }finally{await o.close();}
});

test('E-posta isteği: hatalı veya tamamlanmamış adres POST yapılmadan düzeltilmek üzere kalır',async()=>{
 for(const adres of ['eksik@','hatalı']){
  let post=0;const o=await ortam((_url,init)=>{if(init?.method==='POST')post++;return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}}});
  try{
   await o.render({gorunum:'yeni',ilkTur:'anlik'});await o.input('#viva-baslik','Eğitim');
   await o.input('textarea[aria-label="E-posta ile davet"]',`bir@example.com;${adres}`);
   await o.submit();assert.equal(post,0);assert.match(o.c.textContent!,/Hatalı veya tamamlanmamış e-posta/);
   assert.equal(o.c.querySelector<HTMLTextAreaElement>('textarea[aria-label="E-posta ile davet"]')!.value,adres);
   assert(o.c.querySelector('button[aria-label="bir@example.com adresini kaldır"]'));
  }finally{await o.close();}
 }
});

test('E-posta isteği: taslak, planlı oluşturma ve düzenleme aynı adres alanını kullanır',async()=>{
 for(const [gorunum,taslak] of [['yeni',true],['yeni',false],['duzenle',true],['duzenle',false]] as const){
  const istekler:Record<string,unknown>[]=[];
  const o=await ortam((url,init)=>{
   if(init?.method==='POST'){istekler.push(JSON.parse(String(init.body)));return{status:503,data:{hata:'Kayıt bağlantısı henüz hazır değil.'}};}
   return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:{etkinlik:{...e,durum:taslak?'taslak':'planlandi'},katilimcilar:[],davetler:[]}};
  });
  try{
   await o.render({gorunum,ilkTur:'planli',etkinlikId:gorunum==='duzenle'?id:undefined});
   if(gorunum==='yeni'){await o.input('#viva-baslik','Eğitim');await o.input('#viva-tarih','2027-01-02');await o.input('#viva-saat','12:00');}
   await o.input('textarea[aria-label="E-posta ile davet"]','bir@example.com;iki@example.com');
   if(taslak)await o.click('Taslak olarak kaydet');else await o.submit();
   assert.equal(istekler.length,1);assert.deepEqual(istekler[0].davet_epostalari,['bir@example.com','iki@example.com']);
   assert.equal(istekler[0].islem,gorunum==='duzenle'?'kaydet':'olustur');assert.equal(istekler[0].durum,taslak?'taslak':'planlandi');
   if(gorunum==='duzenle'){assert.equal(istekler[0].etkinlik_id,id);assert.equal(istekler[0].surum,e.surum);}
  }finally{await o.close();}
 }
});

test('E-posta isteği: aynı içerik aynı işlem anahtarını korur; adres değişince anahtar yenilenir',async()=>{
 const istekler:Record<string,unknown>[]=[];const o=await ortam((_url,init)=>{
  if(init?.method==='POST'){istekler.push(JSON.parse(String(init.body)));return{status:503,data:{hata:'Bağlantı kesildi'}};}
  return{data:{olusturabilir:true,kapsam:'Firma',kisiler:[]}};
 });
 try{
  await o.render({gorunum:'yeni',ilkTur:'anlik'});await o.input('#viva-baslik','Eğitim');
  await o.input('textarea[aria-label="E-posta ile davet"]','bir@example.com');await o.submit();await o.submit();
  assert.equal(istekler.length,2);assert.equal(istekler[0].etkinlik_id,istekler[1].etkinlik_id);
  await o.input('textarea[aria-label="E-posta ile davet"]','iki@example.com');await o.submit();
  assert.equal(istekler.length,3);assert.notEqual(istekler[1].etkinlik_id,istekler[2].etkinlik_id);
  assert.deepEqual(istekler[2].davet_epostalari,['bir@example.com','iki@example.com']);
 }finally{await o.close();}
});

test('E-posta kaydı: taslak yeniden açıldığında yalnız aktif adresler pill olarak yüklenir',async()=>{
 const davet=(n:number,adres:string,iptal=false)=>({davet_id:`davet-${n}`,eposta:adres,iptal,durum:iptal?'iptal':'taslak',deneme_sayisi:0,son_deneme:null,gonderim_zamani:null,hata_kodu:null});
 const detay={etkinlik:{...e,durum:'taslak'},katilimcilar:[],davetler:[],eposta_davetleri:[davet(1,'bir@example.com'),davet(2,'silinen@example.com',true),davet(3,'iki@example.com')]};
 const o=await ortam(url=>({data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:detay}));
 try{
  await o.render({gorunum:'duzenle',etkinlikId:id});
  assert.equal(o.c.querySelectorAll('button[aria-label$=" adresini kaldır"]').length,2);
  assert(o.c.querySelector('button[aria-label="bir@example.com adresini kaldır"]'));
  assert(o.c.querySelector('button[aria-label="iki@example.com adresini kaldır"]'));
  assert.equal(o.c.querySelector('button[aria-label="silinen@example.com adresini kaldır"]'),null);
 }finally{await o.close();}
});

test('E-posta kaydı: taslakta pill kaldırma ve yeni adres ekleme aynı sürümlü kayda taşınır',async()=>{
 const davet=(adres:string)=>({davet_id:adres,eposta:adres,iptal:false,durum:'taslak',deneme_sayisi:0,son_deneme:null,gonderim_zamani:null,hata_kodu:null});
 let detay={etkinlik:{...e,durum:'taslak'},katilimcilar:[],davetler:[],eposta_davetleri:[davet('bir@example.com'),davet('iki@example.com')]};
 const istekler:Record<string,unknown>[]=[];
 const o=await ortam((url,init)=>{
  if(init?.method==='POST'){
   const b=JSON.parse(String(init.body));istekler.push(b);
   detay={...detay,etkinlik:{...detay.etkinlik,surum:2},eposta_davetleri:b.davet_epostalari.map(davet)};
   return{data:detay};
  }
  return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:detay};
 });
 try{
  await o.render({gorunum:'duzenle',etkinlikId:id});
  await act(async()=>o.c.querySelector<HTMLButtonElement>('button[aria-label="bir@example.com adresini kaldır"]')!.click());
  await o.input('textarea[aria-label="E-posta ile davet"]','uc@example.com');await o.click('Taslak olarak kaydet');
  assert.equal(istekler.length,1);assert.deepEqual(istekler[0].davet_epostalari,['iki@example.com','uc@example.com']);
  assert.equal(istekler[0].islem,'kaydet');assert.equal(istekler[0].durum,'taslak');assert.equal(istekler[0].surum,1);
  assert.equal(o.paths[0],`/viva/${id}`);
  await o.render({gorunum:'detay',etkinlikId:id});await o.render({gorunum:'duzenle',etkinlikId:id});
  assert.equal(o.c.querySelector('button[aria-label="bir@example.com adresini kaldır"]'),null);
  assert(o.c.querySelector('button[aria-label="iki@example.com adresini kaldır"]'));
  assert(o.c.querySelector('button[aria-label="uc@example.com adresini kaldır"]'));
 }finally{await o.close();}
});

test('E-posta kaydı: son pill kaldırıldığında boş liste açıkça gönderilir',async()=>{
 const detay={etkinlik:{...e,durum:'taslak'},katilimcilar:[],davetler:[],eposta_davetleri:[{davet_id:id,eposta:'bir@example.com',iptal:false,durum:'taslak',deneme_sayisi:0,son_deneme:null,gonderim_zamani:null,hata_kodu:null}]};
 const istekler:Record<string,unknown>[]=[];
 const o=await ortam((url,init)=>{if(init?.method==='POST'){istekler.push(JSON.parse(String(init.body)));return{data:{...detay,eposta_davetleri:[]}};}return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler:[]}:detay};});
 try{
  await o.render({gorunum:'duzenle',etkinlikId:id});
  await act(async()=>o.c.querySelector<HTMLButtonElement>('button[aria-label="bir@example.com adresini kaldır"]')!.click());
  await o.click('Taslak olarak kaydet');assert.equal(istekler.length,1);assert.deepEqual(istekler[0].davet_epostalari,[]);
 }finally{await o.close();}
});

test('Davetliler: bölge toplu seçimi, tekil UTT ve diğer davetliler sağ kutuda unvanlarıyla korunur',async()=>{
 const u1='00000000-0000-4000-8000-000000000011',u2='00000000-0000-4000-8000-000000000012',u3='00000000-0000-4000-8000-000000000013';
 const bm='00000000-0000-4000-8000-000000000014',ecz='00000000-0000-4000-8000-000000000015';
 const kisiler=[
  {id:u1,tur:'ic',ad:'Ali Bir',alt:'utt',bolge_id:'ankara',bolge_adi:'Ankara'},
  {id:u2,tur:'ic',ad:'Ayşe İki',alt:'kd_utt',bolge_id:'ankara',bolge_adi:'Ankara'},
  {id:u3,tur:'ic',ad:'Can Üç',alt:'utt',bolge_id:'izmir',bolge_adi:'İzmir'},
  {id:bm,tur:'ic',ad:'Deniz Dört',alt:'bm',bolge_id:'ankara',bolge_adi:'Ankara'},
  {id:ecz,tur:'eclub',ad:'Ece Beş',alt:'eczaci'},
 ];
 const istekler:Record<string,unknown>[]=[];
 const detay={etkinlik:e,katilimcilar:[kisiler[4]],davetler:[]};
 const o=await ortam((url,init)=>{if(init?.method==='POST'){istekler.push(JSON.parse(String(init.body)));return{data:detay};}return{data:url.includes('baglam')?{olusturabilir:true,kapsam:'Firma',kisiler,eclub_davet_edebilir:true}:detay};});
 try{
  await o.render({gorunum:'duzenle',etkinlikId:id});await o.input('#viva-baslik','Bölge toplantısı');
  const box=o.c.querySelector('[aria-label="Seçilen davetliler"]')!;assert(box);assert.equal(box.previousElementSibling?.className,'inviteSelectors');
  await o.click('Firmanız');const menu=o.doc.querySelector('[aria-label="Firmanız seçimi"]')!;
  const ankara=menu.querySelector<HTMLInputElement>('input[aria-label="Ankara bölgesindeki UTT\'leri seç"]')!;
  const izmir=menu.querySelector<HTMLInputElement>('input[aria-label="İzmir bölgesindeki UTT\'leri seç"]')!;
  assert(ankara);assert(izmir);assert(!menu.textContent!.includes('Ali Bir'));
  await act(async()=>ankara.click());assert.match(box.textContent!,/UTT · Ali Bir/);assert.match(box.textContent!,/Kd.UTT · Ayşe İki/);assert(!box.textContent!.includes('Deniz Dört'));
  const expand=menu.querySelector<HTMLButtonElement>('button[aria-label="Ankara UTT listesini aç"]')!;await act(async()=>expand.click());
  const ali=[...menu.querySelectorAll('label')].find(l=>l.textContent?.includes('UTT · Ali Bir'))!.querySelector<HTMLInputElement>('input')!;
  await act(async()=>ali.click());assert(ankara.indeterminate);assert(!box.textContent!.includes('Ali Bir'));assert(box.textContent!.includes('Ayşe İki'));
  await act(async()=>izmir.click());assert(box.textContent!.includes('Can Üç'));assert(box.textContent!.includes('Ayşe İki'));
  await act(async()=>ankara.click());assert(box.textContent!.includes('Ali Bir'));await act(async()=>ankara.click());assert(!box.textContent!.includes('Ali Bir'));assert(!box.textContent!.includes('Ayşe İki'));assert(box.textContent!.includes('Can Üç'));
  const deniz=[...menu.querySelectorAll('label')].find(l=>l.textContent?.includes('BM · Deniz Dört'))!.querySelector<HTMLInputElement>('input')!;
  await act(async()=>deniz.click());await act(async()=>o.c.querySelector<HTMLButtonElement>('button[aria-label="Firmanız"]')!.click());
  assert.match(box.textContent!,/BM · Deniz Dört/);assert.match(box.textContent!,/Ecz\. · Ece Beş/);assert.equal(box.querySelectorAll('li').length,3);
  const kaldir=box.querySelector<HTMLButtonElement>('button[aria-label="BM · Deniz Dört davetini kaldır"]')!;assert(kaldir);assert.equal(kaldir.type,'button');
  await act(async()=>kaldir.click());assert(!box.textContent!.includes('Deniz Dört'));assert.equal(box.querySelectorAll('li').length,2);assert.match(box.textContent!,/UTT · Can Üç/);assert.match(box.textContent!,/Ecz\. · Ece Beş/);
  await act(async()=>o.c.querySelector<HTMLButtonElement>('button[aria-label="Firmanız"]')!.click());
  const guncelMenu=o.doc.querySelector('[aria-label="Firmanız seçimi"]')!;
  assert.equal([...guncelMenu.querySelectorAll('label')].find(l=>l.textContent?.includes('BM · Deniz Dört'))!.querySelector<HTMLInputElement>('input')!.checked,false);
  await act(async()=>o.c.querySelector<HTMLButtonElement>('button[aria-label="Firmanız"]')!.click());
  await o.submit();const beklenen=[{tur:'eclub',id:ecz},{tur:'ic',id:u3}];assert.deepEqual(istekler[0].katilimcilar,beklenen);
 }finally{await o.close();}
});
test('Davetliler: bölge araması bölgenin UTTlerini gösterir; bölgesiz firma rolleri kaybolmaz',async()=>{
 const kisiler=[{id,tur:'ic',ad:'Ali Örnek',alt:'utt',bolge_id:'ankara',bolge_adi:'Ankara'},
  {id:'00000000-0000-4000-8000-000000000022',tur:'ic',ad:'Deniz Örnek',alt:'pm'}];
 const o=await ortam(()=>({data:{olusturabilir:true,kapsam:'Firma',kisiler}}));
 try{await o.render({gorunum:'yeni',ilkTur:'anlik'});await o.click('Firmanız');const menu=o.doc.querySelector('[aria-label="Firmanız seçimi"]')!;
  assert(menu.textContent!.includes('PM · Deniz Örnek'));const search=menu.querySelector<HTMLInputElement>('input[type=search]')!;
  await act(async()=>{const win=search.ownerDocument.defaultView!;const setter=Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype,'value')!.set!;setter.call(search,'ankara');search.dispatchEvent(new win.Event('input',{bubbles:true}));});
  assert(menu.textContent!.includes('UTT · Ali Örnek'));assert(!menu.textContent!.includes('Deniz Örnek'));
 }finally{await o.close();}
});


test('başlangıç saati aranabilir; özel dakika ve klavye seçimi korunur',async()=>{
 const o=await ortam(()=>({data:{olusturabilir:true,kisiler:[]}}));
 try {
  await o.render({gorunum:'yeni',ilkTur:'planli'});
  const saat=o.c.querySelector<HTMLInputElement>('#viva-saat')!;
  assert.ok(saat);
  await act(async()=>saat.click());
  assert.equal(saat.getAttribute('aria-expanded'),'true');
  assert.equal(o.doc.querySelectorAll('[role=option]').length,96);
  await o.input('#viva-saat','09:');
  assert.equal(o.doc.querySelectorAll('[role=option]').length,4);
  await act(async()=>saat.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})));
  await act(async()=>saat.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
  assert.equal(saat.value,'09:15');
  assert.equal(saat.getAttribute('aria-expanded'),'false');
  await o.input('#viva-saat','09:07');
  assert.equal(o.doc.querySelector('[role=option]')?.textContent,'09:07');
  await act(async()=>(o.doc.querySelector('[role=option]') as HTMLElement).click());
  assert.equal(saat.value,'09:07');
  assert.equal(saat.validity.valid,true);
  await o.input('#viva-saat','25:00');
  assert.equal(o.doc.querySelectorAll('[role=option]').length,0);
  assert.equal(saat.validity.patternMismatch,true);
  await o.input('#viva-saat','');
  assert.equal(saat.validity.valueMissing,true);
 } finally {await o.close();}
});
