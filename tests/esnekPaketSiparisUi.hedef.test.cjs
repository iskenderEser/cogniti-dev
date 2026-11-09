/* eslint-disable @typescript-eslint/no-require-imports */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const {Window}=require('happy-dom');const win=new Window({url:'http://localhost/fiyatlar'});
for(const k of ['window','document','navigator'])Object.defineProperty(globalThis,k,{configurable:true,value:win[k]});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{createRoot}=require('react-dom/client');const ctx=React.createContext(false);
const div=({children,...props})=>React.createElement('div',props,children);
const dialog={AlertDialog:({open,children})=>React.createElement(ctx.Provider,{value:open},children),AlertDialogContent:({children})=>React.useContext(ctx)?React.createElement('section',{role:'alertdialog'},children):null,AlertDialogCancel:props=>React.createElement('button',props),AlertDialogHeader:div,AlertDialogFooter:div,AlertDialogTitle:div,AlertDialogDescription:div};
let mode='ok',resolveRequest,calls=[],refresh=0,events=0,passed=0;
win.addEventListener('cogniti-token-bakiye-yenile',()=>events++);
const mocks={react:React,'react/jsx-runtime':require('react/jsx-runtime'),'@/components/ui/alert-dialog':dialog,'@/components/ui/button':{Button:props=>React.createElement('button',props)}};
const cache=new Map();function load(path){if(cache.has(path))return cache.get(path);const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Intl,crypto,AbortSignal,window:win,Event:win.Event,sessionStorage:win.sessionStorage,fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});if(mode==='lost')throw Error('network');if(mode==='wait')await new Promise(r=>resolveRequest=r);if(mode==='price')return Response.json({ok:false,hata:'Fiyat güncellendi. Güncel tutarı yeniden onaylayın.'},{status:409});return Response.json({ok:true,siparisId:'00000000-0000-4000-8000-000000000001'});},require:n=>mocks[n]??(n.startsWith('@/')?load(n.slice(2)+'.ts'):require(n))});cache.set(path,exports);return exports;}
const Component=load('components/satinAlma/EsnekPaketSiparis.tsx').default;
const ok=v=>{assert.ok(v);passed++;};
async function mount(rol='pm',teklif={tokenAdedi:2500,birimFiyat:8.5,tarifeSurumu:7}){const el=document.createElement('div');document.body.append(el);const root=createRoot(el);await React.act(async()=>root.render(React.createElement(Component,{rol,kullaniciId:'user',teklif,fiyatYenile:()=>refresh++})));return{el,root,close:async()=>{await React.act(async()=>root.unmount());el.remove();}};}
async function click(s,text){await React.act(async()=>{const b=[...s.el.querySelectorAll('button')].find(b=>b.textContent===text);assert.ok(b,text);b.click();});}
(async()=>{
 for(const rol of ['tm','admin','utt','kd_utt','bm','iu','partner']){const s=await mount(rol);ok(!s.el.querySelector('button'));await s.close();}
 for(const [rol,hesap,ad] of [['pm','kisisel','Kişisel Token Hesabı'],['gm','firma_ortak','Firma Token Hesabı'],['firma_admin','firma_ortak','Firma Token Hesabı']]){
  const s=await mount(rol);await click(s,'Siparişi tamamla');ok(s.el.textContent.includes(ad));ok(s.el.textContent.includes('21.250,00 TL'));ok(s.el.textContent.includes('8,50 TL'));const satir=ad=>[...s.el.querySelectorAll('dt')].find(e=>e.textContent===ad)?.nextElementSibling?.textContent;ok(satir('Paket Tutarı')==='21.250,00 TL');ok(satir('KDV')==='4.250,00 TL');ok(satir('Genel Tutar')==='25.500,00 TL');ok(!s.el.textContent.includes('KDV hariçtir.'));await click(s,'Siparişi onayla');ok(calls.at(-1).body.hesapTuru===hesap);ok(!s.el.querySelector('[role=alertdialog]'));ok(s.el.textContent.includes('Siparişiniz kaydedildi'));await s.close();
 }
 ok(events===3);
 // Bir yanıt beklenirken çift tıklama tek istek üretir.
 let s=await mount();await click(s,'Siparişi tamamla');mode='wait';const before=calls.length;
 await React.act(async()=>{const b=[...s.el.querySelectorAll('button')].find(b=>b.textContent==='Siparişi onayla');b.click();b.click();});ok(calls.length===before+1);ok(s.el.textContent.includes('İşleniyor'));
 await React.act(async()=>resolveRequest());await s.close();
 // Yanıt kaybı, unmount/yeniden açılış ve yeni fiyat seçimi aynı siparişi değiştiremez.
 mode='lost';s=await mount();await click(s,'Siparişi tamamla');await click(s,'Siparişi onayla');const lost=calls.at(-1).body;ok(s.el.textContent.includes('Aynı siparişi yeniden dene'));await s.close();
 mode='ok';s=await mount('pm',{tokenAdedi:5000,birimFiyat:7,tarifeSurumu:8});await click(s,'Sipariş sonucunu kontrol et');ok(s.el.textContent.includes('21.250,00 TL'));await click(s,'Aynı siparişi yeniden dene');assert.deepEqual(calls.at(-1).body,lost);passed++;ok(win.sessionStorage.length===0);await s.close();
 mode='price';s=await mount();await click(s,'Siparişi tamamla');await click(s,'Siparişi onayla');ok(refresh===1);ok(!s.el.querySelector('[role=alertdialog]'));ok(s.el.textContent.includes('yeniden onaylayın'));ok(win.sessionStorage.length===0);await s.close();
 s=await mount('pm',null);ok(s.el.querySelector('button').disabled);await s.close();
 await win.happyDOM.close();console.log(JSON.stringify({passed,scope:'Gerçek sipariş React bileşeni, sahte modal kabuğu/API: rol, onay özeti, çift tıklama, kayıp yanıt ve yenilemede aynı anahtar, 409 ve navbar olayı'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
