const {createRequire}=require('node:module'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const repo=require('node:path').resolve(__dirname,'..'),req=createRequire(repo+'/package.json'),{Window}=req('happy-dom'),win=new Window({url:'http://localhost/admin?bolum=sistem'});
for(const k of ['window','document','navigator'])Object.defineProperty(globalThis,k,{configurable:true,value:win[k]});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=req('react'),{createRoot}=req('react-dom/client'),ts=req('typescript'),cache=new Map();
let data={surum:1,degerler:{"kko_token_miktari":1500,"kko_asim_tl":0,"kko_token_tl": 9.9, "paket_10k_token_miktari":10000,"paket_30k_token_miktari":30000,"paket_75k_token_miktari":75000,"paket_10k_token_tl": 5.9, "paket_10k_asim_tl": 6.9, "paket_30k_token_tl": 4.9, "paket_30k_asim_tl": 5.9, "paket_75k_token_tl": 3.9, "paket_75k_asim_tl": 4.9, "uretim_video_tl": 25000, "uretim_podcast_tl": 15000, "uretim_brosur_tl": 10000, "uretim_literatur_tl": null, "banner_haftalik_token": 200, "viva_kisi_dakika_usd": 0.004, "viva_usd_tl": 55, "viva_satis_katsayisi": 1.5},hesaplar:{viva_kisi_dakika_tl:.33,viva_kisi_dakika_token:.03333333,paket_10k_aylik_tl:59000,paket_30k_aylik_tl:147000,paket_75k_aylik_tl:292500}},puts=0,errors=[],success=[],passed=0;
data.degerler={...data.degerler,paket_10k_token_miktari:5000,paket_30k_token_miktari:10000,paket_30k_token_tl:4.85,paket_75k_token_miktari:15000,paket_25k_token_miktari:25000,paket_25k_token_tl:2.9,esnek_2500_token_tl:5.5,esnek_50000_token_tl:2.75};
data.hesaplar={...data.hesaplar,paket_10k_aylik_tl:29500,paket_30k_aylik_tl:48500,paket_75k_aylik_tl:58500,paket_25k_aylik_tl:72500};
data.abonelik_paketleri=[[5000,5.9],[10000,4.85],[15000,3.9],[25000,2.9]].map(([token,birim],i)=>({id:i+1,ad:`Paket ${i+1}`,token,birim,aylik:token*birim}));
const frozenRatios=JSON.parse(fs.readFileSync(repo+'/tests/fixtures/esnekPaketLogaritmik.json','utf8')).map(h=>({...h,ay:0,katsayi:h.birim_fiyat/9.9}));
const sm2For=d=>frozenRatios.map(h=>({...h,birim_fiyat:Math.round((d.esnek_2500_token_tl-(d.esnek_2500_token_tl-d.esnek_50000_token_tl)*Math.log(h.token_adedi/2500)/Math.log(20))*100)/100}));
data.sm2=sm2For(data.degerler);
const dialogContext=React.createContext(null);
const dialogBox=({children})=>React.useContext(dialogContext).acik?React.createElement('div',{role:'alertdialog'},children):null;
const mocks={'@/components/ui/alert-dialog':{
 AlertDialog:({children})=>{const [acik,setAcik]=React.useState(false);return React.createElement(dialogContext.Provider,{value:{acik,setAcik}},children);},
 AlertDialogTrigger:({children})=>{const {setAcik}=React.useContext(dialogContext);return React.cloneElement(children,{onClick:()=>setAcik(true)});},
 AlertDialogContent:dialogBox, AlertDialogHeader:({children})=>children,AlertDialogFooter:({children})=>children,
 AlertDialogTitle:({children})=>React.createElement('h5',null,children),AlertDialogDescription:({children})=>React.createElement('p',null,children),
 AlertDialogCancel:({children})=>{const {setAcik}=React.useContext(dialogContext);return React.createElement('button',{onClick:()=>setAcik(false)},children);},
 AlertDialogAction:({children,onClick})=>React.createElement('button',{onClick},children),
},'@/components/ui/button':{Button:p=>React.createElement('button',p,p.children)},'@/components/ui/yenile-butonu':{YenileButonu:p=>React.createElement('button',{onClick:p.onYenile,disabled:p.yenileniyor||p.disabled},'Yenile')}};
function load(rel){if(!/\.tsx?$/.test(rel))rel+='.ts';if(cache.has(rel))return cache.get(rel).exports;const m={exports:{}};cache.set(rel,m);const code=ts.transpileModule(fs.readFileSync(repo+'/'+rel,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'})')(n=>mocks[n]??(n.endsWith('.css')?{__esModule:true,default:new Proxy({},{get:(_,p)=>p})}:n.startsWith('@/')?load(n.slice(2)):n.startsWith('.')?load(require('node:path').posix.join(require('node:path').posix.dirname(rel),n)):req(n)),m,m.exports);return m.exports;}
globalThis.fetch=async(url,opts={})=>{if(opts.method==='PUT'){puts++;const b=JSON.parse(opts.body);assert.equal(b.surum,data.surum);data={...data,surum:data.surum+1,degerler:b.degerler,abonelik_paketleri:b.abonelikPaketleri.map(p=>({...p,id:p.id??5,aylik:p.token*p.birim})),sm2:sm2For(b.degerler)};}return Response.json(data);};
const Table=load('app/admin/_components/FiyatTarifesi.tsx').default,el=document.createElement('div');document.body.append(el);const root=createRoot(el),ok=v=>{assert.ok(v);passed++};
const change=async(id,value)=>{const input=el.querySelector(id.startsWith('[')?id:'#fiyat-'+id),k=Object.keys(input).find(k=>k.startsWith('__reactProps'));await React.act(async()=>input[k].onChange({target:{value}}));};
(async()=>{await React.act(async()=>root.render(React.createElement(Table,{hata:m=>errors.push(m),basari:m=>success.push(m)})));ok(el.querySelectorAll('[aria-label="Paket fiyatları"] tbody tr').length===4);ok(el.querySelectorAll('[aria-label="Paket fiyatları"] tbody tr')[0].querySelectorAll('input').length===3);ok(el.querySelector('[aria-label="1. satır Paket adı"]').value==='Paket 1');ok(el.querySelector('[aria-label="Giriş Paketi fiyatları"] tbody tr').textContent.includes('Giriş Paketi'));ok(el.querySelector('#fiyat-kko_token_miktari').value==='1500');ok(el.querySelector('#fiyat-kko_token_tl').value==='9,9');ok(el.querySelector('#fiyat-kko_asim_tl').value==='0');ok(el.textContent.includes('Banner'));ok(el.textContent.includes('Viva'));ok(el.querySelector('[aria-label="Viva fiyat hesabı"] tbody tr').querySelectorAll('input').length===3);ok(el.querySelector('[aria-label="Viva fiyat hesabı"] tbody tr').textContent.includes('0,03')); ok(!el.textContent.includes('Agora Yayın Satın'));ok(el.querySelector('#fiyat-viva_kisi_dakika_usd').value==='0,004');ok(el.querySelector('#fiyat-banner_haftalik_token').value==='200');
const subscription=el.querySelector('[aria-label="Paket fiyatları"]');
ok(subscription.querySelectorAll('tbody tr').length===4);
ok(subscription.textContent.includes('Aylık Tutar (TL)'));ok(!subscription.textContent.includes('6 Aylık'));
ok([...subscription.querySelectorAll('tbody tr')].map(r=>r.querySelector('td:nth-of-type(3)').textContent).join('|')==='29.500 TL|48.500 TL|58.500 TL|72.500 TL');
ok(el.querySelector('[aria-label="2. satır Birim fiyat"]').value==='4,85');
const matrix=el.querySelector('[aria-label="Paket 2 fiyat matrisi"]');
ok(matrix.querySelectorAll('tbody tr').length===56);
ok(matrix.querySelectorAll('thead th').length===3);
const rows=matrix.querySelectorAll('tbody tr');
ok(rows[0].querySelector('th').textContent==='2.500');
ok(rows[0].querySelector('input').value==='5,5');
ok(rows[1].querySelector('td').textContent==='5,33');
ok(rows[55].querySelector('th').textContent==='50.000');
ok(rows[55].querySelector('input').value==='2,75');
ok(matrix.querySelectorAll('input').length===2);
ok(new Set([...el.querySelectorAll('input')].map(i=>i.id)).size===el.querySelectorAll('input').length);
const save=()=>[...el.querySelectorAll('button')].find(b=>b.textContent==='Fiyatları Kaydet');ok(el.querySelector('[aria-label="1. satır Aylık token miktarı"]').value==='5000');await change('kko_token_miktari','2000');await change('[aria-label="1. satır Aylık token miktarı"]','12000');await change('banner_haftalik_token','250');await React.act(async()=>save().click());ok(puts===1);ok(data.degerler.banner_haftalik_token===250);ok(data.degerler.kko_token_miktari===2000);ok(data.degerler.kko_asim_tl===0);ok(data.abonelik_paketleri[0].token===12000);ok(success.length===1);ok(el.textContent.includes('Tarife sürümü: 2'));
await change('kko_token_tl','19,8');
ok(!el.textContent.includes('Önizleme:'));ok(rows[1].querySelector('td').textContent==='5,33');
await change('esnek_2500_token_tl','6,5');
ok(el.textContent.includes('Önizleme:'));ok(rows[1].querySelector('td').textContent==='6,27');
await change('esnek_50000_token_tl','3,75');
ok(rows[1].querySelector('td').textContent==='6,33');
await change('esnek_50000_token_tl','');ok(rows[1].querySelector('td').textContent==='—');
await change('esnek_50000_token_tl','3,75');
await React.act(async()=>save().click());
ok(puts===2);ok(data.degerler.esnek_2500_token_tl===6.5);ok(data.degerler.esnek_50000_token_tl===3.75);
ok(!el.textContent.includes('Önizleme:'));ok(rows[1].querySelector('td').textContent==='6,33');
await change('uretim_literatur_tl','abc');await React.act(async()=>save().click());ok(puts===2);ok(errors.length===1);
await change('uretim_literatur_tl','');await change('banner_haftalik_token','1,5');await React.act(async()=>save().click());ok(puts===2);ok(errors.length===2);
await change('banner_haftalik_token','250');
await React.act(async()=>[...el.querySelectorAll('button')].find(b=>b.textContent==='Paket Ekle').click());
await change('[aria-label="5. satır Paket adı"]','Yeni Paket');
await change('[aria-label="5. satır Aylık token miktarı"]','30000');
await change('[aria-label="5. satır Birim fiyat"]','2,50');
await React.act(async()=>el.querySelector('[aria-label="Paket 2 paketini kaldır"]').click());
ok(el.querySelector('[role="alertdialog"]').textContent.includes('Mevcut abonelikler'));
await React.act(async()=>[...el.querySelector('[role="alertdialog"]').querySelectorAll('button')].find(b=>b.textContent==='Kaldır').click());
await React.act(async()=>save().click());
ok(data.abonelik_paketleri.map(p=>p.id).join(',')==='1,3,4,5');
ok(data.abonelik_paketleri.at(-1).aylik===75000);
await React.act(async()=>root.unmount());await win.happyDOM.close();console.log(JSON.stringify({passed,scope:'Yalnız fiyat tablosu; gerçek React bileşeni, sahte fetch.'}));})().catch(e=>{console.error(e);process.exitCode=1});
