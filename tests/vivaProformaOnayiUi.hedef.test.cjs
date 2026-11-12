/* eslint-disable @typescript-eslint/no-require-imports */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {Window}=require('happy-dom');const win=new Window({url:'http://localhost/admin'});
for(const k of ['window','document','navigator'])Object.defineProperty(globalThis,k,{configurable:true,value:win[k]});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{createRoot}=require('react-dom/client'),{createPortal}=require('react-dom'),ts=require('typescript');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const taraf={unvan:'Firma A',adres:'Adres',vergi_dairesi:'VD',vergi_numarasi:'111'};
const belge={firma_id:id(1),donem:'2026-10',belge_no:'PF-V-202610-'+id(1),tarih:'2026-11-01',duzenleyen:taraf,alici:taraf,satirlar:[{etkinlik_id:id(3),yayin_tarihi:'2026-10-10T09:00:00Z',yayin_adi:'Yayın Bir',duzenleyen:'Merve Duran',katilimci_sayisi:100,kisi_dakika:6000,birim_fiyat:.33,tutar:1980},{etkinlik_id:id(4),yayin_tarihi:'2026-10-20T09:00:00Z',yayin_adi:'Yayın İki',duzenleyen:'Merve Duran',katilimci_sayisi:2,kisi_dakika:10,birim_fiyat:.33,tutar:3.3}],toplam_tutar:1983.3,kdv:396.66,genel_tutar:2379.96};
let admin=true,approved=null,mode='normal',posts=[],gets=[];
const cache=new Map();
const mocks={react:React,'react/jsx-runtime':require('react/jsx-runtime'),'lucide-react':{Search:()=>null,ShoppingBag:()=>null,ChevronDown:()=>null},
 '@/components/kontrol/SadeKontroller':{SadeKapsulFiltre:({secenekler,deger,onDegistir,etiket})=>React.createElement('div',{role:'group','aria-label':etiket},secenekler.map(s=>React.createElement('button',{key:s.deger,'aria-pressed':s.deger===deger,onClick:()=>onDegistir(s.deger)},s.etiket)))},
 '@/components/ui/button':{Button:props=>React.createElement('button',props)},
 '@/components/ui/alert-dialog':{
  AlertDialog:({open,children})=>open?createPortal(React.createElement('div',{role:'alertdialog'},children),document.body):null,
  AlertDialogContent:({children})=>React.createElement('section',null,children),
  AlertDialogHeader:({children})=>React.createElement('div',null,children),
  AlertDialogFooter:({children})=>React.createElement('div',null,children),
  AlertDialogTitle:({children})=>React.createElement('h2',null,children),
  AlertDialogDescription:({children})=>React.createElement('p',null,children),
  AlertDialogCancel:props=>React.createElement('button',props),
 },
 './MobilUyumluTablo':{default:({children})=>React.createElement('table',null,children)},
};
function load(file){
 if(cache.has(file))return cache.get(file);
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{
  exports,window,Date,Intl,URLSearchParams,AbortController,AbortSignal,Error,
  fetch:async(url,options={})=>{
   if(options.method==='POST'){
    const body=JSON.parse(options.body);posts.push(body);
    if(mode==='lost')throw Error('Yanıt alınamadı');
    assert.equal(body.ay,'2026-10');
    if(admin)assert.ok(body.aciklama.trim());
    approved={tur:admin?'admin':'firma',onaylayan:admin?'Admin Test':'Firma Admini',tarih:'2026-11-10T12:00:00Z',aciklama:body.aciklama};
    return Response.json(approved);
   }
   if(url==='/fiyatlar/api')return Response.json({kko:{birim:9.9}});
   gets.push(url);
   if(mode==='error')return Response.json({hata:'Kurulum bekleniyor'},{status:503});
   const q=new URL(url,'http://localhost').searchParams;
   return Response.json({firma_id:mode==='foreign'?id(2):id(1),ay:'2026-10',admin_onayi:admin,belge:mode==='current'||(q.get('onayli')==='1'&&!approved)?null:belge,onay:approved,onaylanabilir:!['current','pending'].includes(mode),bekleyen:mode==='pending'?1:0});
  },
  require:n=>mocks[n]??(n.endsWith('.css')?{default:{}}:n.startsWith('@/')?load(n.slice(2)+'.ts'):n.startsWith('.')?load(path.join(path.dirname(file),n)+(fs.existsSync(path.join(path.dirname(file),n)+'.ts')?'.ts':'.tsx')):assert.fail(n)),
 });
 cache.set(file,exports);return exports;
}
const C=load('app/admin/_components/VivaProformaAlani.tsx').default;
async function mount(only=false){const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await React.act(async()=>root.render(React.createElement(C,{firmaId:id(1),ay:"2026-10",sadeceOnayli:only})));return{host,close:async()=>{await React.act(async()=>root.unmount());host.remove();}}}
async function click(scope,name){await React.act(async()=>{const b=[...scope.querySelectorAll("button")].find(b=>b.textContent.trim()===name);assert.ok(b,name);b.click();});}
(async()=>{
 let s=await mount();await click(s.host,'Proforma');assert.ok(s.host.textContent.includes('Yayın Bir'));assert.ok(s.host.textContent.includes('Yayın İki'));assert.ok(s.host.textContent.includes('2.379,96 TL'));assert.equal(s.host.querySelectorAll('tbody tr').length,2);
 await click(s.host,'Onayla');let modal=document.querySelector('[role=alertdialog]');let save=[...modal.querySelectorAll('button')].find(b=>b.textContent==='Kaydet');assert.ok(save.disabled);
 const area=modal.querySelector('textarea'),key=Object.keys(area).find(k=>k.startsWith('__reactProps'));await React.act(async()=>area[key].onChange({target:{value:'Firma talebi üzerine.'}}));assert.ok(!save.disabled);
 mode='lost';await click(modal,'Kaydet');assert.ok(document.querySelector('[role=alert]'));mode='normal';await React.act(async()=>{save.click();save.click()});assert.equal(posts.length,2);assert.ok(s.host.textContent.includes('Onaylandı'));await s.close();
 s=await mount(true);assert.ok(s.host.textContent.includes('Firma talebi üzerine.'));assert.ok(gets.at(-1).includes('onayli=1'));await s.close();
 approved=null;admin=false;s=await mount();await click(s.host,'Onayla');modal=document.querySelector('[role=alertdialog]');assert.ok(modal.textContent.includes('Proforma Fatura Onayı'));assert.equal(modal.querySelector('textarea'),null);await click(modal,'Onayla');assert.equal(approved.tur,'firma');await s.close();
 approved=null;mode='current';s=await mount();assert.ok(s.host.textContent.includes('ayın 1’inde'));assert.ok(![...s.host.querySelectorAll('button')].some(b=>b.textContent==='Onayla'));await s.close();
 mode='pending';s=await mount();assert.ok([...s.host.querySelectorAll('button')].find(b=>b.textContent==='Onayla').disabled);await s.close();
 mode='normal';s=await mount(true);assert.ok(s.host.textContent.includes('onaylanan Viva proforması bulunmuyor'));await s.close();
 for(mode of ['foreign','error']){s=await mount();assert.ok(s.host.querySelector('[role=alert]'));await s.close();}
 await win.happyDOM.close();console.log('Geçti: çok satırlı aylık proforma, ortak modal, firma/admin onayı, zorunlu açıklama, çift tıklama, ay kapanışı/bekleyen kullanım, onaylı görünüm.');
})().catch(e=>{console.error(e);process.exitCode=1});
