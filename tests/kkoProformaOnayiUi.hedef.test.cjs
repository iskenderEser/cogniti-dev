/* eslint-disable @typescript-eslint/no-require-imports */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {Window}=require('happy-dom');const win=new Window({url:'http://localhost/admin'});
for(const k of ['window','document','navigator'])Object.defineProperty(globalThis,k,{configurable:true,value:win[k]});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{createRoot}=require('react-dom/client'),{createPortal}=require('react-dom'),ts=require('typescript');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const taraf={unvan:'Firma A',adres:'Adres',vergi_dairesi:'VD',vergi_numarasi:'111'};
const row={kayit_id:id(3),siparis_tarihi:'2026-11-10T09:55:00Z',satin_alan_ad_soyad:'Merve Duran',bakiye_turu:'kisisel',paket_turu:'kko',token_adedi:2500,birim_fiyat:5.5,toplam_tutar:13750,kdv:2750,
 proforma:{belge_no:'PF-K-'+id(3),tarih:'2026-11-10T09:55:00Z',duzenleyen:taraf,alici:taraf,token_adedi:2500,birim_fiyat:5.5,toplam_tutar:13750,kdv:2750,donem:'2026-10-01',test_notu:'SİLİNECEK TEST KAYDI'},onay:null,onaylanabilir:true};
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
    assert.equal(body.siparisId,row.kayit_id);
    if(admin)assert.ok(body.aciklama.trim());
    approved={tur:admin?'admin':'firma',onaylayan:admin?'Admin Test':'Firma Admini',tarih:'2026-11-10T12:00:00Z',aciklama:body.aciklama};
    return Response.json(approved);
   }
   if(url==='/fiyatlar/api')return Response.json({kko:{birim:9.9}});
   gets.push(url);
   if(mode==='error')return Response.json({hata:'Kurulum bekleniyor'},{status:503});
   const q=new URL(url,'http://localhost').searchParams;
   const rows=q.get('onayli')==='1'&&!approved?[]:[{...row,onay:approved}];
   return Response.json({firma_id:mode==='foreign'?id(2):id(1),siparisler:rows,toplam:rows.length,sayfa:Number(q.get('sayfa')),sayfa_boyutu:20,admin_onayi:admin});
  },
  require:n=>mocks[n]??(n.endsWith('.css')?{default:{}}:n.startsWith('@/')?load(n.slice(2)+'.ts'):n.startsWith('.')?load(path.join(path.dirname(file),n)+(fs.existsSync(path.join(path.dirname(file),n)+'.ts')?'.ts':'.tsx')):assert.fail(n)),
 });
 cache.set(file,exports);return exports;
}
const C=load('app/admin/_components/KkoPaketAlimlari.tsx').default;
async function mount(only=false){const host=document.createElement('div');document.body.append(host);const root=createRoot(host);await React.act(async()=>root.render(React.createElement(C,{firmaId:id(1),sadeceOnayli:only})));return{host,close:async()=>{await React.act(async()=>root.unmount());host.remove();}}}
async function click(scope,name){await React.act(async()=>{const b=[...scope.querySelectorAll('button')].find(b=>b.textContent.trim()===name);assert.ok(b,name);b.click()})}
(async()=>{
 let s=await mount();
 assert.equal(s.host.querySelector('[aria-label="Satın alım ayları"]').querySelectorAll('button').length,12);
 assert.equal(s.host.querySelectorAll('thead>tr>th').length,9);
 await click(s.host,'Proforma');assert.ok(s.host.textContent.includes('PROFORMA FATURA'));assert.ok(s.host.textContent.includes('SİLİNECEK TEST KAYDI'));
 const sheet=s.host.querySelector('section[aria-label="KKÖ proforma faturası"]');
 assert.ok(!sheet.textContent.includes('Merve Duran'));assert.ok(!sheet.textContent.includes('Token Hesabı'));assert.ok(!sheet.textContent.includes('KDV Oranı'));
 assert.ok(sheet.textContent.includes('16.500,00 TL'));
 await click(s.host,'Proforma');assert.ok(!s.host.textContent.includes('PROFORMA FATURA'));
 await click(s.host,'Onayla');
 let modal=document.querySelector('[role=alertdialog]');assert.ok(modal.textContent.includes('Admin Onayı'));
 let save=[...modal.querySelectorAll('button')].find(b=>b.textContent==='Kaydet');assert.ok(save.disabled);
 const area=modal.querySelector('textarea'),key=Object.keys(area).find(k=>k.startsWith('__reactProps'));
 await React.act(async()=>area[key].onChange({target:{value:'   '}}));assert.ok(save.disabled);
 await React.act(async()=>area[key].onChange({target:{value:'Firma yöneticisinin talebi üzerine.'}}));assert.ok(!save.disabled);
 mode='lost';await click(modal,'Kaydet');assert.ok(document.querySelector('[role=alert]'));assert.ok(!s.host.textContent.includes('Onaylandı'));
 mode='normal';
 await React.act(async()=>{save.click();save.click()});
 assert.equal(posts.length,2);assert.equal(posts[1].aciklama,'Firma yöneticisinin talebi üzerine.');
 assert.ok(s.host.textContent.includes('Onaylandı'));assert.equal(document.querySelector('[role=alertdialog]'),null);
 await click(s.host,'Proforma');assert.ok(s.host.textContent.includes(approved.aciklama));assert.ok(s.host.textContent.includes('Admin Onayı'));
 await s.close();
 s=await mount(true);assert.ok(s.host.textContent.includes('Onaylandı'));assert.ok(gets.at(-1).includes('onayli=1'));await s.close();
 admin=false;approved=null;s=await mount();await click(s.host,'Onayla');modal=document.querySelector('[role=alertdialog]');assert.equal(modal.querySelector('textarea'),null);
 await click(modal,'Onayla');assert.equal(approved.tur,'firma');assert.ok(s.host.textContent.includes('Firma Onayı'));await s.close();
 admin=true;approved=null;s=await mount(true);assert.ok(s.host.textContent.includes('Henüz onaylanan proforma'));await s.close();
 for(mode of ['error','foreign']){s=await mount();assert.ok(s.host.querySelector('[role=alert]'));assert.ok(!s.host.textContent.includes('Merve Duran'));await s.close()}
 mode='normal';approved=null;row.onaylanabilir=false;s=await mount();const approveButton=[...s.host.querySelectorAll('button')].find(b=>b.textContent.trim()==='Onayla');assert.ok(approveButton.disabled);await click(s.host,'Proforma');assert.ok(s.host.textContent.includes('PROFORMA FATURA'));await s.close();
 await win.happyDOM.close();console.log('Geçti: salt okunur proforma aç/kapat, firma/admin onayı, zorunlu açıklama, yanıt kaybı ve tekrar, çift tıklama, onaylı admin listesi, firma izolasyonu.');
})().catch(e=>{console.error(e);process.exitCode=1});
